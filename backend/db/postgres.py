"""
PostgreSQL Database Connection and Schema Initialization
"""

import logging
from typing import AsyncGenerator
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import declarative_base

from core.config import settings

logger = logging.getLogger(__name__)

# Base class for all models
Base = declarative_base()

# Global engine and session factory
engine = create_async_engine(
    settings.POSTGRES_URL,
    echo=settings.DEBUG,
    pool_pre_ping=True,
    pool_size=20,
    max_overflow=40
)

AsyncSessionLocal = async_sessionmaker(
    engine, class_=AsyncSession, expire_on_commit=False
)

async def init_db():
    """Initialize PostgreSQL database tables if needed."""
    try:
        # Import models so SQLAlchemy metadata is populated
        from db import schemas  # noqa: F401
        
        # Create all tables
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
        
        logger.info("PostgreSQL database initialized successfully")
    except Exception as e:
        logger.warning(f"PostgreSQL initialization deferred (DB likely offline): {e}")
        # DO NOT RAISE - Allow API to start for infrastructure management

async def get_db_session() -> AsyncGenerator[AsyncSession, None]:
    """Dependency for getting database session"""
    async with AsyncSessionLocal() as session:
        yield session

async def close_db():
    """Close database connection"""
    await engine.dispose()
    logger.info("PostgreSQL connection closed")
