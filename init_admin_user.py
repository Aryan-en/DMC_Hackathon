"""Initialize admin user for ONTORA system."""

import asyncio
import sys
from pathlib import Path
import hashlib
import json

sys.path.insert(0, str(Path(__file__).parent / 'backend'))

from config import settings
import asyncpg

def simple_hash_password(password: str) -> str:
    """Simple password hashing using PBKDF2 (for initialization only)."""
    salt = "ontora2026salt"
    return hashlib.pbkdf2_hmac(
        'sha256',
        password.encode('utf-8'),
        salt.encode('utf-8'),
        100000
    ).hex()

async def init_admin():
    """Create default admin user if it doesn't exist."""
    
    conn_str_dict = {
        'host': settings.POSTGRES_HOST,
        'port': settings.POSTGRES_PORT,
        'user': settings.POSTGRES_USER,
        'password': settings.POSTGRES_PASSWORD,
        'database': settings.POSTGRES_DB,
    }
    
    print(f"Connecting to {conn_str_dict['host']}:5432/{conn_str_dict['database']}...")
    
    try:
        conn = await asyncpg.connect(**conn_str_dict)
        print("✓ Connected to PostgreSQL\n")
        
        # Check if admin exists
        admin_exists = await conn.fetchval(
            "SELECT id FROM users WHERE username = 'admin' LIMIT 1"
        )
        
        if admin_exists:
            print("ℹ Admin user already exists")
            await conn.close()
            return
        
        # Create admin user
        admin_id = "00000000-0000-0000-0000-000000000001"
        admin_password = "Admin@123"
        password_hash = simple_hash_password(admin_password)
        
        await conn.execute("""
            INSERT INTO users 
            (id, username, email, hashed_password, full_name, roles, clearance_level, is_active)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        """, 
        admin_id, 
        "admin", 
        "admin@ontora.local",
        password_hash,
        "System Administrator",
        json.dumps(["admin"]),
        "TS",
        True
        )
        
        print("✓ Admin user created")
        print(f"  Username: admin")
        print(f"  Password: {admin_password}")
        print(f"  Clearance: TS\n")
        
        # Create analyst user
        analyst_id = "00000000-0000-0000-0000-000000000002"
        analyst_password = "Analyst@123"
        analyst_hash = simple_hash_password(analyst_password)
        
        await conn.execute("""
            INSERT INTO users 
            (id, username, email, hashed_password, full_name, roles, clearance_level, is_active)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        """,
        analyst_id,
        "analyst",
        "analyst@ontora.local",
        analyst_hash,
        "Test Analyst",
        json.dumps(["analyst"]),
        "SECRET",
        True
        )
        
        print("✓ Analyst user created")
        print(f"  Username: analyst")
        print(f"  Password: {analyst_password}")
        print(f"  Clearance: SECRET\n")
        
        # Create viewer user
        viewer_id = "00000000-0000-0000-0000-000000000003"
        viewer_password = "Viewer@123"
        viewer_hash = simple_hash_password(viewer_password)
        
        await conn.execute("""
            INSERT INTO users 
            (id, username, email, hashed_password, full_name, roles, clearance_level, is_active)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        """,
        viewer_id,
        "viewer",
        "viewer@ontora.local",
        viewer_hash,
        "Test Viewer",
        json.dumps(["viewer"]),
        "FOUO",
        True
        )
        
        print("✓ Viewer user created")
        print(f"  Username: viewer")
        print(f"  Password: {viewer_password}")
        print(f"  Clearance: FOUO\n")
        
        print("\n✅ User initialization complete!")
        print("\nAvailable test credentials:")
        print("  Admin    - admin / Admin@123")
        print("  Analyst  - analyst / Analyst@123")
        print("  Viewer   - viewer / Viewer@123")
        
        await conn.close()
        
    except Exception as e:
        print(f"❌ ERROR: {e}")
        import traceback
        traceback.print_exc()


if __name__ == "__main__":
    asyncio.run(init_admin())
