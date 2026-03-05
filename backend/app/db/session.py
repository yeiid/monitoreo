import os
import asyncio
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import sessionmaker
from sqlalchemy import text
from sqlmodel import SQLModel
from dotenv import load_dotenv

# Load .env from backend/ folder
load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")

if not DATABASE_URL or DATABASE_URL.startswith("${"):
    print("⚠️ DATABASE_URL not set or unresolved, falling back to local SQLite.")
    DATABASE_URL = "sqlite+aiosqlite:///./monitoreo.db"

# Force asyncpg driver for PostgreSQL since AsyncEngine requires it
if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql+asyncpg://", 1)
elif DATABASE_URL.startswith("postgresql://") and "asyncpg" not in DATABASE_URL:
    DATABASE_URL = DATABASE_URL.replace("postgresql://", "postgresql+asyncpg://", 1)

# Debug: Print masked URL to verify format in logs
masked_url = DATABASE_URL
if "@" in DATABASE_URL:
    prefix = DATABASE_URL.split("@")[0]
    suffix = DATABASE_URL.split("@")[1]
    if ":" in prefix:
        parts = prefix.split(":")
        masked_url = f"{parts[0]}:***@{suffix}"

print(f"📡 Connecting to database: {masked_url}")

# Check if using SQLite to disable specific PostGIS features
IS_SQLITE = DATABASE_URL.startswith("sqlite")

connect_args = {"check_same_thread": False} if IS_SQLITE else {}
try:
    engine = create_async_engine(DATABASE_URL, echo=True, future=True, connect_args=connect_args)
except Exception as e:
    print(f"❌ CRITICAL: Failed to create engine with URL: {masked_url}")
    print(f"Error detail: {e}")
    raise e

async def init_db():
    max_retries = 5
    retry_delay = 5
    
    for i in range(max_retries):
        try:
            async with engine.begin() as conn:
                if not IS_SQLITE:
                    # Enable PostGIS extension only on PostgreSQL
                    await conn.execute(text("CREATE EXTENSION IF NOT EXISTS postgis;"))
                await conn.run_sync(SQLModel.metadata.create_all)
            print("✅ Database initialized successfully.")
            return
        except Exception as e:
            if i < max_retries - 1:
                print(f"⚠️ Database connection failed, retrying in {retry_delay}s... ({i+1}/{max_retries})")
                print(f"Error: {e}")
                await asyncio.sleep(retry_delay)
            else:
                print("❌ Max retries reached. Database initialisation failed.")
                raise e

async def get_session() -> AsyncSession:
    async_session = sessionmaker(
        engine, class_=AsyncSession, expire_on_commit=False
    )
    async with async_session() as session:
        yield session
