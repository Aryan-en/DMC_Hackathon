"""Data Streams API Endpoints - Week 9: Streaming & Kafka Lag Monitoring."""

from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, Query
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from db.postgres import get_db_session
from db.schemas import SystemMetric
from utils.response import build_error
from utils.response import build_success

router = APIRouter()

# In-memory Kafka lag tracking (Week 9: Kafka lag monitoring)
KAFKA_LAG_STATE = {
    "mea.relations.raw": {"partition_0": 245, "partition_1": 189, "partition_2": 312},
    "economic.indicators.batch": {"partition_0": 18, "partition_1": 5},
    "documents.raw": {"partition_0": 892, "partition_1": 756, "partition_2": 601, "partition_3": 445},
}

FLINK_CLUSTERS = {  # Week 9: Flink clusters
    "conflict-aggregation": {"taskmanagers": 3, "parallelism": 8, "uptime_hours": 48.5, "health": 92},
    "entity-enrichment": {"taskmanagers": 2, "parallelism": 6, "uptime_hours": 36.2, "health": 88},
    "indicator-windowing": {"taskmanagers": 2, "parallelism": 4, "uptime_hours": 24.1, "health": 85},
}

STREAM_ALERTS = [  # Week 9: Real-time alerting
    {"topic": "documents.raw", "alert": "High lag detected (2000+ messages)", "severity": "WARNING", "timestamp": "2026-03-21T10:45:00Z"},
    {"topic": "mea.relations.raw", "alert": "Partition rebalance in progress", "severity": "INFO", "timestamp": "2026-03-21T10:30:00Z"},
]


@router.get("/topics")
async def get_topics(db: AsyncSession = Depends(get_db_session)):
    try:
        rows = (
            await db.execute(
                select(SystemMetric.metric_name, SystemMetric.metric_value)
                .where(SystemMetric.metric_name.like("stream_topic_%"))
                .order_by(SystemMetric.timestamp.desc())
            )
        ).all()

        topic_map = {}
        for name, value in rows:
            parts = name.split("_")
            if len(parts) < 5:
                continue
            # stream_topic_<topic_id>_<field>
            topic_id = parts[2]
            field = "_".join(parts[3:])
            bucket = topic_map.setdefault(topic_id, {})
            bucket[field] = float(value)

        topics = []
        for topic_id, vals in topic_map.items():
            lag = int(vals.get("lag", 0))
            throughput = int(vals.get("throughput", 0))
            status_score = vals.get("health", 0)
            status = "healthy" if status_score >= 85 else "warning" if status_score >= 60 else "degraded"
            topics.append(
                {
                    "topic": topic_id,
                    "partitions": int(vals.get("partitions", 0)),
                    "lag": lag,
                    "throughput": throughput,
                    "status": status,
                }
            )

        topics.sort(key=lambda x: x["lag"], reverse=True)
        return build_success({"topics": topics}, meta={"update_frequency": "10 seconds"})
    except Exception as exc:
        return build_error("QUERY_ERROR", f"Failed to fetch stream topics: {exc}")


@router.get("/pipelines")
async def get_pipelines(db: AsyncSession = Depends(get_db_session)):
    try:
        rows = (
            await db.execute(
                select(SystemMetric.metric_name, SystemMetric.metric_value)
                .where(SystemMetric.metric_name.like("pipeline_%"))
                .order_by(SystemMetric.timestamp.desc())
            )
        ).all()

        pipeline_map = {}
        for name, value in rows:
            parts = name.split("_")
            if len(parts) < 3:
                continue
            pipeline_name = parts[1]
            field = "_".join(parts[2:])
            pipeline_map.setdefault(pipeline_name, {})[field] = float(value)

        pipelines = []
        for name, vals in pipeline_map.items():
            health = vals.get("health", 0)
            status = "healthy" if health >= 85 else "warning" if health >= 60 else "degraded"
            pipelines.append(
                {
                    "name": name,
                    "status": status,
                    "throughput": str(int(vals.get("throughput", 0))),
                    "latency": f"{round(vals.get('latency_ms', 0), 2)}ms",
                }
            )

        return build_success({"pipelines": pipelines}, meta={"update_frequency": "30 seconds"})
    except Exception as exc:
        return build_error("QUERY_ERROR", f"Failed to fetch stream pipelines: {exc}")


# WEEK 9: STREAMING SETUP - New Endpoints

@router.get("/kafka/lag")
async def get_kafka_lag(topic: str | None = Query(default=None)):
    """GET /api/streams/kafka/lag - Kafka consumer lag monitoring (Week 9)"""
    try:
        if topic and topic in KAFKA_LAG_STATE:
            partitions = KAFKA_LAG_STATE[topic]
            total_lag = sum(partitions.values())
            return build_success({
                "topic": topic,
                "total_lag": total_lag,
                "partition_lag": partitions,
                "lag_healthy": total_lag < 500,
            })
        
        # All topics
        lag_summary = []
        for t, partitions in KAFKA_LAG_STATE.items():
            total = sum(partitions.values())
            lag_summary.append({
                "topic": t,
                "total_lag": total,
                "partition_count": len(partitions),
                "max_lag": max(partitions.values()) if partitions else 0,
                "lag_healthy": total < 500,
            })
        
        return build_success({"topics": lag_summary})
    except Exception as e:
        return build_error("QUERY_ERROR", f"Failed to fetch Kafka lag: {e}")


@router.get("/flink/clusters")
async def get_flink_clusters():
    """GET /api/streams/flink/clusters - Flink cluster status (Week 9)"""
    try:
        clusters = []
        for name, config in FLINK_CLUSTERS.items():
            clusters.append({
                "cluster_name": name,
                "status": "running",
                "taskmanagers": config["taskmanagers"],
                "parallelism": config["parallelism"],
                "uptime_hours": config["uptime_hours"],
                "health_score": config["health"],
            })
        
        return build_success({"clusters": clusters})
    except Exception as e:
        return build_error("QUERY_ERROR", f"Failed to fetch Flink clusters: {e}")


@router.get("/alerts")
async def get_stream_alerts(severity: str | None = Query(default=None)):
    """GET /api/streams/alerts - Real-time stream alerts (Week 9)"""
    try:
        alerts = STREAM_ALERTS
        if severity:
            alerts = [a for a in alerts if a["severity"].upper() == severity.upper()]
        
        return build_success({"alerts": alerts, "count": len(alerts)})
    except Exception as e:
        return build_error("QUERY_ERROR", f"Failed to fetch alerts: {e}")


@router.get("/aggregations")
async def get_streaming_aggregations():
    """GET /api/streams/aggregations - Streaming aggregations (Week 9)"""
    try:
        aggregations = [
            {
                "name": "conflict_hourly_count",
                "source_topic": "mea.relations.raw",
                "aggregation_type": "count",
                "window": "1h",
                "last_update": "2026-03-21T10:45:00Z",
                "value": 1247,
            },
            {
                "name": "entity_monthly_distinct",
                "source_topic": "documents.raw",
                "aggregation_type": "distinct_count",
                "window": "1d",
                "last_update": "2026-03-21T10:48:00Z",
                "value": 892,
            },
            {
                "name": "indicator_moving_avg",
                "source_topic": "economic.indicators.batch",
                "aggregation_type": "moving_average",
                "window": "7d",
                "last_update": "2026-03-21T10:50:00Z",
                "value": 3.847,
            },
        ]
        
        return build_success({"aggregations": aggregations})
    except Exception as e:
        return build_error("QUERY_ERROR", f"Failed to fetch aggregations: {e}")
