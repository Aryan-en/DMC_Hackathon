"""Data Lake API Endpoints - Weeks 10-11: Delta Lake, Data Quality, Lineage, Cost Monitoring."""

from fastapi import APIRouter, Depends, Query
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from db.postgres import get_db_session
from db.schemas import CountryRelation, Document, EconomicIndicator, Entity, Relationship
from utils.response import build_error
from utils.response import build_success

router = APIRouter()

# Week 10: Data quality metrics (in-memory for demo)
DATA_QUALITY_SCORES = {
    "economic_indicators": {"completeness": 98.5, "accuracy": 97.2, "freshness": 89.1, "uniqueness": 99.8},
    "country_relations": {"completeness": 95.3, "accuracy": 96.8, "freshness": 92.4, "uniqueness": 99.9},
    "documents": {"completeness": 87.6, "accuracy": 91.2, "freshness": 78.5, "uniqueness": 99.2},
    "entities": {"completeness": 93.1, "accuracy": 94.7, "freshness": 85.3, "uniqueness": 99.5},
    "relationships": {"completeness": 91.8, "accuracy": 93.9, "freshness": 82.1, "uniqueness": 99.7},
}

# Week 11: Lineage tracking (in-memory for demo)
DATA_LINEAGE = {
    "economic_indicators": ["worldbank_fetcher.py", "kafka:economic.indicators.batch", "postgres:economic_indicators"],
    "country_relations": ["mea_scraper.py", "kafka:mea.relations.raw", "postgres:country_relations"],
    "documents": ["mea_scraper.py", "kafka:documents.raw", "postgres:documents"],
    "entities": ["llm_classifier.py", "kafka:documents.raw", "postgres:entities"],
    "relationships": ["entity_extractor.py", "postgres:entities", "neo4j:relationships"],
}

# Week 11: Query cost tracking (in-memory for demo)
QUERY_COSTS = [
    {"query_id": "q_2026_03_21_001", "dataset": "economic_indicators", "rows_scanned": 15000, "cost_units": 2.45, "timestamp": "2026-03-21T10:30:00Z"},
    {"query_id": "q_2026_03_21_002", "dataset": "country_relations", "rows_scanned": 5200, "cost_units": 0.89, "timestamp": "2026-03-21T10:35:00Z"},
    {"query_id": "q_2026_03_21_003", "dataset": "relationships", "rows_scanned": 8900, "cost_units": 1.56, "timestamp": "2026-03-21T10:40:00Z"},
]


@router.get("/summary")
async def get_summary(db: AsyncSession = Depends(get_db_session)):
    try:
        indicator_count = (await db.execute(select(func.count(EconomicIndicator.id)))).scalar() or 0
        relation_count = (await db.execute(select(func.count(CountryRelation.id)))).scalar() or 0
        document_count = (await db.execute(select(func.count(Document.id)))).scalar() or 0
        entity_count = (await db.execute(select(func.count(Entity.id)))).scalar() or 0
        relationship_count = (await db.execute(select(func.count(Relationship.id)))).scalar() or 0

        total_records = int(indicator_count + relation_count + document_count + entity_count + relationship_count)
        total_size_gb = round(
            (indicator_count * 0.000001)
            + (relation_count * 0.000002)
            + (document_count * 0.00005)
            + (entity_count * 0.000001)
            + (relationship_count * 0.000001),
            6,
        )

        return build_success(
            {
                "total_size_gb": total_size_gb,
                "record_count": total_records,
                "datasets": 5,
            },
            meta={"update_frequency": "hourly"},
        )
    except Exception as exc:
        return build_error("QUERY_ERROR", f"Failed to fetch data lake summary: {exc}")


@router.get("/datasets")
async def get_datasets(db: AsyncSession = Depends(get_db_session)):
    try:
        indicator_count = (await db.execute(select(func.count(EconomicIndicator.id)))).scalar() or 0
        relation_count = (await db.execute(select(func.count(CountryRelation.id)))).scalar() or 0
        document_count = (await db.execute(select(func.count(Document.id)))).scalar() or 0
        entity_count = (await db.execute(select(func.count(Entity.id)))).scalar() or 0
        relationship_count = (await db.execute(select(func.count(Relationship.id)))).scalar() or 0

        datasets = [
            {
                "name": "economic_indicators",
                "format": "postgresql",
                "records": int(indicator_count),
                "size_gb": round(indicator_count * 0.000001, 6),
                "tier": "silver",
            },
            {
                "name": "country_relations",
                "format": "postgresql",
                "records": int(relation_count),
                "size_gb": round(relation_count * 0.000002, 6),
                "tier": "silver",
            },
            {
                "name": "documents",
                "format": "postgresql",
                "records": int(document_count),
                "size_gb": round(document_count * 0.00005, 6),
                "tier": "bronze",
            },
            {
                "name": "entities",
                "format": "postgresql",
                "records": int(entity_count),
                "size_gb": round(entity_count * 0.000001, 6),
                "tier": "gold",
            },
            {
                "name": "relationships",
                "format": "postgresql",
                "records": int(relationship_count),
                "size_gb": round(relationship_count * 0.000001, 6),
                "tier": "gold",
            },
        ]

        return build_success({"datasets": datasets})
    except Exception as exc:
        return build_error("QUERY_ERROR", f"Failed to fetch datasets: {exc}")


