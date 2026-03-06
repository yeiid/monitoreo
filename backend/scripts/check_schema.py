# Script para verificar las columnas y tipos de datos de las tablas principales (splitters, splices, fiber_strands)
import asyncio
import os
from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy import text
from dotenv import load_dotenv

env_path = os.path.join(os.path.dirname(__file__), "..", ".env")
if os.path.exists(env_path):
    load_dotenv(env_path)
DATABASE_URL = os.getenv("DATABASE_URL")

async def print_schema():
    engine = create_async_engine(DATABASE_URL)
    async with engine.connect() as conn:
        for table in ['splitters', 'splices', 'fiber_strands']:
            print(f"\n--- {table} ---")
            res = await conn.execute(text(f"SELECT column_name, data_type FROM information_schema.columns WHERE table_name = '{table}';"))
            for row in res:
                print(f"{row[0]}: {row[1]}")
    await engine.dispose()

if __name__ == "__main__":
    asyncio.run(print_schema())
