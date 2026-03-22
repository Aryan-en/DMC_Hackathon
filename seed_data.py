"""
Comprehensive data seed script for ONTORA backend.
Seeds: Countries, Economic Indicators (from World Bank JSON), Entities,
       Documents, Relationships, Audit Logs, System Metrics, Users.

Usage: python seed_data.py
"""
import asyncio
import json
import sys
from datetime import datetime, timedelta
from pathlib import Path
import uuid

# Add backend to path
sys.path.insert(0, str(Path(__file__).parent / 'backend'))

from sqlalchemy import text
from db.postgres import init_db, engine


# ──────────────────────────────────────────────
# STATIC DATA
# ──────────────────────────────────────────────

COUNTRIES = [
    ("IND", "India", "South Asia", "Asia"),
    ("USA", "United States", "North America", "North America"),
    ("CHN", "China", "East Asia", "Asia"),
    ("RUS", "Russia", "Eastern Europe", "Europe"),
    ("GBR", "United Kingdom", "Western Europe", "Europe"),
    ("FRA", "France", "Western Europe", "Europe"),
    ("DEU", "Germany", "Western Europe", "Europe"),
    ("JPN", "Japan", "East Asia", "Asia"),
    ("BRA", "Brazil", "South America", "South America"),
    ("AUS", "Australia", "Oceania", "Oceania"),
    ("CAN", "Canada", "North America", "North America"),
    ("ZAF", "South Africa", "Southern Africa", "Africa"),
    ("KOR", "South Korea", "East Asia", "Asia"),
    ("IDN", "Indonesia", "Southeast Asia", "Asia"),
    ("MEX", "Mexico", "Central America", "North America"),
    ("SAU", "Saudi Arabia", "Middle East", "Asia"),
    ("TUR", "Turkey", "Western Asia", "Asia"),
    ("IRN", "Iran", "Middle East", "Asia"),
    ("PAK", "Pakistan", "South Asia", "Asia"),
    ("AFG", "Afghanistan", "South Asia", "Asia"),
    ("ISR", "Israel", "Middle East", "Asia"),
    ("EGY", "Egypt", "North Africa", "Africa"),
    ("NGA", "Nigeria", "West Africa", "Africa"),
    ("UKR", "Ukraine", "Eastern Europe", "Europe"),
    ("POL", "Poland", "Central Europe", "Europe"),
    ("TWN", "Taiwan", "East Asia", "Asia"),
    ("THA", "Thailand", "Southeast Asia", "Asia"),
    ("VNM", "Vietnam", "Southeast Asia", "Asia"),
    ("ARE", "United Arab Emirates", "Middle East", "Asia"),
    ("SGP", "Singapore", "Southeast Asia", "Asia"),
]

