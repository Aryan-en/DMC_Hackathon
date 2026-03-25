import asyncio
import sys
from pathlib import Path
from uuid import uuid4
from datetime import datetime

# Add backend to path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from db.postgres import AsyncSessionLocal
from db.schemas import Document, Entity

async def seed():
    print("Seeding Verification Data...")
    async with AsyncSessionLocal() as session:
        # 1. Add some Documents
        docs = [
            Document(
                id=str(uuid4()),
                title="Suez Canal Traffic Disruption Assessment",
                source="OSINT-CENTRAL",
                url="https://intel.example.com/suez-disruption",
                content="Recent satellite imagery indicates a 15% reduction in Suez Canal throughput due to regional tensions. This impact on global supply chains is being monitored by NATO and G7 stakeholders.",
                published_date=datetime.utcnow(),
                processed=True
            ),
            Document(
                id=str(uuid4()),
                title="Nordic Maritime Security Update",
                source="BALTIC-WATCH",
                url="https://intel.example.com/nordic-security",
                content="Increased naval presence in the Baltic Sea has been observed. Energy infrastructure along the coast is being placed under heightened surveillance following reports of unexplained drone activity.",
                published_date=datetime.utcnow(),
                processed=True
            )
        ]
        session.add_all(docs)
        
        # 2. Add some Entities
        entities = [
            Entity(
                name="Suez Canal",
                entity_type="LOCATION",
                confidence_score=0.98,
                mention_count=142
            ),
            Entity(
                name="NATO",
                entity_type="ORG",
                confidence_score=0.95,
                mention_count=89
            ),
            Entity(
                name="Baltic Sea",
                entity_type="LOCATION",
                confidence_score=0.99,
                mention_count=213
            )
        ]
        session.add_all(entities)
        
        await session.commit()
    print("Seeding Complete. Dashboard should now reflect live DB state.")

if __name__ == "__main__":
    asyncio.run(seed())
