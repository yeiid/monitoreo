# Script de diagnóstico y reparación automática: Verifica y añade columnas faltantes en las tablas de la base de datos
import asyncio
import os
from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy import text
from dotenv import load_dotenv

env_path = os.path.join(os.path.dirname(__file__), "..", ".env")
if os.path.exists(env_path):
    load_dotenv(env_path)
DATABASE_URL = os.getenv("DATABASE_URL")

async def diagnose_and_fix():
    print(f"Connecting to: {DATABASE_URL.split('@')[-1]}") # Log host only for safety
    engine = create_async_engine(DATABASE_URL)
    
    async with engine.connect() as conn:
        for table in ['splitters', 'splices', 'fiber_strands']:
            print(f"\n--- Table: {table} ---")
            try:
                # Get column info
                result = await conn.execute(text(f"SELECT column_name FROM information_schema.columns WHERE table_name = '{table}';"))
                existing_cols = [row[0] for row in result.all()]
                print(f"Existing columns: {existing_cols}")
                
                # Required columns for splitters
                if table == 'splitters':
                    reqs = [("input_strand_id", "UUID"), ("configuration", "JSONB")]
                elif table == 'splices':
                    reqs = [
                        ("input_node_id", "UUID"), ("output_node_id", "UUID"), 
                        ("input_fiber_index", "INTEGER"), ("output_fiber_index", "INTEGER"),
                        ("loss_db", "FLOAT"), ("extra_metadata", "JSONB")
                    ]
                elif table == 'fiber_strands':
                    reqs = [("buffer_number", "INTEGER"), ("optical_power_dbm", "FLOAT")]
                
                for col, dtype in reqs:
                    if col not in existing_cols:
                        print(f"Adding missing column: {col} ({dtype})")
                        await conn.execute(text(f"ALTER TABLE {table} ADD COLUMN {col} {dtype};"))
                
                await conn.commit()
                print(f"Update for {table} complete.")
                
            except Exception as e:
                print(f"Error processing {table}: {e}")

    await engine.dispose()

if __name__ == "__main__":
    asyncio.run(diagnose_and_fix())
