"""Security & Governance API Endpoints."""

from datetime import datetime, timedelta

from fastapi import APIRouter, Depends, Query, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy import case, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from db.postgres import get_db_session
from db.schemas import AuditLog
from utils.response import build_error
from utils.response import build_success
from services.security_monitor import security_monitor
from services.data_classification import classifier
from services.export_approval import export_approval

router = APIRouter()


class AccessCheckRequest(BaseModel):
    clearance_level: str = Field(default="FOUO", min_length=2, max_length=16)
    classification: str = Field(default="FOUO", min_length=2, max_length=16)


class ExportRequestModel(BaseModel):
    resource_ids: list[str] = Field(..., description="IDs of resources to export")
    format: str = Field(default="csv", description="Export format (csv, json, parquet)")
    purpose: str = Field(default="analysis", description="Purpose of export")
    classification: str = Field(default="internal", description="Data classification level")


class ExportApprovalModel(BaseModel):
    request_id: str = Field(..., description="Export request ID")
    approved: bool = Field(..., description="Approval decision")
    reason: str = Field(default="", description="Approval/denial reason")





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


@router.get("/monitoring-dashboard")
async def get_security_monitoring():
    """GET /api/security/monitoring-dashboard - Security monitoring dashboard data."""
    try:
        threat_summary = security_monitor.get_threat_summary()
        critical_events = security_monitor.get_critical_events()
        recent_events = security_monitor.get_recent_events(minutes=60)
        
        payload = {
            "summary": threat_summary,
            "critical_events": [
                {
                    "id": e.id,
                    "event_type": e.event_type,
                    "severity": e.severity.value,
                    "user_id": e.user_id,
                    "resource": e.resource,
                    "description": e.description,
                    "timestamp": e.timestamp.isoformat(),
                }
                for e in critical_events[:10]
            ],
            "recent_events_count": len(recent_events),
            "current_status": "healthy" if len(critical_events) == 0 else "degraded" if len(critical_events) < 5 else "critical",
            "last_updated": datetime.utcnow().isoformat(),
        }
        return build_success(payload, meta={"update_frequency": "realtime"})
    except Exception as exc:
        return build_error("QUERY_ERROR", f"Failed to fetch security monitoring dashboard: {exc}")


@router.post("/export-request")
async def create_export_request(payload: ExportRequestModel, user_id: str = Query(..., description="Current user ID")):
    """POST /api/security/export-request - Create a data export request."""
    try:
        request = export_approval.create_export_request(
            user_id=user_id,
            resource_ids=payload.resource_ids,
            format=payload.format,
            purpose=payload.purpose,
            clearance_level="SECRET",  # Would come from authenticated user in production
            classification=payload.classification
        )
        
        return build_success({
            "request": request.to_dict(),
            "message": "Export request created successfully"
        }, source="service")
    except Exception as exc:
        return build_error("REQUEST_ERROR", f"Failed to create export request: {exc}")


@router.get("/export-requests/{request_id}")
async def get_export_request(request_id: str):
    """GET /api/security/export-requests/{request_id} - Retrieve export request status."""
    try:
        request = export_approval.get_request(request_id)
        if not request:
            return build_error("NOT_FOUND", f"Export request not found: {request_id}")
        
        return build_success({"request": request.to_dict()})
    except Exception as exc:
        return build_error("QUERY_ERROR", f"Failed to fetch export request: {exc}")


@router.get("/export-requests")
async def list_export_requests(user_id: str = Query(None), limit: int = Query(default=20, ge=1, le=100)):
    """GET /api/security/export-requests - List export requests."""
    try:
        if user_id:
            requests = export_approval.get_user_requests(user_id)
        else:
            requests = list(export_approval.requests.values())
        
        summary = export_approval.get_approval_summary()
        
        return build_success({
            "requests": [r.to_dict() for r in requests[:limit]],
            "summary": summary,
            "count": len(requests)
        })
    except Exception as exc:
        return build_error("QUERY_ERROR", f"Failed to list export requests: {exc}")


@router.post("/export-approve")
async def approve_export_request(payload: ExportApprovalModel, approver_id: str = Query(..., description="Approver ID")):
    """POST /api/security/export-approve - Approve or deny an export request."""
    try:
        if payload.approved:
            success = export_approval.approve_export(payload.request_id, approver_id, payload.reason)
            if not success:
                return build_error("UPDATE_ERROR", "Failed to approve export request")
            return build_success({
                "message": "Export request approved",
                "request_id": payload.request_id
            })
        else:
            success = export_approval.deny_export(payload.request_id, approver_id, payload.reason)
            if not success:
                return build_error("UPDATE_ERROR", "Failed to deny export request")
            return build_success({
                "message": "Export request denied",
                "request_id": payload.request_id
            })
    except Exception as exc:
        return build_error("UPDATE_ERROR", f"Failed to update export request: {exc}")


@router.get("/data-classification/{resource_type}")
async def get_resource_classification(resource_type: str):
    """GET /api/security/data-classification/{resource_type} - Get data classification for a resource type."""
    try:
        classification = classifier.classify_resource(resource_type)
        access_summary = {
            "resource_type": resource_type,
            "classification": classification.value,
            "role_requirements": {
                "public": "Any user",
                "internal": "Registered user",
                "confidential": "SECRET clearance",
                "secret": "TOP SECRET clearance",
                "top_secret": "TS/SCI clearance"
            }.get(classification.value, "Unknown")
        }
        
        return build_success(access_summary)
    except Exception as exc:
        return build_error("QUERY_ERROR", f"Failed to classify resource: {exc}")


@router.get("/pending-approvals")
async def get_pending_export_approvals(limit: int = Query(default=50, ge=1, le=200)):
    """GET /api/security/pending-approvals - Get pending export approvals for administrators."""
    try:
        pending = export_approval.get_pending_approvals()
        
        return build_success({
            "pending_count": len(pending),
            "requests": [r.to_dict() for r in pending[:limit]]
        }, meta={"update_frequency": "5 minutes"})
    except Exception as exc:
        return build_error("QUERY_ERROR", f"Failed to fetch pending approvals: {exc}")
