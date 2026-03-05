# Script de parche v2: Asegura que las tablas splitters y splices tengan las columnas y valores por defecto correctos
import asyncio
import os
from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy import text
from dotenv import load_dotenv

load_dotenv()
DATABASE_URL = os.getenv("DATABASE_URL")

async def fix_schema():
    if not DATABASE_URL:
        print("Error: DATABASE_URL not found in .env")
        return

    engine = create_async_engine(DATABASE_URL)
    
    async with engine.begin() as conn:
        print("Checking/Adding columns to splitters table...")
        try:
            await conn.execute(text("ALTER TABLE splitters ADD COLUMN IF NOT EXISTS input_strand_id UUID;"))
            await conn.execute(text("ALTER TABLE splitters ADD COLUMN IF NOT EXISTS configuration JSONB DEFAULT '{}';"))
            print("Successfully updated splitters table.")
        except Exception as e:
            print(f"Error updating splitters: {e}")

        print("Checking/Adding columns to splices table...")
        try:
            await conn.execute(text("ALTER TABLE splices ADD COLUMN IF NOT EXISTS input_node_id UUID;"))
            await conn.execute(text("ALTER TABLE splices ADD COLUMN IF NOT EXISTS output_node_id UUID;"))
            await conn.execute(text("ALTER TABLE splices ADD COLUMN IF NOT EXISTS input_fiber_index INTEGER;"))
            await conn.execute(text("ALTER TABLE splices ADD COLUMN IF NOT EXISTS output_fiber_index INTEGER;"))
            # For existing columns that might have been created without defaults
            await conn.execute(text("ALTER TABLE splices ADD COLUMN IF NOT EXISTS loss_db FLOAT DEFAULT 0.1;"))
            # Make sure metadata is there
            await conn.execute(text("ALTER TABLE splices ADD COLUMN IF NOT EXISTS extra_metadata JSONB DEFAULT '{}';"))
            print("Successfully updated splices table.")
        except Exception as e:
            print(f"Error updating splices: {e}")

    await engine.dispose()

if __name__ == "__main__":
    asyncio.run(fix_schema())
