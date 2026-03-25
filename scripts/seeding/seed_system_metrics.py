import asyncio
import asyncpg
from datetime import datetime
from uuid import uuid4
import sys
from pathlib import Path

# Add backend to path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent.parent / 'backend'))

from core.config import settings

async def seed_system_metrics():
    print(f"Seeding system_metrics for {settings.POSTGRES_DB}...")
    
    conn_str_dict = {
        'host': settings.POSTGRES_HOST,
        'port': settings.POSTGRES_PORT,
        'user': settings.POSTGRES_USER,
        'password': settings.POSTGRES_PASSWORD,
        'database': settings.POSTGRES_DB,
    }
    
    try:
        conn = await asyncpg.connect(**conn_str_dict)
        
        metrics = [
            ("infra_kafka_health", 99.0),
            ("infra_neo4j_health", 98.0),
            ("infra_ml_health", 95.0),
            ("infra_vector_health", 99.0),
            ("infra_flink_health", 92.0),
            ("model_accuracy", 84.5),
            ("model_precision", 0.81),
            ("model_recall", 0.79),
            ("serving_requests_per_min", 425.0),
            ("serving_latency_ms", 125.0),
            ("serving_error_rate_pct", 0.12),
            ("serving_uptime_pct", 99.98),
            ("conflict_risk_probability", 0.35),
            ("training_dataset_size", 125000),
            ("training_epochs_completed", 12),
            ("training_epochs_target", 15),
            ("training_progress_pct", 80.0),
            ("training_loss", 0.1242)
        ]
        
        for name, value in metrics:
            await conn.execute("""
                INSERT INTO system_metrics (id, metric_name, metric_value, timestamp)
                VALUES ($1, $2, $3, NOW())
            """, str(uuid4()), name, value)
            
        print(f"Successfully seeded {len(metrics)} system metrics.")
        await conn.close()
    except Exception as e:
        print(f"Seeding error: {e}")

if __name__ == "__main__":
    asyncio.run(seed_system_metrics())
