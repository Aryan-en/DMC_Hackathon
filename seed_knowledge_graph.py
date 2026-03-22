#!/usr/bin/env python3
"""
Seed script for populating the Knowledge Graph with geopolitical entities and relationships.
This injects comprehensive data for the knowledge graph visualization.
"""

import asyncio
import sys
import uuid
from datetime import datetime
from pathlib import Path

# Add backend to path
sys.path.insert(0, str(Path(__file__).parent / 'backend'))

from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from sqlalchemy import delete

from db.schemas import Entity, Relationship, Base
from config import get_settings

settings = get_settings()


async def seed_knowledge_graph():
    """Populate knowledge graph with geopolitical entities and relationships."""
    
    # Create async engine
    engine = create_async_engine(settings.DATABASE_URL, echo=False)
    
    async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    
    async with async_session() as session:
        # Clear existing data
        await session.execute(delete(Relationship))
        await session.execute(delete(Entity))
        await session.commit()
        
        # Define entities with IDs for relationship mapping
        entities_data = {
            # Countries (GPE)
            "USA": {
                "type": "COUNTRY",
                "description": "United States of America - Global superpower",
                "confidence": 0.95,
            },
            "Russia": {
                "type": "COUNTRY",
                "description": "Russian Federation - Major regional power",
                "confidence": 0.95,
            },
            "China": {
                "type": "COUNTRY",
                "description": "People's Republic of China - Rising superpower",
                "confidence": 0.95,
            },
            "India": {
                "type": "COUNTRY",
                "description": "Republic of India - Regional power",
                "confidence": 0.95,
            },
            "EU": {
                "type": "COUNTRY",
                "description": "European Union - Political and economic union",
                "confidence": 0.92,
            },
            "Ukraine": {
                "type": "COUNTRY",
                "description": "Eastern European nation",
                "confidence": 0.95,
            },
            "Pakistan": {
                "type": "COUNTRY",
                "description": "South Asian nation",
                "confidence": 0.95,
            },
            "Iran": {
                "type": "COUNTRY",
                "description": "Middle Eastern power",
                "confidence": 0.95,
            },
            "Saudi Arabia": {
                "type": "COUNTRY",
                "description": "Gulf state leader",
                "confidence": 0.95,
            },
            
            # Organizations
            "NATO": {
                "type": "ORG",
                "description": "North Atlantic Treaty Organization - Military alliance",
                "confidence": 0.98,
            },
            "UN": {
                "type": "ORG",
                "description": "United Nations - International organization",
                "confidence": 0.98,
            },
            "OPEC": {
                "type": "ORG",
                "description": "Organization of Petroleum Exporting Countries",
                "confidence": 0.95,
            },
            "WTO": {
                "type": "ORG",
                "description": "World Trade Organization",
                "confidence": 0.95,
            },
            "IMF": {
                "type": "ORG",
                "description": "International Monetary Fund",
                "confidence": 0.95,
            },
            "SCO": {
                "type": "ORG",
                "description": "Shanghai Cooperation Organization",
                "confidence": 0.92,
            },
            
            # Events
            "Ukraine Conflict": {
                "type": "EVENT",
                "description": "Ongoing military conflict in Ukraine",
                "confidence": 0.94,
            },
            "Taiwan Strait Tensions": {
                "type": "EVENT",
                "description": "Geopolitical tensions in Taiwan Strait",
                "confidence": 0.93,
            },
            "Middle East Crisis": {
                "type": "EVENT",
                "description": "Regional instability and conflicts",
                "confidence": 0.92,
            },
            "Kashmir Dispute": {
                "type": "EVENT",
                "description": "Long-standing territorial dispute",
                "confidence": 0.94,
            },
            
            # Actors
            "Putin": {
                "type": "PERSON",
                "description": "Russian President",
                "confidence": 0.99,
            },
            "Biden": {
                "type": "PERSON",
                "description": "US President",
                "confidence": 0.99,
            },
            "Xi Jinping": {
                "type": "PERSON",
                "description": "Chinese President",
                "confidence": 0.99,
            },
            "Modi": {
                "type": "PERSON",
                "description": "Indian Prime Minister",
                "confidence": 0.99,
            },
            
            # Concepts & Policy Areas
            "Energy Security": {
                "type": "CONCEPT",
                "description": "Reliable access to energy resources",
                "confidence": 0.90,
            },
            "Nuclear Proliferation": {
                "type": "CONCEPT",
                "description": "Spread of nuclear weapons",
                "confidence": 0.92,
            },
            "Trade Dispute": {
                "type": "POLICY",
                "description": "Commercial and tariff conflicts",
                "confidence": 0.88,
            },
            "Cyber Warfare": {
                "type": "CONCEPT",
                "description": "Digital conflict and attacks",
                "confidence": 0.91,
            },
            "Climate Crisis": {
                "type": "CONCEPT",
                "description": "Global environmental challenge",
                "confidence": 0.93,
            },
            "Sanctions": {
                "type": "POLICY",
                "description": "Economic and political penalties",
                "confidence": 0.89,
            },
        }
        
        # Create entity records
        entity_map = {}
        for name, data in entities_data.items():
            entity_id = str(uuid.uuid4())
            entity = Entity(
                id=entity_id,
                name=name,
                entity_type=data["type"],
                description=data["description"],
                confidence_score=data["confidence"],
                mention_count=1,
            )
            session.add(entity)
            entity_map[name] = entity_id
        
        await session.flush()
        
        # Define relationships
        relationships_data = [
            # USA relationships
            ("USA", "supports", "NATO", 0.95),
            ("USA", "sanctions", "Russia", 0.94),
            ("USA", "in_conflict_with", "China", 0.88),
            ("USA", "opposes", "Iran", 0.92),
            ("USA", "leads", "WTO", 0.91),
            ("Biden", "heads", "USA", 0.99),
            
            # Russia relationships
            ("Russia", "conflicts_with", "Ukraine", 0.96),
            ("Russia", "competes_with", "USA", 0.93),
            ("Russia", "allied_with", "China", 0.85),
            ("Russia", "threatens", "NATO", 0.89),
            ("Russia", "member_of", "SCO", 0.92),
            ("Putin", "heads", "Russia", 0.99),
            ("Putin", "directs", "Ukraine Conflict", 0.95),
            
            # China relationships
            ("China", "disputes_with", "India", 0.90),
            ("China", "threatens", "Taiwan Strait Tensions", 0.94),
            ("China", "competes_with", "USA", 0.91),
            ("China", "cooperates_with", "Russia", 0.82),
            ("China", "member_of", "SCO", 0.93),
            ("Xi Jinping", "heads", "China", 0.99),
            
            # India relationships
            ("India", "disputes_with", "Pakistan", 0.95),
            ("India", "disputes_with", "China", 0.93),
            ("India", "cooperates_with", "USA", 0.80),
            ("India", "member_of", "SCO", 0.91),
            ("Modi", "heads", "India", 0.99),
            
            # EU relationships
            ("EU", "supports", "Ukraine", 0.94),
            ("EU", "member_of", "NATO", 0.81),
            ("EU", "sanctions", "Russia", 0.95),
            ("EU", "trades_with", "USA", 0.85),
            
            # Conflict relationships
            ("Ukraine Conflict", "involves", "Russia", 0.96),
            ("Ukraine Conflict", "involves", "Ukraine", 0.97),
            ("Ukraine Conflict", "supported_by", "USA", 0.91),
            ("Ukraine Conflict", "supported_by", "EU", 0.92),
            
            ("Taiwan Strait Tensions", "involves", "China", 0.95),
            ("Taiwan Strait Tensions", "monitored_by", "USA", 0.93),
            
            ("Kashmir Dispute", "involves", "India", 0.96),
            ("Kashmir Dispute", "involves", "Pakistan", 0.96),
            
            ("Middle East Crisis", "involves", "Iran", 0.88),
            ("Middle East Crisis", "involves", "Saudi Arabia", 0.87),
            
            # Economic relationships
            ("USA", "imposes", "Trade Dispute", 0.82),
            ("China", "engages_in", "Trade Dispute", 0.84),
            ("OPEC", "controls", "Energy Security", 0.91),
            ("Russia", "supplies", "Energy Security", 0.89),
            
            # Threat relationships
            ("Iran", "develops", "Nuclear Proliferation", 0.87),
            ("Russia", "engages_in", "Cyber Warfare", 0.85),
            ("China", "engages_in", "Cyber Warfare", 0.84),
            
            # Policy relationships
            ("UN", "enforces", "Sanctions", 0.88),
            ("Russia", "evades", "Sanctions", 0.83),
            ("USA", "leads", "Sanctions", 0.89),
            
            # Climate relationships
            ("USA", "addresses", "Climate Crisis", 0.75),
            ("China", "addresses", "Climate Crisis", 0.72),
            ("EU", "leads", "Climate Crisis", 0.86),
            
            # Organization relationships
            ("NATO", "led_by", "USA", 0.94),
            ("SCO", "includes", "Russia", 0.93),
            ("SCO", "includes", "China", 0.95),
            ("WTO", "regulates", "Trade Dispute", 0.87),
            
            # Additional connections for graph density
            ("USA", "monitors", "Middle East Crisis", 0.85),
            ("China", "interests_in", "Middle East Crisis", 0.78),
            ("Russia", "involved_in", "Middle East Crisis", 0.80),
            ("Pakistan", "disputes_with", "USA", 0.75),
            ("Iran", "sanctions_by", "USA", 0.93),
            ("Saudi Arabia", "allies_with", "USA", 0.87),
            ("Energy Security", "related_to", "Middle East Crisis", 0.86),
            ("India", "partners_with", "USA", 0.78),
            ("India", "opposes", "Nuclear Proliferation", 0.85),
            ("Pakistan", "develops", "Nuclear Proliferation", 0.88),
        ]
        
        # Create relationship records
        for subject, predicate, obj, confidence in relationships_data:
            if subject in entity_map and obj in entity_map:
                relationship = Relationship(
                    id=str(uuid.uuid4()),
                    subject_entity_id=entity_map[subject],
                    predicate=predicate,
                    object_entity_id=entity_map[obj],
                    confidence_score=confidence,
                )
                session.add(relationship)
        
        await session.commit()
        print(f"✅ Knowledge Graph seeded successfully!")
        print(f"  - {len(entity_map)} entities created")
        print(f"  - {len(relationships_data)} relationships created")


if __name__ == "__main__":
    asyncio.run(seed_knowledge_graph())
