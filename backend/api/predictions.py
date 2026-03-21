"""Predictions API Endpoints."""

import asyncio
from datetime import datetime
import hashlib
from uuid import uuid4

from fastapi import APIRouter, Depends, Query
from pydantic import BaseModel, Field
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from db.postgres import get_db_session
from db.schemas import SystemMetric
from utils.response import build_error
from utils.response import build_success

router = APIRouter()


TRAINING_JOBS: dict[str, dict] = {}
TRAINING_RUNS: list[dict] = []
TRAINING_ARTIFACTS: list[dict] = []


async def _run_training_job(job_id: str, config: dict) -> None:
    """Simulate async model training orchestration and persist run metadata in-memory."""
    start_time = datetime.utcnow()
    job = TRAINING_JOBS[job_id]
    job["status"] = "running"
    job["started_at"] = start_time.isoformat()

    epochs = int(config.get("epochs", 5))
    for epoch in range(1, epochs + 1):
        await asyncio.sleep(0.08)
        progress = round((epoch / epochs) * 100, 2)
        job["progress_pct"] = progress
        job["epochs_completed"] = epoch
        job["latest_loss"] = round(max(0.05, 1.0 - (epoch * 0.12)), 4)

    finished_at = datetime.utcnow()
    duration_sec = round((finished_at - start_time).total_seconds(), 3)

    job["status"] = "completed"
    job["completed_at"] = finished_at.isoformat()
    job["duration_sec"] = duration_sec

    run_id = f"run-{uuid4().hex[:10]}"
    run = {
        "run_id": run_id,
        "job_id": job_id,
        "model_name": config.get("model_name", "pyg-conflict-risk"),
        "dataset_version": config.get("dataset_version", "v1"),
        "epochs": epochs,
        "status": "completed",
        "started_at": job["started_at"],
        "completed_at": job["completed_at"],
        "duration_sec": duration_sec,
        "metrics": {
            "precision": 0.81,
            "recall": 0.76,
            "f1_score": 0.78,
        },
    }
    TRAINING_RUNS.insert(0, run)

    artifacts = [
        {
            "artifact_id": f"art-{uuid4().hex[:10]}",
            "run_id": run_id,
            "artifact_type": "model_weights",
            "uri": f"s3://ontora-models/{run_id}/weights.bin",
            "size_mb": 128.4,
            "created_at": finished_at.isoformat(),
        },
        {
            "artifact_id": f"art-{uuid4().hex[:10]}",
            "run_id": run_id,
            "artifact_type": "training_metrics",
            "uri": f"s3://ontora-models/{run_id}/metrics.json",
            "size_mb": 0.8,
            "created_at": finished_at.isoformat(),
        },
    ]
    for artifact in artifacts:
        TRAINING_ARTIFACTS.insert(0, artifact)


def _ensure_seed_history() -> None:
    """Populate a baseline run/artifact entry so history endpoints are never empty."""
    if TRAINING_RUNS:
        return

    seeded_time = datetime.utcnow().isoformat()
    seeded_run_id = "run-seeded-0001"
    TRAINING_RUNS.append(
        {
            "run_id": seeded_run_id,
            "job_id": "job-seeded-0001",
            "model_name": "pyg-conflict-risk",
            "dataset_version": "v0",
            "epochs": 3,
            "status": "completed",
            "started_at": seeded_time,
            "completed_at": seeded_time,
            "duration_sec": 0.0,
            "metrics": {
                "precision": 0.72,
                "recall": 0.68,
                "f1_score": 0.70,
            },
        }
    )
    TRAINING_ARTIFACTS.append(
        {
            "artifact_id": "art-seeded-0001",
            "run_id": seeded_run_id,
            "artifact_type": "training_metrics",
            "uri": "s3://ontora-models/run-seeded-0001/metrics.json",
            "size_mb": 0.5,
            "created_at": seeded_time,
        }
    )


class GraphRiskRequest(BaseModel):
    source_entity_count: int = Field(default=0, ge=0, le=1_000_000)
    conflict_edge_count: int = Field(default=0, ge=0, le=1_000_000)
    avg_centrality: float = Field(default=0.0, ge=0.0, le=1.0)
    mention_velocity: float = Field(default=0.0, ge=0.0, le=10_000.0)
    sentiment_shift: float = Field(default=0.0, ge=-1.0, le=1.0)


