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
import traceback


# Add parent to path for imports
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from sqlalchemy import delete
from sqlalchemy.future import select
from db.postgres import get_db_session, init_db
from db.schemas import Entity, Relationship, Document

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("GDELT_Importer")

# GDELT column indices (0-based)
# GDELT column indices (V2 Export)
COL_ACTOR1_CODE = 5
COL_ACTOR1_NAME = 6
COL_ACTOR2_CODE = 15
COL_ACTOR2_NAME = 16
COL_EVENT_CODE = 26
COL_GOLDSTEIN = 30
COL_SOURCE_URL = 60 # V2 index


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

async def import_to_db(df, truncate=False):
    if df is None or df.empty:
        return 0, 0, 0

    await init_db()
    
    entities_to_create = {} # name -> Entity object
    relationships_to_create = []
    documents_to_create = []
    
    logger.info(f"Processing {len(df)} rows from GDELT...")
    
    async for session in get_db_session():
        if truncate:
            logger.info("Truncating relationships, entities, and documents for fresh import...")
            await session.execute(delete(Relationship))
            await session.execute(delete(Entity))
            await session.execute(delete(Document))
            await session.commit()
        
        for _, row in df.iterrows():
            # Get actor names, fallback to codes if name is missing
            a1 = str(row[COL_ACTOR1_NAME]) if not pd.isna(row[COL_ACTOR1_NAME]) else (str(row[COL_ACTOR1_CODE]) if not pd.isna(row[COL_ACTOR1_CODE]) else None)
            a2 = str(row[COL_ACTOR2_NAME]) if not pd.isna(row[COL_ACTOR2_NAME]) else (str(row[COL_ACTOR2_CODE]) if not pd.isna(row[COL_ACTOR2_CODE]) else None)
            
            code = str(row[COL_EVENT_CODE])[:2] if not pd.isna(row[COL_EVENT_CODE]) else "01"
            goldstein = float(row[COL_GOLDSTEIN]) if not pd.isna(row[COL_GOLDSTEIN]) else 0.0
            
            # GDELT V2 sometimes has different column counts, ensure URL exists
            source_url_idx = COL_SOURCE_URL if len(row) > COL_SOURCE_URL else (len(row)-1)
            url = str(row[source_url_idx]) if not pd.isna(row[source_url_idx]) else ""

            
            if a1 and a2 and a1 != a2:
                # Normalize names slightly
                a1 = a1.strip().title()
                a2 = a2.strip().title()
                
                # Check for existing entities in this session OR the DB (using names)
                # For high-speed import, we'll stage they as new objects with fixed UUIDs derived from names
                # This ensures consistent IDs across batches.
                def get_id(name): return uuid.uuid5(uuid.NAMESPACE_DNS, name)
                
                s_id = get_id(a1)
                o_id = get_id(a2)

                if a1 not in entities_to_create:
                    entities_to_create[a1] = Entity(
                        id=s_id,
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
                        id=o_id,
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
                
                # Create a document for each high-confidence event
                doc_id = uuid.uuid4()
                is_doc_created = False
                if confidence > 0.6 and len(documents_to_create) < 200:
                    documents_to_create.append(Document(
                        id=doc_id,
                        title=f"{a1} affects {a2} via {predicate}",
                        content=f"Detected significant geopolitical event: {a1} engaged in {predicate} with {a2}. Goldstein scale: {goldstein}. Source GDELT: {url}",
                        source="GDELT",
                        url=url,
                        created_at=datetime.utcnow(),
                        doc_metadata={"confidence": confidence}
                    ))
                    is_doc_created = True

                relationships_to_create.append(Relationship(
                    id=uuid.uuid4(),
                    subject_entity_id=s_id,
                    predicate=predicate,
                    object_entity_id=o_id,
                    confidence_score=confidence,
                    url=url,
                    source_document_id=doc_id if is_doc_created else None
                ))


        logger.info(f"Staged {len(entities_to_create)} entities and {len(relationships_to_create)} relationships")
        
        # Batch upsert entities (merge strategy)
        chunk_size = 1000
        entity_list = list(entities_to_create.values())
        for i in range(0, len(entity_list), chunk_size):
            chunk = entity_list[i : i + chunk_size]
            for ent in chunk:
                await session.merge(ent)
            await session.flush()
        
        # Batch insert documents
        for i in range(0, len(documents_to_create), chunk_size):
            chunk = documents_to_create[i : i + chunk_size]
            session.add_all(chunk)
            await session.flush()

        # Batch insert relationships
        for i in range(0, len(relationships_to_create), chunk_size):
            chunk = relationships_to_create[i : i + chunk_size]
            session.add_all(chunk)
            await session.flush()
            
        await session.commit()
        return len(entities_to_create), len(relationships_to_create), len(documents_to_create)

async def main():
    try:
        resp = requests.get("http://data.gdeltproject.org/gdeltv2/masterfilelist.txt")
        lines = resp.text.splitlines()[-2000:]
        export_urls = [line.split()[-1] for line in lines if "export.CSV.zip" in line]
        export_urls.reverse()
        
        total_e = 0
        total_r = 0
        first_run = True
        
        for url in export_urls:
            df = await fetch_gdelt_data(url)
            if df is not None:
                e_count, r_count, d_count = await import_to_db(df, truncate=first_run)
                total_e += e_count
                total_r += r_count
                first_run = False
                logger.info(f"Cumulative nodes: {total_e}, edges: {total_r}")
                if total_e >= 31000:
                    break
        
        print(f"Finished. Total imported nodes approx: {total_e}")
    except Exception as e:
        logger.error(f"Main execution error: {e}")
        with open("import_error.txt", "w") as f:
            f.write(traceback.format_exc())
        raise

if __name__ == "__main__":
    asyncio.run(main())


