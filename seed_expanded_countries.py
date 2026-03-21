"""
Expand country data in database with 50+ countries and their relationships
"""
import asyncio
import asyncpg
from uuid import uuid4
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent / 'backend'))

from config import settings

async def seed():
    """Seed expanded country dataset"""
    
    conn_str_dict = {
        'host': settings.POSTGRES_HOST,
        'port': settings.POSTGRES_PORT,
        'user': settings.POSTGRES_USER,
        'password': settings.POSTGRES_PASSWORD,
        'database': settings.POSTGRES_DB,
    }
    
    print(f"Connecting to {conn_str_dict['host']}:5432/{conn_str_dict['database']}...")
    
    try:
        conn = await asyncpg.connect(**conn_str_dict)
        print("✓ Connected to PostgreSQL\n")
        
        # Expanded country list
        countries_data = [
            # Asia (Primary Focus)
            ("IND", "India", "Asia"),
            ("CHN", "China", "Asia"),
            ("PAK", "Pakistan", "Asia"),
            ("AFG", "Afghanistan", "Asia"),
            ("IRN", "Iran", "Asia"),
            ("JPN", "Japan", "Asia"),
            ("KOR", "South Korea", "Asia"),
            ("VTN", "Vietnam", "Asia"),
            ("THA", "Thailand", "Asia"),
            ("MMR", "Myanmar", "Asia"),
            ("BGD", "Bangladesh", "Asia"),
            ("LKA", "Sri Lanka", "Asia"),
            ("IDN", "Indonesia", "Asia"),
            ("MYS", "Malaysia", "Asia"),
            ("PHL", "Philippines", "Asia"),
            
            # Europe
            ("RUS", "Russia", "Europe"),
            ("UKR", "Ukraine", "Europe"),
            ("POL", "Poland", "Europe"),
            ("DEU", "Germany", "Europe"),
            ("FRA", "France", "Europe"),
            ("GBR", "United Kingdom", "Europe"),
            ("ITA", "Italy", "Europe"),
            ("ESP", "Spain", "Europe"),
            ("TUR", "Turkey", "Europe"),
            ("GRC", "Greece", "Europe"),
            ("SRB", "Serbia", "Europe"),
            ("BLR", "Belarus", "Europe"),
            ("EU", "European Union", "Europe"),
            
            # Middle East & North Africa
            ("SAU", "Saudi Arabia", "Middle East"),
            ("ISR", "Israel", "Middle East"),
            ("ARE", "United Arab Emirates", "Middle East"),
            ("QAT", "Qatar", "Middle East"),
            ("KWT", "Kuwait", "Middle East"),
            ("IRQ", "Iraq", "Middle East"),
            ("SYR", "Syria", "Middle East"),
            ("YEM", "Yemen", "Middle East"),
            ("EGY", "Egypt", "North Africa"),
            
            # Americas
            ("USA", "United States", "North America"),
            ("CAN", "Canada", "North America"),
            ("MEX", "Mexico", "North America"),
            ("BRA", "Brazil", "South America"),
            ("ARG", "Argentina", "South America"),
            ("COL", "Colombia", "South America"),
            ("VEN", "Venezuela", "South America"),
            ("CHL", "Chile", "South America"),
            
            # Africa
            ("NGA", "Nigeria", "Africa"),
            ("KEN", "Kenya", "Africa"),
            ("ZAF", "South Africa", "Africa"),
            ("ETH", "Ethiopia", "Africa"),
            ("MAR", "Morocco", "Africa"),
            
            # Oceania
            ("AUS", "Australia", "Oceania"),
            ("NZL", "New Zealand", "Oceania"),
        ]
        
        print("Inserting countries...")
        countries_map = {}
        for code, name, region in countries_data:
            country_id = str(uuid4())
            countries_map[code] = country_id
            try:
                await conn.execute("""
                    INSERT INTO countries (id, iso_code, name, region, created_at, updated_at)
                    VALUES ($1, $2, $3, $4, NOW(), NOW())
                    ON CONFLICT DO NOTHING
                """, country_id, code, name, region)
            except Exception as e:
                print(f"  Note: {name} - {str(e)[:40]}")
        
        print(f"✓ Inserted/verified {len(countries_data)} countries\n")
        
        # Add strategic relationships
        print("Adding geopolitical relationships...")
        relationships = [
            # Asia Regional Conflicts
            ("IND", "PAK", "border_conflict", "active_dispute", 85),
            ("IND", "CHN", "border_conflict", "tense", 78),
            ("PAK", "AFG", "military", "conflict", 88),
            ("AFG", "IRN", "border", "tense", 65),
            ("IRN", "IRQ", "border_dispute", "tense", 72),
            ("CHN", "JPN", "territorial", "tense", 75),
            ("KOR", "JPN", "historical", "tense", 62),
            
            # Middle East Tensions
            ("ISR", "IRN", "regional_rivalry", "conflict", 92),
            ("ISR", "SYR", "active_dispute", "conflict", 88),
            ("SAU", "IRN", "regional_rivalry", "active_dispute", 85),
            ("IRQ", "IRN", "border", "tense", 70),
            ("YEM", "SAU", "military", "conflict", 90),
            
            # Europe Tensions
            ("RUS", "UKR", "military", "conflict", 95),
            ("RUS", "POL", "diplomatic", "tense", 72),
            ("RUS", "GBR", "espionage", "tense", 68),
            ("RUS", "EU", "sanctions", "tense", 75),
            
            # US-China Strategic Competition
            ("USA", "CHN", "trade_conflict", "tense", 80),
            ("USA", "RUS", "sanctions", "tense", 75),
            
            # Strategic Alliances
            ("USA", "JPN", "alliance", "stable", 35),
            ("USA", "KOR", "alliance", "stable", 40),
            ("USA", "AUS", "alliance", "stable", 30),
            ("USA", "GBR", "alliance", "stable", 25),
            ("USA", "EU", "alliance", "stable", 45),
            ("USA", "ISR", "alliance", "stable", 50),
            
            # Asian Regional
            ("IND", "JPN", "partnership", "stable", 45),
            ("IND", "VTN", "partnership", "stable", 50),
            ("CHN", "RUS", "strategic_partnership", "stable", 55),
            
            # African & South American
            ("ZAF", "NGA", "regional_cooperation", "stable", 55),
            ("BRA", "ARG", "trade", "stable", 48),
        ]
        
        rel_count = 0
        for code_a, code_b, rel_type, status, strength in relationships:
            if code_a in countries_map and code_b in countries_map:
                relation_id = str(uuid4())
                try:
                    await conn.execute("""
                        INSERT INTO country_relations 
                        (id, country_a_id, country_b_id, relation_type, status, last_updated, source)
                        VALUES ($1, $2, $3, $4, $5, NOW(), 'EXPANDED_SEED')
                        ON CONFLICT DO NOTHING
                    """, relation_id, countries_map[code_a], countries_map[code_b], rel_type, status)
                    rel_count += 1
                except Exception as e:
                    pass
        
        print(f"✓ Added {rel_count} strategic relationships\n")
        
        # Verify totals
        count = await conn.fetchval("SELECT COUNT(*) FROM countries")
        rel_total = await conn.fetchval("SELECT COUNT(*) FROM country_relations")
        print("Database Summary:")
        print(f"  Total Countries: {count}")
        print(f"  Total Relations: {rel_total}")
        
        print("\n✅ Expanded country dataset seeding complete!")
        
        await conn.close()
        
    except Exception as e:
        print(f"❌ ERROR: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(seed())
