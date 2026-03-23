import asyncio
from sqlalchemy import text
from db.postgres import init_db, AsyncSessionLocal

async def check_db():
    try:
        print("Initializing database connection...")
        await init_db()
        
        async with AsyncSessionLocal() as session:
            result = await session.execute(text("SELECT table_name FROM information_schema.tables WHERE table_schema='public'"))
            tables = result.fetchall()
            print("\nTables in database:")
            for table in tables:
                print(f"  - {table[0]}")
            
            # Check country data
            try:
                result = await session.execute(text("SELECT COUNT(*) FROM countries"))
                count = result.scalar()
                print(f"\nCountries in DB: {count}")
                
                if count == 0:
                    print("⚠️  Countries table is empty - seed data needed!")
                else:
                    print(f"✅ Countries table has {count} records")
            except Exception as e:
                print(f"Could not query countries table: {e}")
                
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()

asyncio.run(check_db())
