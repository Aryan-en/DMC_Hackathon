"""Audit logging utilities for ONTORA Intelligence Platform."""

from typing import Optional, Any, Dict
from datetime import datetime
from sqlalchemy.ext.asyncio import AsyncSession
from db.schemas import AuditLog

async def record_audit_log(
    db: AsyncSession,
    user_id: str,
    action: str,
    resource: str,
    status: str,
    classification: str = "UNCLASS",
    ip_address: Optional[str] = None,
    details: Optional[Dict[str, Any]] = None
) -> AuditLog:
    """
    Utility to record an audit log entry in PostgreSQL.
    
    Args:
        db: Async SQLAlchemy session
        user_id: ID or username of the actor
        action: Type of action (LOGIN, LOGOUT, READ, WRITE, EXPORT, DELETE, ACCESS_CHECK)
        resource: Resource identifier (e.g. 'auth/session', 'bill-analysis/history')
        status: 'ALLOW' or 'DENY'
        classification: Data classification level
        ip_address: Optional source IP
        details: Optional JSON-serializable details
    """
    log_entry = AuditLog(
        user_id=user_id,
        action=action,
        resource=resource,
        status=status,
        classification=classification,
        ip_address=ip_address,
        details=details,
        timestamp=datetime.utcnow()
    )
    db.add(log_entry)
    return log_entry
