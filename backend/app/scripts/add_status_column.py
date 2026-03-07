import asyncio
import os
import sys
from sqlalchemy import text

# Add root directory to sys.path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..")))

from app.db.session import engine

async def migrate():
    print("🚀 Starting database migration: Adding 'status' column to 'nodes'...")
    try:
        async with engine.begin() as conn:
            # PostgreSQL specific ALTER TABLE with IF NOT EXISTS (requires PG 9.6+)
            # Using single quotes for the default value
            await conn.execute(text("ALTER TABLE nodes ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'online';"))
            print("✅ Column 'status' verified/added to 'nodes' table.")
            
            # Also ensure all existing rows have the value
            await conn.execute(text("UPDATE nodes SET status = 'online' WHERE status IS NULL;"))
            print("✅ Existing rows updated to 'online'.")
            
        print("🎉 Migration complete.")
    except Exception as e:
        print(f"❌ Migration failed: {e}")

if __name__ == "__main__":
    asyncio.run(migrate())
