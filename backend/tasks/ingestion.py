"""Ingestion tasks for background processing."""

import asyncio
import logging
from core.celery_app import celery_app
from ingestors.mea_scraper import run_mea_scraper
from ingestors.worldbank_fetcher import run_worldbank_fetcher
from ingestors.gdelt_fetcher import run_gdelt_fetcher

logger = logging.getLogger(__name__)

import random
import math
import time
import re
from uuid import uuid4
from datetime import datetime, timedelta, timezone
from sqlalchemy import select, func
from db.postgres import AsyncSessionLocal
from db.schemas import Country, CountryRelation, Document, EconomicIndicator, Entity, Relationship, SystemMetric
from services.entity_extractor import EntityExtractionService
from utils.entity_resolution import canonicalize_entity_name, normalize_country_name

logger = logging.getLogger(__name__)


def _derive_country_code(name: str) -> str:
    letters = re.sub(r"[^A-Za-z]", "", normalize_country_name(name).upper())
    if len(letters) >= 3:
        return letters[:3]
    return (letters + "XXX")[:3]


def _normalize_entity_name(name: str) -> str:
    return canonicalize_entity_name(name)


async def _get_or_create_country(session, iso_code: str, name: str) -> Country:
    iso = (iso_code or "XXX").strip().upper()[:3]
    display_name = normalize_country_name((name or iso).strip() or iso)

    existing = (
        await session.execute(select(Country).where(Country.iso_code == iso))
    ).scalar_one_or_none()
    if existing:
        if display_name and (not existing.name or len(existing.name) <= 3):
            existing.name = display_name
        return existing

    by_name = (
        await session.execute(select(Country).where(func.lower(Country.name) == display_name.lower()))
    ).scalar_one_or_none()
    if by_name:
        return by_name

    candidate = iso
    suffix = 1
    while True:
        occupied = (
            await session.execute(select(Country.id).where(Country.iso_code == candidate))
        ).scalar_one_or_none()
        if not occupied:
            break
        candidate = f"{iso[:2]}{suffix % 10}"
        suffix += 1

    country = Country(iso_code=candidate, name=display_name)
    session.add(country)
    await session.flush()
    return country


async def _upsert_extracted_entity(session, cache: dict[str, Entity], payload: dict) -> Entity | None:
    name = _normalize_entity_name(str(payload.get("name") or ""))
    entity_type = str(payload.get("entity_type") or "CONCEPT").upper()[:50]
    if not name:
        return None

    key = f"{entity_type}:{name.lower()}"
    if key in cache:
        entity = cache[key]
        entity.mention_count = int(entity.mention_count or 0) + int(payload.get("mention_count") or 1)
        return entity

    entity = (
        await session.execute(
            select(Entity).where(
                func.lower(Entity.name) == name.lower(),
                Entity.entity_type == entity_type,
            )
        )
    ).scalar_one_or_none()

    mention_inc = int(payload.get("mention_count") or 1)
    confidence = float(payload.get("confidence_score") or 0.6)

    if entity:
        entity.mention_count = int(entity.mention_count or 0) + max(1, mention_inc)
        entity.confidence_score = max(float(entity.confidence_score or 0.0), confidence)
        entity.updated_at = datetime.utcnow()
    else:
        entity = Entity(
            id=uuid4(),
            entity_type=entity_type,
            name=name,
            confidence_score=confidence,
            mention_count=max(1, mention_inc),
            properties={"link_key": payload.get("link_key")},
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow(),
        )
        session.add(entity)
        await session.flush()

    cache[key] = entity
    return entity