ENTITIES = [
    ("ORG", "United Nations", "International multilateral organization", 0.97, 1842),
    ("ORG", "European Union", "Supranational economic and political union", 0.96, 1567),
    ("ORG", "NATO", "North Atlantic Treaty Organization", 0.95, 1089),
    ("ORG", "OPEC", "Organization of Petroleum Exporting Countries", 0.93, 823),
    ("ORG", "World Bank", "International financial institution", 0.94, 712),
    ("ORG", "IMF", "International Monetary Fund", 0.93, 689),
    ("ORG", "WHO", "World Health Organization", 0.92, 534),
    ("ORG", "BRICS", "Brazil, Russia, India, China, South Africa alliance", 0.91, 456),
    # Military Organizations
    ("ORG", "Indian Army", "Primary land-based service of the Indian Armed Forces", 0.96, 1432),
    ("ORG", "Indian Navy", "Maritime service of Indian Armed Forces, operates in Indian Ocean", 0.95, 1198),
    ("ORG", "Indian Air Force", "Aerial warfare branch of Indian Armed Forces", 0.94, 987),
    ("ORG", "People's Liberation Army", "Military arm of Communist Party of China", 0.97, 2145),
    ("ORG", "US Navy", "Maritime warfare service of United States Armed Forces", 0.98, 1876),
    ("ORG", "Russian Armed Forces", "Military organization of Russian Federation", 0.96, 1654),
    ("ORG", "Ministry of Defence India", "Government ministry overseeing Indian defence", 0.93, 856),
    ("ORG", "Shanghai Cooperation Organization", "Regional military and security alliance", 0.92, 734),
    ("ORG", "United States Indo-Pacific Command", "US military command for Indo-Pacific region", 0.94, 1023),
    ("ORG", "Indian Coast Guard", "Maritime law enforcement and security agency", 0.91, 567),
    # Military Personnel
    ("PER", "Vladimir Putin", "President of Russian Federation", 0.98, 956),
    ("PER", "Xi Jinping", "President of People's Republic of China", 0.97, 892),
    ("PER", "Narendra Modi", "Prime Minister of India", 0.97, 845),
    ("PER", "Joe Biden", "President of the United States", 0.96, 1234),
    ("PER", "Volodymyr Zelenskyy", "President of Ukraine", 0.95, 678),
    ("PER", "General Manoj Pande", "Chief of Defence Staff, Indian Armed Forces", 0.92, 543),
    ("PER", "Admiral R Hari Kumar", "Chief of Naval Staff, Indian Navy", 0.89, 412),
    # Military Equipment/Weapons
    ("ORG", "BrahMos Missile", "Supersonic cruise missile developed by India and Russia", 0.89, 634),
    ("ORG", "S-400 Air Defence System", "Russian long-range surface-to-air missile system", 0.90, 723),
    ("ORG", "INS Vikrant", "First Indian-built aircraft carrier", 0.88, 521),
    ("ORG", "Type 055 Destroyer", "Chinese guided-missile destroyer", 0.87, 456),
    # Military Locations
    ("LOC", "South China Sea", "Disputed maritime region in Southeast Asia", 0.94, 1203),
    ("LOC", "Taiwan Strait", "Waterway between Taiwan and mainland China", 0.93, 567),
    ("LOC", "Sahel Region", "Semi-arid region spanning West to East Africa", 0.91, 423),
    ("LOC", "Horn of Africa", "Peninsula in Northeast Africa", 0.90, 389),
    ("LOC", "Lakshadweep Islands", "Strategic Indian territory in Arabian Sea", 0.88, 345),
    ("LOC", "Andaman & Nicobar Islands", "Indian strategic military territory", 0.87, 298),
    ("LOC", "Strait of Malacca", "Critical global maritime chokepoint", 0.91, 876),
    # Events
    ("EVENT", "Belt and Road Initiative", "Chinese infrastructure development strategy", 0.91, 823),
    ("EVENT", "Ukraine Conflict", "Ongoing Russia-Ukraine military conflict", 0.96, 2341),
    ("EVENT", "COP28 Climate Summit", "28th Conference of the Parties", 0.89, 345),
    ("EVENT", "India-China Border Tensions", "Military standoff at Ladakh border since 2020", 0.94, 1567),
    ("EVENT", "US-China Military Escalation", "Rising military tensions between US and China", 0.93, 1342),
    ("EVENT", "Indo-Pacific Strategy", "Coalition strategy for regional stability", 0.92, 987),
]

