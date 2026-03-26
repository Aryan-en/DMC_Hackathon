import asyncio
import sys
from pathlib import Path
from uuid import uuid4
from datetime import datetime

# Add backend to path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from db.postgres import AsyncSessionLocal
from db.schemas import Entity, Relationship

async def seed_kg():
    print("Seeding Knowledge Graph...")
    async with AsyncSessionLocal() as session:
        try:
            # entities_data
            entities_data = {
                "USA": ("COUNTRY", "United States of America", 0.95),
                "Russia": ("COUNTRY", "Russian Federation", 0.95),
                "China": ("COUNTRY", "People's Republic of China", 0.95),
                "NATO": ("ORG", "North Atlantic Treaty Organization", 0.98),
                "Ukraine Conflict": ("EVENT", "Ongoing military conflict", 0.94),
            }
            
            entity_map = {}
            for name, (etype, desc, conf) in entities_data.items():
                ent = Entity(
                    id=uuid4(), 
                    name=name, 
                    entity_type=etype, 
                    description=desc, 
                    confidence_score=conf
                )
                session.add(ent)
                await session.flush()
                entity_map[name] = ent.id
            
            # relationships
            rels = [
                ("USA", "sanctions", "Russia", 0.94),
                ("Russia", "conflicts_with", "Ukraine Conflict", 0.96),
                ("USA", "supports", "NATO", 0.95),
            ]
            
            for sub, pred, obj, conf in rels:
                if sub in entity_map and obj in entity_map:
                    rel = Relationship(
                        id=uuid4(),
                        subject_entity_id=entity_map[sub],
                        predicate=pred,
                        object_entity_id=entity_map[obj],
                        confidence_score=conf
                    )
                    session.add(rel)
            
            await session.commit()
            print("KG Seeded successfully!")
        except Exception as e:
            await session.rollback()
            print(f"Error seeding KG: {e}")
            import traceback
            traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(seed_kg())
