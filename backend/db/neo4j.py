"""
Neo4j Graph Database Connection and Initialization
"""

import logging
from neo4j import AsyncGraphDatabase, AsyncDriver
from neo4j.exceptions import ServiceUnavailable

from config import settings

logger = logging.getLogger(__name__)

# Global Neo4j driver
_driver: AsyncDriver = None


def init_driver():
    """Initialize Neo4j driver"""
    global _driver
    
    try:
        _driver = AsyncGraphDatabase.driver(
            settings.NEO4J_URL,
            auth=(settings.NEO4J_USER, settings.NEO4J_PASSWORD),
            encrypted=False,
        )
        
        logger.info("Neo4j driver initialized")
        return _driver
        
    except ServiceUnavailable:
        logger.error("Neo4j service unavailable")
        raise
    except Exception as e:
        logger.error(f"Failed to initialize Neo4j driver: {e}")
        raise


def get_driver() -> AsyncDriver:
    """Get Neo4j driver instance"""
    global _driver
    if _driver is None:
        init_driver()
    return _driver


async def init_constraints():
    """Initialize Neo4j constraints and indexes"""
    driver = get_driver()
    
    async with driver.session() as session:
        try:
            # Create constraints for unique properties
            constraints = [
                "CREATE CONSTRAINT country_code IF NOT EXISTS FOR (n:Country) REQUIRE n.iso_code IS UNIQUE",
                "CREATE CONSTRAINT org_id IF NOT EXISTS FOR (n:Organization) REQUIRE n.id IS UNIQUE",
                "CREATE CONSTRAINT person_id IF NOT EXISTS FOR (n:Person) REQUIRE n.id IS UNIQUE",
                "CREATE CONSTRAINT event_id IF NOT EXISTS FOR (n:Event) REQUIRE n.id IS UNIQUE",
                "CREATE CONSTRAINT policy_id IF NOT EXISTS FOR (n:Policy) REQUIRE n.id IS UNIQUE",
            ]
            
            for constraint in constraints:
                await session.run(constraint)
            
            logger.info("Neo4j constraints initialized")
            
        except Exception as e:
            logger.error(f"Failed to initialize Neo4j constraints: {e}")
            raise


async def close_driver():
    """Close Neo4j driver connection"""
    global _driver
    if _driver:
        await _driver.close()
        _driver = None
        logger.info("Neo4j driver closed")


async def verify_connection():
    """Verify Neo4j connection is working"""
    driver = get_driver()
    try:
        async with driver.session() as session:
            result = await session.run("RETURN 1 as num")
            await result.single()
        logger.info("Neo4j connection verified")
        return True
    except Exception as e:
        logger.error(f"Neo4j connection verification failed: {e}")
        return False
