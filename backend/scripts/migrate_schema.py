import asyncio
import os
import sys

# Add parent to path for imports
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from sqlalchemy import text
from db.postgres import get_db_session

async def update_schema():
    print("Updating schema...")
    async for session in get_db_session():
        try:
            await session.execute(text("ALTER TABLE entities ADD COLUMN IF NOT EXISTS properties JSONB;"))
            await session.execute(text("ALTER TABLE relationships ADD COLUMN IF NOT EXISTS url VARCHAR(2000);"))
            await session.commit()
            print("Schema updated successfully")
        except Exception as e:
            print(f"Update failed: {e}")

if __name__ == "__main__":
    asyncio.run(update_schema())
