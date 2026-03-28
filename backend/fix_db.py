import asyncio
from sqlalchemy import text
from db.postgres import engine

async def fix_schema():
    async with engine.begin() as conn:
        print("Checking/Adding relationships.url...")
        await conn.execute(text("ALTER TABLE relationships ADD COLUMN IF NOT EXISTS url VARCHAR(2000)"))
        
        print("Checking/Adding entities.properties...")
        await conn.execute(text("ALTER TABLE entities ADD COLUMN IF NOT EXISTS properties JSONB"))
        
        print("Done.")

if __name__ == "__main__":
    asyncio.run(fix_schema())
