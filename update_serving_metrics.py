#!/usr/bin/env python3
"""Continuously update serving health metrics to simulate live data changes."""

import asyncio
import random
from datetime import datetime, timezone
from sqlalchemy import select
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
                tracked_metrics = [
                    'serving_requests_per_min',
                    'serving_latency_ms',
                    'serving_error_rate_pct',
                    'serving_uptime_pct',
                    'serving_cpu_util_pct',
                    'serving_cpu_speed_ghz',
                    'serving_cpu_base_speed_ghz',
                    'serving_process_count',
                    'serving_thread_count',
                    'serving_handle_count',
                    'serving_socket_count',
                    'serving_core_count',
                    'serving_logical_processors',
                    'serving_uptime_seconds',
                ]

                # Keep a rolling history window per metric for live charting.
                for metric_name in tracked_metrics:
                    existing = (await session.execute(
                        select(SystemMetric)
                        .where(SystemMetric.metric_name == metric_name)
                        .order_by(SystemMetric.timestamp.desc())
                    )).scalars().all()

                    if len(existing) > 180:
                        for stale in existing[180:]:
                            await session.delete(stale)
                
                # Update with new values based on base values + random fluctuation
                base_latency = 45.5
                base_requests = 125.0
                base_error = 0.1
                base_uptime = 99.9
                
                new_latency = base_latency + random.uniform(-5, 5)  # Vary by up to 5ms
                new_requests = base_requests + random.uniform(-30, 40)  # Vary by 30-40 req/min
                new_error = max(0, base_error + random.uniform(-0.05, 0.08))  # Vary but keep positive
                new_uptime = min(100, base_uptime + random.uniform(-0.5, 0.1))  # Slight variation

                cpu_util = min(100.0, max(3.0, (new_requests * 0.18) + (new_latency * 0.35) + random.uniform(-4, 6)))
                cpu_speed = 2.30 + random.uniform(-0.15, 0.25)
                process_count = int(500 + random.uniform(-20, 25))
                thread_count = int(9150 + random.uniform(-250, 260))
                handle_count = int(263000 + random.uniform(-7000, 9000))

                prev_uptime = (await session.execute(
                    select(SystemMetric.metric_value)
                    .where(SystemMetric.metric_name == 'serving_uptime_seconds')
                    .order_by(SystemMetric.timestamp.desc())
                    .limit(1)
                )).scalar_one_or_none()
                uptime_seconds = (float(prev_uptime) if prev_uptime is not None else 37237.0) + 1.0

                now_ts = datetime.now(timezone.utc).replace(tzinfo=None)
                
                new_metrics = [
                    SystemMetric(
                        metric_name='serving_latency_ms',
                        metric_value=float(new_latency),
                        timestamp=now_ts,
                        tags={'service': 'prediction-serving'}
                    ),
                    SystemMetric(
                        metric_name='serving_requests_per_min',
                        metric_value=float(new_requests),
                        timestamp=now_ts,
                        tags={'service': 'prediction-serving'}
                    ),
                    SystemMetric(
                        metric_name='serving_error_rate_pct',
                        metric_value=float(new_error),
                        timestamp=now_ts,
                        tags={'service': 'prediction-serving'}
                    ),
                    SystemMetric(
                        metric_name='serving_uptime_pct',
                        metric_value=float(new_uptime),
                        timestamp=now_ts,
                        tags={'service': 'prediction-serving'}
                    ),
                    SystemMetric(
                        metric_name='serving_cpu_util_pct',
                        metric_value=float(cpu_util),
                        timestamp=now_ts,
                        tags={'service': 'prediction-serving', 'panel': 'serving-live-matrix'}
                    ),
                    SystemMetric(
                        metric_name='serving_cpu_speed_ghz',
                        metric_value=float(cpu_speed),
                        timestamp=now_ts,
                        tags={'service': 'prediction-serving', 'panel': 'serving-live-matrix'}
                    ),
                    SystemMetric(
                        metric_name='serving_cpu_base_speed_ghz',
                        metric_value=2.60,
                        timestamp=now_ts,
                        tags={'service': 'prediction-serving', 'panel': 'serving-live-matrix'}
                    ),
                    SystemMetric(
                        metric_name='serving_process_count',
                        metric_value=float(process_count),
                        timestamp=now_ts,
                        tags={'service': 'prediction-serving', 'panel': 'serving-live-matrix'}
                    ),
                    SystemMetric(
                        metric_name='serving_thread_count',
                        metric_value=float(thread_count),
                        timestamp=now_ts,
                        tags={'service': 'prediction-serving', 'panel': 'serving-live-matrix'}
                    ),
                    SystemMetric(
                        metric_name='serving_handle_count',
                        metric_value=float(handle_count),
                        timestamp=now_ts,
                        tags={'service': 'prediction-serving', 'panel': 'serving-live-matrix'}
                    ),
                    SystemMetric(
                        metric_name='serving_socket_count',
                        metric_value=1.0,
                        timestamp=now_ts,
                        tags={'service': 'prediction-serving', 'panel': 'serving-live-matrix'}
                    ),
                    SystemMetric(
                        metric_name='serving_core_count',
                        metric_value=14.0,
                        timestamp=now_ts,
                        tags={'service': 'prediction-serving', 'panel': 'serving-live-matrix'}
                    ),
                    SystemMetric(
                        metric_name='serving_logical_processors',
                        metric_value=20.0,
                        timestamp=now_ts,
                        tags={'service': 'prediction-serving', 'panel': 'serving-live-matrix'}
                    ),
                    SystemMetric(
                        metric_name='serving_uptime_seconds',
                        metric_value=float(uptime_seconds),
                        timestamp=now_ts,
                        tags={'service': 'prediction-serving', 'panel': 'serving-live-matrix'}
                    ),
                ]
                
                for metric in new_metrics:
                    session.add(metric)
                
                await session.commit()
                iteration += 1
                
                if iteration % 60 == 0:  # Log every minute at 1s cadence
                    print(f"Updated serving metrics (iteration {iteration})")
                    print(f"  CPU: {cpu_util:.1f}%, Speed: {cpu_speed:.2f}GHz")
                    print(f"  Latency: {new_latency:.2f}ms, Requests: {new_requests:.2f}/min, Error: {new_error:.3f}%, Uptime: {new_uptime:.2f}%")
                
        except Exception as e:
            print(f"Error updating metrics: {e}")
        
        # Wait 1 second before next update for realtime matrix refresh.
        await asyncio.sleep(1)

async def main():
    try:
        await update_serving_metrics()
    except KeyboardInterrupt:
        print("\nStopped metrics updater")

if __name__ == '__main__':
    print("Starting serving health metrics updater (1s interval)...")
    print("Press Ctrl+C to stop")
    asyncio.run(main())
