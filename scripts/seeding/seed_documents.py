import asyncio
import asyncpg
from datetime import datetime, timedelta
from uuid import uuid4
import sys
from pathlib import Path

# Add backend to path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent.parent / 'backend'))

from core.config import settings

async def seed_documents():
    print(f"Seeding sample documents for {settings.POSTGRES_DB}...")
    
    conn_str_dict = {
        'host': settings.POSTGRES_HOST,
        'port': settings.POSTGRES_PORT,
        'user': settings.POSTGRES_USER,
        'password': settings.POSTGRES_PASSWORD,
        'database': settings.POSTGRES_DB,
    }
    
    try:
        conn = await asyncpg.connect(**conn_str_dict)
        
        docs = [
            ("Joint Statement: India-China 14th Border Dialogue", "MEA", "https://www.mea.gov.in/bilateral-documents.htm?dtl/37521/14th_LAC_Dialogue", "The two sides engaged in productive discussions regarding the disengagement at Hot Springs and the Depsang Plains..."),
            ("World Bank Report: Global Economic Prospects 2026", "WORLDBANK", "https://openknowledge.worldbank.org/server/api/core/bitstreams/v1_prospects_2026.pdf", "Global growth is projected to stabilize at 2.4% in 2026, though persistent inflationary pressures remain in emerging markets..."),
            ("MEA Briefing: Crisis in the Red Sea Region", "MEA", "https://www.mea.gov.in/press-briefing.htm?dtl/37492/Red_Sea_Security", "External Affairs Minister discussed maritime security with littoral states following recent drone attacks on merchant vessels..."),
            ("Diplomatic Note: Strategic Partnership with EU", "EU_EXTERNAL", "https://www.eeas.europa.eu/sites/default/files/strategic_partnership_2026.pdf", "European Union and India agree to intensify cooperation in semiconductors and green hydrogen technology under the Trade and Technology Council framework..."),
            ("Intelligence Analysis: Cybersecurity Threats to Infrastructure", "OSINT", "https://threat-intel.example.com/analysis/grid_vulnerability_2026", "Analysis of recent intrusion attempts into regional smart grids suggests a coordinated state-sponsored actor targeting critical control systems...")
        ]
        
        for title, source, url, content in docs:
            await conn.execute("""
                INSERT INTO documents (id, title, source, url, content, published_date, created_at, processed)
                VALUES ($1, $2, $3, $4, $5, $6, $7, TRUE)
            """, str(uuid4()), title, source, url, content, datetime.now() - timedelta(days=2), datetime.now() - timedelta(hours=5))
            
        print(f"Successfully seeded {len(docs)} documents.")
        await conn.close()
    except Exception as e:
        print(f"Seeding error: {e}")

if __name__ == "__main__":
    asyncio.run(seed_documents())
