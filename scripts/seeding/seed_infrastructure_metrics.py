#!/usr/bin/env python3
"""
Seed script for Infrastructure Health Metrics.
Populates SystemMetric table with infrastructure component health values.

Infrastructure components:
- Kafka Cluster: Message streaming platform
- Neo4j Graph: Knowledge graph database
- ML Pipeline: Machine learning model serving
- Vector Search: Embedding and semantic search
- Flink Jobs: Stream processing framework
"""

import asyncio
import sys
import uuid
from datetime import datetime
from pathlib import Path

# Add backend to path
sys.path.insert(0, str(Path(__file__).parent / 'backend'))

from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from sqlalchemy import delete, select

from db.schemas import SystemMetric, Base
from config import settings

async def seed_infrastructure_metrics():
    """Populate infrastructure health metrics."""
    
    # Create async engine
    db_url = settings.POSTGRES_URL
    engine = create_async_engine(db_url, echo=False)
    
    async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    
    async with async_session() as session:
        print("🔄 Seeding infrastructure health metrics...\n")
        
        # Define infrastructure components with health values
        infrastructure_metrics = [
            {
                "metric_name": "infra_kafka_health",
                "metric_value": 94,  # 94% (stored as 0-100%)
                "unit": "percent",
                "tags": {"component": "kafka", "type": "streaming", "status": "healthy"},
            },
            {
                "metric_name": "infra_neo4j_health",
                "metric_value": 91,  # 91%
                "unit": "percent",
                "tags": {"component": "neo4j", "type": "graph", "status": "healthy"},
            },
            {
                "metric_name": "infra_ml_health",
                "metric_value": 87,  # 87%
                "unit": "percent",
                "tags": {"component": "ml_pipeline", "type": "inference", "status": "healthy"},
            },
            {
                "metric_name": "infra_vector_health",
                "metric_value": 89,  # 89%
                "unit": "percent",
                "tags": {"component": "vector_search", "type": "embeddings", "status": "healthy"},
            },
            {
                "metric_name": "infra_flink_health",
                "metric_value": 92,  # 92%
                "unit": "percent",
                "tags": {"component": "flink", "type": "streaming", "status": "healthy"},
            },
        ]
        
        # Clear existing infrastructure metrics
        await session.execute(
            delete(SystemMetric).where(
                SystemMetric.metric_name.in_([m["metric_name"] for m in infrastructure_metrics])
            )
        )
        await session.commit()
        
        # Create metrics
        created_count = 0
        for metric_data in infrastructure_metrics:
            metric = SystemMetric(
                id=uuid.uuid4(),
                metric_name=metric_data["metric_name"],
                metric_value=metric_data["metric_value"],
                unit=metric_data["unit"],
                tags=metric_data["tags"],
                timestamp=datetime.utcnow(),
            )
            session.add(metric)
            created_count += 1
            
            # Print individual metric
            health_pct = int(metric_data["metric_value"])
            component_name = " ".join(metric_data["metric_name"].replace("infra_", "").replace("_health", "").split("_")).title()
            color_emoji = "🟢" if health_pct >= 90 else "🟡" if health_pct >= 80 else "🔴"
            print(f"  {color_emoji} {component_name:20} {health_pct:3}%")
        
        await session.commit()
        
        print("\n" + "="*70)
        print("✅ INFRASTRUCTURE HEALTH METRICS SEEDED")
        print("="*70)
        print(f"✓ Metrics created: {created_count}")
        print(f"✓ Kafka Cluster:     94% (Healthy)")
        print(f"✓ Neo4j Graph:       91% (Healthy)")  
        print(f"✓ ML Pipeline:       87% (Healthy)")
        print(f"✓ Vector Search:     89% (Healthy)")
        print(f"✓ Flink Jobs:        92% (Healthy)")
        print(f"\nAccess infrastructure health at:")
        print(f"  🌐 http://localhost:3002/ (Dashboard)")
        print(f"  📡 API: http://localhost:8000/api/metrics/infrastructure-health")
        print("="*70 + "\n")


if __name__ == "__main__":
    asyncio.run(seed_infrastructure_metrics())
