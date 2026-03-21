"""
Simple database seed to populate test data
This script uses raw SQL to quickly insert test data without complex ORM setup
"""
import asyncio
import asyncpg
from datetime import datetime
from uuid import uuid4
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent / 'backend'))

from config import settings

async def seed():
    """Seed database using direct asyncpg connection"""
    
    # Parse connection string
    conn_str = settings.POSTGRES_URL
    if conn_str.startswith("postgresql+asyncpg://"):
        conn_str = conn_str.replace("postgresql+asyncpg://", "postgresql://")
    
    conn_str_dict = {
        'host': settings.POSTGRES_HOST,
        'port': settings.POSTGRES_PORT,
        'user': settings.POSTGRES_USER,
        'password': settings.POSTGRES_PASSWORD,
        'database': settings.POSTGRES_DB,
    }
    
    print(f"Connecting to {conn_str_dict['host']}:{conn_str_dict['port']}/{conn_str_dict['database']}...")
    
    try:
        conn = await asyncpg.connect(**conn_str_dict)
        print("✓ Connected to PostgreSQL")
        
        # Insert countries
        countries_data = [
            ("IND", "India", "Asia", "CONTINENTS"),
            ("USA", "United States", "North America", "CONTINENTS"),
            ("CHN", "China", "Asia", "CONTINENTS"),
            ("RUS", "Russia", "Europe", "CONTINENTS"),
            ("EU", "European Union", "Europe", "REGIONS"),
            ("PAK", "Pakistan", "Asia", "CONTINENTS"),
            ("AFG", "Afghanistan", "Asia", "CONTINENTS"),
            ("IRN", "Iran", "Asia", "CONTINENTS"),
        ]
        
        print("\nInserting countries...")
        for code, name, region, _ in countries_data:
            country_id = str(uuid4())
            try:
                await conn.execute("""
                    INSERT INTO countries (id, iso_code, name, region, created_at, updated_at)
                    VALUES ($1, $2, $3, $4, NOW(), NOW())
                    ON CONFLICT DO NOTHING
                """, country_id, code, name, region)
                print(f"  ✓ {name} ({code})")
            except Exception as e:
                print(f"  ✗ {name}: {e}")
        
        # Get country IDs
        print("\nFetching country IDs...")
        countries_map = {}
        rows = await conn.fetch("SELECT iso_code, id FROM countries")
        for iso_code, country_id in rows:
            countries_map[iso_code] = country_id
            print(f"  {iso_code} -> {country_id}")
        
        if not countries_map:
            print("ERROR: No countries found in database")
            await conn.close()
            return
        
        # Insert country relations
        print("\nInserting country relations...")
        relations = [
            ("IND", "USA", "trade", "stable", 0.65),
            ("IND", "CHN", "border_conflict", "active_dispute", 0.78),
            ("IND", "PAK", "border_conflict", "active_dispute", 0.82),
            ("PAK", "AFG", "military", "conflict", 0.88),
            ("AFG", "IRN", "border", "tense", 0.65),
            ("USA", "CHN", "trade", "tense", 0.72),
            ("USA", "EU", "alliance", "stable", 0.45),
        ]
        
        for code_a, code_b, rel_type, status, strength in relations:
            if code_a in countries_map and code_b in countries_map:
                relation_id = str(uuid4())
                try:
                    await conn.execute("""
                        INSERT INTO country_relations 
                        (id, country_a_id, country_b_id, relation_type, status, last_updated, source)
                        VALUES ($1, $2, $3, $4, $5, NOW(), 'SEED')
                        ON CONFLICT DO NOTHING
                    """, relation_id, countries_map[code_a], countries_map[code_b], rel_type, status)
                    print(f"  ✓ {code_a} ← {rel_type} → {code_b}")
                except Exception as e:
                    print(f"  ✗ {code_a} ← {rel_type} → {code_b}: {e}")
        
        # Verify data was inserted
        print("\nVerifying data...")
        count = await conn.fetchval("SELECT COUNT(*) FROM countries")
        print(f"  Countries in database: {count}")
        count = await conn.fetchval("SELECT COUNT(*) FROM country_relations")
        print(f"  Relations in database: {count}")
        
        print("\n✅ Seeding complete!")
        
        await conn.close()
        
    except Exception as e:
        print(f"❌ ERROR: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(seed())
