import os
import sys
import requests
import zipfile
import io
import pandas as pd
import asyncio
import logging
from datetime import datetime
import uuid

# Add parent to path for imports
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from sqlalchemy import delete
from sqlalchemy.future import select
from db.postgres import get_db_session, init_db
from db.schemas import Entity, Relationship, Document

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("GDELT_Importer")

# GDELT column indices (0-based)
COL_ACTOR1_NAME = 6
COL_ACTOR2_NAME = 16
COL_EVENT_CODE = 26
COL_GOLDSTEIN = 30
COL_SOURCE_URL = 57

# Event code to predicate mapping (Sample)
EVENT_MAP = {
    "01": "MAKE_PUBLIC_STATEMENT",
    "02": "APPEAL",
    "03": "EXPRESS_INTENT_TO_COOPERATE",
    "04": "CONSULT",
    "05": "ENGAGE_IN_DIPLOMATIC_COOPERATION",
    "06": "ENGAGE_IN_MATERIAL_COOPERATION",
    "07": "PROVIDE_AID",
    "08": "YIELD",
    "09": "INVESTIGATE",
    "10": "DEMAND",
    "11": "DISAPPROVE",
    "12": "REJECT",
    "13": "THREATEN",
    "14": "PROTEST",
    "15": "EXHIBIT_FORCE_POSTURE",
    "16": "REDUCE_RELATIONS",
    "17": "COERCE",
    "18": "ASSAULT",
    "19": "FIGHT",
    "20": "UNCONVENTIONAL_MASS_VIOLENCE"
}

async def fetch_gdelt_data(url):
    logger.info(f"Downloading GDELT data from {url}...")
    try:
        r = requests.get(url, timeout=30)
        r.raise_for_status()
        
        with zipfile.ZipFile(io.BytesIO(r.content)) as z:
            csv_name = z.namelist()[0]
            with z.open(csv_name) as f:
                # Use tab delimiter for GDELT
                df = pd.read_csv(f, sep='\t', header=None, low_memory=False)
                return df
    except Exception as e:
        logger.error(f"Failed to fetch {url}: {e}")
        return None

async def import_to_db(df):
    if df is None or df.empty:
        return 0, 0

    await init_db()
    
    entities_to_create = {} # name -> Entity object
    relationships_to_create = []
    
    logger.info(f"Processing {len(df)} rows from GDELT...")
    
    # Track existing entities to avoid duplicates
    async for session in get_db_session():
        # Clear small demo data first if user wants "actual" data
        # await session.execute(delete(Relationship))
        # await session.execute(delete(Entity))
        # await session.commit()
        
        count = 0
        for _, row in df.iterrows():
            a1 = str(row[COL_ACTOR1_NAME]) if not pd.isna(row[COL_ACTOR1_NAME]) else None
            a2 = str(row[COL_ACTOR2_NAME]) if not pd.isna(row[COL_ACTOR2_NAME]) else None
            code = str(row[COL_EVENT_CODE])[:2] if not pd.isna(row[COL_EVENT_CODE]) else "01"
            goldstein = float(row[COL_GOLDSTEIN]) if not pd.isna(row[COL_GOLDSTEIN]) else 0.0
            url = str(row[COL_SOURCE_URL]) if not pd.isna(row[COL_SOURCE_URL]) else ""
            
            if a1 and a2 and a1 != a2:
                # Normalize names slightly
                a1 = a1.strip().title()
                a2 = a2.strip().title()
                
                # Check if we already staged these entities in this run
                if a1 not in entities_to_create:
                    entities_to_create[a1] = Entity(
                        id=uuid.uuid4(),
                        name=a1,
                        entity_type="ACTOR",
                        confidence_score=0.9,
                        mention_count=1,
                        properties={"actor_code": str(row[5]) if not pd.isna(row[5]) else ""}
                    )
                else:
                    entities_to_create[a1].mention_count += 1
                    
                if a2 not in entities_to_create:
                    entities_to_create[a2] = Entity(
                        id=uuid.uuid4(),
                        name=a2,
                        entity_type="ACTOR",
                        confidence_score=0.9,
                        mention_count=1,
                        properties={"actor_code": str(row[15]) if not pd.isna(row[15]) else ""}
                    )
                else:
                    entities_to_create[a2].mention_count += 1
                
                # Create relationship
                predicate = EVENT_MAP.get(code, "INTERACTS_WITH")
                confidence = (goldstein + 10) / 20.0 # Map -10/10 to 0/1 approx
                confidence = max(0.1, min(1.0, confidence))
                
                relationships_to_create.append({
                    "subject": a1,
                    "predicate": predicate,
                    "object": a2,
                    "confidence": confidence,
                    "url": url
                })
                count += 1
                
                # If we have enough for this run, stop (or continue for 15k nodes)
                if len(entities_to_create) >= 16000:
                    break
        
        logger.info(f"Staged {len(entities_to_create)} entities and {len(relationships_to_create)} relationships")
        
        # Batch insert entities
        # To avoid primary key conflicts with existing data, we could check DB first, 
        # but for speed in this "actual data" request, we'll try to insert new ones.
        
        # Optimization: chunked insert
        chunk_size = 500
        entity_list = list(entities_to_create.values())
        for i in range(0, len(entity_list), chunk_size):
            chunk = entity_list[i : i + chunk_size]
            session.add_all(chunk)
            await session.flush()
        
        await session.commit()
        logger.info("Entities committed to PostgreSQL")
        
        # Batch insert relationships
        rel_objects = []
        for rel in relationships_to_create:
            s_id = entities_to_create[rel["subject"]].id
            o_id = entities_to_create[rel["object"]].id
            rel_objects.append(Relationship(
                subject_entity_id=s_id,
                predicate=rel["predicate"],
                object_entity_id=o_id,
                confidence_score=rel["confidence"],
                url=rel.get("url")
            ))
            
        for i in range(0, len(rel_objects), chunk_size):
            chunk = rel_objects[i : i + chunk_size]
            session.add_all(chunk)
            await session.flush()
            
        await session.commit()
        logger.info("Relationships committed to PostgreSQL")
        
        return len(entities_to_create), len(relationships_to_create)

async def main():
    # Get latest GDELT URLs
    try:
        resp = requests.get("http://data.gdeltproject.org/gdeltv2/masterfilelist.txt")
        lines = resp.text.splitlines()[-2000:] # Last 2000 records
        
        # Filter for export files
        export_urls = [line.split()[-1] for line in lines if "export.CSV.zip" in line]
        export_urls.reverse() # Start from most recent
        
        total_e = 0
        total_r = 0
        
        # Target 15k nodes
        for url in export_urls:
            df = await fetch_gdelt_data(url)
            if df is not None:
                e_count, r_count = await import_to_db(df)
                total_e += e_count
                total_r += r_count
                logger.info(f"Cumulative nodes: {total_e}, edges: {total_r}")
                if total_e >= 15000:
                    logger.info("Reached 15k target nodes!")
                    break
        
        print(f"Finished. Total unique nodes approximately imported: {total_e}")
        
    except Exception as e:
        logger.error(f"Main execution error: {e}")

if __name__ == "__main__":
    asyncio.run(main())
