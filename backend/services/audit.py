"""Audit Logging Service for compliance and security monitoring."""

from datetime import datetime
from typing import Optional
from sqlalchemy.ext.asyncio import AsyncSession
from db.schemas import AuditLog
from services.rbac import ClearanceLevel


class AuditLogger:
    """Service for logging audit events."""
    
    # Event categories
    CATEGORY_AUTH = "AUTHENTICATION"
    CATEGORY_AUTHZ = "AUTHORIZATION"
    CATEGORY_DATA = "DATA_ACCESS"
    CATEGORY_ADMIN = "ADMINISTRATIVE"
    CATEGORY_EXPORT = "DATA_EXPORT"
    CATEGORY_CONFIG = "CONFIGURATION"
    
    # Actions
    ACTION_LOGIN = "LOGIN"
    ACTION_LOGOUT = "LOGOUT"
    ACTION_REGISTER = "REGISTER"
    ACTION_TOKEN_REFRESH = "TOKEN_REFRESH"
    ACTION_PERMISSION_DENIED = "PERMISSION_DENIED"
    ACTION_ACCESS_GRANTED = "ACCESS_GRANTED"
    ACTION_READ = "READ"
    ACTION_WRITE = "WRITE"
    ACTION_DELETE = "DELETE"
    ACTION_EXPORT = "EXPORT"
    ACTION_APPROVE = "APPROVE"
    ACTION_DENY = "DENY"
    ACTION_CONFIG_CHANGE = "CONFIG_CHANGE"
    ACTION_USER_CREATE = "USER_CREATE"
    ACTION_USER_DELETE = "USER_DELETE"
    ACTION_USER_ROLE_CHANGE = "USER_ROLE_CHANGE"
    
    # Status values
    STATUS_SUCCESS = "SUCCESS"
    STATUS_FAILURE = "FAILURE"
    STATUS_DENIED = "DENIED"
    
    @staticmethod
    async def log(
        db: AsyncSession,
        user_id: str,
        category: str,
        action: str,
        resource: str,
        status: str,
        resource_type: str = "API",
        description: Optional[str] = None,
        classification: str = "FOUO",
        details: Optional[dict] = None
    ):
        """Log an audit event."""
        try:
            audit_log = AuditLog(
                user_id=user_id,
                category=category,
                action=action,
                resource=resource,
                resource_type=resource_type,
                status=status,
                description=description or f"{action} on {resource}",
                classification=classification,
                details=details or {},
                timestamp=datetime.utcnow()
            )
            
            db.add(audit_log)
            await db.flush()  # Flush without commit to maintain transaction semantics
            
        except Exception as e:
            print(f"Audit logging error: {e}")
            # Don't raise - audit failures shouldn't break main operations
    
    @staticmethod
    async def log_authentication(
        db: AsyncSession,
        user_id: str,
        username: str,
        action: str,
        status: str,
        ip_address: Optional[str] = None,
        user_agent: Optional[str] = None
    ):
        """Log authentication events."""
        await AuditLogger.log(
            db=db,
            user_id=user_id,
            category=AuditLogger.CATEGORY_AUTH,
            action=action,
            resource=username,
            status=status,
            resource_type="AUTHENTICATION",
            description=f"{action} for user {username}",
            classification="UNCLASS",
            details={
                "ip_address": ip_address,
                "user_agent": user_agent
            }
        )
    
    @staticmethod
    async def log_data_access(
        db: AsyncSession,
        user_id: str,
        action: str,
        resource: str,
        status: str,
        classification: str = "FOUO",
        record_count: Optional[int] = None
    ):
        """Log data access events."""
        await AuditLogger.log(
            db=db,
            user_id=user_id,
            category=AuditLogger.CATEGORY_DATA,
            action=action,
            resource=resource,
            status=status,
            classification=classification,
            details={"record_count": record_count}
        )
    
    @staticmethod
    async def log_authorization_decision(
        db: AsyncSession,
        user_id: str,
        action: str,
        resource: str,
        status: str,
        reason: Optional[str] = None
    ):
        """Log authorization decisions."""
        await AuditLogger.log(
            db=db,
            user_id=user_id,
            category=AuditLogger.CATEGORY_AUTHZ,
            action=action,
            resource=resource,
            status=status,
            description=reason or f"{action} on {resource}: {status}",
            classification="SECRET"
        )
    
    @staticmethod
    async def log_export(
        db: AsyncSession,
        user_id: str,
        resource: str,
        export_format: str,
        record_count: int,
        classification: str = "SECRET",
        approved: bool = False
    ):
        """Log data export events."""
        await AuditLogger.log(
            db=db,
            user_id=user_id,
            category=AuditLogger.CATEGORY_EXPORT,
            action=AuditLogger.ACTION_EXPORT if approved else AuditLogger.ACTION_DENY,
            resource=resource,
            status=AuditLogger.STATUS_SUCCESS if approved else AuditLogger.STATUS_DENIED,
            classification=classification,
            details={
                "format": export_format,
                "record_count": record_count,
                "timestamp": datetime.utcnow().isoformat()
            }
        )
    
    @staticmethod
    async def log_admin_action(
        db: AsyncSession,
        user_id: str,
        action: str,
        resource: str,
        status: str,
        details: Optional[dict] = None
    ):
        """Log administrative actions."""
        await AuditLogger.log(
            db=db,
            user_id=user_id,
            category=AuditLogger.CATEGORY_ADMIN,
            action=action,
            resource=resource,
            status=status,
            classification="TS",
            details=details
        )
