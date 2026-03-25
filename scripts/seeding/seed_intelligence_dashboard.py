#!/usr/bin/env python3
"""
Seed intelligence dashboard data for /intelligence page.

Populates:
- entities (NER, trending keywords, sentiment radar)
- documents (strategic briefs, language distribution, live alerts)
- system_metrics (pipeline status throughput metrics)
"""

import asyncio
import sys
import uuid
from datetime import datetime, timedelta, timezone
from pathlib import Path

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.orm import sessionmaker

sys.path.insert(0, str(Path(__file__).parent / 'backend'))

from config import settings
from db.schemas import Base, Document, Entity, SystemMetric


ENTITIES = [
    ("ORG", "United Nations Security Council", "Diplomatic coordination and sanction posture updates", 0.96, 6420, "NEUTRAL"),
    ("ORG", "NATO", "Alliance force posture and interoperability exercises", 0.95, 5980, "NEGATIVE"),
    ("ORG", "BRICS", "Economic bloc signaling on currency and trade rails", 0.93, 3820, "NEUTRAL"),
    ("PERSON", "Narendra Modi", "Prime Minister of India", 0.97, 4320, "NEUTRAL"),
    ("PERSON", "Xi Jinping", "President of China", 0.96, 4170, "NEUTRAL"),
    ("PERSON", "Volodymyr Zelenskyy", "President of Ukraine", 0.94, 2980, "NEGATIVE"),
    ("LOC", "South China Sea", "Maritime flashpoint with dense military signaling", 0.95, 5140, "NEGATIVE"),
    ("LOC", "Ganges Valley", "Climate-water-agriculture risk hotspot", 0.92, 3410, "NEGATIVE"),
    ("LOC", "Strait of Hormuz", "Energy corridor with high disruption impact", 0.94, 3025, "NEGATIVE"),
    ("EVENT", "Critical Infrastructure Cyber Campaign", "State-linked intrusion attempts against utilities", 0.91, 2760, "NEGATIVE"),
    ("CONCEPT", "Food Security Stress", "Cross-border agricultural and supply pressure", 0.9, 2440, "NEGATIVE"),
    ("CONCEPT", "Energy Price Volatility", "Macro instability from commodity shock exposure", 0.89, 2190, "NEGATIVE"),
]

DOCUMENTS = [
    (
        "Strategic Climate-Risk Outlook: South Asia",
        "Composite analysis indicates elevated food and water stress across monsoon-dependent zones. Priority monitoring should focus on migration pressure and infrastructure resilience windows over the next 8-12 weeks.",
        "INTELLIGENCE",
        "en",
        15,
    ),
    (
        "MEA Brief: India-Japan Maritime Coordination",
        "Bilateral maritime cooperation remains stable with expansion in technology transfer and domain-awareness sharing. Risk posture remains moderate with high strategic relevance in Indo-Pacific routes.",
        "MEA",
        "en",
        40,
    ),
    (
        "Regional Security Flash Update",
        "Recent reporting shows accelerated mention velocity for contested corridors. Analysts should cross-reference geospatial event density and economic stress indicators for escalation triggers.",
        "NEWS",
        "en",
        65,
    ),
    (
        "Analyse Geopolitique: Energie et Stabilite",
        "Les signaux economiques regionaux montrent une volatilite croissante avec impacts potentiels sur les chaines d'approvisionnement.",
        "NEWS",
        "fr",
        85,
    ),
    (
        "Informe de Inteligencia Economica",
        "La exposicion comercial en corredores maritimos sensibles incrementa el riesgo operativo para sectores industriales clave.",
        "INTELLIGENCE",
        "es",
        105,
    ),
    (
        "Auto Strategic Brief Baseline",
        "Baseline generated brief for dashboard readiness. Intelligence posture remains elevated across climate, cyber, and maritime dimensions.",
        "AI_BRIEF",
        "en",
        6,
    ),
]

PIPELINE_METRICS = [
    ("pipeline_spacy_per_min", 126.0, "inferences/min"),
    ("pipeline_llm_per_min", 72.0, "inferences/min"),
    ("pipeline_keyword_per_min", 148.0, "inferences/min"),
    ("pipeline_vector_per_min", 102.0, "inferences/min"),
    ("pipeline_whisper_per_min", 37.0, "inferences/min"),
]


def utc_now_naive() -> datetime:
    return datetime.now(timezone.utc).replace(tzinfo=None)


async def upsert_entity(session: AsyncSession, entity_data: tuple) -> bool:
    entity_type, name, description, confidence, mentions, sentiment = entity_data
    existing = (await session.execute(select(Entity).where(Entity.name == name))).scalar_one_or_none()

    if existing:
        existing.entity_type = entity_type
        existing.description = description
        existing.confidence_score = confidence
        existing.mention_count = max(int(existing.mention_count or 0), int(mentions))
        existing.sentiment = sentiment
        existing.updated_at = utc_now_naive()
        return False

    session.add(
        Entity(
            id=uuid.uuid4(),
            entity_type=entity_type,
            name=name,
            description=description,
            confidence_score=confidence,
            mention_count=mentions,
            sentiment=sentiment,
            created_at=utc_now_naive(),
            updated_at=utc_now_naive(),
        )
    )
    return True


async def insert_document_if_missing(session: AsyncSession, doc_data: tuple) -> bool:
    title, content, source, language, minutes_ago = doc_data
    existing = (await session.execute(select(Document).where(Document.title == title))).scalar_one_or_none()
    if existing:
        return False

    now = utc_now_naive()
    created_at = now - timedelta(minutes=minutes_ago)
    session.add(
        Document(
            id=uuid.uuid4(),
            title=title,
            content=content,
            source=source,
            language=language,
            created_at=created_at,
            published_date=created_at,
            processed=True,
            doc_metadata={"seed": "intelligence_dashboard"},
        )
    )
    return True


async def insert_pipeline_metrics(session: AsyncSession) -> int:
    now = utc_now_naive()
    inserted = 0
    for metric_name, metric_value, unit in PIPELINE_METRICS:
        session.add(
            SystemMetric(
                id=uuid.uuid4(),
                metric_name=metric_name,
                metric_value=metric_value,
                unit=unit,
                timestamp=now,
                tags={"module": "intelligence", "seed": True},
            )
        )
        inserted += 1
    return inserted


async def seed_intelligence_dashboard() -> None:
    engine = create_async_engine(settings.POSTGRES_URL, echo=False)
    async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async with async_session() as session:
        new_entities = 0
        for entity_data in ENTITIES:
            created = await upsert_entity(session, entity_data)
            if created:
                new_entities += 1

        new_documents = 0
        for doc_data in DOCUMENTS:
            created = await insert_document_if_missing(session, doc_data)
            if created:
                new_documents += 1

        metrics_added = await insert_pipeline_metrics(session)

        await session.commit()

        print("Intelligence dashboard seed complete")
        print(f"Entities added: {new_entities}, total processed: {len(ENTITIES)}")
        print(f"Documents added: {new_documents}, total processed: {len(DOCUMENTS)}")
        print(f"Pipeline metrics inserted: {metrics_added}")

    await engine.dispose()


if __name__ == "__main__":
    asyncio.run(seed_intelligence_dashboard())
