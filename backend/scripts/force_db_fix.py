# Script de reparación forzada: Versión completa para actualizar todas las tablas críticas (splitters, splices, fiber_strands) con sus columnas necesarias
import asyncio
import os
from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy import text
from dotenv import load_dotenv

env_path = os.path.join(os.path.dirname(__file__), "..", ".env")
if os.path.exists(env_path):
    load_dotenv(env_path)
DATABASE_URL = os.getenv("DATABASE_URL")

async def force_fix_schema():
    if not DATABASE_URL:
        print("Error: DATABASE_URL not found in .env")
        return

    print(f"Connecting to remote DB...")
    engine = create_async_engine(DATABASE_URL)
    
    async with engine.begin() as conn:
        # 1. Splitters table
        print("Fixing table: splitters")
        try:
            await conn.execute(text("ALTER TABLE splitters ADD COLUMN IF NOT EXISTS input_strand_id UUID;"))
            await conn.execute(text("ALTER TABLE splitters ADD COLUMN IF NOT EXISTS configuration JSONB DEFAULT '{}';"))
            print("Splitters OK.")
        except Exception as e:
            print(f"Error in splitters: {e}")

        # 2. Splices table
        print("Fixing table: splices")
        try:
            await conn.execute(text("ALTER TABLE splices ADD COLUMN IF NOT EXISTS input_node_id UUID;"))
            await conn.execute(text("ALTER TABLE splices ADD COLUMN IF NOT EXISTS output_node_id UUID;"))
            await conn.execute(text("ALTER TABLE splices ADD COLUMN IF NOT EXISTS input_fiber_index INTEGER;"))
            await conn.execute(text("ALTER TABLE splices ADD COLUMN IF NOT EXISTS output_fiber_index INTEGER;"))
            await conn.execute(text("ALTER TABLE splices ADD COLUMN IF NOT EXISTS loss_db FLOAT DEFAULT 0.1;"))
            await conn.execute(text("ALTER TABLE splices ADD COLUMN IF NOT EXISTS extra_metadata JSONB DEFAULT '{}';"))
            print("Splices OK.")
        except Exception as e:
            print(f"Error in splices: {e}")

        # 3. FiberStrands table
        print("Fixing table: fiber_strands")
        try:
            await conn.execute(text("ALTER TABLE fiber_strands ADD COLUMN IF NOT EXISTS buffer_number INTEGER DEFAULT 1;"))
            await conn.execute(text("ALTER TABLE fiber_strands ADD COLUMN IF NOT EXISTS optical_power_dbm FLOAT;"))
            print("Fiber strands OK.")
        except Exception as e:
            print(f"Error in fiber_strands: {e}")

    await engine.dispose()
    print("\n--- SCHEMA UPDATE COMPLETE ---")

if __name__ == "__main__":
    asyncio.run(force_fix_schema())
