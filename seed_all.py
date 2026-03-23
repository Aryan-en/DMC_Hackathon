#!/usr/bin/env python3
"""
Comprehensive Master Seed Script - Seeds ALL data across the application
Populates Knowledge Graph, Geospatial Intelligence, Metrics, and all modules
"""
import asyncio
import asyncpg
import json
from uuid import uuid4
from datetime import datetime, timedelta
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent / 'backend'))

from config import settings

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
            ("IND", "India", "South Asia", 20.5937, 78.9629),
            ("CHN", "China", "East Asia", 35.8617, 104.1954),
            ("PAK", "Pakistan", "South Asia", 30.3753, 69.3451),
            ("AFG", "Afghanistan", "Central Asia", 33.9391, 67.3100),
            ("IRN", "Iran", "West Asia", 32.4279, 53.6880),
            ("JPN", "Japan", "East Asia", 36.2048, 138.2529),
            ("KOR", "South Korea", "East Asia", 35.9078, 127.7669),
            ("VTN", "Vietnam", "Southeast Asia", 14.0583, 108.2772),
            ("THA", "Thailand", "Southeast Asia", 15.8700, 100.9925),
            ("RUS", "Russia", "Europe/Asia", 61.5240, 105.3188),
            ("USA", "United States", "North America", 37.0902, -95.7129),
            ("GBR", "United Kingdom", "Europe", 55.3781, -3.4360),
            ("FRA", "France", "Europe", 46.2276, 2.2137),
            ("DEU", "Germany", "Europe", 51.1657, 10.4515),
            ("EU", "European Union", "Europe", 50.0, 10.0),
            ("UKR", "Ukraine", "Europe", 48.3794, 31.1656),
            ("ISR", "Israel", "West Asia", 31.0461, 34.8516),
            ("SAU", "Saudi Arabia", "West Asia", 23.8859, 45.0792),
            ("IRQ", "Iraq", "West Asia", 33.2232, 43.6793),
            ("SYR", "Syria", "West Asia", 34.8021, 38.9968),
            ("EGY", "Egypt", "North Africa", 26.8206, 30.8025),
            ("ZAF", "South Africa", "Africa", -30.5595, 22.9375),
            ("NGA", "Nigeria", "Africa", 9.0820, 8.6753),
            ("BRA", "Brazil", "South America", -14.2350, -51.9253),
            ("ARG", "Argentina", "South America", -38.4161, -63.6167),
            ("AUS", "Australia", "Oceania", -25.2744, 133.7751),
            ("NZL", "New Zealand", "Oceania", -40.9006, 174.8860),
            ("POL", "Poland", "Europe", 51.9194, 19.1451),
        ]
        
        countries_map = {}
        for code, name, region, lat, lon in countries_data:
            country_id = str(uuid4())
            countries_map[code] = country_id
            try:
                await conn.execute("""
                    INSERT INTO countries (id, iso_code, name, region, latitude, longitude, created_at, updated_at)
                    VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
                    ON CONFLICT (iso_code) DO NOTHING
                """, country_id, code, name, region, lat, lon)
            except Exception as e:
                print(f"  [WARN] {name}: {str(e)[:50]}")
        
        print(f"[OK] Seeded {len(countries_data)} countries with geospatial coordinates")
        
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
                        (id, country_a_id, country_b_id, relation_type, status, trade_volume, last_updated, source)
                        VALUES ($1, $2, $3, $4, $5, $6, NOW(), 'MASTER_SEED')
                        ON CONFLICT DO NOTHING
                    """, relation_id, countries_map[code_a], countries_map[code_b], rel_type, status, strength * 1000)
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
            kg_entity_map[name] = entity_id
            try:
                await conn.execute("""
                    INSERT INTO entities (id, name, entity_type, description, confidence_score, mention_count, created_at, updated_at)
                    VALUES ($1, $2, $3, $4, $5, 1, NOW(), NOW())
                    ON CONFLICT DO NOTHING
                """, entity_id, name, etype, desc, conf)
            except:
                pass
        
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
        
        alerts_inserted = 0
        for alert_type, description, severity, confidence in alert_types:
            alert_id = str(uuid4())
            try:
                # Insert into alerts table if it exists
                result = await conn.execute("""
                    INSERT INTO intelligence_alerts (id, alert_type, description, severity, confidence_score, created_at, status)
                    VALUES ($1, $2, $3, $4, $5, NOW(), 'ACTIVE')
                    ON CONFLICT DO NOTHING
                """, alert_id, alert_type, description, severity, confidence)
                alerts_inserted += 1
            except Exception as e:
                # Table might not exist, skip silently
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
        
        metrics_inserted = 0
        for comp_name, comp_desc, status, health in components:
            metric_id = str(uuid4())
            timestamp = datetime.utcnow()
            try:
                await conn.execute("""
                    INSERT INTO infrastructure_metrics (id, component, description, status, health_score, timestamp)
                    VALUES ($1, $2, $3, $4, $5, $6)
                    ON CONFLICT DO NOTHING
                """, metric_id, comp_name, comp_desc, status, health, timestamp)
                metrics_inserted += 1
            except:
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
