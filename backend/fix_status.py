import asyncio
import asyncpg
import os

async def run():
    # Use the specific DATABASE_URL found in .env
    url = "postgresql://monitoreo:monitoreo123@localhost:5432/monitoreodb"
    print(f"Connecting to {url}...")
    try:
        conn = await asyncpg.connect(url)
        print("Connected. Executing ALTER TABLE...")
        await conn.execute("ALTER TABLE nodes ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'online';")
        await conn.execute("UPDATE nodes SET status = 'online' WHERE status IS NULL;")
        await conn.close()
        print("✅ Column 'status' added and updated successfully!")
    except Exception as e:
        print(f"❌ Error during migration: {e}")

if __name__ == "__main__":
    asyncio.run(run())
