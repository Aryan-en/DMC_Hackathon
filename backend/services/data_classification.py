"""Data Classification & Sensitivity Management System."""

from enum import Enum
from typing import Dict, List, Set


class DataClassification(str, Enum):
    """Data sensitivity classifications."""
    PUBLIC = "public"
    INTERNAL = "internal"
    CONFIDENTIAL = "confidential"
    SECRET = "secret"
    TOP_SECRET = "top_secret"


class DataClassifier:
    """Classify data resources by sensitivity."""
    
    # Resource classifications
    RESOURCE_CLASSIFICATIONS: Dict[str, DataClassification] = {
        # Public accessible resources
        "metrics": DataClassification.INTERNAL,
        "intelligence": DataClassification.CONFIDENTIAL,
        
        # Sensitive resources - require clearance
        "knowledge_graph": DataClassification.SECRET,
        "geospatial": DataClassification.SECRET,
        "predictions": DataClassification.CONFIDENTIAL,
        
        # Streaming - moderate sensitivity
        "streams": DataClassification.CONFIDENTIAL,
        "data_lake": DataClassification.SECRET,
        
        # Very sensitive - restricted access
        "security": DataClassification.TOP_SECRET,
        "audit": DataClassification.SECRET,
        "users": DataClassification.TOP_SECRET,
        "system": DataClassification.TOP_SECRET,
    }
    
    # Action-based classification
    ACTION_MULTIPLIER = {
        "read": 1.0,
        "write": 1.5,
        "delete": 2.0,
        "export": 2.5,
    }
    
    @classmethod
    def classify_resource(cls, resource: str) -> DataClassification:
        """Get classification for a resource."""
        return cls.RESOURCE_CLASSIFICATIONS.get(
            resource,
            DataClassification.INTERNAL
        )
    
    @classmethod
    def classify_action(
        cls,
        resource: str,
        action: str,
        record_count: int = 0
    ) -> DataClassification:
        """Classify an action based on resource and action type."""
        base_classification = cls.classify_resource(resource)
        action_multiplier = cls.ACTION_MULTIPLIER.get(action, 1.0)
        
        # Escalate classification for bulk operations
        if action == "export" and record_count > 10000:
            if base_classification == DataClassification.SECRET:
                return DataClassification.TOP_SECRET
            elif base_classification == DataClassification.CONFIDENTIAL:
                return DataClassification.SECRET
        
        return base_classification
    
    @classmethod
    def requires_approval(cls, resource: str, action: str) -> bool:
        """Check if action requires approval."""
        classification = cls.classify_resource(resource)
        approval_actions = ["delete", "export"]
        
        return (
            action in approval_actions or
            classification in [DataClassification.SECRET, DataClassification.TOP_SECRET]
        )
    
    @classmethod
    def get_access_controls(cls, classification: DataClassification) -> Dict:
        """Get access controls for a classification level."""
        controls = {
            DataClassification.PUBLIC: {
                "allowed_roles": ["viewer", "analyst", "operator", "admin"],
                "requires_login": False,
                "requires_approval": False,
                "log_access": False,
            },
            DataClassification.INTERNAL: {
                "allowed_roles": ["viewer", "analyst", "operator", "admin"],
                "requires_login": True,
                "requires_approval": False,
                "log_access": False,
            },
            DataClassification.CONFIDENTIAL: {
                "allowed_roles": ["analyst", "operator", "admin"],
                "requires_login": True,
                "requires_approval": False,
                "log_access": True,
            },
            DataClassification.SECRET: {
                "allowed_roles": ["analyst", "admin"],
                "requires_login": True,
                "requires_approval": True,
                "log_access": True,
            },
            DataClassification.TOP_SECRET: {
                "allowed_roles": ["admin"],
                "requires_login": True,
                "requires_approval": True,
                "log_access": True,
            },
        }
        
        return controls.get(classification, controls[DataClassification.INTERNAL])
    
    @classmethod
    def get_clearance_required(cls, classification: DataClassification) -> str:
        """Get minimum clearance required for classification."""
        mapping = {
            DataClassification.PUBLIC: "UNCLASS",
            DataClassification.INTERNAL: "FOUO",
            DataClassification.CONFIDENTIAL: "FOUO",
            DataClassification.SECRET: "SECRET",
            DataClassification.TOP_SECRET: "TS",
        }
        return mapping.get(classification, "UNCLASS")


class ExportApprovalWorkflow:
    """Manage data export approvals."""
    
    def __init__(self):
        self.pending_approvals = {}
        self.approval_history = []
    
    def request_export(
        self,
        export_id: str,
        user_id: str,
        resource: str,
        record_count: int,
        classification: DataClassification,
        description: str = ""
    ) -> Dict:
        """Create a new export approval request."""
        request = {
            "id": export_id,
            "user_id": user_id,
            "resource": resource,
            "record_count": record_count,
            "classification": classification.value,
            "description": description,
            "status": "pending",
            "requested_at": str(__import__('datetime').datetime.utcnow()),
            "approvers_required": 2 if classification == DataClassification.TOP_SECRET else 1,
            "approvals": [],
            "denial_reason": None,
        }
        
        self.pending_approvals[export_id] = request
        return request
    
    def approve_export(
        self,
        export_id: str,
        approver_id: str,
        comments: str = ""
    ) -> bool:
        """Approve an export request."""
        if export_id not in self.pending_approvals:
            return False
        
        request = self.pending_approvals[export_id]
        
        # Prevent self-approval
        if approver_id == request["user_id"]:
            return False
        
        # Prevent duplicate approvals
        if approver_id in [a["id"] for a in request["approvals"]]:
            return False
        
        approval = {
            "id": approver_id,
            "comments": comments,
            "approved_at": str(__import__('datetime').datetime.utcnow())
        }
        
        request["approvals"].append(approval)
        
        # Check if approved
        if len(request["approvals"]) >= request["approvers_required"]:
            request["status"] = "approved"
        
        return True
    
    def deny_export(
        self,
        export_id: str,
        denier_id: str,
        reason: str
    ) -> bool:
        """Deny an export request."""
        if export_id not in self.pending_approvals:
            return False
        
        request = self.pending_approvals[export_id]
        request["status"] = "denied"
        request["denial_reason"] = reason
        
        self.approval_history.append({
            "request": request,
            "action": "denied_by",
            "user": denier_id,
            "timestamp": str(__import__('datetime').datetime.utcnow())
        })
        
        return True
    
    def get_pending_approvals(self, approver_id: str) -> List[Dict]:
        """Get export requests pending this approver's decision."""
        pending = []
        for export_id, request in self.pending_approvals.items():
            if request["status"] == "pending":
                # Check if approver hasn't already approved
                approver_ids = [a["id"] for a in request["approvals"]]
                if approver_id not in approver_ids:
                    pending.append(request)
        return pending
    
    def get_user_export_history(self, user_id: str) -> List[Dict]:
        """Get export history for a user."""
        history = []
        for request in self.approval_history:
            if request["request"]["user_id"] == user_id:
                history.append(request)
        return history


# Global instances
classifier = DataClassifier()
approval_workflow = ExportApprovalWorkflow()
