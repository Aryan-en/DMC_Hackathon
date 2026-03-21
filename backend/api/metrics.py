"""Metrics API Endpoints - Strategic Overview Dashboard."""

from datetime import datetime, timedelta

from fastapi import APIRouter, Depends
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from db.postgres import get_db_session
from db.schemas import Country, CountryRelation, EconomicIndicator, Entity, SystemMetric
from utils.response import build_error, build_success

router = APIRouter()


def _health_color(value: int) -> str:
    if value >= 85:
        return "#3eb87a"
    if value >= 65:
        return "#c8a84a"
    return "#b84a4a"


@router.get("/regional-risk")
async def get_regional_risk(db: AsyncSession = Depends(get_db_session)):
    try:
        stmt = (
            select(Country.region, CountryRelation.status, func.count(CountryRelation.id))
            .join(Country, Country.id == CountryRelation.country_b_id)
            .group_by(Country.region, CountryRelation.status)
        )
        rows = (await db.execute(stmt)).all()

        region_scores: dict[str, float] = {}
        region_total: dict[str, int] = {}
        weight = {"stable": 25, "tense": 55, "active_dispute": 80, "conflict": 92}

        for region, status, count in rows:
            key = region or "Unspecified"
            base = weight.get((status or "").lower(), 50)
            region_scores[key] = region_scores.get(key, 0) + (base * count)
            region_total[key] = region_total.get(key, 0) + count

        regions = []
        for region, total in region_total.items():
            risk = int(region_scores[region] / total) if total else 0
            color = "#3eb87a"
            if risk >= 80:
                color = "#b84a4a"
            elif risk >= 65:
                color = "#c8822a"
            elif risk >= 45:
                color = "#c8a84a"
            regions.append({"name": region, "risk": risk, "color": color})

        regions.sort(key=lambda x: x["risk"], reverse=True)
        return build_success({"regions": regions}, meta={"update_frequency": "5 minutes"})
    except Exception as exc:
        return build_error("QUERY_ERROR", f"Failed to compute regional risk: {exc}")


@router.get("/global-entities")
async def get_global_entities(db: AsyncSession = Depends(get_db_session)):
    try:
        total_entities = (await db.execute(select(func.count(Entity.id)))).scalar() or 0
        countries = (await db.execute(select(func.count(Country.id)))).scalar() or 0
        orgs = (
            await db.execute(select(func.count(Entity.id)).where(Entity.entity_type.in_(["ORG", "ORGANIZATION"])))
        ).scalar() or 0
        individuals = (
            await db.execute(select(func.count(Entity.id)).where(Entity.entity_type.in_(["PERSON", "INDIVIDUAL"])))
        ).scalar() or 0
        events = (await db.execute(select(func.count(Entity.id)).where(Entity.entity_type == "EVENT"))).scalar() or 0

        breakdown = {
            "nations": int(countries),
            "organizations": int(orgs),
            "individuals": int(individuals),
            "events": int(events),
        }
        return build_success({"total": int(total_entities), "breakdown": breakdown}, meta={"update_frequency": "hourly"})
    except Exception as exc:
        return build_error("QUERY_ERROR", f"Failed to fetch global entities: {exc}")


@router.get("/threat-threads")
async def get_threat_threads(db: AsyncSession = Depends(get_db_session)):
    try:
        rows = (await db.execute(select(CountryRelation.status, func.count(CountryRelation.id)).group_by(CountryRelation.status))).all()

        critical = 0
        high = 0
        monitor = 0
        for status, count in rows:
            s = (status or "").lower()
            if s == "conflict":
                critical += count
            elif s in {"active_dispute", "tense"}:
                high += count
            else:
                monitor += count

        total = critical + high + monitor
        return build_success(
            {
                "critical": int(critical),
                "high": int(high),
                "monitor": int(monitor),
                "total": int(total),
            },
            meta={"update_frequency": "real-time"},
        )
    except Exception as exc:
        return build_error("QUERY_ERROR", f"Failed to fetch threat threads: {exc}")


