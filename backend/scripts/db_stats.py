import asyncio
import sys
import os

# Add parent to path for imports
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from sqlalchemy import func, select
from db.postgres import get_db_session, init_db
from db.schemas import Entity, Relationship

async def check_stats():
    await init_db()
    async for session in get_db_session():
        entity_count = (await session.execute(select(func.count(Entity.id)))).scalar()
        rel_count = (await session.execute(select(func.count(Relationship.id)))).scalar()
        print(f"Entities: {entity_count}")
        print(f"Relationships: {rel_count}")
        break

if __name__ == "__main__":
    asyncio.run(check_stats())
