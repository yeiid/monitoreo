"""
Script para crear el Super Admin inicial del sistema.
Ejecutar una sola vez al configurar el servidor:

    python -m app.seed

El Super Admin puede luego crear organizaciones y sus respectivos admins desde la API.
"""
import asyncio
import os
import secrets
import string
from dotenv import load_dotenv

if os.path.exists(".env"):
    load_dotenv()

from app.db.session import init_db, get_session
from app.models.auth import User, UserRole
from app.core.security import get_password_hash
from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import select
from app.db.session import engine
from sqlalchemy.ext.asyncio import async_sessionmaker


def generate_secure_password(length: int = 16) -> str:
    """Genera una contraseña segura con mayúsculas, minúsculas, números y símbolos."""
    alphabet = string.ascii_letters + string.digits + "!@#$%^&*"
    # Asegurar al menos un carácter de cada tipo
    password = [
        secrets.choice(string.ascii_uppercase),
        secrets.choice(string.ascii_lowercase),
        secrets.choice(string.digits),
        secrets.choice("!@#$%^&*"),
    ]
    password += [secrets.choice(alphabet) for _ in range(length - 4)]
    # Mezclar
    import random
    random.SystemRandom().shuffle(password)
    return ''.join(password)


async def seed_data(session: AsyncSession):
    """Lógica para crear el Super Admin inicial si no existe."""
    # Verificar si ya existe un super admin
    result = await session.execute(
        select(User).where(User.role == UserRole.SUPER_ADMIN)
    )
    existing = result.scalar_one_or_none()
    
    if existing:
        print(f"Ya existe un Super Admin: {existing.email}")
        return
    
    # Crear Super Admin
    email = os.getenv("SUPER_ADMIN_EMAIL", "admin@ftth-mapper.com")
    name = os.getenv("SUPER_ADMIN_NAME", "Super Administrador")

    # Si no se proporciona contraseña, generar una segura
    password = os.getenv("SUPER_ADMIN_PASSWORD")
    if not password or password in ("admin123", "CAMBIA_ESTA_CONTRASEÑA"):
        password = generate_secure_password()
        print(f"   Contraseña generada automáticamente (guárdala en un lugar seguro)")
    
    admin = User(
        email=email,
        full_name=name,
        hashed_password=get_password_hash(password),
        role=UserRole.SUPER_ADMIN,
        organization_id=None,
        is_active=True
    )
    session.add(admin)
    await session.commit()
    
    print(f"Super Admin creado exitosamente:")
    print(f"   Email: {email}")
    print(f"   Password: {password}")


async def seed():
    # Para ejecución manual desde CLI
    await init_db()
    async_session = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    async with async_session() as session:
        await seed_data(session)


if __name__ == "__main__":
    asyncio.run(seed())
