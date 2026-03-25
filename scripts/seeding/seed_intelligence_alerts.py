#!/usr/bin/env python3
"""
Seed script for Intelligence Alerts System.
Populates Entity and Document tables to generate realistic intelligence alerts.

The live-alerts endpoint generates alerts based on:
1. High-mention entities (LOC, PERSON, ORG, CONCEPT types)
2. Recent documents from various sources

Alert severity determined by mention_count:
- CRITICAL: > 5000 mentions
- HIGH: > 3000 mentions
- MEDIUM: > 1000 mentions
- LOW: <= 1000 mentions
"""

import asyncio
import sys
import uuid
from datetime import datetime, timedelta
from pathlib import Path

# Add backend to path
sys.path.insert(0, str(Path(__file__).parent / 'backend'))

from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from sqlalchemy import delete, select

from db.schemas import Entity, Document, Relationship, Base
from config import settings


async def seed_intelligence_alerts():
    """Populate Entity and Document tables for intelligence alerts."""
    
    # Create async engine
    db_url = settings.POSTGRES_URL
    engine = create_async_engine(db_url, echo=False)
    
    async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    
    async with async_session() as session:
        print("🔄 Clearing existing alert data...")
        await session.execute(delete(Relationship))
        await session.execute(delete(Document))
        await session.execute(delete(Entity))
        await session.commit()
        
        # Define CRITICAL alert entities (5000+ mentions)
        critical_entities = [
            {
                "name": "Election Interference",
                "type": "CONCEPT",
                "description": "Coordinated multi-platform influence operations detected",
                "mention_count": 8734,
                "confidence": 0.94,
                "sentiment": "NEGATIVE",
            },
            {
                "name": "Drought Crisis",
                "type": "EVENT",
                "description": "Critical drought affecting 3+ provinces with food security implications",
                "mention_count": 6521,
                "confidence": 0.92,
                "sentiment": "NEGATIVE",
            },
            {
                "name": "Federal Reserve Policy",
                "type": "CONCEPT",
                "description": "ML analysis of Fed communication patterns signals 82% rate hold",
                "mention_count": 5847,
                "confidence": 0.89,
                "sentiment": "NEUTRAL",
            },
            {
                "name": "Supply Chain Disruption",
                "type": "EVENT",
                "description": "Rare earth element supply chain critical nodes identified",
                "mention_count": 6234,
                "confidence": 0.91,
                "sentiment": "NEGATIVE",
            },
            {
                "name": "APT-41 Cybersecurity",
                "type": "CONCEPT",
                "description": "Advanced persistent threat signatures on critical infrastructure",
                "mention_count": 7543,
                "confidence": 0.96,
                "sentiment": "CRITICAL",
            },
        ]
        
        # Define HIGH alert entities (3000-5000 mentions)
        high_entities = [
            {
                "name": "Middle East Tensions",
                "type": "LOC",
                "description": "Escalating military and political tensions in the region",
                "mention_count": 4521,
                "confidence": 0.88,
                "sentiment": "NEGATIVE",
            },
            {
                "name": "Commodity Volatility",
                "type": "CONCEPT",
                "description": "Natural gas prices exceed 3-sigma volatility threshold",
                "mention_count": 4234,
                "confidence": 0.87,
                "sentiment": "NEGATIVE",
            },
            {
                "name": "Trade War Escalation",
                "type": "EVENT",
                "description": "Bilateral trade restrictions and retaliatory measures",
                "mention_count": 3876,
                "confidence": 0.85,
                "sentiment": "NEGATIVE",
            },
            {
                "name": "China",
                "type": "LOC",
                "description": "Strategic power with multiple intelligence concerns",
                "mention_count": 5124,
                "confidence": 0.93,
                "sentiment": "NEUTRAL",
            },
            {
                "name": "Russia",
                "type": "LOC",
                "description": "Regional power with ongoing security implications",
                "mention_count": 4856,
                "confidence": 0.91,
                "sentiment": "NEUTRAL",
            },
            {
                "name": "Iran",
                "type": "LOC",
                "description": "Middle Eastern actor with missile program developments",
                "mention_count": 3654,
                "confidence": 0.83,
                "sentiment": "NEGATIVE",
            },
        ]
        
        # Define MEDIUM alert entities (1000-3000 mentions)
        medium_entities = [
            {
                "name": "North Korea Nuclear",
                "type": "CONCEPT",
                "description": "Nuclear weapons program testing and development",
                "mention_count": 2845,
                "confidence": 0.84,
                "sentiment": "NEGATIVE",
            },
            {
                "name": "Afghanistan Stability",
                "type": "EVENT",
                "description": "Security situation and humanitarian crisis monitoring",
                "mention_count": 2156,
                "confidence": 0.79,
                "sentiment": "NEGATIVE",
            },
            {
                "name": "Taiwan Relations",
                "type": "CONCEPT",
                "description": "Cross-strait tensions and political developments",
                "mention_count": 2634,
                "confidence": 0.82,
                "sentiment": "NEGATIVE",
            },
            {
                "name": "Ukraine Conflict",
                "type": "EVENT",
                "description": "Ongoing military operations and humanitarian impact",
                "mention_count": 3089,
                "confidence": 0.88,
                "sentiment": "NEGATIVE",
            },
            {
                "name": "European Energy Security",
                "type": "CONCEPT",
                "description": "Gas supply diversification and renewable transition",
                "mention_count": 2412,
                "confidence": 0.80,
                "sentiment": "NEUTRAL",
            },
            {
                "name": "South China Sea",
                "type": "LOC",
                "description": "Disputed maritime territory with geopolitical significance",
                "mention_count": 2876,
                "confidence": 0.83,
                "sentiment": "NEUTRAL",
            },
        ]
        
        # Define LOW alert entities (<=1000 mentions)
        low_entities = [
            {
                "name": "World Bank Policy",
                "type": "ORG",
                "description": "Development finance and economic programs monitoring",
                "mention_count": 856,
                "confidence": 0.75,
                "sentiment": "NEUTRAL",
            },
            {
                "name": "Climate Accord",
                "type": "EVENT",
                "description": "International climate agreements and compliance tracking",
                "mention_count": 945,
                "confidence": 0.78,
                "sentiment": "NEUTRAL",
            },
            {
                "name": "Arctic Sovereignty",
                "type": "CONCEPT",
                "description": "Climate change and territorial claims in Arctic region",
                "mention_count": 634,
                "confidence": 0.71,
                "sentiment": "NEUTRAL",
            },
            {
                "name": "India Japan Partnership",
                "type": "EVENT",
                "description": "Strategic alliance and technology cooperation",
                "mention_count": 512,
                "confidence": 0.73,
                "sentiment": "POSITIVE",
            },
            {
                "name": "ASEAN Cooperation",
                "type": "ORG",
                "description": "Regional economic and political organization activities",
                "mention_count": 723,
                "confidence": 0.76,
                "sentiment": "NEUTRAL",
            },
        ]
        
        # Combine all entities
        all_entities = critical_entities + high_entities + medium_entities + low_entities
        
        print(f"\n📊 Seeding {len(all_entities)} intelligence entities...")
        
        # Create entities
        created_entities = []
        for ent_data in all_entities:
            entity = Entity(
                id=uuid.uuid4(),
                entity_type=ent_data["type"],
                name=ent_data["name"],
                description=ent_data["description"],
                confidence_score=ent_data["confidence"],
                mention_count=ent_data["mention_count"],
                sentiment=ent_data["sentiment"],
                created_at=datetime.utcnow(),
            )
            session.add(entity)
            created_entities.append(entity)
        
        await session.commit()
        print(f"✅ Created {len(created_entities)} entities")
        
        # Define recent documents from various sources
        now = datetime.utcnow()
        documents_data = [
            {
                "title": "Multi-Platform Influence Campaign Analysis Report",
                "content": "Analysis of coordinated inauthentic behavior across social platforms reveals systematic election interference narrative",
                "source": "MEA",
                "created_at": now - timedelta(minutes=5),
            },
            {
                "title": "Critical Drought Assessment - 3 Provinces at Risk",
                "content": "Meteorological analysis indicates severe drought conditions affecting agricultural output and water security",
                "source": "CLIMATE",
                "created_at": now - timedelta(minutes=12),
            },
            {
                "title": "Federal Reserve Communication Pattern Analysis",
                "content": "Deep learning model analysis of Fed speeches and statements indicates high probability of rate hold policy",
                "source": "ECON-AI",
                "created_at": now - timedelta(minutes=18),
            },
            {
                "title": "Rare Earth Supply Chain Vulnerability Report",
                "content": "Semiconductor industry dependency mapping reveals critical nodes in rare earth element supply chain",
                "source": "TRADE",
                "created_at": now - timedelta(minutes=25),
            },
            {
                "title": "APT-41 Campaign: Critical Infrastructure Targeting",
                "content": "Cyber threat intelligence shows advanced persistent threat signatures matching APT-41 group patterns",
                "source": "CYBER",
                "created_at": now - timedelta(minutes=31),
            },
            {
                "title": "Middle East Military Developments",
                "content": "Satellite imagery analysis shows troop movements and equipment deployments near Strait of Hormuz",
                "source": "SAT-FEED",
                "created_at": now - timedelta(minutes=38),
            },
            {
                "title": "Commodity Market Volatility Alert",
                "content": "Natural gas prices exhibit 3-sigma volatility spike due to supply disruptions and geopolitical factors",
                "source": "MARKET",
                "created_at": now - timedelta(minutes=45),
            },
            {
                "title": "Trade Tensions Escalation - Bilateral Restrictions",
                "content": "Major trading partners announce reciprocal trade restrictions and retaliatory tariff measures",
                "source": "NEWS",
                "created_at": now - timedelta(minutes=52),
            },
            {
                "title": "Strategic Power Assessment: China Regional Role",
                "content": "Comprehensive analysis of China's role in regional security dynamics and economic influence",
                "source": "OSINT",
                "created_at": now - timedelta(minutes=59),
            },
            {
                "title": "Russia Security Posture Analysis",
                "content": "Assessment of Russian military capabilities and strategic positioning in multiple regions",
                "source": "MEA",
                "created_at": now - timedelta(minutes=66),
            },
            {
                "title": "Iran Missile Program Development",
                "content": "Intelligence assessment of Iranian missile testing and weapons development programs",
                "source": "OSINT",
                "created_at": now - timedelta(minutes=73),
            },
            {
                "title": "North Korea Nuclear Testing Update",
                "content": "Analysis of seismic data and satellite imagery indicating recent or planned nuclear weapons tests",
                "source": "SAT-FEED",
                "created_at": now - timedelta(minutes=80),
            },
            {
                "title": "Afghanistan Humanitarian Crisis Report",
                "content": "Updated assessment of humanitarian situation and security developments in Afghanistan",
                "source": "NEWS",
                "created_at": now - timedelta(minutes=87),
            },
            {
                "title": "Taiwan Cross-Strait Tension Update",
                "content": "Analysis of political developments and military activities in Taiwan Strait region",
                "source": "OSINT",
                "created_at": now - timedelta(minutes=94),
            },
            {
                "title": "Ukraine Military Operations Summary",
                "content": "Latest developments in ongoing military conflict including territorial changes and humanitarian impact",
                "source": "NEWS",
                "created_at": now - timedelta(minutes=101),
            },
            {
                "title": "European Energy Security Strategy",
                "content": "EU policy initiatives for energy diversification and renewable energy transition",
                "source": "TRADE",
                "created_at": now - timedelta(minutes=108),
            },
            {
                "title": "South China Sea Territorial Disputes",
                "content": "Analysis of competing maritime claims and recent military posturing in disputed waters",
                "source": "SAT-FEED",
                "created_at": now - timedelta(minutes=115),
            },
            {
                "title": "World Bank Development Finance Programs",
                "content": "Review of World Bank lending policies and economic development initiatives",
                "source": "NEWS",
                "created_at": now - timedelta(minutes=122),
            },
            {
                "title": "International Climate Accord Compliance",
                "content": "Assessment of nations' progress toward climate goals under international agreements",
                "source": "CLIMATE",
                "created_at": now - timedelta(minutes=129),
            },
            {
                "title": "Arctic Sovereignty and Climate Change",
                "content": "Analysis of climate impacts on Arctic region and emerging territorial sovereignty issues",
                "source": "CLIMATE",
                "created_at": now - timedelta(minutes=136),
            },
        ]
        
        print(f"\n📄 Seeding {len(documents_data)} intelligence documents...")
        
        for doc_data in documents_data:
            document = Document(
                id=uuid.uuid4(),
                title=doc_data["title"],
                content=doc_data["content"],
                source=doc_data["source"],
                language="en",
                created_at=doc_data["created_at"],
                processed=True,
            )
            session.add(document)
        
        await session.commit()
        print(f"✅ Created {len(documents_data)} documents")
        
        print("\n" + "="*60)
        print("🎯 INTELLIGENCE ALERTS SEEDING COMPLETE")
        print("="*60)
        print(f"✓ Entities: {len(all_entities)}")
        print(f"  - CRITICAL (5000+ mentions): {len(critical_entities)}")
        print(f"  - HIGH (3000-5000 mentions): {len(high_entities)}")
        print(f"  - MEDIUM (1000-3000 mentions): {len(medium_entities)}")
        print(f"  - LOW (<=1000 mentions): {len(low_entities)}")
        print(f"✓ Documents: {len(documents_data)}")
        print(f"\nAccess intelligence alerts at:")
        print(f"  🌐 http://localhost:3005/intelligence")
        print(f"  📡 API: http://localhost:8000/api/intelligence/live-alerts")
        print("="*60 + "\n")


if __name__ == "__main__":
    asyncio.run(seed_intelligence_alerts())
