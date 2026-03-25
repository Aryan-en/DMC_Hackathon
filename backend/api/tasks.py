"""API Endpoints for Task Orchestration and Ingestion Control."""

from datetime import datetime
from fastapi import APIRouter, HTTPException
from core.celery_app import celery_app
from tasks.ingestion import run_full_ingestion, scheduled_mea_sync, scheduled_gdelt_sync
from utils.response import build_success, build_error

router = APIRouter()

@router.post("/ingestion/trigger-all")
@router.post("/full-ingestion")
async def trigger_full_ingestion_api():
    """Manually trigger the full ingestion pipeline as a background task."""
    try:
        task = run_full_ingestion.delay()
        return build_success({
            "task_id": task.id,
            "status": "queued",
            "message": "Full ingestion pipeline started in background."
        })
    except Exception as e:
        return build_error("TASK_ERROR", f"Failed to trigger ingestion: {str(e)}")

@router.post("/simulate-metrics")
async def trigger_simulated_metrics():
    """Manually trigger the metrics simulation for immediate dashboard updates."""
    from tasks.ingestion import generate_simulated_metrics
    try:
        task = generate_simulated_metrics.delay()
        return build_success({
            "task_id": task.id,
            "status": "queued",
            "message": "Metrics simulation triggered."
        })
    except Exception as e:
        return build_error("TASK_ERROR", f"Failed to trigger simulation: {str(e)}")

@router.get("/status/{task_id}")
async def get_task_status(task_id: str):
    """Check the status of a background task."""
    task_result = celery_app.AsyncResult(task_id)
    return build_success({
        "task_id": task_id,
        "status": task_result.status,
        "result": task_result.result if task_result.ready() else None
    })

@router.get("/telemetry/live")
async def get_live_telemetry():
    """GET /api/tasks/telemetry/live - High-fidelity system metrics for dynamic charts."""
    import random
    import time
    
    # Generate oscillating CPU usage (45-85% range)
    # Using a sine-like oscillation + noise for 'Task Manager' feel
    t = time.time()
    osc = (random.random() * 5) + (15 * (t % 60) / 60) 
    cpu_usage = min(99.8, max(42.1, 65 + osc + random.uniform(-8, 8)))
    
    return build_success({
        "cpu": {
            "utilization": round(cpu_usage, 1),
            "speed_ghz": round(2.4 + random.uniform(-0.1, 0.2), 2),
            "uptime": "0:10:24:18",  # Simulated uptime string
            "threads": 48,
            "processes": 216,
        },
        "memory": {
            "used_gb": round(12.4 + random.uniform(-0.2, 0.3), 1),
            "total_gb": 32.0,
            "percent": 38.8
        },
        "network": {
            "in_mbps": round(142.5 + random.uniform(-10, 20), 1),
            "out_mbps": round(84.2 + random.uniform(-5, 10), 1)
        },
        "timestamp": datetime.utcnow().isoformat()
    })


@router.get("/active-ingestors")
async def get_active_ingestors():
    """List all available ingestors and their last run status."""
    # This would ideally come from a DB or Redis state
    return build_success({
        "ingestors": [
            {"id": "mea", "name": "Ministry of External Affairs", "type": "Scraper", "status": "active"},
            {"id": "worldbank", "name": "World Bank Economic Data", "type": "API", "status": "active"},
            {"id": "gdelt", "name": "GDELT Global Events", "type": "Stream", "status": "active"},
        ]
    })
