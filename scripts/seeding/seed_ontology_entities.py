#!/usr/bin/env python3
"""
Seed script for Ontology Entity Distribution.
Populates Entity table with various entity types to populate the
Ontology Entity Distribution chart on the dashboard.

Entity types to seed:
- State Actors (Countries/Locations): 1847
- NGOs (Organizations): 932
- Corps (Corporations/Organizations): 2341
- Events: 5621
- Policies (Concepts): 1204
- Persons: 3892
"""

import asyncio
import sys
import uuid
from datetime import datetime
from pathlib import Path
import random

# Add backend to path
sys.path.insert(0, str(Path(__file__).parent / 'backend'))

from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from sqlalchemy import delete, select, func

from db.schemas import Entity, Base
from config import settings


# State Actor Names
STATE_ACTORS = [
    "United States", "China", "Russia", "India", "Germany", "United Kingdom",
    "France", "Japan", "Brazil", "Mexico", "Canada", "Australia", "South Korea",
    "Indonesia", "Nigeria", "Pakistan", "Philippines", "Egypt", "Vietnam", "Turkey",
    "Iran", "Saudi Arabia", "Ukraine", "Spain", "Argentina", "Thailand"
]

# NGO Names
NGOS = [
    "Amnesty International", "Human Rights Watch", "Doctors Without Borders",
    "World Wildlife Fund", "UNICEF", "Red Cross", "Oxfam", "Save the Children",
    "Greenpeace", "International Crisis Group", "UN Women", "CARE International",
    "Plan International", "ActionAid", "International Rescue Committee"
]

# Corporation Names
CORPS = [
    "Apple", "Microsoft", "Google", "Amazon", "Tesla", "Meta", "NVIDIA",
    "Goldman Sachs", "JPMorgan Chase", "Bank of America", "Citigroup", "Wells Fargo",
    "Intel", "Cisco", "Oracle", "IBM", "Accenture", "Deloitte", "PWC", "EY",
    "Shell", "ExxonMobil", "BP", "Chevron", "Saudi Aramco", "BASF", "Siemens"
]

# Event Names
EVENTS = [
    "Presidential Election", "Armed Conflict", "Natural Disaster", "Economic Crisis",
    "Trade Agreement", "Summit Meeting", "Cyber Attack", "Terrorism Incident",
    "Climate Conference", "Military Exercise", "Nuclear Test", "Peace Negotiation",
    "Refugee Crisis", "Pandemic Outbreak", "Supply Chain Disruption",
    "Diplomatic Incident", "Sanctions", "Border Dispute", "Technology Launch",
    "Financial Merger", "Corporate Scandal", "Environmental Disaster"
]

# Policy Names
POLICIES = [
    "Carbon Neutrality Commitment", "Nuclear Deterrence Strategy", "Trade Protectionism",
    "Digital Privacy Regulation", "Green Energy Transition", "Cybersecurity Framework",
    "Immigration Reform", "Labor Standards", "Data Protection Law", "Climate Action Plan",
    "Infrastructure Investment", "Education Policy", "Healthcare Reform", "Tax Reform",
    "Antitrust Regulation", "Supply Chain Resilience", "AI Governance"
]

# Person Names (First, Last)
PERSON_FIRST = [
    "John", "Alice", "Robert", "Maria", "James", "Jennifer", "Michael", "Sarah",
    "David", "Lisa", "Richard", "Emily", "Charles", "Anna", "Thomas", "Sophie",
    "Daniel", "Jessica", "Matthew", "Lauren", "Joseph", "Amanda"
]

PERSON_LAST = [
    "Smith", "Johnson", "Williams", "Brown", "Jones", "Garcia", "Miller", "Davis",
    "Rodriguez", "Martinez", "Hernandez", "Lopez", "Gonzalez", "Wilson", "Anderson",
    "Thomas", "Taylor", "Moore", "Jackson", "Martin", "Lee", "Perez"
]


