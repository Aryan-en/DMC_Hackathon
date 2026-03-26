import asyncio
import os
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from sqlalchemy import select, text
import sys

# Add the backend directory to sys.path to import schemas
sys.path.append(os.path.join(os.getcwd(), "backend"))

async def test_db():
    # Load from .env manually or use defaults
    user = "ontora_user"
    password = "ontora_password"
    host = "localhost"
    port = "5433"
    db_name = "ontora_prod"
    
    url = f"postgresql+asyncpg://{user}:{password}@{host}:{port}/{db_name}"
    print(f"Connecting to {url}...")
    
    engine = create_async_engine(url)
    async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    
    async with async_session() as session:
        try:
            # Test simple select
            result = await session.execute(text("SELECT 1"))
            print("Database connection successful!")
            
            # Check entities count
            from db.schemas import Entity
            result = await session.execute(select(Entity))
            entities = result.scalars().all()
            print(f"Current entities count: {len(entities)}")
            
            # Try to insert one entity
            new_entity = Entity(
                entity_type="COUNTRY",
                name="Test Russia",
                description="Seeding test",
                confidence_score=0.99
            )
            session.add(new_entity)
            await session.commit()
            print("Successfully inserted test entity!")
            
        except Exception as e:
            print(f"Error: {e}")
        finally:
            await engine.dispose()

if __name__ == "__main__":
    asyncio.run(test_db())
