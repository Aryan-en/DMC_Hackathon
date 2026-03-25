#!/usr/bin/env python3
"""
Comprehensive Master Seed Script - Seeds ALL data across the application
Populates Knowledge Graph, Geospatial Intelligence, Metrics, and all modules
"""
import asyncio
import asyncpg
import json
from uuid import uuid4
from datetime import datetime
import sys
from pathlib import Path

# Add parent directory to path to allow importing from backend
sys.path.insert(0, str(Path(__file__).resolve().parent.parent.parent / 'backend'))

from core.config import settings


def infer_continent(region: str) -> str:
    """Infer continent from region labels used in seed rows."""
    mapping = {
        "South Asia": "Asia",
        "East Asia": "Asia",
        "Central Asia": "Asia",
        "West Asia": "Asia",
        "Southeast Asia": "Asia",
        "North America": "North America",
        "Europe": "Europe",
        "Europe/Asia": "Europe",
        "North Africa": "Africa",
        "Africa": "Africa",
        "South America": "South America",
        "Oceania": "Oceania",
    }
    return mapping.get(region, "Global")

async def seed_all():
    """Master seed function - populates entire database"""
    
    conn_str_dict = {
        'host': settings.POSTGRES_HOST,
        'port': settings.POSTGRES_PORT,
        'user': settings.POSTGRES_USER,
        'password': settings.POSTGRES_PASSWORD,
        'database': settings.POSTGRES_DB,
    }
    
    print(f"\n[SEEDING] Master Data Seeding Process")
    print(f"[INFO] Connecting to {conn_str_dict['host']}:{conn_str_dict['port']}/{conn_str_dict['database']}")
    
    try:
        conn = await asyncpg.connect(**conn_str_dict)
        print("[OK] Connected to PostgreSQL\n")
        
        # ===== COUNTRIES & GEOSPATIAL =====
        print("[STEP 1/6] Seeding Countries and Geospatial Data")
        countries_data = [
            # Asia (Primary Focus)
            ("IND", "India", "South Asia"),
            ("CHN", "China", "East Asia"),
            ("PAK", "Pakistan", "South Asia"),
            ("AFG", "Afghanistan", "Central Asia"),
            ("IRN", "Iran", "West Asia"),
            ("JPN", "Japan", "East Asia"),
            ("KOR", "South Korea", "East Asia"),
            ("VTN", "Vietnam", "Southeast Asia"),
            ("THA", "Thailand", "Southeast Asia"),
            ("RUS", "Russia", "Europe/Asia"),
            ("USA", "United States", "North America"),
            ("GBR", "United Kingdom", "Europe"),
            ("FRA", "France", "Europe"),
            ("DEU", "Germany", "Europe"),
            ("EU", "European Union", "Europe"),
            ("UKR", "Ukraine", "Europe"),
            ("ISR", "Israel", "West Asia"),
            ("SAU", "Saudi Arabia", "West Asia"),
            ("IRQ", "Iraq", "West Asia"),
            ("SYR", "Syria", "West Asia"),
            ("EGY", "Egypt", "North Africa"),
            ("ZAF", "South Africa", "Africa"),
            ("NGA", "Nigeria", "Africa"),
            ("BRA", "Brazil", "South America"),
            ("ARG", "Argentina", "South America"),
            ("AUS", "Australia", "Oceania"),
            ("NZL", "New Zealand", "Oceania"),
            ("POL", "Poland", "Europe"),
        ]
        
        countries_map = {}
        for code, name, region in countries_data:
            country_id = str(uuid4())
            try:
                await conn.execute("""
                    INSERT INTO countries (id, iso_code, name, region, continent, created_at, updated_at)
                    VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
                    ON CONFLICT (iso_code) DO NOTHING
                """, country_id, code, name, region, infer_continent(region))
            except Exception as e:
                print(f"  [WARN] {name}: {str(e)[:50]}")

        # Resolve canonical IDs from DB to avoid FK failures on ON CONFLICT inserts.
        rows = await conn.fetch("SELECT id, iso_code FROM countries")
        for row in rows:
            countries_map[row["iso_code"]] = str(row["id"])
        
        print(f"[OK] Seeded countries catalog ({len(countries_map)} available)")
        
        # ===== COUNTRY RELATIONSHIPS =====
        print("[STEP 2/6] Seeding Geopolitical Relationships")
        relationships = [
            # Conflicts & Tensions
            ("IND", "PAK", "border_conflict", "active_dispute", 0.85),
            ("IND", "CHN", "border_conflict", "tense", 0.78),
            ("PAK", "AFG", "military_spill", "conflict", 0.88),
            ("AFG", "IRN", "border", "tense", 0.65),
            ("IRN", "IRQ", "religious_rivalry", "tense", 0.72),
            ("RUS", "UKR", "military", "conflict", 0.95),
            ("ISR", "IRN", "regional_rivalry", "conflict", 0.92),
            ("USA", "CHN", "trade_tech", "tense", 0.80),
            ("USA", "RUS", "sanctions", "tense", 0.75),
            
            # Strategic Alliances
            ("USA", "JPN", "alliance", "stable", 0.35),
            ("USA", "KOR", "alliance", "stable", 0.40),
            ("USA", "GBR", "alliance", "stable", 0.25),
            ("USA", "EU", "alliance", "stable", 0.45),
            ("USA", "ISR", "alliance", "stable", 0.50),
            ("IND", "JPN", "partnership", "stable", 0.45),
            ("CHN", "RUS", "strategic_partnership", "stable", 0.55),
            ("EU", "USA", "trade", "stable", 0.50),
        ]
        
        rel_inserted = 0
        for code_a, code_b, rel_type, status, strength in relationships:
            if code_a in countries_map and code_b in countries_map:
                relation_id = str(uuid4())
                try:
                    await conn.execute("""
                        INSERT INTO country_relations 
                        (id, country_a_id, country_b_id, relation_type, status, trade_volume, sentiment, confidence_score, agreements, key_issues, last_updated, source)
                        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9::jsonb, $10::jsonb, NOW(), 'MASTER_SEED')
                        ON CONFLICT DO NOTHING
                    """, relation_id, countries_map[code_a], countries_map[code_b], rel_type, status, strength * 1000,
                         "negative" if status in {"conflict", "active_dispute", "tense"} else "positive",
                         strength,
                         json.dumps([]),
                         json.dumps([]))
                    rel_inserted += 1
                except Exception as e:
                    print(f"  [WARN] {code_a}-{code_b}: {str(e)[:40]}")
        
        print(f"[OK] Seeded {rel_inserted} country relationships")
        
        # ===== KNOWLEDGE GRAPH - ENTITIES =====
        print("[STEP 3/6] Seeding Knowledge Graph Entities")
        kg_entities = {
            # Organizations
            "NATO": ("ORG", "NATO - Military alliance", 0.98),
            "UN": ("ORG", "United Nations", 0.98),
            "OPEC": ("ORG", "Oil cartel", 0.95),
            "WTO": ("ORG", "World Trade Organization", 0.95),
            "SCO": ("ORG", "Shanghai Cooperation Organization", 0.92),

            # Countries/Geopolitical Actors
            "USA": ("GPE", "United States", 0.97),
            "Russia": ("GPE", "Russian Federation", 0.97),
            "Ukraine": ("GPE", "Ukraine", 0.96),
            "China": ("GPE", "People's Republic of China", 0.97),
            "India": ("GPE", "Republic of India", 0.97),
            "Pakistan": ("GPE", "Islamic Republic of Pakistan", 0.96),
            "Iran": ("GPE", "Islamic Republic of Iran", 0.96),
            
            # People
            "Modi": ("PERSON", "Indian PM", 0.99),
            "Xi": ("PERSON", "Chinese President", 0.99),
            "Biden": ("PERSON", "US President", 0.99),
            "Putin": ("PERSON", "Russian President", 0.99),
            
            # Events
            "Ukraine Conflict": ("EVENT", "Russia-Ukraine war", 0.95),
            "India-China Tension": ("EVENT", "Border disputes", 0.93),
            "Taiwan Crisis": ("EVENT", "Cross-strait tensions", 0.92),
            
            # Concepts
            "Energy Security": ("CONCEPT", "Energy independence", 0.90),
            "Nuclear Proliferation": ("CONCEPT", "WMD spread", 0.92),
            "Cyber Warfare": ("CONCEPT", "Digital conflict", 0.91),
            "Trade War": ("CONCEPT", "Commercial conflict", 0.88),
        }
        
        kg_entity_map = {}
        for name, (etype, desc, conf) in kg_entities.items():
            entity_id = str(uuid4())
            try:
                await conn.execute("""
                    INSERT INTO entities (id, name, entity_type, description, confidence_score, mention_count, created_at, updated_at)
                    VALUES ($1, $2, $3, $4, $5, 1, NOW(), NOW())
                    ON CONFLICT DO NOTHING
                """, entity_id, name, etype, desc, conf)
            except:
                pass

        entity_rows = await conn.fetch("SELECT id, name FROM entities")
        for row in entity_rows:
            kg_entity_map[row["name"]] = str(row["id"])
        
        print(f"[OK] Seeded {len(kg_entities)} knowledge graph entities")
        
        # ===== KNOWLEDGE GRAPH - RELATIONSHIPS =====
        print("[STEP 4/6] Seeding Knowledge Graph Relationships")
        kg_relationships = [
            ("USA", "supports", "NATO", 0.95),
            ("NATO", "opposes", "Russia", 0.92),
            ("Russia", "conflicts_with", "Ukraine", 0.96),
            ("China", "competes_with", "USA", 0.88),
            ("India", "disputes_with", "Pakistan", 0.90),
            ("India", "borders", "China", 0.93),
            ("Iran", "develops", "Nuclear Proliferation", 0.87),
            ("Russia", "engages_in", "Cyber Warfare", 0.85),
            ("USA", "leads", "WTO", 0.91),
            ("Modi", "heads", "India", 0.99),
        ]
        
        rel_kg_inserted = 0
        for subj, pred, obj, conf in kg_relationships:
            if subj in kg_entity_map and obj in kg_entity_map:
                rel_id = str(uuid4())
                try:
                    await conn.execute("""
                        INSERT INTO relationships (id, subject_entity_id, predicate, object_entity_id, confidence_score, created_at)
                        VALUES ($1, $2, $3, $4, $5, NOW())
                        ON CONFLICT DO NOTHING
                    """, rel_id, kg_entity_map[subj], pred, kg_entity_map[obj], conf)
                    rel_kg_inserted += 1
                except:
                    pass
        
        print(f"[OK] Seeded {rel_kg_inserted} knowledge graph relationships")
        
        # ===== INTELLIGENCE ALERTS =====
        print("[STEP 5/6] Seeding Intelligence Alerts")
        
        # Create some base alerts
        alert_types = [
            ("CONFLICT_ESCALATION", "Border tensions increasing", "HIGH", 0.85),
            ("MILITARY_BUILDUP", "Troop movements detected", "MEDIUM", 0.72),
            ("TRADE_DISRUPTION", "Supply chain threat", "MEDIUM", 0.65),
            ("CYBER_ACTIVITY", "Suspicious network patterns", "HIGH", 0.88),
            ("POLITICAL_INSTABILITY", "Domestic tensions", "MEDIUM", 0.70),
        ]
        
        alerts_table_exists = await conn.fetchval("""
            SELECT EXISTS (
                SELECT 1 FROM information_schema.columns
                WHERE table_schema = 'public' AND table_name = 'intelligence_alerts'
            )
        """)

        alerts_inserted = 0
        if alerts_table_exists:
            for alert_type, description, severity, confidence in alert_types:
                alert_id = str(uuid4())
                try:
                    await conn.execute("""
                        INSERT INTO intelligence_alerts (id, alert_type, description, severity, confidence_score, created_at, status)
                        VALUES ($1, $2, $3, $4, $5, NOW(), 'ACTIVE')
                        ON CONFLICT DO NOTHING
                    """, alert_id, alert_type, description, severity, confidence)
                    alerts_inserted += 1
                except Exception:
                    pass
        
        if alerts_inserted > 0:
            print(f"[OK] Seeded {alerts_inserted} intelligence alerts")
        else:
            print("[SKIP] Intelligence alerts table not found")
        
        # ===== INFRASTRUCTURE METRICS =====
        print("[STEP 6/6] Seeding Infrastructure and Metrics")
        
        # Seed infrastructure components
        components = [
            ("DATABASE", "PostgreSQL Primary", "HEALTHY", 0.99),
            ("CACHE", "Redis Cache", "HEALTHY", 0.99),
            ("SEARCH", "Elasticsearch", "HEALTHY", 0.95),
            ("GRAPH_DB", "Neo4j Knowledge Graph", "HEALTHY", 0.98),
            ("API_GATEWAY", "FastAPI Gateway", "HEALTHY", 0.99),
            ("FRONTEND", "Next.js Frontend", "HEALTHY", 0.98),
        ]
        
        metrics_table_exists = await conn.fetchval("""
            SELECT EXISTS (
                SELECT 1 FROM information_schema.columns
                WHERE table_schema = 'public' AND table_name = 'infrastructure_metrics'
            )
        """)

        metrics_inserted = 0
        if metrics_table_exists:
            for comp_name, comp_desc, status, health in components:
                metric_id = str(uuid4())
                timestamp = datetime.now()
                try:
                    await conn.execute("""
                        INSERT INTO infrastructure_metrics (id, component, description, status, health_score, timestamp)
                        VALUES ($1, $2, $3, $4, $5, $6)
                        ON CONFLICT DO NOTHING
                    """, metric_id, comp_name, comp_desc, status, health, timestamp)
                    metrics_inserted += 1
                except Exception:
                    pass
        
        if metrics_inserted > 0:
            print(f"[OK] Seeded {metrics_inserted} infrastructure metrics")
        else:
            print("[SKIP] Infrastructure metrics table not found")
        
        # ===== SUMMARY =====
        print("\n[SUMMARY] Seed Data Complete!")
        count_countries = await conn.fetchval("SELECT COUNT(*) FROM countries")
        count_relations = await conn.fetchval("SELECT COUNT(*) FROM country_relations")
        count_entities = await conn.fetchval("SELECT COUNT(*) FROM entities")
        count_relationships = await conn.fetchval("SELECT COUNT(*) FROM relationships")
        
        print(f"  Countries: {count_countries}")
        print(f"  Country Relations: {count_relations}")
        print(f"  KG Entities: {count_entities}")
        print(f"  KG Relationships: {count_relationships}")
        print("\n[SUCCESS] All data seeding complete!")
        
        await conn.close()
        
    except Exception as e:
        print(f"\n[ERROR] {e}")
        import traceback
        traceback.print_exc()
        return False
    
    return True

if __name__ == "__main__":
    success = asyncio.run(seed_all())
    sys.exit(0 if success else 1)