DOCUMENTS = [
    ("Indo-Pacific Security Assessment Q1 2026", "Comprehensive analysis of shifting power dynamics in the Indo-Pacific region, with focus on maritime disputes, alliance structures, and emerging threats.", "INTELLIGENCE", "en", "https://ontora.int/briefs/indo-pacific-q1-2026"),
    ("Global Supply Chain Vulnerability Report", "Assessment of critical chokepoints in global supply chains with focus on semiconductor and rare earth mineral dependencies.", "INTELLIGENCE", "en", "https://ontora.int/briefs/supply-chain-vuln-2026"),
    ("MEA Bilateral Relations: India-Japan", "Summary of bilateral relations between India and Japan including trade, defense cooperation, and technology partnerships.", "MEA", "en", "https://mea.gov.in/bilateral/india-japan"),
    ("MEA Bilateral Relations: India-USA", "Overview of strategic partnership including defense agreements, technology transfer, and economic cooperation.", "MEA", "en", "https://mea.gov.in/bilateral/india-usa"),
    ("Climate Risk Assessment: South Asia", "Regional climate risk analysis covering monsoon variability, glacial melt, and agricultural impacts in South Asia.", "INTELLIGENCE", "en", "https://ontora.int/briefs/climate-south-asia"),
    ("Sahel Security Situation Report", "Monthly analysis of security developments in the Sahel region including armed group activities and humanitarian impact.", "INTELLIGENCE", "fr", "https://ontora.int/briefs/sahel-sitrep"),
    ("Economic Outlook: BRICS Nations 2026", "Comparative economic analysis of BRICS member nations with focus on trade dynamics and currency arrangements.", "NEWS", "en", "https://ontora.int/briefs/brics-outlook-2026"),
    ("Cyber Threat Landscape Q1 2026", "Analysis of state-sponsored cyber operations targeting critical infrastructure across NATO member states.", "INTELLIGENCE", "en", "https://ontora.int/briefs/cyber-threats-q1-2026"),
    ("Middle East Diplomatic Developments", "Summary of diplomatic engagements and treaty negotiations across the Middle East region.", "MEA", "ar", "https://ontora.int/briefs/mideast-diplo-2026"),
    ("Trade Corridor Analysis: India-Central Asia", "Assessment of India's trade connectivity with Central Asian nations via Chabahar port and INSTC corridor.", "NEWS", "en", "https://ontora.int/briefs/india-central-asia-trade"),
    # Military Intelligence Documents
    ("India-China Military Posture Assessment 2026", "Detailed analysis of military buildup along India-China border with assessment of capabilities in Ladakh, Arunachal Pradesh, and Sikkim. Includes intelligence on PLA deployments, weapons systems, and command structure.", "INTELLIGENCE", "en", "https://ontora.int/briefs/india-china-military-2026"),
    ("South China Sea Naval Capabilities Report", "Comprehensive assessment of Chinese naval operations in South China Sea including carrier strike group deployments, submarine activity, and artificial island military installations.", "INTELLIGENCE", "en", "https://ontora.int/briefs/scs-naval-2026"),
    ("India Defence Modernization Strategy Q1 2026", "Analysis of Indian military modernization including induction of Tejas fighter aircraft, BrahMos missiles, INS Vikrant carrier operations, and indigenous defense technology development.", "MEA", "en", "https://mea.gov.in/defence/modernization-2026"),
    ("US Indo-Pacific Military Strategy", "Strategic overview of US military posture in Indo-Pacific region including naval deployments, military alliances through QUAD and AUKUS, and response to PLA expansion.", "INTELLIGENCE", "en", "https://ontora.int/briefs/us-indopacific-strategy-2026"),
    ("Russian Military Activities in Arctic and Eastern Europe", "Assessment of Russian military modernization, Arctic expansion strategy, and military presence along NATO borders. Includes nuclear capabilities review and submarine activity analysis.", "INTELLIGENCE", "en", "https://ontora.int/briefs/russia-military-2026"),
    ("Taiwan Strait Military Dynamics", "Analysis of military tensions across Taiwan Strait with focus on PRC military threats, ROC defense capabilities, and international military posture. Includes cross-strait military balance assessment.", "INTELLIGENCE", "en", "https://ontora.int/briefs/taiwan-military-2026"),
    ("Global Military Spending and Armament Trends 2026", "Worldwide analysis of defense budgets, military procurements, and arms race developments. Regional focus on Asia-Pacific, Europe, and Middle East with technology focus on AI, hypersonic weapons, and cyber warfare.", "NEWS", "en", "https://ontora.int/briefs/global-military-spending-2026"),
    ("Cyber Warfare and Information Operations Assessment", "Strategic assessment of state-sponsored cyber attacks, information warfare capabilities, and critical infrastructure vulnerabilities. Focus on Russia, China, Iran, and North Korea operations.", "INTELLIGENCE", "en", "https://ontora.int/briefs/cyber-warfare-2026"),
    ("Naval Modernization in Indian Ocean Region", "Analysis of naval power balance in Indian Ocean including Indian Navy expansion, Chinese PLAN presence, and UK/French maritime operations. Strategic chokepoints and submarine capabilities reviewed.", "MEA", "en", "https://mea.gov.in/naval/modernization-2026"),
    ("Weapons Systems Technology Assessment", "Detailed technical analysis of emerging military technologies including hypersonic missiles, stealth systems, AI-enabled autonomous weapons, directed energy weapons, and next-generation fighter aircraft platforms.", "INTELLIGENCE", "en", "https://ontora.int/briefs/weapons-tech-2026"),
]

