#!/usr/bin/env python3
"""Continuously update serving health metrics to simulate live data changes."""

import asyncio
import random
from datetime import datetime
from sqlalchemy import select, delete
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker

# Add backend to path
import sys
sys.path.insert(0, 'backend')

from config import settings
from db.schemas import SystemMetric

DB_URL = settings.POSTGRES_URL

async def update_serving_metrics():
    """Update serving health metrics with slight variations."""
    engine = create_async_engine(DB_URL, echo=False)
    async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    
    iteration = 0
    while True:
        try:
            async with async_session() as session:
                # Clear old metrics (keep only latest)
                existing = (await session.execute(
                    select(SystemMetric).where(
                        SystemMetric.metric_name.in_([
                            'serving_requests_per_min',
                            'serving_latency_ms',
                            'serving_error_rate_pct',
                            'serving_uptime_pct'
                        ])
                    ).order_by(SystemMetric.timestamp.desc())
                )).scalars().all()
                
                # Keep only the most recent one
                if len(existing) > 1:
                    for metric in existing[1:]:
                        await session.delete(metric)
                
                # Update with new values based on base values + random fluctuation
                base_latency = 45.5
                base_requests = 125.0
                base_error = 0.1
                base_uptime = 99.9
                
                new_latency = base_latency + random.uniform(-5, 5)  # Vary by up to 5ms
                new_requests = base_requests + random.uniform(-30, 40)  # Vary by 30-40 req/min
                new_error = max(0, base_error + random.uniform(-0.05, 0.08))  # Vary but keep positive
                new_uptime = min(100, base_uptime + random.uniform(-0.5, 0.1))  # Slight variation
                
                new_metrics = [
                    SystemMetric(
                        metric_name='serving_latency_ms',
                        metric_value=float(new_latency),
                        timestamp=datetime.utcnow(),
                        metadata={'service': 'prediction-serving'}
                    ),
                    SystemMetric(
                        metric_name='serving_requests_per_min',
                        metric_value=float(new_requests),
                        timestamp=datetime.utcnow(),
                        metadata={'service': 'prediction-serving'}
                    ),
                    SystemMetric(
                        metric_name='serving_error_rate_pct',
                        metric_value=float(new_error),
                        timestamp=datetime.utcnow(),
                        metadata={'service': 'prediction-serving'}
                    ),
                    SystemMetric(
                        metric_name='serving_uptime_pct',
                        metric_value=float(new_uptime),
                        timestamp=datetime.utcnow(),
                        metadata={'service': 'prediction-serving'}
                    ),
                ]
                
                for metric in new_metrics:
                    session.add(metric)
                
                await session.commit()
                iteration += 1
                
                if iteration % 12 == 0:  # Log every minute
                    print(f"Updated serving metrics (iteration {iteration})")
                    print(f"  Latency: {new_latency:.2f}ms, Requests: {new_requests:.2f}/min, Error: {new_error:.3f}%, Uptime: {new_uptime:.2f}%")
                
        except Exception as e:
            print(f"Error updating metrics: {e}")
        
        # Wait 5 seconds before next update (matches frontend polling interval)
        await asyncio.sleep(5)

async def main():
    try:
        await update_serving_metrics()
    except KeyboardInterrupt:
        print("\nStopped metrics updater")

if __name__ == '__main__':
    print("Starting serving health metrics updater (5s interval)...")
    print("Press Ctrl+C to stop")
    asyncio.run(main())
