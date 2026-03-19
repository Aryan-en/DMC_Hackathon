"""
PostgreSQL Database Connection and Schema Initialization
"""

import logging
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import declarative_base

from config import settings

logger = logging.getLogger(__name__)

# Base class for all models
Base = declarative_base()

# Global engine and session factory
engine = None
AsyncSessionLocal = None


async def init_db():
    """Initialize PostgreSQL database connection and create tables"""
    global engine, AsyncSessionLocal
    
    try:
        # Create async engine
        engine = create_async_engine(
            settings.POSTGRES_URL,
            echo=settings.DEBUG,
            pool_pre_ping=True,
            pool_size=20,
            max_overflow=40
        )
        
        # Create session factory
        AsyncSessionLocal = async_sessionmaker(
            engine, class_=AsyncSession, expire_on_commit=False
        )
        
        # Create all tables
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
        
        logger.info("PostgreSQL database initialized successfully")
        
    except Exception as e:
        logger.error(f"Failed to initialize PostgreSQL: {e}")
        raise


async def get_db_session() -> AsyncSession:
    """Dependency for getting database session"""
    async with AsyncSessionLocal() as session:
        yield session


async def close_db():
    """Close database connection"""
    if engine:
        await engine.dispose()
        logger.info("PostgreSQL connection closed")
