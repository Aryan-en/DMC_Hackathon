import asyncio
import sys
from pathlib import Path
from uuid import uuid4
from sqlalchemy import select

# Add backend to path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from db.postgres import AsyncSessionLocal
from db.schemas import Entity, Relationship

async def link_kg():
    print("Linking Knowledge Graph Entities...")
    async with AsyncSessionLocal() as session:
        try:
            # Get existing entities
            result = await session.execute(select(Entity))
            entities = result.scalars().all()
            entity_map = {e.name: e.id for e in entities}
            
            print(f"Found entities: {list(entity_map.keys())}")
            
            # relationships to add
            rels_to_add = [
                ("Suez Canal", "monitored_by", "NATO"),
                ("Baltic Sea", "monitored_by", "NATO"),
            ]
            
            for sub, pred, obj in rels_to_add:
                if sub in entity_map and obj in entity_map:
                    rel = Relationship(
                        id=uuid4(),
                        subject_entity_id=entity_map[sub],
                        predicate=pred,
                        object_entity_id=entity_map[obj],
                        confidence_score=0.95
                    )
                    session.add(rel)
            
            await session.commit()
            print("Relationships linked successfully!")
        except Exception as e:
            await session.rollback()
            print(f"Error linking KG: {e}")
            import traceback
            traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(link_kg())