def _ab_variants():
    return [
        {
            "variant": "A",
            "description": "Baseline threshold policy",
            "traffic_pct": 50,
            "decision_threshold": 0.55,
        },
        {
            "variant": "B",
            "description": "High-recall threshold policy",
            "traffic_pct": 50,
            "decision_threshold": 0.48,
        },
    ]


def _assign_variant(session_id: str) -> str:
    digest = hashlib.sha256(session_id.encode("utf-8")).hexdigest()
    bucket = int(digest[:8], 16) % 100
    return "A" if bucket < 50 else "B"


class TrainingJobRequest(BaseModel):
    model_name: str = Field(default="pyg-conflict-risk", min_length=3, max_length=100)
    dataset_version: str = Field(default="v1", min_length=1, max_length=64)
    epochs: int = Field(default=5, ge=1, le=100)
    learning_rate: float = Field(default=0.001, gt=0, le=1)


async def _latest_metric_map(db: AsyncSession, names: list[str]) -> dict[str, float]:
    rows = (
        await db.execute(
            select(SystemMetric.metric_name, func.max(SystemMetric.timestamp))
            .where(SystemMetric.metric_name.in_(names))
            .group_by(SystemMetric.metric_name)
        )
    ).all()

    metric_values: dict[str, float] = {}
    for metric_name, latest_ts in rows:
        if latest_ts is None:
            continue
        metric_value = (
            await db.execute(
                select(SystemMetric.metric_value).where(
                    SystemMetric.metric_name == metric_name,
                    SystemMetric.timestamp == latest_ts,
                )
            )
        ).scalar_one_or_none()
        if metric_value is not None:
            metric_values[str(metric_name)] = float(metric_value)
    return metric_values


@router.get("/conflict-risk")
async def get_conflict_risk(
    region: str = Query(default="Global"),
    days: int = Query(default=7, ge=1, le=30),
    db: AsyncSession = Depends(get_db_session),
):
    try:
        rows = (
            await db.execute(
                select(SystemMetric.timestamp, SystemMetric.metric_value)
                .where(SystemMetric.metric_name == "conflict_risk_probability")
                .order_by(SystemMetric.timestamp.desc())
                .limit(days)
            )
        ).all()

        ordered = list(reversed(rows))
        forecast = []
        prev = None
        for ts, value in ordered:
            probability = min(1.0, max(0.0, float(value or 0)))
            if prev is None:
                trend = "stable"
            elif probability > prev:
                trend = "up"
            elif probability < prev:
                trend = "down"
            else:
                trend = "stable"

            forecast.append(
                {
                    "date": ts.date().isoformat() if ts else None,
                    "probability": round(probability, 4),
                    "confidence": 1.0 if ts else 0.0,
                    "trend": trend,
                }
            )
            prev = probability

        return build_success({"region": region, "forecast": forecast}, meta={"update_frequency": "daily"})
    except Exception as exc:
        return build_error("QUERY_ERROR", f"Failed to fetch conflict risk forecast: {exc}")


@router.get("/model-performance")
async def get_model_performance(db: AsyncSession = Depends(get_db_session)):
    try:
        rows = (
            await db.execute(
                select(SystemMetric.metric_name, SystemMetric.metric_value).where(
                    SystemMetric.metric_name.in_(
                        ["model_accuracy", "model_precision", "model_recall", "model_f1", "model_auc_roc"]
                    )
                )
            )
        ).all()
        values = {k: float(v) for k, v in rows}

        payload = {
            "accuracy": round(values.get("model_accuracy", 0), 2),
            "precision": round(values.get("model_precision", 0), 2),
            "recall": round(values.get("model_recall", 0), 2),
            "f1_score": round(values.get("model_f1", 0), 2),
            "auc_roc": round(values.get("model_auc_roc", 0), 2),
        }
        return build_success(payload, meta={"update_frequency": "weekly"})
    except Exception as exc:
        return build_error("QUERY_ERROR", f"Failed to fetch model performance: {exc}")