async def seed_ontology_entities():
    """Populate Entity table with ontology entity distribution data."""
    
    # Create async engine
    db_url = settings.POSTGRES_URL
    engine = create_async_engine(db_url, echo=False)
    
    async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    
    async with async_session() as session:
        print("[*] Seeding ontology entity distribution...\n")
        
        # Clear existing entities (optional - comment out if you want to keep existing)
        # await session.execute(delete(Entity))
        # await session.commit()
        
        entities_to_create = []
        
        # 1. State Actors (Countries/Locations) - 1847
        print("  [Locations] State Actors (1847)")
        for i in range(1847):
            actor_name = random.choice(STATE_ACTORS)
            if i > 0:
                actor_name = f"{actor_name} - Region {i % 100}"
            
            entity = Entity(
                id=uuid.uuid4(),
                entity_type="LOC",
                name=actor_name,
                description="State actor or geopolitical entity",
                confidence_score=random.uniform(0.75, 0.99),
                mention_count=random.randint(50, 500),
                sentiment="NEUTRAL",
                created_at=datetime.utcnow(),
            )
            entities_to_create.append(entity)
        
        # 2. NGOs (Non-Governmental Organizations) - 932
        print("  [NGOs] Organizations (932)")
        for i in range(932):
            ngo_name = random.choice(NGOS)
            if i > 0:
                ngo_name = f"{ngo_name} - Chapter {i % 50}"
            
            entity = Entity(
                id=uuid.uuid4(),
                entity_type="ORG",
                name=ngo_name,
                description="Non-governmental organization",
                confidence_score=random.uniform(0.70, 0.95),
                mention_count=random.randint(10, 200),
                sentiment="POSITIVE",
                created_at=datetime.utcnow(),
            )
            entities_to_create.append(entity)
        
        # 3. Corporations - 2341
        print("  [Business] Corporations (2341)")
        for i in range(2341):
            corp_name = random.choice(CORPS)
            if i > 0:
                corp_name = f"{corp_name} - Subsidiary {i % 100}"
            
            entity = Entity(
                id=uuid.uuid4(),
                entity_type="ORG",
                name=corp_name,
                description="Private corporation or business entity",
                confidence_score=random.uniform(0.65, 0.92),
                mention_count=random.randint(5, 150),
                sentiment=random.choice(["POSITIVE", "NEUTRAL", "NEGATIVE"]),
                created_at=datetime.utcnow(),
            )
            entities_to_create.append(entity)
        
        # 4. Events - 5621
        print("  [Events] Events (5621)")
        for i in range(5621):
            event_name = random.choice(EVENTS)
            if i > 0:
                event_name = f"{event_name} {i % 50}"
            
            entity = Entity(
                id=uuid.uuid4(),
                entity_type="EVENT",
                name=event_name,
                description="Significant geopolitical or economic event",
                confidence_score=random.uniform(0.60, 0.90),
                mention_count=random.randint(20, 300),
                sentiment=random.choice(["NEGATIVE", "NEUTRAL", "POSITIVE"]),
                created_at=datetime.utcnow(),
            )
            entities_to_create.append(entity)
        
        # 5. Policies - 1204
        print("  [Policies] Concepts (1204)")
        for i in range(1204):
            policy_name = random.choice(POLICIES)
            if i > 0:
                policy_name = f"{policy_name} - Version {i % 20}"
            
            entity = Entity(
                id=uuid.uuid4(),
                entity_type="CONCEPT",
                name=policy_name,
                description="Policy framework or governance concept",
                confidence_score=random.uniform(0.65, 0.95),
                mention_count=random.randint(15, 250),
                sentiment="NEUTRAL",
                created_at=datetime.utcnow(),
            )
            entities_to_create.append(entity)
        
        # 6. Persons - 3892
        print("  [Persons] Individuals (3892)")
        for i in range(3892):
            first_name = random.choice(PERSON_FIRST)
            last_name = random.choice(PERSON_LAST)
            person_name = f"{first_name} {last_name}"
            
            entity = Entity(
                id=uuid.uuid4(),
                entity_type="PERSON",
                name=person_name,
                description="Individual person of interest or public figure",
                confidence_score=random.uniform(0.55, 0.88),
                mention_count=random.randint(5, 100),
                sentiment=random.choice(["POSITIVE", "NEUTRAL", "NEGATIVE"]),
                created_at=datetime.utcnow(),
            )
            entities_to_create.append(entity)
        
        # Batch insert all entities
        print(f"\n  [DB] Inserting {len(entities_to_create)} entities into database...")
        session.add_all(entities_to_create)
        await session.commit()
        
        # Verify counts
        counts = {}
        for entity_type in ["LOC", "ORG", "EVENT", "CONCEPT", "PERSON"]:
            count = (await session.execute(
                select(func.count(Entity.id)).where(Entity.entity_type == entity_type)
            )).scalar() or 0
            counts[entity_type] = count
        
        print("\n" + "="*70)
        print("[OK] ONTOLOGY ENTITY DISTRIBUTION SEEDED")
        print("="*70)
        print(f"[+] State Actors (LOC):     {counts['LOC']:,}")
        print(f"[+] NGOs (ORG subset):       {sum([1 for e in entities_to_create if e.entity_type == 'ORG' and 'NGO' in e.description])} created")
        print(f"[+] Corporations (ORG):      {counts['ORG']:,}")
        print(f"[+] Events:                 {counts['EVENT']:,}")
        print(f"[+] Policies (CONCEPT):     {counts['CONCEPT']:,}")
        print(f"[+] Persons:                {counts['PERSON']:,}")
        print(f"[+] Total Entities:         {sum(counts.values()):,}")
        print(f"\nAccess ontology distribution at:")
        print(f"  [Web] http://localhost:3002/ (Dashboard - Ontology Entity Distribution)")
        print(f"  [API] http://localhost:8000/api/metrics/global-entities")
        print("="*70 + "\n")


if __name__ == "__main__":
    asyncio.run(seed_ontology_entities())