AUDIT_LOGS = [
    ("admin-001", "LOGIN", "auth/session", "UNCLASS", "ALLOW"),
    ("analyst-042", "QUERY", "knowledge-graph/nodes", "FOUO", "ALLOW"),
    ("analyst-018", "EXPORT", "geospatial/hotspots", "SECRET", "DENY"),
    ("admin-001", "UPDATE", "users/roles", "FOUO", "ALLOW"),
    ("analyst-007", "QUERY", "intelligence/briefs", "SECRET", "ALLOW"),
    ("viewer-105", "ACCESS", "predictions/forecast", "FOUO", "ALLOW"),
    ("analyst-042", "EXPORT", "data-lake/economic", "SECRET", "DENY"),
    ("admin-002", "CONFIG_CHANGE", "security/policy", "TS", "ALLOW"),
    ("analyst-019", "QUERY", "geospatial/climate", "FOUO", "ALLOW"),
    ("admin-001", "DELETE", "entities/duplicate", "FOUO", "ALLOW"),
]


async def seed_data():
    """Seed the database with comprehensive data for all dashboard pages."""

    print("=" * 70)
    print("ONTORA Database Bulk Seed Script")
    print("=" * 70)
    print()

    # ── 1. Initialise DB ─────────────────────────────────
    print("Initializing database...")
    try:
        await init_db()
        print("✓ Database initialized\n")
    except Exception as e:
        print(f"ERROR initializing database: {e}")
        return

    from db.postgres import AsyncSessionLocal as session_local
    if session_local is None:
        print("ERROR: Session maker not available")
        return

    async with session_local() as db:
        try:
            # ── 2. Countries ──────────────────────────────
            print("Seeding countries...")
            country_ids = {}  # iso_code -> uuid
            for iso_code, name, region, continent in COUNTRIES:
                uid = str(uuid.uuid4())
                await db.execute(text("""
                    INSERT INTO countries (id, iso_code, name, region, continent, created_at, updated_at)
                    VALUES (:id, :iso, :name, :region, :continent, :now, :now)
                    ON CONFLICT (iso_code) DO NOTHING
                """), {
                    "id": uid, "iso": iso_code, "name": name,
                    "region": region, "continent": continent,
                    "now": datetime.utcnow(),
                })
                country_ids[iso_code] = uid
            await db.commit()
            print(f"  ✓ Seeded {len(COUNTRIES)} countries")

            # Re-read actual UUIDs (in case ON CONFLICT skipped inserts)
            result = await db.execute(text("SELECT id, iso_code FROM countries"))
            for row in result.all():
                country_ids[row[1]] = str(row[0])

            # ── 3. Economic Indicators from World Bank JSON ──
            print("Seeding economic indicators from World Bank data...")
            wb_path = Path(__file__).parent / "data" / "IndiAPIs" / "world_bank_data.json"
            indicator_count = 0
            if wb_path.exists():
                with open(wb_path, "r") as f:
                    wb_data = json.load(f)

                india_id = country_ids.get("IND")
                if india_id and "indicators" in wb_data:
                    for indicator_group in wb_data["indicators"]:
                        indicator_code = indicator_group.get("indicator_code", "")
                        indicator_name = indicator_group.get("indicator_name", "")
                        for record in indicator_group.get("data", []):
                            value = record.get("value")
                            year_str = record.get("date", "")
                            if value is not None and year_str.isdigit():
                                year = int(year_str)
                                # Only import recent 25 years to keep DB trim
                                if year >= 2000:
                                    await db.execute(text("""
                                        INSERT INTO economic_indicators
                                        (id, country_id, indicator_code, indicator_name, value, year, unit, created_at)
                                        VALUES (:id, :cid, :code, :name, :val, :year, :unit, :now)
                                        ON CONFLICT DO NOTHING
                                    """), {
                                        "id": str(uuid.uuid4()),
                                        "cid": india_id,
                                        "code": indicator_code,
                                        "name": indicator_name,
                                        "val": float(value),
                                        "year": year,
                                        "unit": "USD" if "US$" in indicator_name else "%",
                                        "now": datetime.utcnow(),
                                    })
                                    indicator_count += 1
                await db.commit()
                print(f"  ✓ Seeded {indicator_count} economic indicators from World Bank JSON")
            else:
                print(f"  ⚠ World Bank JSON not found at {wb_path}, skipping")

            # ── 4. Entities ───────────────────────────────
            print("Seeding entities...")
            entity_ids = {}  # name -> uuid
            for entity_type, name, description, confidence, mentions in ENTITIES:
                uid = str(uuid.uuid4())
                await db.execute(text("""
                    INSERT INTO entities (id, entity_type, name, description, confidence_score, mention_count, sentiment, created_at, updated_at)
                    VALUES (:id, :type, :name, :desc, :conf, :mentions, :sentiment, :now, :now)
                    ON CONFLICT DO NOTHING
                """), {
                    "id": uid, "type": entity_type, "name": name,
                    "desc": description, "conf": confidence,
                    "mentions": mentions, "sentiment": "neutral",
                    "now": datetime.utcnow(),
                })
                entity_ids[name] = uid
            await db.commit()
            print(f"  ✓ Seeded {len(ENTITIES)} entities")

            # ── 5. Country Relations ──────────────────────
            print("Seeding country relations...")
            relations_data = [
                ("IND", "USA", "bilateral", "stable", 85000.0, "positive", 0.88),
                ("IND", "CHN", "bilateral", "tense", 125000.0, "negative", 0.72),
                ("IND", "RUS", "bilateral", "stable", 12500.0, "positive", 0.81),
                ("IND", "JPN", "bilateral", "stable", 20000.0, "positive", 0.90),
                ("IND", "PAK", "bilateral", "active_dispute", 2000.0, "negative", 0.65),
                ("USA", "CHN", "bilateral", "tense", 650000.0, "negative", 0.60),
                ("USA", "GBR", "bilateral", "stable", 280000.0, "positive", 0.95),
                ("RUS", "UKR", "bilateral", "conflict", 500.0, "negative", 0.95),
                ("CHN", "TWN", "bilateral", "active_dispute", 180000.0, "negative", 0.88),
                ("SAU", "IRN", "bilateral", "tense", 1000.0, "negative", 0.75),
                ("IND", "ARE", "bilateral", "stable", 85000.0, "positive", 0.87),
                ("USA", "DEU", "bilateral", "stable", 250000.0, "positive", 0.85),
                ("CHN", "RUS", "bilateral", "stable", 220000.0, "positive", 0.78),
                ("JPN", "KOR", "bilateral", "tense", 80000.0, "neutral", 0.68),
                ("IND", "AUS", "bilateral", "stable", 28000.0, "positive", 0.82),
                # Military Relations
                ("IND", "USA", "military_alliance", "stable", 5000.0, "positive", 0.92),
                ("IND", "JPN", "military_cooperation", "stable", 2500.0, "positive", 0.89),
                ("USA", "AUS", "military_alliance", "stable", 8000.0, "positive", 0.94),
                ("USA", "GBR", "military_alliance", "stable", 12000.0, "positive", 0.96),
                ("IND", "AUS", "military_cooperation", "stable", 1800.0, "positive", 0.87),
                ("CHN", "RUS", "military_exercises", "stable", 3000.0, "positive", 0.81),
                ("IND", "CHN", "border_military", "tense", 500.0, "negative", 0.88),
                ("USA", "CHN", "military_rivalry", "tense", 8500.0, "negative", 0.85),
                ("CHN", "TWN", "military_threat", "active_dispute", 0.0, "negative", 0.91),
                ("IND", "RUS", "military_cooperation", "stable", 1200.0, "positive", 0.84),
                ("USA", "KOR", "military_alliance", "stable", 2800.0, "positive", 0.90),
                ("USA", "JPN", "military_alliance", "stable", 4500.0, "positive", 0.93),
                ("RUS", "UKR", "military_conflict", "conflict", 0.0, "negative", 0.97),
                ("IND", "PAK", "military_standoff", "active_dispute", 0.0, "negative", 0.79),
                ("DEU", "POL", "military_alliance", "stable", 1500.0, "positive", 0.88),
            ]
            for iso_a, iso_b, rel_type, status, trade, sentiment, conf in relations_data:
                id_a = country_ids.get(iso_a)
                id_b = country_ids.get(iso_b)
                if id_a and id_b:
                    await db.execute(text("""
                        INSERT INTO country_relations
                        (id, country_a_id, country_b_id, relation_type, status, trade_volume, sentiment, confidence_score, last_updated, source)
                        VALUES (:id, :a, :b, :type, :status, :trade, :sentiment, :conf, :now, 'MEA')
                        ON CONFLICT DO NOTHING
                    """), {
                        "id": str(uuid.uuid4()),
                        "a": id_a, "b": id_b,
                        "type": rel_type, "status": status,
                        "trade": trade, "sentiment": sentiment,
                        "conf": conf, "now": datetime.utcnow(),
                    })
            await db.commit()
            print(f"  ✓ Seeded {len(relations_data)} country relations")

            # ── 6. Documents ──────────────────────────────
            print("Seeding documents...")
            doc_ids = []
            now = datetime.utcnow()
            for i, (title, content, source, lang, url) in enumerate(DOCUMENTS):
                uid = str(uuid.uuid4())
                doc_ids.append(uid)
                await db.execute(text("""
                    INSERT INTO documents (id, title, content, source, language, url, published_date, created_at, processed)
                    VALUES (:id, :title, :content, :source, :lang, :url, :pub, :now, true)
                    ON CONFLICT DO NOTHING
                """), {
                    "id": uid, "title": title, "content": content,
                    "source": source, "lang": lang, "url": url,
                    "pub": now - timedelta(days=i), "now": now,
                })
            await db.commit()
            print(f"  ✓ Seeded {len(DOCUMENTS)} documents")

            # ── 7. Relationships (entity triplets) ────────
            print("Seeding entity relationships...")
            triplets = [
                ("Russia", "SANCTIONS", "European Union"),
                ("China", "TRADE_PARTNER", "United States"),
                ("India", "DEFENSE_AGREEMENT", "Russia"),
                ("NATO", "MILITARY_SUPPORT", "Ukraine"),
                ("OPEC", "PRICE_INFLUENCE", "Global Markets"),
                ("European Union", "DIPLOMATIC_TENSION", "China"),
                ("United Nations", "MEDIATION", "Ukraine Conflict"),
                ("BRICS", "ECONOMIC_COOPERATION", "India"),
                ("World Bank", "FUNDING", "South Asia"),
                ("IMF", "LENDING", "Pakistan"),
                # Military Relationships
                ("Indian Army", "OPERATIONAL_PRESENCE", "Lakshadweep Islands"),
                ("Indian Navy", "MARITIME_PATROL", "Strait of Malacca"),
                ("People's Liberation Army", "MILITARY_BUILDUP", "South China Sea"),
                ("US Navy", "CARRIER_DEPLOYMENT", "Indo-Pacific"),
                ("Indian Air Force", "DEFENSE_AGREEMENT", "United States"),
                ("Shanghai Cooperation Organization", "MILITARY_EXERCISE", "India"),
                ("Ministry of Defence India", "COORDINATES", "Indian Army"),
                ("S-400 Air Defence System", "DEPLOYED_BY", "India"),
                ("BrahMos Missile", "DEVELOPED_BY", "India"),
                ("INS Vikrant", "OPERATED_BY", "Indian Navy"),
                ("General Manoj Pande", "COMMANDS", "Indian Army"),
                ("Admiral R Hari Kumar", "COMMANDS", "Indian Navy"),
                ("India-China Border Tensions", "INVOLVES", "People's Liberation Army"),
                ("US-China Military Escalation", "INVOLVES", "United States Indo-Pacific Command"),
                ("Taiwan Strait Military Dynamics", "INVOLVES", "US Navy"),
                ("Type 055 Destroyer", "OPERATED_BY", "People's Liberation Army"),
                ("Russian Armed Forces", "MAINTAINS_PRESENCE", "Arctic"),
                ("India", "MILITARY_ALLIANCE", "United States"),
                ("China", "MILITARY_MODERNIZATION", "People's Liberation Army"),
                ("Ukraine Conflict", "INVOLVES", "Russian Armed Forces"),
            ]
            entity_name_to_id = {}
            result = await db.execute(text("SELECT id, name FROM entities"))
            for row in result.all():
                entity_name_to_id[row[1]] = str(row[0])

            rel_count = 0
            for subj_name, predicate, obj_name in triplets:
                subj_id = entity_name_to_id.get(subj_name)
                obj_id = entity_name_to_id.get(obj_name)
                # Only insert if both entities exist
                if subj_id and obj_id:
                    doc_id = doc_ids[rel_count % len(doc_ids)] if doc_ids else None
                    await db.execute(text("""
                        INSERT INTO relationships (id, subject_entity_id, predicate, object_entity_id, confidence_score, source_document_id, created_at)
                        VALUES (:id, :subj, :pred, :obj, :conf, :doc, :now)
                        ON CONFLICT DO NOTHING
                    """), {
                        "id": str(uuid.uuid4()),
                        "subj": subj_id, "pred": predicate,
                        "obj": obj_id, "conf": 0.85,
                        "doc": doc_id, "now": datetime.utcnow(),
                    })
                    rel_count += 1
            await db.commit()
            print(f"  ✓ Seeded {rel_count} entity relationships")

            # ── 8. Audit Logs ─────────────────────────────
            print("Seeding audit logs...")
            for i, (user_id, action, resource, classification, status) in enumerate(AUDIT_LOGS):
                await db.execute(text("""
                    INSERT INTO audit_logs (id, user_id, action, resource, classification, status, ip_address, timestamp)
                    VALUES (:id, :user, :action, :resource, :class, :status, :ip, :ts)
                    ON CONFLICT DO NOTHING
                """), {
                    "id": str(uuid.uuid4()),
                    "user": user_id, "action": action,
                    "resource": resource, "class": classification,
                    "status": status, "ip": "10.0.1.42",
                    "ts": now - timedelta(minutes=i * 15),
                })
            await db.commit()
            print(f"  ✓ Seeded {len(AUDIT_LOGS)} audit logs")

            # ── 9. System Metrics ─────────────────────────
            print("Seeding system metrics...")
            metrics = [
                ("postgresql_uptime", 99.98, "%"),
                ("neo4j_uptime", 95.2, "%"),
                ("kafka_throughput", 142000, "events/sec"),
                ("redis_uptime", 99.99, "%"),
                ("api_latency_p99", 128.4, "ms"),
                ("model_inferences_today", 8400000, "count"),
                ("data_ingestion_gb", 12.4, "GB"),
            ]
            for name, value, unit in metrics:
                await db.execute(text("""
                    INSERT INTO system_metrics (id, metric_name, metric_value, unit, timestamp)
                    VALUES (:id, :name, :val, :unit, :ts)
                    ON CONFLICT DO NOTHING
                """), {
                    "id": str(uuid.uuid4()),
                    "name": name, "val": value,
                    "unit": unit, "ts": now,
                })
            await db.commit()
            print(f"  ✓ Seeded {len(metrics)} system metrics")

            # ── 10. Default Admin User ────────────────────
            print("Seeding default users...")
            import hashlib
            pw_hash = hashlib.sha256("admin123".encode()).hexdigest()
            await db.execute(text("""
                INSERT INTO users (id, username, email, password_hash, full_name, roles, clearance_level, is_active, created_at, updated_at)
                VALUES (:id, :user, :email, :pw, :name, :roles, :cl, true, :now, :now)
                ON CONFLICT DO NOTHING
            """), {
                "id": str(uuid.uuid4()),
                "user": "admin", "email": "admin@ontora.int",
                "pw": pw_hash, "name": "System Administrator",
                "roles": '["admin", "analyst"]',
                "cl": "TS/SCI", "now": now,
            })
            await db.execute(text("""
                INSERT INTO users (id, username, email, password_hash, full_name, roles, clearance_level, is_active, created_at, updated_at)
                VALUES (:id, :user, :email, :pw, :name, :roles, :cl, true, :now, :now)
                ON CONFLICT DO NOTHING
            """), {
                "id": str(uuid.uuid4()),
                "user": "analyst", "email": "analyst@ontora.int",
                "pw": hashlib.sha256("analyst123".encode()).hexdigest(),
                "name": "Intelligence Analyst",
                "roles": '["analyst"]',
                "cl": "SECRET", "now": now,
            })
            await db.commit()
            print("  ✓ Seeded 2 default users")

            print()
            print("=" * 70)
            print("✅ Database seeding complete!")
            print("=" * 70)

        except Exception as e:
            print(f"\nERROR during seeding: {e}")
            await db.rollback()
            raise
        finally:
            await db.close()

    if engine:
        await engine.dispose()


if __name__ == "__main__":
    asyncio.run(seed_data())
