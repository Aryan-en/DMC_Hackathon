"""Security Monitoring & Threat Detection Service."""

from datetime import datetime, timedelta
from typing import Optional, Dict, List
from enum import Enum
import asyncio


class ThreatLevel(str, Enum):
    """Threat severity levels."""
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"


class SecurityEvent:
    """Security event record."""
    
    def __init__(
        self,
        event_type: str,
        severity: ThreatLevel,
        user_id: str,
        resource: str,
        description: str,
        details: Optional[Dict] = None
    ):
        self.id = f"sec_{datetime.utcnow().timestamp()}"
        self.event_type = event_type
        self.severity = severity
        self.user_id = user_id
        self.resource = resource
        self.description = description
        self.details = details or {}
        self.timestamp = datetime.utcnow()
        self.resolved = False


class SecurityMonitor:
    """Real-time security monitoring."""
    
    # Threat patterns
    FAILED_LOGIN_THRESHOLD = 5
    REQUEST_RATE_THRESHOLD = 100  # per minute
    PRIVILEGE_ESCALATION_PATTERN = "user_role_change"
    DATA_EXPORT_THRESHOLD = 10000  # records
    
    def __init__(self):
        self.events: List[SecurityEvent] = []
        self.user_login_attempts: Dict[str, List[datetime]] = {}
        self.user_request_counts: Dict[str, int] = {}
        self.detected_threats: List[SecurityEvent] = []
    
    def log_security_event(self, event: SecurityEvent) -> None:
        """Log a security event."""
        self.events.append(event)
        if event.severity in [ThreatLevel.CRITICAL, ThreatLevel.HIGH]:
            self.detected_threats.append(event)
    
    def detect_brute_force(self, user_id: str, success: bool) -> Optional[SecurityEvent]:
        """Detect brute force login attempts."""
        if success:
            # Clear attempts on successful login
            self.user_login_attempts.pop(user_id, None)
            return None
        
        # Track failed attempts
        if user_id not in self.user_login_attempts:
            self.user_login_attempts[user_id] = []
        
        self.user_login_attempts[user_id].append(datetime.utcnow())
        
        # Keep only attempts from last hour
        cutoff = datetime.utcnow() - timedelta(hours=1)
        self.user_login_attempts[user_id] = [
            t for t in self.user_login_attempts[user_id] if t > cutoff
        ]
        
        # Check threshold
        if len(self.user_login_attempts[user_id]) >= self.FAILED_LOGIN_THRESHOLD:
            event = SecurityEvent(
                event_type="brute_force_detected",
                severity=ThreatLevel.CRITICAL,
                user_id=user_id,
                resource="authentication",
                description=f"Brute force attack detected: {len(self.user_login_attempts[user_id])} failed attempts",
                details={"attempt_count": len(self.user_login_attempts[user_id])}
            )
            self.log_security_event(event)
            return event
        
        return None
    
    def detect_privilege_escalation(self, user_id: str, old_roles: List[str], new_roles: List[str]) -> Optional[SecurityEvent]:
        """Detect unauthorized privilege escalation."""
        if "admin" in new_roles and "admin" not in old_roles:
            event = SecurityEvent(
                event_type="privilege_escalation",
                severity=ThreatLevel.CRITICAL,
                user_id=user_id,
                resource="users",
                description="Privilege escalation: user promoted to admin without authorization",
                details={"old_roles": old_roles, "new_roles": new_roles}
            )
            self.log_security_event(event)
            return event
        
        return None
    
    def detect_data_exfiltration(self, user_id: str, resource: str, record_count: int) -> Optional[SecurityEvent]:
        """Detect suspicious data exports."""
        if record_count > self.DATA_EXPORT_THRESHOLD:
            event = SecurityEvent(
                event_type="large_data_export",
                severity=ThreatLevel.HIGH,
                user_id=user_id,
                resource=resource,
                description=f"Large data export: {record_count} records",
                details={"record_count": record_count}
            )
            self.log_security_event(event)
            return event
        
        return None
    
    def detect_anomalous_access(self, user_id: str, resource: str, action: str) -> Optional[SecurityEvent]:
        """Detect anomalous access patterns."""
        # Example: Access to sensitive resource at unusual time
        hour = datetime.utcnow().hour
        if resource in ["security", "users"] and (hour < 6 or hour > 22):
            event = SecurityEvent(
                event_type="anomalous_access",
                severity=ThreatLevel.MEDIUM,
                user_id=user_id,
                resource=resource,
                description=f"Anomalous access: {resource} accessed at {hour}:00 hours",
                details={"action": action, "hour": hour}
            )
            self.log_security_event(event)
            return event
        
        return None
    
    def get_recent_events(self, minutes: int = 60) -> List[SecurityEvent]:
        """Get security events from last N minutes."""
        cutoff = datetime.utcnow() - timedelta(minutes=minutes)
        return [e for e in self.events if e.timestamp > cutoff]
    
    def get_critical_events(self) -> List[SecurityEvent]:
        """Get all unresolved critical events."""
        return [
            e for e in self.detected_threats
            if not e.resolved and e.severity == ThreatLevel.CRITICAL
        ]
    
    def get_threat_summary(self) -> Dict:
        """Get security threat summary."""
        recent = self.get_recent_events(minutes=1440)  # 24 hours
        
        severity_counts = {level.value: 0 for level in ThreatLevel}
        for event in recent:
            severity_counts[event.severity.value] += 1
        
        return {
            "total_events": len(recent),
            "by_severity": severity_counts,
            "critical_unresolved": len(self.get_critical_events()),
            "timestamp": datetime.utcnow().isoformat()
        }


# Global security monitor instance
security_monitor = SecurityMonitor()
