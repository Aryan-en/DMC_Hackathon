"""Celery Application Instance Configuration"""

from celery import Celery
from core.config import settings

celery_app = Celery(
    "ontora_tasks",
    broker=settings.CELERY_BROKER_URL,
    backend=settings.CELERY_RESULT_BACKEND
)

celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,
    task_always_eager=settings.DEBUG,  # Run synchronously in debug/development mode if preferred
)

# Auto-discover tasks from the 'tasks' directory
celery_app.autodiscover_tasks(["tasks"])

celery_app.conf.beat_schedule = {
    "generate-simulated-metrics-every-60s": {
        "task": "tasks.ingestion.generate_simulated_metrics",
        "schedule": 60.0,
    },
    "full-ingestion-every-6h": {
        "task": "tasks.ingestion.run_full_ingestion",
        "schedule": 21600.0,
    },
}