# WEEK 10-11: DATA LAKE & QUALITY - New Endpoints

@router.get("/quality")
async def get_data_quality(dataset: str | None = Query(default=None)):
    """GET /api/data-lake/quality - Data quality metrics (Week 10)"""
    try:
        if dataset and dataset in DATA_QUALITY_SCORES:
            scores = DATA_QUALITY_SCORES[dataset]
            overall = sum(scores.values()) / len(scores)
            return build_success({
                "dataset": dataset,
                "overall_score": round(overall, 1),
                "metrics": scores,
            })
        
        # All datasets
        quality = []
        for ds, scores in DATA_QUALITY_SCORES.items():
            overall = sum(scores.values()) / len(scores)
            quality.append({
                "dataset": ds,
                "overall_score": round(overall, 1),
                "completeness": scores["completeness"],
                "accuracy": scores["accuracy"],
            })
        
        return build_success({"datasets": quality})
    except Exception as e:
        return build_error("QUERY_ERROR", f"Failed to fetch quality metrics: {e}")


@router.get("/lineage")
async def get_data_lineage(dataset: str | None = Query(default=None)):
    """GET /api/data-lake/lineage - Data lineage tracking (Week 11)"""
    try:
        if dataset and dataset in DATA_LINEAGE:
            lineage = DATA_LINEAGE[dataset]
            return build_success({
                "dataset": dataset,
                "lineage_path": lineage,
                "stages": len(lineage),
            })
        
        # All lineages
        lineages = []
        for ds, path in DATA_LINEAGE.items():
            lineages.append({
                "dataset": ds,
                "stages": len(path),
                "source": path[0] if path else "unknown",
                "destination": path[-1] if path else "unknown",
            })
        
        return build_success({"lineages": lineages})
    except Exception as e:
        return build_error("QUERY_ERROR", f"Failed to fetch lineage: {e}")


@router.get("/costs")
async def get_query_costs(days: int = Query(default=1)):
    """GET /api/data-lake/costs - Query cost monitoring (Week 11)"""
    try:
        total_cost = sum(q["cost_units"] for q in QUERY_COSTS)
        avg_cost = total_cost / len(QUERY_COSTS) if QUERY_COSTS else 0
        max_rows = max((q["rows_scanned"] for q in QUERY_COSTS), default=0)
        
        return build_success({
            "period_days": days,
            "total_cost_units": round(total_cost, 2),
            "average_cost_per_query": round(avg_cost, 2),
            "total_rows_scanned": sum(q["rows_scanned"] for q in QUERY_COSTS),
            "queries_tracked": len(QUERY_COSTS),
            "max_rows_scanned": max_rows,
        })
    except Exception as e:
        return build_error("QUERY_ERROR", f"Failed to fetch costs: {e}")


@router.get("/materialized-views")
async def get_materialized_views():
    """GET /api/data-lake/materialized-views - Materialized views metadata (Week 11)"""
    try:
        materialized_views = [
            {
                "name": "v_conflict_risk_summary",
                "base_tables": ["country_relations", "entities"],
                "refresh_frequency": "hourly",
                "rows": 1247,
                "size_gb": 0.012,
                "last_refresh": "2026-03-21T10:00:00Z",
            },
            {
                "name": "v_entity_metrics_daily",
                "base_tables": ["entities", "relationships"],
                "refresh_frequency": "daily",
                "rows": 892,
                "size_gb": 0.008,
                "last_refresh": "2026-03-21T00:00:00Z",
            },
            {
                "name": "v_economic_indicators_monthly",
                "base_tables": ["economic_indicators"],
                "refresh_frequency": "monthly",
                "rows": 185,
                "size_gb": 0.002,
                "last_refresh": "2026-03-01T00:00:00Z",
            },
        ]
        
        return build_success({"materialized_views": materialized_views})
    except Exception as e:
        return build_error("QUERY_ERROR", f"Failed to fetch materialized views: {e}")
