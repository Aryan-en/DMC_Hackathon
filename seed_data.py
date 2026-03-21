"""Quick data seed script for development/testing"""
import asyncio
import sys
import os
from datetime import datetime, timedelta
from pathlib import Path

# Add backend to path
sys.path.insert(0, str(Path(__file__).parent / 'backend'))

from sqlalchemy import text
from db.postgres import init_db, AsyncSessionLocal, engine
from config import settings

async def seed_data():
    """Seed the database with sample data for testing"""
    
    print("Initializing database...")
    try:
        await init_db()
        print("Database initialized successfully")
        from db.postgres import AsyncSessionLocal as session_local  # Re-import after init
    except Exception as e:
        print(f"ERROR initializing database: {e}")
        return
    
    if session_local is None:
        print("ERROR: Session maker not available")
        return
    
    AsyncSessionLocal_ref = session_local
    
    async with AsyncSessionLocal_ref() as db:
        try:
            # Check if data already exists
            result = await db.execute(text("SELECT COUNT(*) FROM country LIMIT 1"))
            count = result.scalar()
            if count and count > 0:
                print(f"Database already has {count} countries. Skipping seed.")
                return
            
            print("Seeding country data...")
            countries = [
                ("IND", "India", "Asia"),
                ("USA", "United States", "North America"),
                ("CHN", "China", "Asia"),
                ("Russia", "Russia", "Europe"),
                ("EU", "European Union", "Europe"),
                ("PAK", "Pakistan", "Asia"),
                ("AFG", "Afghanistan", "Asia"),
                ("IRN", "Iran", "Asia"),
            ]
            
            for code, name, region in countries:
                await db.execute(text(
                    "INSERT INTO country (code, name, region) VALUES (:code, :name, :region) ON CONFLICT DO NOTHING"
                ), {"code": code, "name": name, "region": region})
            
            await db.commit()
            print(f"✓ Seeded {len(countries)} countries")
            
            # Get country IDs for relationships
            result = await db.execute(text("SELECT id, code FROM country LIMIT 10"))
            countries_map = {code: id for id, code in result.all()}
            
            print("Seeding relationships...")
            # Sample relationships
            relationships = [
                (countries_map.get(1), countries_map.get(5), "trade", "active", 75),  # IND-USA
                (countries_map.get(1), countries_map.get(4), "diplomatic", "tense", 65),  # IND-China
                (countries_map.get(1), countries_map.get(6), "border_tension", "active_dispute", 80),  # IND-Pakistan
                (countries_map.get(6), countries_map.get(7), "military", "conflict", 92),  # Pakistan-Afghanistan
                (countries_map.get(7), countries_map.get(8), "insurgency", "conflict", 88),  # Afghanistan-Iran
                (countries_map.get(4), countries_map.get(5), "trade", "stable", 45),  # China-USA
                (countries_map.get(2), countries_map.get(5), "alliance", "stable", 30),  # USA-EU
                (countries_map.get(3), countries_map.get(5), "trade", "tense", 58),  # China-EU
            ]
            
            for country_a, country_b, relation_type, status, strength in relationships:
                if country_a and country_b and country_a != country_b:
                    await db.execute(text("""
                        INSERT INTO country_relation (country_a_id, country_b_id, relation_type, status, strength)
                        VALUES (:a, :b, :type, :status, :strength)
                        ON CONFLICT DO NOTHING
                    """), {
                        "a": country_a, "b": country_b, "type": relation_type, 
                        "status": status, "strength": strength
                    })
            
            await db.commit()
            print(f"✓ Seeded {len(relationships)} relationships")
            
            # Seed entities
            print("Seeding entities...")
            entities = [
                ("Ministry of External Affairs", "India", "government", [], ["India", "Foreign Affairs"]),
                ("Ministry of Defence", "India", "government", [], ["India", "Military"]),
                ("US State Department", "USA", "government", [], ["USA", "Diplomacy"]),
                ("Pentagon", "USA", "military", [], ["USA", "Military"]),
                ("EU Commission", "EU", "government", [], ["EU", "Governance"]),
                ("Taliban", "Afghanistan", "militant_group", [], ["Afghanistan", "Opposition"]),
                ("ISIS-K", "Afghanistan", "terrorist_group", [], ["Afghanistan", "Terrorism"]),
            ]
            
            for name, country, entity_type, aliases, tags in entities:
                await db.execute(text("""
                    INSERT INTO entity (name, entity_type, source_country, aliases, tags)
                    VALUES (:name, :type, :country, :aliases, :tags)
                    ON CONFLICT DO NOTHING
                """), {
                    "name": name, "type": entity_type, "country": country,
                    "aliases": aliases, "tags": tags
                })
            
            await db.commit()
            print(f"✓ Seeded {len(entities)} entities")
            
            # Seed economic indicators
            print("Seeding economic indicators...")
            now = datetime.utcnow()
            for code in ["IND", "USA", "CHN", "Russia", "EU"]:
                await db.execute(text("""
                    INSERT INTO economic_indicator 
                    (country_code, gdp, gdp_growth, inflation, unemployment, timestamp)
                    VALUES (:code, :gdp, :growth, :inflation, :unemployment, :ts)
                    ON CONFLICT DO NOTHING
                """), {
                    "code": code,
                    "gdp": 3.5e12 if code == "USA" else 1.2e12,
                    "growth": 6.5 + (hash(code) % 5),
                    "inflation": 3.5 + (hash(code) % 4),
                    "unemployment": 3.8 + (hash(code) % 3),
                    "ts": now
                })
            
            await db.commit()
            print(f"✓ Seeded economic indicators")
            
            print("\n✅ Database seeding complete!")
            
        except Exception as e:
            print(f"ERROR during seeding: {e}")
            await db.rollback()
            raise
        finally:
            await db.close()

if __name__ == "__main__":
    asyncio.run(seed_data())