async def _process_document_for_ontology(
    session,
    entity_service: EntityExtractionService,
    entity_cache: dict[str, Entity],
    entity_seen: set[str],
    doc: Document,
    stats: dict,
) -> None:
    content = str(doc.content or doc.title or "").strip()
    if not content:
        doc.processed = True
        return

    extracted = entity_service.extract(content)
    link_to_entity: dict[str, Entity] = {}

    for ent in extracted[:20]:
        upserted = await _upsert_extracted_entity(session, entity_cache, ent)
        if not upserted:
            continue
        link_key = str(ent.get("link_key") or "")
        if link_key:
            link_to_entity[link_key] = upserted
        dedupe_key = f"{upserted.entity_type}:{upserted.name.lower()}"
        if dedupe_key not in entity_seen:
            entity_seen.add(dedupe_key)
            stats["entities_upserted"] += 1

    triplets = entity_service.extract_triplets(content)
    for trip in triplets[:20]:
        subj_payload = {
            "name": trip.get("subject"),
            "entity_type": "CONCEPT",
            "confidence_score": trip.get("confidence") or 0.6,
            "mention_count": 1,
            "link_key": trip.get("subject_link"),
        }
        obj_payload = {
            "name": trip.get("object"),
            "entity_type": "CONCEPT",
            "confidence_score": trip.get("confidence") or 0.6,
            "mention_count": 1,
            "link_key": trip.get("object_link"),
        }

        subject = link_to_entity.get(str(trip.get("subject_link") or "")) or await _upsert_extracted_entity(
            session, entity_cache, subj_payload
        )
        obj = link_to_entity.get(str(trip.get("object_link") or "")) or await _upsert_extracted_entity(
            session, entity_cache, obj_payload
        )
        if not subject or not obj or subject.id == obj.id:
            continue

        rel = Relationship(
            id=uuid4(),
            subject_entity_id=subject.id,
            predicate=str(trip.get("predicate") or "RELATED_TO")[:100],
            object_entity_id=obj.id,
            confidence_score=float(trip.get("confidence") or 0.6),
            source_document_id=doc.id,
            url=doc.url,
            created_at=datetime.utcnow(),
        )
        session.add(rel)
        stats["relationships_persisted"] += 1

    doc.processed = True


async def _run_full_ingestion_async() -> dict:
    mea_results = await run_mea_scraper()
    wb_results = await run_worldbank_fetcher()
    gdelt_results = await run_gdelt_fetcher()

    stats = {
        "mea_count": len(mea_results),
        "wb_count": len(wb_results),
        "gdelt_count": len(gdelt_results),
        "documents_persisted": 0,
        "documents_ontology_processed": 0,
        "countries_updated": 0,
        "indicators_persisted": 0,
        "relations_persisted": 0,
        "entities_upserted": 0,
        "relationships_persisted": 0,
    }

    entity_service = EntityExtractionService()

    async with AsyncSessionLocal() as session:
        country_seen: set[str] = set()
        entity_seen: set[str] = set()
        entity_cache: dict[str, Entity] = {}

        # 1) Persist news documents and derive entities/relationships used by app dashboards.
        for art in gdelt_results:
            now = datetime.now(timezone.utc).replace(tzinfo=None)
            metadata = art.get("metadata") or {}
            metadata["ingested_at"] = now.isoformat()

            content = str(art.get("content") or art.get("title") or "").strip()
            new_doc = Document(
                id=uuid4(),
                title=art.get("title"),
                source=art.get("source", "NEWS"),
                url=art.get("url"),
                content=content,
                doc_metadata=metadata,
                published_date=now,
                created_at=now,
                processed=True,
            )
            session.add(new_doc)
            await session.flush()
            stats["documents_persisted"] += 1

            await _process_document_for_ontology(
                session=session,
                entity_service=entity_service,
                entity_cache=entity_cache,
                entity_seen=entity_seen,
                doc=new_doc,
                stats=stats,
            )
            stats["documents_ontology_processed"] += 1

        # 1b) Backfill ontology extraction for older unprocessed documents already in DB.
        pending_docs = (
            await session.execute(
                select(Document)
                .where(Document.processed.is_(False))
                .order_by(Document.created_at.desc())
                .limit(300)
            )
        ).scalars().all()

        for pending_doc in pending_docs:
            await _process_document_for_ontology(
                session=session,
                entity_service=entity_service,
                entity_cache=entity_cache,
                entity_seen=entity_seen,
                doc=pending_doc,
                stats=stats,
            )
            stats["documents_ontology_processed"] += 1

        # 2) Persist World Bank indicators (supports economic charts and ingestion counters).
        for item in wb_results:
            iso_code = str(item.get("country_code") or "IND").upper()[:3]
            country = await _get_or_create_country(session, iso_code, iso_code)
            country_seen.add(country.iso_code)

            indicator = EconomicIndicator(
                id=uuid4(),
                country_id=country.id,
                indicator_code=str(item.get("indicator_code") or "UNKNOWN")[:50],
                indicator_name=str(item.get("indicator_name") or "Unknown Indicator")[:255],
                value=float(item.get("value") or 0.0),
                year=int(item.get("year") or datetime.utcnow().year),
                unit=str(item.get("unit") or "unknown")[:50],
                created_at=datetime.utcnow(),
            )
            session.add(indicator)
            stats["indicators_persisted"] += 1

        # 3) Persist MEA bilateral relations when available.
        if mea_results:
            india = await _get_or_create_country(session, "IND", "India")
            country_seen.add(india.iso_code)

            for rel in mea_results:
                country_name = normalize_country_name(str(rel.get("country") or rel.get("country_name") or "").strip())
                if not country_name:
                    continue
                target = await _get_or_create_country(session, _derive_country_code(country_name), country_name)
                country_seen.add(target.iso_code)

                relation = CountryRelation(
                    id=uuid4(),
                    country_a_id=india.id,
                    country_b_id=target.id,
                    relation_type=str(rel.get("relation_type") or "bilateral")[:50],
                    status=str(rel.get("status") or "stable")[:50],
                    trade_volume=float(rel.get("trade_volume") or 0.0) if rel.get("trade_volume") is not None else None,
                    sentiment=str(rel.get("sentiment") or "neutral")[:50],
                    confidence_score=float(rel.get("confidence_score") or 0.75),
                    agreements=rel.get("agreements") or [],
                    key_issues=rel.get("key_issues") or [],
                    last_updated=datetime.utcnow(),
                    source="MEA",
                )
                session.add(relation)
                stats["relations_persisted"] += 1

        stats["countries_updated"] = len(country_seen)
        await session.commit()

    # 4) Refresh operational metrics after ingestion to keep dashboard cards moving.
    try:
        generate_simulated_metrics.delay()
    except Exception:
        logger.warning("Unable to enqueue simulated metrics refresh after full ingestion.")

    stats["status"] = "success"
    return stats

