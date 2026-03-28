import asyncio
import sys
import os

# Add backend to path
sys.path.append(os.path.join(os.getcwd(), 'backend'))

from neo4j_sync import incremental_sync

async def main():
    print("Starting Neo4j full sync...")
    result = await incremental_sync(limit_entities=40000, limit_relationships=50000)
    print(f"Sync result: {result}")

if __name__ == "__main__":
    asyncio.run(main())
