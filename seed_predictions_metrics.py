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

from config import settings
from db.schemas import SystemMetric, Base

DB_URL = settings.POSTGRES_URL

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
                metric_value=float(probability),
                timestamp=metric_date,
                metadata={"region": "Global"}
            )
            metrics.append(metric)
        
        # Add other model metrics
        model_metrics = [
            ("model_accuracy", 0.84),
            ("model_precision", 0.81),
            ("model_recall", 0.79),
            ("model_f1", 0.80),
            ("model_auc_roc", 0.87),
        ]
        
        for metric_name, value in model_metrics:
            metric = SystemMetric(
                metric_name=metric_name,
                metric_value=float(value),
                timestamp=datetime.utcnow(),
                metadata={"model": "PyG Conflict Risk GNN"}
            )
            metrics.append(metric)
        
        # Add serving health metrics
        serving_metrics = [
            ("serving_requests_per_min", 125.0),
            ("serving_latency_ms", 45.5),
            ("serving_error_rate_pct", 0.1),
            ("serving_uptime_pct", 99.9),
        ]
        
        for metric_name, value in serving_metrics:
            metric = SystemMetric(
                metric_name=metric_name,
                metric_value=float(value),
                timestamp=datetime.utcnow(),
                metadata={"service": "prediction-serving"}
            )
            metrics.append(metric)
        
        # Add training status metrics
        training_metrics = [
            ("training_progress_pct", 50.0),
            ("training_dataset_size", 5000.0),
            ("training_epochs_completed", 3.0),
            ("training_epochs_target", 5.0),
            ("training_loss", 0.0523),
            ("training_last_duration_sec", 120.5),
        ]
        
        for metric_name, value in training_metrics:
            metric = SystemMetric(
                metric_name=metric_name,
                metric_value=float(value),
                timestamp=datetime.utcnow(),
                metadata={"training": "pyg-conflict-risk-v1"}
            )
            metrics.append(metric)
        
        # Add PyG model metrics
        pyg_metrics = [
            ("pyg_model_version", 0.1),
            ("pyg_model_precision", 0.87),
            ("pyg_model_recall", 0.82),
            ("pyg_model_f1", 0.845),
            ("pyg_inference_ms", 23.5),
        ]
        
        for metric_name, value in pyg_metrics:
            metric = SystemMetric(
                metric_name=metric_name,
                metric_value=float(value),
                timestamp=datetime.utcnow(),
                metadata={"model": "pyg-conflict-risk-gnn"}
            )
            metrics.append(metric)
        
        # Add A/B testing metrics
        ab_metrics = [
            ("ab_variant_a_precision", 0.81),
            ("ab_variant_b_precision", 0.78),
            ("ab_variant_a_recall", 0.76),
            ("ab_variant_b_recall", 0.72),
            ("ab_variant_a_sample", 5000.0),
            ("ab_variant_b_sample", 4800.0),
        ]
        
        for metric_name, value in ab_metrics:
            metric = SystemMetric(
                metric_name=metric_name,
                metric_value=float(value),
                timestamp=datetime.utcnow(),
                metadata={"experiment": "prediction-threshold-policy"}
            )
            metrics.append(metric)
        
        # Add model drift monitoring metric
        drift_metric = SystemMetric(
            metric_name="model_drift_score",
            metric_value=0.15,
            timestamp=datetime.utcnow(),
            metadata={"monitoring": "continuous-drift-detection"}
        )
        metrics.append(drift_metric)
        
        # Add to session and commit
        session.add_all(metrics)
        await session.commit()
        
        print(f"✓ Seeded {len(metrics)} metric records for predictions endpoints")
        print(f"  - 7 conflict risk probabilities")
        print(f"  - 5 model performance metrics")
        print(f"  - 4 serving health metrics")
        print(f"  - 6 training status metrics")
        print(f"  - 5 PyG model metrics")
        print(f"  - 6 A/B testing metrics")
        print(f"  - 1 model drift score")

async def main():
    try:
        await seed_metrics()
        print("\n✓ Predictions metrics data is ready!")
    except Exception as e:
        print(f"✗ Error seeding metrics: {e}")
        sys.exit(1)

if __name__ == "__main__":
    asyncio.run(main())
