"""Security Monitoring & Data Export API Endpoints - Week 14."""

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from uuid import uuid4

from db.postgres import get_db_session
from api.auth import get_current_user, require_role
from services.rbac import UserRole, RBACContext
from services.security_monitor import security_monitor, ThreatLevel
from services.data_classification import classifier, approval_workflow, DataClassification
from services.audit import AuditLogger
from utils.response import build_success, build_error

router = APIRouter(prefix="/security", tags=["security-monitoring"])


# Models
class SecurityEventResponse(BaseModel):
    """Security event response."""
    id: str
    event_type: str
    severity: str
    user_id: str
    resource: str
    description: str
    timestamp: str


class ThreatSummaryResponse(BaseModel):
    """Security threat summary."""
    total_events: int
    critical_events: int
    by_severity: dict
    timestamp: str


class ExportRequest(BaseModel):
    """Data export approval request."""
    resource: str
    record_count: int
    format: str = "csv"
    description: str = ""


class ExportApprovalRequest(BaseModel):
    """Approve/deny export request."""
    action: str  # "approve" or "deny"
    comments: str = ""


class ResourceClassificationResponse(BaseModel):
    """Resource classification info."""
    resource: str
    classification: str
    requires_approval: bool
    clearance_required: str
    access_controls: dict


# Endpoints - Security Monitoring
@router.get("/threats/summary")
async def get_threat_summary(
    current_user: RBACContext = Depends(get_current_user),
    db: AsyncSession = Depends(get_db_session)
):
    """Get current security threat summary."""
    try:
        summary = security_monitor.get_threat_summary()
        
        await AuditLogger.log(
            db=db,
            user_id=current_user.user_id,
            category=AuditLogger.CATEGORY_AUTHZ,
            action="SECURITY_REPORT",
            resource="security",
            status=AuditLogger.STATUS_SUCCESS,
            classification="SECRET"
        )
        
        return build_success({
            "total_events": summary["total_events"],
            "critical_events": summary["critical_unresolved"],
            "by_severity": summary["by_severity"],
            "timestamp": summary["timestamp"]
        })
    
    except Exception as e:
        return build_error("QUERY_ERROR", str(e))


@router.get("/threats/critical")
async def get_critical_threats(
    current_user: RBACContext = Depends(require_role(UserRole.ADMIN)),
    db: AsyncSession = Depends(get_db_session)
):
    """Get critical unresolved security threats (admin only)."""
    try:
        threats = security_monitor.get_critical_events()
        
        threat_list = [
            {
                "id": t.id,
                "event_type": t.event_type,
                "severity": t.severity.value,
                "user_id": t.user_id,
                "resource": t.resource,
                "description": t.description,
                "timestamp": t.timestamp.isoformat(),
            }
            for t in threats
        ]
        
        return build_success({"threats": threat_list, "total": len(threat_list)})
    
    except Exception as e:
        return build_error("QUERY_ERROR", str(e))


@router.get("/events/recent")
async def get_recent_security_events(
    current_user: RBACContext = Depends(get_current_user),
    db: AsyncSession = Depends(get_db_session),
    minutes: int = 60
):
    """Get recent security events."""
    try:
        events = security_monitor.get_recent_events(minutes=minutes)
        
        event_list = [
            {
                "id": e.id,
                "event_type": e.event_type,
                "severity": e.severity.value,
                "user_id": e.user_id,
                "resource": e.resource,
                "description": e.description,
                "timestamp": e.timestamp.isoformat(),
            }
            for e in events
        ]
        
        return build_success({"events": event_list, "total": len(event_list)})
    
    except Exception as e:
        return build_error("QUERY_ERROR", str(e))


# Endpoints - Data Classification
@router.get("/classification/{resource}")
async def get_resource_classification(
    resource: str,
    current_user: RBACContext = Depends(get_current_user),
    db: AsyncSession = Depends(get_db_session)
):
    """Get classification and access controls for a resource."""
    try:
        classification = classifier.classify_resource(resource)
        controls = classifier.get_access_controls(classification)
        clearance = classifier.get_clearance_required(classification)
        
        return build_success({
            "resource": resource,
            "classification": classification.value,
            "requires_approval": classifier.requires_approval(resource, "export"),
            "clearance_required": clearance,
            "access_controls": controls
        })
    
    except Exception as e:
        return build_error("CLASSIFICATION_ERROR", str(e))