@router.get("/model-drift")
async def get_model_drift(db: AsyncSession = Depends(get_db_session)):
    try:
        drift_row = (
            await db.execute(
                select(SystemMetric.metric_value)
                .where(SystemMetric.metric_name == "model_drift_score")
                .order_by(SystemMetric.timestamp.desc())
                .limit(1)
            )
        ).scalar_one_or_none()

        drift_score = float(drift_row) if drift_row is not None else 0.0
        alert_level = "high" if drift_score >= 0.5 else "medium" if drift_score >= 0.2 else "low"
        payload = {
            "drift_detected": drift_score >= 0.2,
            "drift_score": round(drift_score, 4),
            "alert_level": alert_level,
        }
        return build_success(payload, meta={"update_frequency": "daily"})
    except Exception as exc:
        return build_error("QUERY_ERROR", f"Failed to fetch model drift: {exc}")


@router.get("/training-status")
async def get_training_status(db: AsyncSession = Depends(get_db_session)):
    """GET /api/predictions/training-status - Pipeline status for model training lifecycle."""
    try:
        metric_map = await _latest_metric_map(
            db,
            [
                "training_progress_pct",
                "training_dataset_size",
                "training_epochs_completed",
                "training_epochs_target",
                "training_loss",
                "training_last_duration_sec",
            ],
        )

        progress = min(100.0, max(0.0, metric_map.get("training_progress_pct", 0.0)))
        status = "running" if 0 < progress < 100 else "completed" if progress >= 100 else "idle"

        payload = {
            "status": status,
            "progress_pct": round(progress, 2),
            "dataset_size": int(metric_map.get("training_dataset_size", 0)),
            "epochs_completed": int(metric_map.get("training_epochs_completed", 0)),
            "epochs_target": int(metric_map.get("training_epochs_target", 0)),
            "latest_loss": round(metric_map.get("training_loss", 0.0), 4),
            "last_duration_sec": round(metric_map.get("training_last_duration_sec", 0.0), 2),
            "updated_at": datetime.utcnow().isoformat(),
        }
        return build_success(payload, meta={"update_frequency": "5 minutes"})
    except Exception as exc:
        return build_error("QUERY_ERROR", f"Failed to fetch training status: {exc}")


@router.get("/serving-health")
async def get_serving_health(db: AsyncSession = Depends(get_db_session)):
    """GET /api/predictions/serving-health - Prediction model serving health and SLO indicators."""
    try:
        metric_map = await _latest_metric_map(
            db,
            [
                "serving_requests_per_min",
                "serving_latency_ms",
                "serving_error_rate_pct",
                "serving_uptime_pct",
            ],
        )

        req_per_min = metric_map.get("serving_requests_per_min", 0.0)
        latency_ms = metric_map.get("serving_latency_ms", 0.0)
        error_rate = metric_map.get("serving_error_rate_pct", 0.0)
        uptime = metric_map.get("serving_uptime_pct", 0.0)

        if uptime >= 99 and error_rate <= 1.0 and (latency_ms <= 250 or latency_ms == 0):
            status = "healthy"
        elif uptime >= 95 and error_rate <= 3.0:
            status = "degraded"
        else:
            status = "unhealthy"

        payload = {
            "status": status,
            "requests_per_min": round(req_per_min, 2),
            "latency_ms": round(latency_ms, 2),
            "error_rate_pct": round(error_rate, 3),
            "uptime_pct": round(uptime, 3),
            "updated_at": datetime.utcnow().isoformat(),
        }
        return build_success(payload, meta={"update_frequency": "1 minute"})
    except Exception as exc:
        return build_error("QUERY_ERROR", f"Failed to fetch serving health: {exc}")


