#!/usr/bin/env python3
"""
Seed IndiAPI comprehensive data into the database.
Ingests World Bank indicators, census data, and regional profiles.
"""

import asyncio
import json
import sys
import uuid
from pathlib import Path
from datetime import datetime

# Add backend to sys path
sys.path.insert(0, str(Path(__file__).parent / "backend"))

from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from sqlalchemy import select

from config import settings
from db.schemas import EconomicIndicator, Entity, Country


async def seed_indiapi_data():
    """Load and seed IndiAPI comprehensive data into database."""
    
    # Load the comprehensive IndiAPI JSON
    indiapi_file = Path(__file__).parent / "data" / "IndiAPIs" / "indiapi_comprehensive.json"
    
    if not indiapi_file.exists():
        print(f"❌ IndiAPI data file not found: {indiapi_file}")
        return
    
    with open(indiapi_file, "r") as f:
        indiapi_data = json.load(f)
    
    print("=" * 70)
    print("IndiAPI Data Ingestion into Database")
    print("=" * 70)
    print()
    
    # Create async engine with the configured database URL
    db_url = settings.POSTGRES_URL or f"postgresql+asyncpg://{settings.POSTGRES_USER}:{settings.POSTGRES_PASSWORD}@{settings.POSTGRES_HOST}:{settings.POSTGRES_PORT}/{settings.POSTGRES_DB}"
    print(f"Connecting to database: {db_url.split('@')[1] if '@' in db_url else 'configured database'}")
    
    engine = create_async_engine(db_url, echo=False)
    async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    
    async with async_session() as session:
        try:
            # First, get or create India country record
            print("Creating/fetching India country record...")
            
            # Check if India exists
            result = await session.execute(select(Country).where(Country.name == "India"))
            india = result.scalars().first()
            
            if not india:
                india = Country(
                    id=uuid.uuid4(),
                    name="India",
                    iso_code="IN",
                    region="South Asia",
                    population=1210193422,
                    gdp_current_usd="3.9T"
                )
                session.add(india)
                await session.flush()  # Ensure India gets an ID
            
            india_country_id = india.id
            print(f"  ✓ India country ID: {india_country_id}")
            
            # Seed World Bank indicators
            print("Seeding World Bank indicators...")
            wb_data = indiapi_data.get("world_bank", {})
            indicators = wb_data.get("indicators", [])
            
            indicator_count = 0
            for indicator in indicators:
                try:
                    # Extract the most recent value
                    indicator_data = indicator.get("data", [])
                    if not indicator_data:
                        continue
                    
                    # Find the most recent year with data
                    latest_entry = None
                    for entry in indicator_data:
                        if entry.get("value") is not None:
                            latest_entry = entry
                            break
                    
                    if not latest_entry:
                        continue
                    
                    db_indicator = EconomicIndicator(
                        id=uuid.uuid4(),
                        country_id=india_country_id,
                        indicator_code=indicator.get("indicator_code", ""),
                        indicator_name=indicator.get("indicator_name", ""),
                        value=float(latest_entry.get("value", 0)),
                        year=int(latest_entry.get("date", datetime.now().year)),
                        unit=latest_entry.get("unit", ""),
                    )
                    session.add(db_indicator)
                    indicator_count += 1
                    
                except (KeyError, ValueError, TypeError) as e:
                    print(f"    Warning: Skipping indicator - {e}")
                    continue
            
            print(f"  ✓ Seeded {indicator_count} economic indicators")
            
            # Seed regional entities (states) - these are just Entity records
            print("Seeding Indian state entities...")
            demographics = indiapi_data.get("demographics", {})
            regional_profiles = demographics.get("regional_profiles", [])
            
            state_count = 0
            for profile in regional_profiles:
                state_name = profile.get("state", "")
                if state_name:
                    state_entity = Entity(
                        id=uuid.uuid4(),
                        name=state_name,
                        entity_type="State",
                        description=f"Indian state: {state_name}",
                        metadata={
                            "population": profile.get("population", 0),
                            "area_sq_km": profile.get("area_sq_km", 0),
                            "literacy_rate": round(profile.get("literacy_rate", 0), 2),
                            "sex_ratio": profile.get("sex_ratio", 0),
                            "urban_percentage": round(profile.get("urban_percentage", 0), 2),
                            "country": "India"
                        }
                    )
                    session.add(state_entity)
                    state_count += 1
            
            print(f"  ✓ Seeded {state_count} state entities")
            
            # Commit all changes
            await session.commit()
            
            print()
            print("=" * 70)
            print("IndiAPI INGESTION SUMMARY")
            print("=" * 70)
            print(f"✓ Economic Indicators: {indicator_count}")
            print(f"✓ State Entities: {state_count}")
            print(f"✓ Total records ingested: {indicator_count + state_count}")
            print("=" * 70)
            
        except Exception as e:
            await session.rollback()
            print(f"❌ Error seeding IndiAPI data: {e}")
            raise
        finally:
            await engine.dispose()


async def main():
    """Main execution."""
    try:
        await seed_indiapi_data()
    except Exception as e:
        print(f"Failed to seed IndiAPI data: {e}")
        import traceback
        traceback.print_exc()
        return 1
    
    return 0


if __name__ == "__main__":
    exit_code = asyncio.run(main())
    exit(exit_code)
