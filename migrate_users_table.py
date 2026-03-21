"""Migrate users table to add authentication-related columns."""

import asyncio
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent / 'backend'))

from config import settings
import asyncpg

async def migrate_users_table():
    """Add missing columns to users table for authentication."""
    
    conn_str_dict = {
        'host': settings.POSTGRES_HOST,
        'port': settings.POSTGRES_PORT,
        'user': settings.POSTGRES_USER,
        'password': settings.POSTGRES_PASSWORD,
        'database': settings.POSTGRES_DB,
    }
    
    print("Connecting to PostgreSQL...")
    
    try:
        conn = await asyncpg.connect(**conn_str_dict)
        print("✓ Connected\n")
        
        # Check and add password_hash column
        try:
            await conn.execute("ALTER TABLE users ADD COLUMN password_hash VARCHAR(255)")
            print("✓ Added password_hash column")
        except Exception as e:
            if "already exists" in str(e):
                print("ℹ password_hash column already exists")
            else:
                print(f"Note: {e}")
        
        # Check and add roles column  
        try:
            await conn.execute("ALTER TABLE users ADD COLUMN roles JSONB DEFAULT '[]'::jsonb")
            print("✓ Added roles column")
        except Exception as e:
            if "already exists" in str(e):
                print("ℹ roles column already exists")
            else:
                print(f"Note: {e}")
        
        # Check and add last_login column
        try:
            await conn.execute("ALTER TABLE users ADD COLUMN last_login TIMESTAMP")
            print("✓ Added last_login column")
        except Exception as e:
            if "already exists" in str(e):
                print("ℹ last_login column already exists")
            
        
        # Migrate data from hashed_password to password_hash if needed
        try:
            count = await conn.fetchval("SELECT COUNT(*) FROM users WHERE password_hash IS NULL AND hashed_password IS NOT NULL")
            if count and count > 0:
                await conn.execute("UPDATE users SET password_hash = hashed_password WHERE password_hash IS NULL")
                print(f"✓ Migrated {count} password hashes")
        except Exception as e:
            print(f"Note: {e}")
        
        print("\n✅ Migration complete!")
        await conn.close()
        
    except Exception as e:
        print(f"❌ ERROR: {e}")
        import traceback
        traceback.print_exc()


if __name__ == "__main__":
    asyncio.run(migrate_users_table())