@router.get("/daily-ingestion")
async def get_daily_ingestion(db: AsyncSession = Depends(get_db_session)):
    try:
        last_24h = datetime.utcnow() - timedelta(hours=24)
        indicator_count = (
            await db.execute(select(func.count(EconomicIndicator.id)).where(EconomicIndicator.created_at >= last_24h))
        ).scalar() or 0
        relation_count = (
            await db.execute(select(func.count(CountryRelation.id)).where(CountryRelation.last_updated >= last_24h))
        ).scalar() or 0

        total_gb = round((indicator_count * 0.00004) + (relation_count * 0.00012), 6)
        realtime = round(total_gb * 0.25, 6)
        payload = {
            "total_gb": total_gb,
            "realtime_processed_gb": realtime,
            "batch_processed_gb": round(max(total_gb - realtime, 0), 6),
            "format_breakdown": {
                "structured": 100 if total_gb > 0 else 0,
                "semi_structured": 0,
                "unstructured": 0,
            },
            "raw_counts": {
                "economic_indicators": int(indicator_count),
                "country_relations": int(relation_count),
            },
        }
        return build_success(payload, meta={"update_frequency": "15 minutes"})
    except Exception as exc:
        return build_error("QUERY_ERROR", f"Failed to fetch ingestion metrics: {exc}")


@router.get("/prediction-accuracy")
async def get_prediction_accuracy(db: AsyncSession = Depends(get_db_session)):
    try:
        rows = (
            await db.execute(
                select(SystemMetric.metric_name, SystemMetric.metric_value).where(
                    SystemMetric.metric_name.in_(["model_accuracy", "model_precision", "model_recall", "model_f1"])
                )
            )
        ).all()
        values = {name: value for name, value in rows}
        payload = {
            "accuracy": round(values.get("model_accuracy", 0), 2),
            "precision": round(values.get("model_precision", 0), 2),
            "recall": round(values.get("model_recall", 0), 2),
            "f1_score": round(values.get("model_f1", 0), 2),
            "confidence": 0.0,
            "model_version": None,
            "last_retrained": None,
        }
        return build_success(payload, meta={"update_frequency": "daily"})
    except Exception as exc:
        return build_error("QUERY_ERROR", f"Failed to fetch prediction accuracy: {exc}")


@router.get("/infrastructure-health")
async def get_infrastructure_health(db: AsyncSession = Depends(get_db_session)):
    rows = (
        await db.execute(
            select(SystemMetric.metric_name, SystemMetric.metric_value).where(
                SystemMetric.metric_name.in_(
                    [
                        "infra_kafka_health",
                        "infra_neo4j_health",
                        "infra_ml_health",
                        "infra_vector_health",
                        "infra_flink_health",
                    ]
                )
            )
        )
    ).all()
    metric_map = {name: int(value) for name, value in rows}

    components = []
    names = [
        ("Kafka Cluster", "infra_kafka_health"),
        ("Neo4j Graph", "infra_neo4j_health"),
        ("ML Pipeline", "infra_ml_health"),
        ("Vector Search", "infra_vector_health"),
        ("Flink Jobs", "infra_flink_health"),
    ]
    for label, key in names:
        value = metric_map.get(key, 0)
        components.append({"label": label, "value": value, "color": _health_color(value)})

    return build_success({"components": components}, meta={"update_frequency": "real-time"})


@router.get("/kg-nodes")
async def get_kg_nodes(db: AsyncSession = Depends(get_db_session)):
    entity_total = (await db.execute(select(func.count(Entity.id)))).scalar() or 0
    nations = (await db.execute(select(func.count(Country.id)))).scalar() or 0
    relations_24h = (
        await db.execute(
            select(func.count(CountryRelation.id)).where(CountryRelation.last_updated >= datetime.utcnow() - timedelta(hours=24))
        )
    ).scalar() or 0
    kafka_eps = (
        await db.execute(
            select(SystemMetric.metric_value)
            .where(SystemMetric.metric_name == "kafka_events_per_sec")
            .order_by(SystemMetric.timestamp.desc())
            .limit(1)
        )
    ).scalar_one_or_none()

    nodes = [
        {"label": "Knowledge Graph Nodes", "value": f"{int(entity_total):,}", "icon": "Share2", "color": "#8a78c8"},
        {"label": "Kafka Events/sec", "value": str(int(kafka_eps or 0)), "icon": "Activity", "color": "#5b8db8"},
        {"label": "Relations Updated 24h", "value": str(int(relations_24h)), "icon": "Brain", "color": "#3eb87a"},
        {"label": "Nations Monitored", "value": str(int(nations)), "icon": "Globe", "color": "#c8a84a"},
    ]
    return build_success({"nodes": nodes}, meta={"update_frequency": "hourly"})
