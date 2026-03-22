#!/usr/bin/env python3
"""Seed sample metrics data for predictions endpoints."""

import asyncio
from datetime import datetime, timedelta
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker

# Add backend to path
import sys
sys.path.insert(0, 'backend')

from db.schemas import SystemMetric, Base
from db.config import DB_URL

async def seed_metrics():
    """Seed sample prediction metrics data."""
    # Create engine and session
    engine = create_async_engine(DB_URL, echo=False)
    async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    
    async with async_session() as session:
        # Check if metrics already exist
        count = (await session.execute(
            select(func.count(SystemMetric.id)).where(
                SystemMetric.metric_name == "conflict_risk_probability"
            )
        )).scalar() or 0
        
        if count > 5:
            print(f"✓ Metrics already seeded: {count} records found")
            return
        
        # Create metrics
        base_date = datetime.utcnow() - timedelta(days=7)
        metrics = []
        
        # Generate conflict risk probabilities
        for i in range(7):
            metric_date = base_date + timedelta(days=i)
            probability = 0.32 + (i * 0.02)  # Increasing trend
            
            metric = SystemMetric(
                metric_name="conflict_risk_probability",
                metric_value=str(probability),
                timestamp=metric_date,
                metadata={"region": "Global"}
            )
            metrics.append(metric)
        
        # Add other model metrics
        model_metrics = [
            ("model_accuracy", "0.84"),
            ("model_precision", "0.81"),
            ("model_recall", "0.79"),
            ("model_f1", "0.80"),
            ("model_auc_roc", "0.87"),
        ]
        
        for metric_name, value in model_metrics:
            metric = SystemMetric(
                metric_name=metric_name,
                metric_value=value,
                timestamp=datetime.utcnow(),
                metadata={"model": "PyG Conflict Risk GNN"}
            )
            metrics.append(metric)
        
        # Add to session and commit
        session.add_all(metrics)
        await session.commit()
        
        print(f"✓ Seeded {len(metrics)} metric records for predictions endpoints")
        print(f"  - 7 conflict risk probabilities")
        print(f"  - 5 model performance metrics")

async def main():
    try:
        await seed_metrics()
        print("\n✓ Predictions metrics data is ready!")
    except Exception as e:
        print(f"✗ Error seeding metrics: {e}")
        sys.exit(1)

if __name__ == "__main__":
    asyncio.run(main())
