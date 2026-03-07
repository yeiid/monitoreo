"""
Script utilitario para crear índices GIST espaciales manualmente.
Útil si la base de datos ya tiene datos y se desea asegurar el rendimiento.

Ejecución:
cd backend
python -m app.scripts.create_spatial_indexes
"""
import asyncio
import os
import sys

# Añadir el directorio raíz al path para que los imports funcionen
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..")))

from sqlalchemy import text
from app.db.session import engine

async def create_indexes():
    print("🚀 Iniciando creación de índices espaciales...")
    try:
        async with engine.begin() as conn:
            # Índice para Nodos (POINT)
            print("  - Creando índice GIST para nodes(location)...")
            await conn.execute(text(
                "CREATE INDEX IF NOT EXISTS idx_nodes_location_gist ON nodes USING GIST (location);"
            ))
            
            # Índice para Rutas (LINESTRING)
            print("  - Creando índice GIST para routes(path)...")
            await conn.execute(text(
                "CREATE INDEX IF NOT EXISTS idx_routes_path_gist ON routes USING GIST (path);"
            ))
            
        print("✅ Índices GIST creados exitosamente.")
    except Exception as e:
        print(f"❌ Error al crear índices: {e}")

if __name__ == "__main__":
    asyncio.run(create_indexes())
