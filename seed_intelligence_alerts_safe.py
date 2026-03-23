#!/usr/bin/env python3
"""
Non-destructive intelligence alerts seed script.
Adds/updates entities and documents used by /api/intelligence/live-alerts
without clearing existing data.
"""

import asyncio
import uuid
from datetime import datetime, timedelta, timezone

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.orm import sessionmaker

from backend.config import settings
from backend.db.schemas import Base, Document, Entity


def utc_now_naive() -> datetime:
    return datetime.now(timezone.utc).replace(tzinfo=None)


ENTITIES = [
    # CRITICAL / HIGH signal entities for alerts endpoint
    ("CONCEPT", "Election Interference", "Coordinated influence operations across media channels", 0.94, 8734, "NEGATIVE"),
    ("LOC", "Strait of Hormuz", "Strategic maritime choke point", 0.92, 6521, "NEGATIVE"),
    ("CONCEPT", "Commodity Price Volatility", "Volatility spikes across energy and food markets", 0.89, 5847, "NEGATIVE"),
    ("CONCEPT", "Critical Drought Index", "Multi-province drought stress with food security impact", 0.93, 6234, "NEGATIVE"),
    ("LOC", "Jakarta", "Urban unrest and social-stability monitoring zone", 0.86, 3654, "NEGATIVE"),
    ("ORG", "NATO", "North Atlantic defense alliance", 0.95, 4120, "NEUTRAL"),
    ("PERSON", "Vladimir Putin", "President of Russian Federation", 0.96, 3980, "NEGATIVE"),
    ("PERSON", "Xi Jinping", "President of PRC", 0.95, 3560, "NEUTRAL"),
]

DOCUMENTS = [
    ("Unusual military deployment detected near Strait of Hormuz", "Satellite and OSINT feeds indicate elevated maritime military deployment in the Hormuz corridor.", "SAT-FEED", "en", 6),
    ("Commodity price volatility exceeds 3 sigma threshold - natural gas", "Market analytics detect anomaly in natural gas pricing; spillover risk flagged for industrial sectors.", "MARKET", "en", 8),
    ("Social unrest probability model: 67% confidence - Jakarta", "NLP and social graph signals indicate rising civil-unrest probability in urban clusters.", "NLP-AI", "en", 12),
    ("Election interference narrative detected across 14 platforms", "Cross-platform narrative propagation detected with coordinated amplification behavior.", "OSINT", "en", 15),
    ("Drought index critical: 3 provinces at risk - food security impact", "Climate intelligence models indicate crop and water-stress escalation in monitored provinces.", "CLIMATE", "en", 18),
]


async def upsert_entity(session: AsyncSession, row: tuple) -> tuple[bool, bool]:
    entity_type, name, description, confidence, mention_count, sentiment = row
    existing = (await session.execute(select(Entity).where(Entity.name == name))).scalar_one_or_none()

    if existing:
        existing.entity_type = entity_type
        existing.description = description
        existing.confidence_score = max(float(existing.confidence_score or 0.0), float(confidence))
        existing.mention_count = max(int(existing.mention_count or 0), int(mention_count))
        existing.sentiment = sentiment
        existing.updated_at = utc_now_naive()
        return (False, True)

    session.add(
        Entity(
            id=uuid.uuid4(),
            entity_type=entity_type,
            name=name,
            description=description,
            confidence_score=float(confidence),
            mention_count=int(mention_count),
            sentiment=sentiment,
            created_at=utc_now_naive(),
            updated_at=utc_now_naive(),
        )
    )
    return (True, False)


async def insert_document_if_missing(session: AsyncSession, row: tuple) -> bool:
    title, content, source, language, minutes_ago = row
    existing = (await session.execute(select(Document).where(Document.title == title))).scalar_one_or_none()
    if existing:
        return False

    created_at = utc_now_naive() - timedelta(minutes=int(minutes_ago))
    session.add(
        Document(
            id=uuid.uuid4(),
            title=title,
            content=content,
            source=source,
            language=language,
            created_at=created_at,
            published_date=created_at,
            processed=True,
            doc_metadata={"seed": "intelligence_alerts_safe"},
        )
    )
    return True


async def main() -> None:
    engine = create_async_engine(settings.POSTGRES_URL, echo=False)
    session_factory = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async with session_factory() as session:
        inserted_entities = 0
        updated_entities = 0
        inserted_docs = 0

        for row in ENTITIES:
            inserted, updated = await upsert_entity(session, row)
            inserted_entities += 1 if inserted else 0
            updated_entities += 1 if updated else 0

        for row in DOCUMENTS:
            created = await insert_document_if_missing(session, row)
            inserted_docs += 1 if created else 0

        await session.commit()

        print("Intelligence alerts seeding complete")
        print(f"Entities inserted: {inserted_entities}")
        print(f"Entities updated: {updated_entities}")
        print(f"Documents inserted: {inserted_docs}")

    await engine.dispose()


if __name__ == '__main__':
    asyncio.run(main())
