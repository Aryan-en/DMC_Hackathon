"""Standardized API response helpers for ONTORA."""

from datetime import datetime
import uuid
from typing import Any, Optional, List


def build_success(data: Any, *, source: str = "db", latency_ms: Optional[int] = None, meta: Optional[dict] = None, progress: Optional[int] = None, logs: Optional[List[str]] = None) -> dict:
    base_meta = {
        "timestamp": datetime.utcnow().isoformat(),
        "request_id": str(uuid.uuid4()),
        "source": source,
    }
    if latency_ms is not None:
        base_meta["latency_ms"] = latency_ms
    if meta:
        base_meta.update(meta)

    response = {
        "status": "success",
        "data": data,
        "error": None,
        "meta": base_meta,
    }
    
    if progress is not None:
        response["progress"] = progress
    if logs is not None:
        response["logs"] = logs

    return response


def build_error(code: str, message: str, *, status: str = "error", source: str = "service", meta: Optional[dict] = None, progress: Optional[int] = None, logs: Optional[List[str]] = None) -> dict:
    base_meta = {
        "timestamp": datetime.utcnow().isoformat(),
        "request_id": str(uuid.uuid4()),
        "source": source,
    }
    if meta:
        base_meta.update(meta)

    response = {
        "status": status,
        "data": None,
        "error": {
            "code": code,
            "message": message,
        },
        "meta": base_meta,
    }
    
    if progress is not None:
        response["progress"] = progress
    if logs is not None:
        response["logs"] = logs

    return response
