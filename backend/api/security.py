"""Security & Governance API Endpoints."""

from datetime import datetime, timedelta

from fastapi import APIRouter, Depends, Query
from pydantic import BaseModel, Field
from sqlalchemy import case, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from db.postgres import get_db_session
from db.schemas import AuditLog
from utils.response import build_error
from utils.response import build_success

router = APIRouter()


class AccessCheckRequest(BaseModel):
    clearance_level: str = Field(default="FOUO", min_length=2, max_length=16)
    classification: str = Field(default="FOUO", min_length=2, max_length=16)


@router.get("/audit-log")
async def get_audit_log(limit: int = Query(default=50, ge=1, le=500), db: AsyncSession = Depends(get_db_session)):
    try:
        rows = (
            await db.execute(
                select(
                    AuditLog.timestamp,
                    AuditLog.user_id,
                    AuditLog.action,
                    AuditLog.resource,
                    AuditLog.classification,
                    AuditLog.status,
                )
                .order_by(AuditLog.timestamp.desc())
                .limit(limit)
            )
        ).all()

        logs = [
            {
                "timestamp": ts.isoformat() if ts else None,
                "user_id": user_id,
                "action": action,
                "resource": resource,
                "classification": classification,
                "status": status,
            }
            for ts, user_id, action, resource, classification, status in rows
        ]
        return build_success({"logs": logs, "total_count": len(logs)})
    except Exception as exc:
        return build_error("QUERY_ERROR", f"Failed to fetch audit log: {exc}")


@router.get("/violations-trend")
async def get_violations_trend(db: AsyncSession = Depends(get_db_session)):
    try:
        since = datetime.utcnow() - timedelta(days=7)
        rows = (
            await db.execute(
                select(
                    func.date(AuditLog.timestamp).label("day_bucket"),
                    func.sum(case((AuditLog.status == "DENY", 1), else_=0)).label("violations"),
                    func.sum(case((AuditLog.status == "ALLOW", 1), else_=0)).label("warnings"),
                )
                .where(AuditLog.timestamp >= since)
                .group_by(func.date(AuditLog.timestamp))
                .order_by(func.date(AuditLog.timestamp))
            )
        ).all()

        trend = [
            {
                "day": day_bucket.strftime("%a") if day_bucket else "",
                "violation_count": int(violations or 0),
                "warning_count": int(warnings or 0),
            }
            for day_bucket, violations, warnings in rows
        ]
        return build_success({"trend": trend})
    except Exception as exc:
        return build_error("QUERY_ERROR", f"Failed to fetch violations trend: {exc}")


@router.post("/access-check")
async def access_check(payload: AccessCheckRequest):
    clearance = payload.clearance_level.upper()
    required = payload.classification.upper()
    ordering = ["UNCLASS", "FOUO", "SECRET", "TS", "TS/SCI"]
    allowed = ordering.index(clearance) >= ordering.index(required) if clearance in ordering and required in ordering else False
    reason = "clearance_sufficient" if allowed else "clearance_insufficient"
    return build_success({"allowed": allowed, "reason": reason}, source="service")
