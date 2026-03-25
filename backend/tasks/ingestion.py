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
from uuid import uuid4
from datetime import datetime, timedelta
from sqlalchemy import select, func, delete
from db.postgres import AsyncSessionLocal
from db.schemas import SystemMetric

logger = logging.getLogger(__name__)

@celery_app.task(name="tasks.ingestion.run_full_ingestion")
def run_full_ingestion():
    """Run all scrapers and persist REAL data from GDELT/MEA to DB."""
    logger.info("Starting scheduled full ingestion...")
    from db.schemas import Document
    
    loop = asyncio.get_event_loop()
    try:
        mea_results = loop.run_until_complete(run_mea_scraper())
        wb_results = loop.run_until_complete(run_worldbank_fetcher())
        gdelt_results = loop.run_until_complete(run_gdelt_fetcher())
        
        async def _persist():
            async with AsyncSessionLocal() as session:
                # Persist GDELT Real-time news
                for art in gdelt_results:
                    # check if exists
                    exists = (await session.execute(select(Document).where(Document.url == art["url"]))).scalar_one_or_none()
                    if not exists:
                        new_doc = Document(
                            id=str(uuid4()),
                            title=art["title"],
                            source=art["source"],
                            url=art["url"],
                            content=art["content"],
                            doc_metadata=art["metadata"],
                            published_date=datetime.utcnow(),
                            created_at=datetime.utcnow(),
                            processed=True
                        )
                        session.add(new_doc)
                await session.commit()
        
        loop.run_until_complete(_persist())
        
        return {
            "mea_count": len(mea_results),
            "wb_count": len(wb_results),
            "gdelt_count": len(gdelt_results),
            "status": "success"
        }
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