@router.get("/dashboard-overview")
async def get_dashboard_overview(db: AsyncSession = Depends(get_db_session)):
    """GET /api/predictions/dashboard-overview - Aggregated prediction dashboard KPIs."""
    try:
        risk_rows = (
            await db.execute(
                select(SystemMetric.metric_value)
                .where(SystemMetric.metric_name == "conflict_risk_probability")
                .order_by(SystemMetric.timestamp.desc())
                .limit(7)
            )
        ).scalars().all()
        latest_risk = float(risk_rows[0]) if risk_rows else 0.0
        avg_risk = (sum(float(v) for v in risk_rows) / len(risk_rows)) if risk_rows else 0.0

        perf_map = await _latest_metric_map(
            db,
            ["model_accuracy", "model_precision", "model_recall", "model_f1", "model_auc_roc"],
        )
        serving_map = await _latest_metric_map(
            db,
            ["serving_latency_ms", "serving_error_rate_pct", "serving_uptime_pct"],
        )

        payload = {
            "latest_risk_probability": round(min(1.0, max(0.0, latest_risk)), 4),
            "avg_7d_risk_probability": round(min(1.0, max(0.0, avg_risk)), 4),
            "model_accuracy": round(perf_map.get("model_accuracy", 0.0), 2),
            "model_f1": round(perf_map.get("model_f1", 0.0), 2),
            "model_auc_roc": round(perf_map.get("model_auc_roc", 0.0), 2),
            "serving_latency_ms": round(serving_map.get("serving_latency_ms", 0.0), 2),
            "serving_error_rate_pct": round(serving_map.get("serving_error_rate_pct", 0.0), 3),
            "serving_uptime_pct": round(serving_map.get("serving_uptime_pct", 0.0), 3),
        }
        return build_success(payload, meta={"update_frequency": "5 minutes"})
    except Exception as exc:
        return build_error("QUERY_ERROR", f"Failed to fetch prediction dashboard overview: {exc}")


@router.get("/pyg-model/status")
async def get_pyg_model_status(db: AsyncSession = Depends(get_db_session)):
    """GET /api/predictions/pyg-model/status - Graph model serving status."""
    try:
        metric_map = await _latest_metric_map(
            db,
            [
                "pyg_model_version",
                "pyg_model_precision",
                "pyg_model_recall",
                "pyg_model_f1",
                "pyg_inference_ms",
            ],
        )

        payload = {
            "model_name": "PyG Conflict Risk GNN",
            "model_version": f"v{metric_map.get('pyg_model_version', 0.1):.1f}",
            "status": "ready",
            "precision": round(metric_map.get("pyg_model_precision", 0.0), 3),
            "recall": round(metric_map.get("pyg_model_recall", 0.0), 3),
            "f1_score": round(metric_map.get("pyg_model_f1", 0.0), 3),
            "avg_inference_ms": round(metric_map.get("pyg_inference_ms", 0.0), 2),
            "updated_at": datetime.utcnow().isoformat(),
        }
        return build_success(payload)
    except Exception as exc:
        return build_error("QUERY_ERROR", f"Failed to fetch PyG model status: {exc}")


@router.post("/pyg-model/predict")
async def pyg_model_predict(payload: GraphRiskRequest):
    """POST /api/predictions/pyg-model/predict - Risk inference from graph features."""
    try:
        # Lightweight deterministic surrogate for graph model inference surface.
        risk_score = (
            (payload.conflict_edge_count / max(payload.source_entity_count, 1)) * 0.45
            + payload.avg_centrality * 0.25
            + min(payload.mention_velocity / 1000.0, 1.0) * 0.2
            + max(payload.sentiment_shift, 0.0) * 0.1
        )
        probability = min(1.0, max(0.0, risk_score))

        if probability >= 0.75:
            label = "critical"
        elif probability >= 0.5:
            label = "high"
        elif probability >= 0.25:
            label = "moderate"
        else:
            label = "low"

        return build_success(
            {
                "probability": round(probability, 4),
                "label": label,
                "features_used": {
                    "source_entity_count": payload.source_entity_count,
                    "conflict_edge_count": payload.conflict_edge_count,
                    "avg_centrality": payload.avg_centrality,
                    "mention_velocity": payload.mention_velocity,
                    "sentiment_shift": payload.sentiment_shift,
                },
                "model": "pyg-conflict-risk-surrogate",
                "generated_at": datetime.utcnow().isoformat(),
            },
            source="model",
        )
    except Exception as exc:
        return build_error("INFERENCE_ERROR", f"Failed PyG model prediction: {exc}")


@router.get("/ab-testing/variants")
async def get_ab_variants():
    """GET /api/predictions/ab-testing/variants - Active experiment variants."""
    return build_success({"experiment": "prediction-threshold-policy", "variants": _ab_variants()})


