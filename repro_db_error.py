import asyncio
import uuid
import sys
import os

# Add backend to path
sys.path.append(os.path.join(os.getcwd(), 'backend'))

from db.postgres import init_db, AsyncSessionLocal
from db.schemas import Entity

async def test_insert():
    print("Testing DB insert...")
    await init_db()
    async with AsyncSessionLocal() as session:
        try:
            ent = Entity(
                id=uuid.uuid4(),
                name="Test Entity",
                entity_type="TEST",
                confidence_score=1.0
            )
            session.add(ent)
            await session.commit()
            print("Successfully inserted test entity!")
        except Exception as e:
            print(f"FAILED: {e}")
            import traceback
            traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(test_insert())
