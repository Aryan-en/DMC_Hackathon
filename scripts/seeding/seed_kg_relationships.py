#!/usr/bin/env python3
"""
Seed script for Knowledge Graph Relationships.
Creates relationships between entities to populate the knowledge graph.
"""

import asyncio
import sys
import uuid
import random
from datetime import datetime
from pathlib import Path

# Add backend to path
sys.path.insert(0, str(Path(__file__).parent / 'backend'))

from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from sqlalchemy import select, func

from db.schemas import Entity, Relationship, Base
from config import settings


# Relationship predicates
PREDICATES = [
    "SANCTIONS",
    "TRADE_PARTNER",
    "MILITARY_SUPPORT",
    "DEFENSE_AGREEMENT",
    "DIPLOMATIC_TIES",
    "INFLUENCES",
    "CONTROLS",
    "OPPOSES",
    "COOPERATES_WITH",
    "BORDERS",
    "ALLIANCE_MEMBER",
    "CONFLICT_WITH",
    "FUNDING",
    "ADVISES",
    "RECOGNIZES",
    "DISPUTES",
    "INVESTS_IN",
    "ESTABLISHES",
    "IMPLEMENTS",
    "AFFECTED_BY",
    "PARTICIPATES_IN",
    "TRIGGERED_BY",
    "MITIGATES",
    "EXACERBATES",
    "REQUIRES",
    "SUPPORTS",
    "OPPOSES_POLICY",
]

async def seed_relationships():
    """Seed knowledge graph relationships."""
    engine = create_async_engine(settings.POSTGRES_URL)
    async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    
    async with async_session() as session:
        print("[*] Seeding knowledge graph relationships...\n")
        
        # Get all entities
        entities_result = await session.execute(select(Entity.id))
        entity_ids = [row[0] for row in entities_result.all()]
        
        print(f"  [Entities] Found {len(entity_ids)} entities")
        
        if len(entity_ids) < 2:
            print("  [Error] Not enough entities to create relationships")
            await engine.dispose()
            return
        
        relationships_to_create = []
        
        # Create relationships
        # For each entity, create 2-8 relationships to random other entities
        print("  [Relationships] Generating relationships...")
        
        for i, source_id in enumerate(entity_ids):
            num_relationships = random.randint(2, 8)
            
            for _ in range(num_relationships):
                target_id = random.choice(entity_ids)
                
                # Avoid self-relationships
                if target_id == source_id:
                    continue
                
                predicate = random.choice(PREDICATES)
                confidence = random.uniform(0.5, 0.99)
                
                relationship = Relationship(
                    id=uuid.uuid4(),
                    subject_entity_id=source_id,
                    predicate=predicate,
                    object_entity_id=target_id,
                    confidence_score=confidence,
                    created_at=datetime.utcnow(),
                )
                relationships_to_create.append(relationship)
            
            if (i + 1) % 2000 == 0:
                print(f"    - Processed {i + 1}/{len(entity_ids)} entities")
        
        # Batch insert all relationships
        print(f"\n  [DB] Inserting {len(relationships_to_create)} relationships into database...")
        session.add_all(relationships_to_create)
        await session.commit()
        
        # Verify counts
        rel_count = (await session.execute(select(func.count(Relationship.id)))).scalar() or 0
        
        print("\n" + "="*70)
        print("[OK] KNOWLEDGE GRAPH RELATIONSHIPS SEEDED")
        print("="*70)
        print(f"[+] Total Relationships:  {rel_count:,}")
        print(f"[+] Average per Entity:   {rel_count / len(entity_ids):.1f}")
        print(f"\nAccess knowledge graph at:")
        print(f"  [Web] http://localhost:3002/knowledge-graph")
        print(f"  [API] http://localhost:8000/api/knowledge-graph/relationships")
        print("="*70 + "\n")
    
    await engine.dispose()


if __name__ == "__main__":
    asyncio.run(seed_relationships())
