#!/usr/bin/env python3
import asyncio
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent / 'backend'))

from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from sqlalchemy import select, func

from db.schemas import Entity, Relationship, Base
from config import settings

async def check_data():
    engine = create_async_engine(settings.POSTGRES_URL)
    async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    
    async with async_session() as db:
        entities = (await db.execute(select(func.count(Entity.id)))).scalar() or 0
        relationships = (await db.execute(select(func.count(Relationship.id)))).scalar() or 0
        print(f'Entities: {entities}')
        print(f'Relationships: {relationships}')
    
    await engine.dispose()

asyncio.run(check_data())