@router.get("/classifications")
async def list_resource_classifications(
    current_user: RBACContext = Depends(get_current_user),
    db: AsyncSession = Depends(get_db_session)
):
    """List classifications for all resources."""
    try:
        classifications = {}
        for resource in classifier.RESOURCE_CLASSIFICATIONS:
            classif = classifier.classify_resource(resource)
            classifications[resource] = {
                "classification": classif.value,
                "clearance_required": classifier.get_clearance_required(classif)
            }
        
        return build_success({"classifications": classifications})
    
    except Exception as e:
        return build_error("QUERY_ERROR", str(e))


# Endpoints - Data Export Approval
@router.post("/export/request")
async def request_data_export(
    payload: ExportRequest,
    current_user: RBACContext = Depends(get_current_user),
    db: AsyncSession = Depends(get_db_session)
):
    """Request data export approval."""
    try:
        classification = classifier.classify_action(
            payload.resource,
            "export",
            payload.record_count
        )
        
        export_id = f"export_{uuid4().hex[:12]}"
        
        request = approval_workflow.request_export(
            export_id=export_id,
            user_id=current_user.user_id,
            resource=payload.resource,
            record_count=payload.record_count,
            classification=classification,
            description=payload.description
        )
        
        # Audit log
        await AuditLogger.log_export(
            db=db,
            user_id=current_user.user_id,
            resource=payload.resource,
            export_format=payload.format,
            record_count=payload.record_count,
            classification=classification.value,
            approved=False
        )
        
        return build_success({
            "export_id": export_id,
            "status": request["status"],
            "approvers_required": request["approvers_required"],
            "classification": request["classification"]
        })
    
    except Exception as e:
        return build_error("EXPORT_ERROR", str(e))


@router.get("/export/pending")
async def get_pending_exports(
    current_user: RBACContext = Depends(require_role(UserRole.ADMIN)),
    db: AsyncSession = Depends(get_db_session)
):
    """Get export requests pending approval (admin only)."""
    try:
        pending = approval_workflow.get_pending_approvals(current_user.user_id)
        
        return build_success({
            "pending": pending,
            "total": len(pending)
        })
    
    except Exception as e:
        return build_error("QUERY_ERROR", str(e))


@router.post("/export/{export_id}/approve")
async def approve_export(
    export_id: str,
    payload: ExportApprovalRequest,
    current_user: RBACContext = Depends(require_role(UserRole.ADMIN)),
    db: AsyncSession = Depends(get_db_session)
):
    """Approve a data export request (admin only)."""
    try:
        if payload.action == "approve":
            success = approval_workflow.approve_export(
                export_id,
                current_user.user_id,
                payload.comments
            )
            
            if not success:
                return build_error("APPROVAL_FAILED", "Could not process approval")
            
            status_msg = "approved"
        elif payload.action == "deny":
            success = approval_workflow.deny_export(
                export_id,
                current_user.user_id,
                payload.comments
            )
            
            if not success:
                return build_error("DENIAL_FAILED", "Could not process denial")
            
            status_msg = "denied"
        else:
            return build_error("INVALID_ACTION", f"Unknown action: {payload.action}")
        
        # Log approval action
        await AuditLogger.log_admin_action(
            db=db,
            user_id=current_user.user_id,
            action=f"EXPORT_{payload.action.upper()}",
            resource=export_id,
            status=AuditLogger.STATUS_SUCCESS,
            details={"comments": payload.comments}
        )
        
        return build_success({
            "export_id": export_id,
            "action": payload.action,
            "status": status_msg
        })
    
    except Exception as e:
        return build_error("APPROVAL_ERROR", str(e))


@router.get("/export/history")
async def get_export_history(
    current_user: RBACContext = Depends(get_current_user),
    db: AsyncSession = Depends(get_db_session)
):
    """Get user's export request history."""
    try:
        history = approval_workflow.get_user_export_history(current_user.user_id)
        
        return build_success({
            "history": history,
            "total": len(history)
        })
    
    except Exception as e:
        return build_error("QUERY_ERROR", str(e))
