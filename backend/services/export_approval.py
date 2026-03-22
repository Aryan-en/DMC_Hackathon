"""Export approval workflow for data exports."""

from enum import Enum
from typing import Optional, Dict, List
from datetime import datetime
from uuid import uuid4


class ExportStatus(str, Enum):
    """Export request status."""
    PENDING = "pending"
    APPROVED = "approved"
    DENIED = "denied"
    COMPLETED = "completed"
    EXPIRED = "expired"


class ExportRequest:
    """Represents a data export request."""
    
    def __init__(self, user_id: str, resource_ids: List[str], format: str,
                 purpose: str, clearance_level: str):
        self.request_id = f"export-{uuid4().hex[:12]}"
        self.user_id = user_id
        self.resource_ids = resource_ids
        self.format = format  # csv, json, parquet, etc.
        self.purpose = purpose
        self.clearance_level = clearance_level
        self.status = ExportStatus.PENDING
        self.created_at = datetime.utcnow()
        self.approved_at = None
        self.approved_by = None
        self.denial_reason = None
        self.completed_at = None
        self.file_uri = None
    
    def to_dict(self) -> Dict:
        """Convert to dictionary."""
        return {
            "request_id": self.request_id,
            "user_id": self.user_id,
            "resource_count": len(self.resource_ids),
            "format": self.format,
            "purpose": self.purpose,
            "status": self.status.value,
            "created_at": self.created_at.isoformat(),
            "approved_at": self.approved_at.isoformat() if self.approved_at else None,
            "approved_by": self.approved_by,
            "denial_reason": self.denial_reason,
            "completed_at": self.completed_at.isoformat() if self.completed_at else None,
        }


class ExportApprovalWorkflow:
    """Manages data export approval workflow."""
    
    def __init__(self):
        self.requests: Dict[str, ExportRequest] = {}
        self.approval_rules = {
            "public": {"approver_required": False, "min_clearance": "FOUO"},
            "internal": {"approver_required": True, "min_clearance": "FOUO"},
            "confidential": {"approver_required": True, "min_clearance": "SECRET"},
            "secret": {"approver_required": True, "min_clearance": "TS"},
            "top_secret": {"approver_required": True, "min_clearance": "TS/SCI"}
        }
    
    def create_export_request(self, user_id: str, resource_ids: List[str],
                            format: str, purpose: str, clearance_level: str,
                            classification: str) -> ExportRequest:
        """Create a new export request."""
        request = ExportRequest(user_id, resource_ids, format, purpose, clearance_level)
        self.requests[request.request_id] = request
        
        # Auto-approve if public and no approver required
        rules = self.approval_rules.get(classification.lower(), {})
        if not rules.get("approver_required", True):
            self.approve_export(request.request_id, "system", "Auto-approved: public data")
        
        return request
    
    def approve_export(self, request_id: str, approver_id: str, notes: str) -> bool:
        """Approve an export request."""
        request = self.requests.get(request_id)
        if not request:
            return False
        
        if request.status != ExportStatus.PENDING:
            return False
        
        request.status = ExportStatus.APPROVED
        request.approved_at = datetime.utcnow()
        request.approved_by = approver_id
        
        # Generate export file URI
        request.file_uri = f"s3://ontora-exports/{request_id}/data.{request.format}"
        request.status = ExportStatus.COMPLETED
        request.completed_at = datetime.utcnow()
        
        return True
    
    def deny_export(self, request_id: str, denier_id: str, reason: str) -> bool:
        """Deny an export request."""
        request = self.requests.get(request_id)
        if not request:
            return False
        
        if request.status != ExportStatus.PENDING:
            return False
        
        request.status = ExportStatus.DENIED
        request.approved_by = denier_id
        request.denial_reason = reason
        
        return True
    
    def get_request(self, request_id: str) -> Optional[ExportRequest]:
        """Retrieve an export request."""
        return self.requests.get(request_id)
    
    def get_user_requests(self, user_id: str) -> List[ExportRequest]:
        """Get all export requests from a user."""
        return [r for r in self.requests.values() if r.user_id == user_id]
    
    def get_pending_approvals(self) -> List[ExportRequest]:
        """Get all pending export approvals."""
        return [
            r for r in self.requests.values()
            if r.status == ExportStatus.PENDING
        ]
    
    def get_approval_summary(self) -> Dict:
        """Get export approval workflow summary."""
        all_requests = list(self.requests.values())
        
        return {
            "total_requests": len(all_requests),
            "pending": sum(1 for r in all_requests if r.status == ExportStatus.PENDING),
            "approved": sum(1 for r in all_requests if r.status == ExportStatus.APPROVED),
            "denied": sum(1 for r in all_requests if r.status == ExportStatus.DENIED),
            "completed": sum(1 for r in all_requests if r.status == ExportStatus.COMPLETED),
            "expired": sum(1 for r in all_requests if r.status == ExportStatus.EXPIRED),
        }
    
    def validate_clearance(self, user_clearance: str, required_clearance: str) -> bool:
        """Validate if user has sufficient clearance."""
        clearance_levels = ["FOUO", "SECRET", "TS", "TS/SCI"]
        try:
            user_level_idx = clearance_levels.index(user_clearance)
            required_level_idx = clearance_levels.index(required_clearance)
            return user_level_idx >= required_level_idx
        except (ValueError, IndexError):
            return False


# Global export approval workflow instance
export_approval = ExportApprovalWorkflow()
