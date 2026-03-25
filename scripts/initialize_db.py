import asyncio
import sys
from pathlib import Path

# Add backend to path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent / 'backend'))

from db.postgres import init_db, close_db
from core.config import settings

async def main():
    print(f"Initializing database: {settings.POSTGRES_DB} on {settings.POSTGRES_HOST}:{settings.POSTGRES_PORT}...")
    try:
        await init_db()
        print("Database schema initialized successfully.")
    except Exception as e:
        print(f"Error during initialization: {e}")
    finally:
        await close_db()

if __name__ == "__main__":
    asyncio.run(main())
