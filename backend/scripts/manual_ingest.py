import asyncio
import sys
from pathlib import Path

# Add backend to path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from tasks.ingestion import run_full_ingestion

def main():
    print("Starting Manual Ingestion...")
    # Create an event loop for this thread explicitly if it doesn't exist
    try:
        loop = asyncio.get_event_loop()
    except RuntimeError:
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
    
    # run_full_ingestion uses loop.run_until_complete internal
    result = run_full_ingestion()
    print(f"Ingestion Finished: {result}")

if __name__ == "__main__":
    main()
