import asyncio
import os
import sys

# Add backend to path
sys.path.append(os.path.join(os.getcwd(), "backend"))

from backend.ingestors.folder_ingestor import run_folder_ingestion

async def test():
    base_dir = os.getcwd()
    mea_dir = os.path.join(base_dir, "data", "MEA")
    indiapi_dir = os.path.join(base_dir, "data", "IndiAPIs")
    
    print(f"Checking MEA dir: {mea_dir}")
    print(f"Exists: {os.path.exists(mea_dir)}")
    if os.path.exists(mea_dir):
        print(f"Files: {len(os.listdir(mea_dir))}")
        
    print(f"Checking IndiAPI dir: {indiapi_dir}")
    print(f"Exists: {os.path.exists(indiapi_dir)}")

    results = await run_folder_ingestion(mea_dir, indiapi_dir)
    print(f"Total results: {len(results)}")
    if results:
        print(f"First result source: {results[0].get('source')}")
        print(f"First result title: {results[0].get('title')}")

if __name__ == "__main__":
    asyncio.run(test())
