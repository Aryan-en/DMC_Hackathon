import asyncio
import sys
from sqlalchemy import select, func
from pathlib import Path

# Add backend to path
sys.path.insert(0, str(Path(__file__).parent.parent / 'backend'))

from db.postgres import get_async_engine
from db.schemas import Document, Country, EconomicIndicator
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import sessionmaker

async def read_db_stats():
    """Read document counts and country counts."""
    from config import settings
    engine = get_async_engine()
    async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    
    async with async_session() as session:
        doc_count = (await session.execute(select(func.count(Document.id)))).scalar() or 0
        country_count = (await session.execute(select(func.count(Country.id)))).scalar() or 0
        econ_count = (await session.execute(select(func.count(EconomicIndicator.id)))).scalar() or 0
        
        print(f"Postgres Documents: {doc_count}")
        print(f"Postgres Countries: {country_count}")
        print(f"Postgres Economic Indicators: {econ_count}")
    
    await engine.dispose()

if __name__ == "__main__":
    asyncio.run(read_db_stats())
