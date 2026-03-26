import asyncio
import uuid
import random
import os
import sys
from datetime import datetime, timedelta

# Add current directory to path so we can import from backend
sys.path.append(os.getcwd())

from db.postgres import AsyncSessionLocal, engine
from db.schemas import AuditLog

async def seed_audit_logs():
    async with AsyncSessionLocal() as db:
        print("Seeding audit logs in PostgreSQL...")
        
        # Clear existing logs if any (optional, but good for a deterministic seed)
        # await db.execute(AuditLog.__table__.delete())
        
        users = ["admin-001", "analyst-042", "analyst-018", "viewer-105", "admin-002", "global-monitor"]
        actions = ["LOGIN", "LOGOUT", "QUERY", "EXPORT", "UPDATE", "ACCESS_CHECK", "WRITE"]
        resources = [
            "auth/session", 
            "data-lake/economic", 
            "intelligence/briefs", 
            "security/policy", 
            "bill-analysis/start/amnesty_bill.pdf",
            "bill-analysis/history",
            "geospatial/hotspots"
        ]
        classifications = ["UNCLASS", "FOUO", "SECRET", "TS", "TS/SCI"]
        
        # Create 50 logs over the last 10 days
        logs_to_add = []
        for i in range(50):
            days_ago = random.randint(0, 9)
            hours_ago = random.randint(0, 23)
            minutes_ago = random.randint(0, 59)
            timestamp = datetime.utcnow() - timedelta(days=days_ago, hours=hours_ago, minutes=minutes_ago)
            
            user = random.choice(users)
            action = random.choice(actions)
            resource = random.choice(resources)
            classification = random.choice(classifications)
            
            # Logic: TS/SECRET have higher denial rates for non-admins
            is_admin = "admin" in user
            deny_chance = 0.05
            if classification in ["SECRET", "TS", "TS/SCI"] and not is_admin:
                deny_chance = 0.4
            
            status = "DENY" if random.random() < deny_chance else "ALLOW"
            
            log = AuditLog(
                user_id=user,
                action=action,
                resource=resource,
                classification=classification,
                status=status,
                ip_address=f"192.168.1.{random.randint(10, 99)}",
                timestamp=timestamp,
                details={
                    "seeded": True, 
                    "reason": "Clearance check" if status == "ALLOW" else "Insufficient privileges",
                    "session_id": str(uuid.uuid4())[:8]
                }
            )
            logs_to_add.append(log)
        
        # Add specifically recent logs for the "Live" feel
        for i in range(5):
            timestamp = datetime.utcnow() - timedelta(minutes=random.randint(1, 45))
            log = AuditLog(
                user_id=random.choice(users),
                action="QUERY",
                resource="data-lake/telemetry",
                classification="FOUO",
                status="ALLOW",
                ip_address="127.0.0.1",
                timestamp=timestamp,
                details={"seeded": True, "live_mode": True}
            )
            logs_to_add.append(log)

        db.add_all(logs_to_add)
        await db.commit()
        print(f"Successfully seeded {len(logs_to_add)} audit logs.")

if __name__ == "__main__":
    asyncio.run(seed_audit_logs())