@celery_app.task(name="tasks.ingestion.run_full_ingestion")
def run_full_ingestion():
    """Run all ingestion sources and persist data required across all dashboards."""
    logger.info("Starting scheduled full ingestion...")
    try:
        return asyncio.run(_run_full_ingestion_async())
    except Exception as e:
        logger.error(f"Ingestion task failed: {str(e)}")
        return {"status": "error", "message": str(e)}

@celery_app.task(name="tasks.ingestion.generate_simulated_metrics")
def generate_simulated_metrics():
    """Simulate real-time metric generation (CPU, Latency, Risk)."""
    if AsyncSessionLocal is None:
        from core.config import settings
        from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
        engine = create_async_engine(settings.POSTGRES_URL)
        session_factory = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    else:
        session_factory = AsyncSessionLocal

    async def _update():
        async with session_factory() as session:
            now = datetime.utcnow()
            
            # 1. Update Conflict Risk (Random walk)
            latest_risk = (await session.execute(
                select(SystemMetric.metric_value)
                .where(SystemMetric.metric_name == "conflict_risk_probability")
                .order_by(SystemMetric.timestamp.desc())
                .limit(1)
            )).scalar_one_or_none()
            
            risk_val = float(latest_risk) if latest_risk else 0.35
            new_risk = min(0.95, max(0.1, risk_val + random.uniform(-0.02, 0.03)))
            
            session.add(SystemMetric(
                metric_name="conflict_risk_probability",
                metric_value=new_risk,
                timestamp=now,
                tags={"region": "Global", "simulated": "true"}
            ))

            # 2. Update Infrastructure Health
            for component in ["kafka", "neo4j", "ml", "vector", "flink"]:
                health_val = 90 + random.uniform(-5, 5)
                session.add(SystemMetric(
                    metric_name=f"infra_{component}_health",
                    metric_value=min(100, health_val),
                    timestamp=now,
                    tags={"component": component, "simulated": "true"}
                ))

            # 3. Stream Topics (Kafka)
            topics = ["documents.raw", "mea.relations.raw", "economic.indicators.batch"]
            for topic in topics:
                lag = random.randint(50, 1200)
                throughput = 1000 + random.randint(0, 5000)
                
                session.add_all([
                    SystemMetric(metric_name=f"stream_topic_{topic}_lag", metric_value=float(lag), timestamp=now, tags={"topic": topic}),
                    SystemMetric(metric_name=f"stream_topic_{topic}_throughput", metric_value=float(throughput), timestamp=now, tags={"topic": topic}),
                    SystemMetric(metric_name=f"stream_topic_{topic}_partitions", metric_value=4.0 if "raw" in topic else 2.0, timestamp=now, tags={"topic": topic}),
                    SystemMetric(metric_name=f"stream_topic_{topic}_health", metric_value=100.0 if lag < 800 else 60.0, timestamp=now, tags={"topic": topic}),
                ])

            # 4. Pipelines (Flink)
            pipelines = ["conflict-aggregation", "entity-enrichment", "indicator-windowing"]
            for pipe in pipelines:
                latency = 100.0 + random.uniform(0, 150)
                throughput = 5000 + random.randint(0, 15000)
                
                session.add_all([
                    SystemMetric(metric_name=f"pipeline_{pipe}_latency_ms", metric_value=latency, timestamp=now, tags={"pipeline": pipe}),
                    SystemMetric(metric_name=f"pipeline_{pipe}_throughput", metric_value=float(throughput), timestamp=now, tags={"pipeline": pipe}),
                    SystemMetric(metric_name=f"pipeline_{pipe}_health", metric_value=95.0 if latency < 200 else 70.0, timestamp=now, tags={"pipeline": pipe}),
                ])

            # 5. Serving Metrics (Dynamic for Task Manager effect)
            t = time.time()
            # CPU oscillates between 30% and 85% with 10% noise
            base_cpu = 50 + 20 * math.sin(t / 10.0) 
            cpu_val = min(99.6, max(15.2, base_cpu + random.uniform(-10, 10)))
            
            # Latency oscillates 35-180ms
            latency_val = 80 + 40 * math.cos(t / 15.0) + random.uniform(-15, 25)
            
            # Requests oscillate 400-950 per min
            req_val = 600 + 200 * math.sin(t / 20.0) + random.randint(-50, 150)

            session.add_all([
                SystemMetric(metric_name="serving_cpu_util_pct", metric_value=cpu_val, timestamp=now),
                SystemMetric(metric_name="serving_cpu_speed_ghz", metric_value=2.4 + random.uniform(-0.1, 0.2), timestamp=now),
                SystemMetric(metric_name="serving_latency_ms", metric_value=max(10.0, latency_val), timestamp=now),
                SystemMetric(metric_name="serving_requests_per_min", metric_value=float(req_val), timestamp=now),
                SystemMetric(metric_name="serving_error_rate_pct", metric_value=0.1 + random.uniform(-0.05, 0.08), timestamp=now),
                SystemMetric(metric_name="serving_uptime_pct", metric_value=99.98 + random.uniform(-0.01, 0.02), timestamp=now),
                SystemMetric(metric_name="serving_uptime_seconds", metric_value=37240 + t % 1000, timestamp=now),
            ])
            
            await session.commit()
            logger.info(f"Generated simulated metrics at {now}")

    asyncio.get_event_loop().run_until_complete(_update())
    return "success"

@celery_app.task(name="tasks.ingestion.scheduled_mea_sync")
def scheduled_mea_sync():
    """Specific task for MEA sync."""
    loop = asyncio.get_event_loop()
    return loop.run_until_complete(run_mea_scraper())

@celery_app.task(name="tasks.ingestion.scheduled_gdelt_sync")
def scheduled_gdelt_sync():
    """Specific task for GDELT sync."""
    loop = asyncio.get_event_loop()
    return loop.run_until_complete(run_gdelt_fetcher())
