import asyncio
import random
from datetime import datetime, timedelta
import sys
from pathlib import Path
from uuid import uuid4

# Add backend to path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent / 'backend'))

from db.postgres import AsyncSessionLocal
from db.schemas import SystemMetric, Document

async def seed_historical_metrics():
    print("ONTORA Historical Seeding Engine v1.0")
    print("Populating 7-day tactical stream [100+ points]...")
    
    async with AsyncSessionLocal() as session:
        now = datetime.utcnow()
        # 1. System Metrics (7 days, 1h interval)
        for d in range(7, -1, -1):
            day_ts = now - timedelta(days=d)
            for h in range(24):
                ts = day_ts.replace(hour=h, minute=random.randint(0,59), second=random.randint(0,59))
                if ts > now: continue
                
                # Conflict Risk (Random walk with trend)
                base_prob = 0.4 + (0.1 * math.sin(d / 2.0))
                prob = min(0.95, max(0.1, base_prob + random.uniform(-0.1, 0.15)))
                
                metrics = [
                    SystemMetric(metric_name="conflict_risk_probability", metric_value=prob, timestamp=ts, tags={"region": "Global"}),
                    SystemMetric(metric_name="serving_cpu_util_pct", metric_value=40 + 30 * math.sin((h+d*24)/10.0) + random.uniform(0, 10), timestamp=ts),
                    SystemMetric(metric_name="serving_requests_per_min", metric_value=500 + 300 * math.cos((h+d*24)/12.0) + random.randint(0, 200), timestamp=ts),
                ]
                
                # Distribution metrics
                cats = ["PEOPLE", "ORG", "LOC", "EVENT", "CONCEPT", "GPE"]
                for cat in cats:
                    count = random.randint(500, 5000) if cat != "ORG" else 8000
                    metrics.append(SystemMetric(metric_name=f"entity_count_{cat}", metric_value=float(count), timestamp=ts, tags={"category": cat}))
                
                session.add_all(metrics)
            print(f"  Day -{d} seeded.")
        
        # 2. Sample Documents
        print("Populating diverse knowledge nodes (GDELT/MEA samples)...")
        sources = ["GDELT", "MEA India", "World Bank", "Reuters", "BBC World", "Al Jazeera"]
        narratives = [
            "Trade agreements in Southeast Asia shifting towards localized currency swaps",
            "Infrastructure health index shows 12% improvement in sub-Saharan logistics",
            "Conflict probability in the Red Sea remains at CRITICAL level for maritime assets",
            "Energy transition policies in EU impacting global crude pricing narratives",
            "Cybersecurity threat landscape: 40% increase in sophisticated phishing vectors targeting NGOs",
            "Global semi-conductor supply chain diversifying into Latin American assembly nodes"
        ]
        
        for i in range(20):
            source = random.choice(sources)
            ts = now - timedelta(hours=random.randint(1, 48))
            new_doc = Document(
                id=str(uuid4()),
                title=f"Tactical Update: {random.choice(narratives)}",
                source=source,
                url=f"https://intel-nodes.ontora.ai/node/{uuid4().hex[:8]}",
                content=f"Detailed intelligence report from {source} regarding {random.choice(narratives)}. Classification: SECRET//REL.",
                doc_metadata={"classification": "SECRET", "priority": random.choice(["HIGH", "CRITICAL", "MEDIUM"])},
                published_date=ts,
                created_at=ts,
                processed=True
            )
            session.add(new_doc)
            
        await session.commit()
    print("SUCCESS: Historical seeding complete. Dashboard refreshed with 168h timeline.")

import math
if __name__ == "__main__":
    asyncio.run(seed_historical_metrics())
