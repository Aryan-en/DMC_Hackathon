import asyncio
import sys
from pathlib import Path

# Add backend to path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent / 'backend'))

from ingestors.gdelt_fetcher import run_gdelt_fetcher
from db.schemas import Document
from db.postgres import AsyncSessionLocal
from uuid import uuid4
from datetime import datetime, timezone

async def pull_live_news():
    print("Pulling live global news from GDELT API...")
    gdelt_results = await run_gdelt_fetcher()
    
    async with AsyncSessionLocal() as session:
        count = 0
        for art in gdelt_results:
            metadata = art.get("metadata") or {}
            now = datetime.now(timezone.utc).replace(tzinfo=None)
            metadata["ingested_at"] = now.isoformat()

            new_doc = Document(
                id=str(uuid4()),
                title=art["title"],
                source=art["source"],
                url=art["url"],
                content=art["content"],
                doc_metadata=metadata,
                published_date=now,
                created_at=now,
                processed=True
            )
            session.add(new_doc)
            count += 1
        
        await session.commit()
        print(f"Successfully integrated {count} REAL live news articles into Ontora Lake (historical accumulation mode).")

if __name__ == "__main__":
    asyncio.run(pull_live_news())
