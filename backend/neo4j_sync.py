import sys
import os
import asyncio
import logging
from sqlalchemy import select

# Add parent to path for imports
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '.')))

from db.postgres import AsyncSessionLocal
from db.schemas import Entity, Relationship
from db.neo4j_driver import get_driver

logger = logging.getLogger(__name__)
logging.basicConfig(level=logging.INFO)



async def incremental_sync(limit_entities: int = 50000, limit_relationships: int = 60000) -> dict:
    """Synchronize a subset of Postgres data to Neo4j. This is a basic one-shot sync."""
    driver = get_driver()
    if not driver:
        return {"status": "failed", "reason": "Neo4j not connected"}

    async with AsyncSessionLocal() as pg_session:
        # Pull a batch of entities
        ent_query = select(Entity.id, Entity.name, Entity.entity_type, Entity.description, Entity.confidence_score).limit(limit_entities)
        ent_rows = (await pg_session.execute(ent_query)).all()

        async with driver.session() as neo_session:
            # Upsert entities into Neo4j
            for eid, name, etype, desc, conf in ent_rows:
                await neo_session.run(
                    "MERGE (e:Entity {id: $id}) SET e.name = $name, e.entity_type = $etype, e.description = $desc, e.confidence_score = $conf",
                    id=str(eid), name=name, etype=etype, desc=desc or '', conf=float(conf) if conf is not None else 0.0,
                )

            # Pull a batch of relationships
            rel_query = select(Relationship.subject_entity_id, Relationship.object_entity_id, Relationship.predicate, Relationship.confidence_score, Relationship.url)
            rel_rows = (await pg_session.execute(rel_query.limit(limit_relationships))).all()
            for sid, oid, pred, conf, url in rel_rows:
                await neo_session.run(
                    "MERGE (a:Entity {id: $sa}) MERGE (b:Entity {id: $ob}) MERGE (a)-[:RELATED_TO {predicate: $pred, confidence: $conf, url: $url}]->(b)",
                    sa=str(sid), ob=str(oid), pred=pred or '', conf=float(conf) if conf is not None else 0.0, url=url or ''
                )


        await pg_session.commit()
    logger.info("Neo4j incremental sync completed (basic)")
    return {"status": "success"}

if __name__ == "__main__":
    asyncio.run(incremental_sync())

