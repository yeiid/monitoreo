"""
Script para crear el Super Admin inicial del sistema.
Ejecutar una sola vez al configurar el servidor:

    python -m app.seed

El Super Admin puede luego crear organizaciones y sus respectivos admins desde la API.
"""
import asyncio
import os
from dotenv import load_dotenv

load_dotenv()

from .db.session import init_db, get_session
from .models.auth import User, UserRole
from .core.security import get_password_hash
from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import select
from .db.session import engine
from sqlalchemy.ext.asyncio import async_sessionmaker


async def seed():
    # Primero inicializar las tablas
    await init_db()
    
    async_session = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    
    async with async_session() as session:
        # Verificar si ya existe un super admin
        result = await session.execute(
            select(User).where(User.role == UserRole.SUPER_ADMIN)
        )
        existing = result.scalar_one_or_none()
        
        if existing:
            print(f"⚠️ Ya existe un Super Admin: {existing.email}")
            print("No se creará otro. Si quieres reiniciar, elimina la tabla 'users'.")
            return
        
        # Crear Super Admin
        email = os.getenv("SUPER_ADMIN_EMAIL", "admin@ftth-mapper.com")
        password = os.getenv("SUPER_ADMIN_PASSWORD", "admin123")
        name = os.getenv("SUPER_ADMIN_NAME", "Super Administrador")
        
        admin = User(
            email=email,
            full_name=name,
            hashed_password=get_password_hash(password),
            role=UserRole.SUPER_ADMIN,
            organization_id=None,  # Super admin no pertenece a ninguna org
            is_active=True
        )
        session.add(admin)
        await session.commit()
        
        print(f"✅ Super Admin creado exitosamente:")
        print(f"   Email: {email}")
        print(f"   Password: {password}")
        print(f"   ⚠️ ¡CAMBIA LA CONTRASEÑA EN PRODUCCIÓN!")


if __name__ == "__main__":
    asyncio.run(seed())