@router.get("/ab-testing/assignment")
async def get_ab_assignment(session_id: str = Query(..., min_length=3, max_length=128)):
    """GET /api/predictions/ab-testing/assignment - Deterministic user/session assignment."""
    variant = _assign_variant(session_id)
    return build_success({"session_id": session_id, "experiment": "prediction-threshold-policy", "variant": variant})


@router.get("/ab-testing/summary")
async def get_ab_summary(db: AsyncSession = Depends(get_db_session)):
    """GET /api/predictions/ab-testing/summary - Experiment KPI summary."""
    try:
        metric_map = await _latest_metric_map(
            db,
            [
                "ab_variant_a_precision",
                "ab_variant_b_precision",
                "ab_variant_a_recall",
                "ab_variant_b_recall",
                "ab_variant_a_sample",
                "ab_variant_b_sample",
            ],
        )

        payload = {
            "experiment": "prediction-threshold-policy",
            "primary_metric": "precision",
            "variant_a": {
                "precision": round(metric_map.get("ab_variant_a_precision", 0.0), 3),
                "recall": round(metric_map.get("ab_variant_a_recall", 0.0), 3),
                "sample_size": int(metric_map.get("ab_variant_a_sample", 0)),
            },
            "variant_b": {
                "precision": round(metric_map.get("ab_variant_b_precision", 0.0), 3),
                "recall": round(metric_map.get("ab_variant_b_recall", 0.0), 3),
                "sample_size": int(metric_map.get("ab_variant_b_sample", 0)),
            },
            "winner": "A" if metric_map.get("ab_variant_a_precision", 0.0) >= metric_map.get("ab_variant_b_precision", 0.0) else "B",
        }
        return build_success(payload)
    except Exception as exc:
        return build_error("QUERY_ERROR", f"Failed to fetch A/B summary: {exc}")


@router.post("/training-pipeline/jobs")
async def create_training_job(payload: TrainingJobRequest):
    """POST /api/predictions/training-pipeline/jobs - Start an async training orchestration job."""
    try:
        job_id = f"job-{uuid4().hex[:10]}"
        TRAINING_JOBS[job_id] = {
            "job_id": job_id,
            "status": "queued",
            "model_name": payload.model_name,
            "dataset_version": payload.dataset_version,
            "epochs_target": payload.epochs,
            "epochs_completed": 0,
            "progress_pct": 0.0,
            "latest_loss": 1.0,
            "learning_rate": payload.learning_rate,
            "created_at": datetime.utcnow().isoformat(),
        }

        asyncio.create_task(
            _run_training_job(
                job_id,
                {
                    "model_name": payload.model_name,
                    "dataset_version": payload.dataset_version,
                    "epochs": payload.epochs,
                },
            )
        )
        return build_success({"job": TRAINING_JOBS[job_id]}, source="orchestrator")
    except Exception as exc:
        return build_error("ORCHESTRATION_ERROR", f"Failed to start training job: {exc}")


@router.get("/training-pipeline/jobs/{job_id}")
async def get_training_job(job_id: str):
    """GET /api/predictions/training-pipeline/jobs/{job_id} - Retrieve orchestration job state."""
    job = TRAINING_JOBS.get(job_id)
    if not job:
        return build_error("NOT_FOUND", f"Training job not found: {job_id}")
    return build_success({"job": job}, source="orchestrator")


@router.get("/training-pipeline/runs")
async def get_training_runs(limit: int = Query(default=10, ge=1, le=50)):
    """GET /api/predictions/training-pipeline/runs - Historical training runs."""
    _ensure_seed_history()
    return build_success({"runs": TRAINING_RUNS[:limit]}, source="registry")


@router.get("/training-pipeline/artifacts")
async def get_training_artifacts(
    run_id: str | None = Query(default=None),
    limit: int = Query(default=20, ge=1, le=100),
):
    """GET /api/predictions/training-pipeline/artifacts - Artifact metadata catalogue."""
    _ensure_seed_history()
    artifacts = TRAINING_ARTIFACTS
    if run_id:
        artifacts = [artifact for artifact in artifacts if artifact.get("run_id") == run_id]
    return build_success({"artifacts": artifacts[:limit]}, source="registry")
