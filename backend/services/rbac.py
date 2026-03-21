"""Role-Based Access Control (RBAC) System."""

from enum import Enum
from typing import Optional, Set
from dataclasses import dataclass


class UserRole(str, Enum):
    """System user roles."""
    ADMIN = "admin"
    ANALYST = "analyst"
    VIEWER = "viewer"
    AUDITOR = "auditor"
    OPERATOR = "operator"


class ClearanceLevel(str, Enum):
    """Security clearance levels."""
    UNCLASS = "UNCLASS"        # Unclassified
    FOUO = "FOUO"              # For Official Use Only
    SECRET = "SECRET"          # Secret
    TS = "TS"                  # Top Secret
    TS_SCI = "TS/SCI"          # Top Secret / Sensitive Compartmented Information


@dataclass
class Permission:
    """Permission definition."""
    resource: str             # e.g., "metrics", "knowledge_graph", "geospatial"
    action: str               # e.g., "read", "write", "delete"
    clearance_required: ClearanceLevel


class PermissionMatrix:
    """RBAC Permission Matrix - defines role-based access."""
    
    PERMISSIONS = {
        UserRole.ADMIN: {
            "metrics": ["read", "write", "delete", "export"],
            "intelligence": ["read", "write", "delete", "export"],
            "knowledge_graph": ["read", "write", "delete", "export"],
            "predictions": ["read", "write", "delete"],
            "geospatial": ["read", "write", "delete", "export"],
            "streams": ["read", "write", "manage"],
            "data_lake": ["read", "write", "manage", "export"],
            "security": ["read", "write", "manage", "audit"],
            "users": ["read", "write", "delete", "manage"],
            "audit": ["read"],
            "system": ["manage", "configure", "monitor"],
        },
        UserRole.ANALYST: {
            "metrics": ["read", "write"],
            "intelligence": ["read", "write"],
            "knowledge_graph": ["read", "write"],
            "predictions": ["read"],
            "geospatial": ["read", "write"],
            "streams": ["read"],
            "data_lake": ["read", "write"],
            "security": ["read"],
            "audit": ["read"],
        },
        UserRole.OPERATOR: {
            "metrics": ["read"],
            "streams": ["read", "write"],
            "data_lake": ["read"],
            "security": ["read"],
            "audit": ["read"],
        },
        UserRole.VIEWER: {
            "metrics": ["read"],
            "intelligence": ["read"],
            "knowledge_graph": ["read"],
            "predictions": ["read"],
            "geospatial": ["read"],
            "streams": ["read"],
            "data_lake": ["read"],
            "security": ["read"],
        },
        UserRole.AUDITOR: {
            "audit": ["read"],
            "security": ["read"],
            "users": ["read"],
            "metrics": ["read"],
        },
    }
    
    CLEARANCE_HIERARCHY = [
        ClearanceLevel.UNCLASS,
        ClearanceLevel.FOUO,
        ClearanceLevel.SECRET,
        ClearanceLevel.TS,
        ClearanceLevel.TS_SCI,
    ]
    
    RESOURCE_CLEARANCE = {
        "metrics": ClearanceLevel.UNCLASS,
        "intelligence": ClearanceLevel.FOUO,
        "knowledge_graph": ClearanceLevel.SECRET,
        "predictions": ClearanceLevel.FOUO,
        "geospatial": ClearanceLevel.SECRET,
        "streams": ClearanceLevel.FOUO,
        "data_lake": ClearanceLevel.SECRET,
        "security": ClearanceLevel.TS,
        "audit": ClearanceLevel.SECRET,
        "users": ClearanceLevel.TS,
        "system": ClearanceLevel.TS,
    }

    @classmethod
    def has_permission(
        cls,
        role: UserRole,
        resource: str,
        action: str,
        user_clearance: ClearanceLevel
    ) -> bool:
        """Check if user role has permission for resource/action."""
        # Check role has resource
        if role not in cls.PERMISSIONS:
            return False
        
        if resource not in cls.PERMISSIONS[role]:
            return False
        
        # Check action is granted
        if action not in cls.PERMISSIONS[role][resource]:
            return False
        
        # Check clearance level
        required_clearance = cls.RESOURCE_CLEARANCE.get(resource, ClearanceLevel.UNCLASS)
        if not cls.has_clearance(user_clearance, required_clearance):
            return False
        
        return True

    @classmethod
    def has_clearance(cls, user_clearance: ClearanceLevel, required_clearance: ClearanceLevel) -> bool:
        """Check if user has sufficient clearance."""
        user_level = cls.CLEARANCE_HIERARCHY.index(user_clearance)
        required_level = cls.CLEARANCE_HIERARCHY.index(required_clearance)
        return user_level >= required_level

    @classmethod
    def get_resource_permissions(cls, role: UserRole) -> dict:
        """Get all resources and actions accessible by role."""
        return cls.PERMISSIONS.get(role, {})

    @classmethod
    def get_accessible_resources(cls, role: UserRole, clearance: ClearanceLevel) -> Set[str]:
        """Get all resources accessible by role and clearance."""
        accessible = set()
        role_resources = cls.PERMISSIONS.get(role, {})
        
        for resource in role_resources:
            required = cls.RESOURCE_CLEARANCE.get(resource, ClearanceLevel.UNCLASS)
            if cls.has_clearance(clearance, required):
                accessible.add(resource)
        
        return accessible


class RBACContext:
    """Runtime RBAC context for a user session."""
    
    def __init__(
        self,
        user_id: str,
        username: str,
        roles: list[UserRole],
        clearance: ClearanceLevel
    ):
        self.user_id = user_id
        self.username = username
        self.roles = [UserRole(r) if isinstance(r, str) else r for r in roles]
        self.clearance = clearance if isinstance(clearance, ClearanceLevel) else ClearanceLevel(clearance)
    
    def has_permission(self, resource: str, action: str) -> bool:
        """Check if user has permission for resource/action."""
        # Admin always has all permissions
        if UserRole.ADMIN in self.roles:
            return True
        
        # Check if any role grants permission
        for role in self.roles:
            if PermissionMatrix.has_permission(role, resource, action, self.clearance):
                return True
        
        return False
    
    def can_access_resource(self, resource: str) -> bool:
        """Check if user can access a resource at all."""
        accessible = set()
        for role in self.roles:
            if resource in PermissionMatrix.get_resource_permissions(role):
                accessible.add(resource)
        
        if accessible:
            required = PermissionMatrix.RESOURCE_CLEARANCE.get(resource, ClearanceLevel.UNCLASS)
            return PermissionMatrix.has_clearance(self.clearance, required)
        
        return False
    
    def get_accessible_resources(self) -> Set[str]:
        """Get all accessible resources for this user."""
        accessible = set()
        for role in self.roles:
            resources = PermissionMatrix.get_accessible_resources(role, self.clearance)
            accessible.update(resources)
        return accessible
    
    def to_dict(self) -> dict:
        """Convert context to dictionary."""
        return {
            "user_id": self.user_id,
            "username": self.username,
            "roles": [r.value for r in self.roles],
            "clearance": self.clearance.value,
            "accessible_resources": list(self.get_accessible_resources()),
        }
