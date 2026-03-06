"""
Dependencias reutilizables de FastAPI para autenticación y filtrado multi-tenant.
"""
import uuid
from typing import Optional
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import select

from ...db.session import get_session
from ...models.auth import User, UserRole
from ...core.security import decode_access_token

# Esquema de seguridad Bearer
security = HTTPBearer()


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    session: AsyncSession = Depends(get_session)
) -> User:
    """Decodifica el JWT y retorna el usuario autenticado."""
    token = credentials.credentials
    payload = decode_access_token(token)
    
    if payload is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token inválido o expirado",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token inválido")
    
    result = await session.execute(select(User).where(User.id == uuid.UUID(user_id)))
    user = result.scalar_one_or_none()
    
    if not user or not user.is_active:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Usuario no encontrado o desactivado")
    
    return user


async def require_admin(current_user: User = Depends(get_current_user)) -> User:
    """Verificar que el usuario sea org_admin o super_admin."""
    if current_user.role not in [UserRole.ORG_ADMIN, UserRole.SUPER_ADMIN]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Se requiere rol de administrador"
        )
    return current_user


async def require_super_admin(current_user: User = Depends(get_current_user)) -> User:
    """Verificar que el usuario sea super_admin."""
    if current_user.role != UserRole.SUPER_ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Se requiere rol de super administrador"
        )
    return current_user


def get_org_filter(current_user: User) -> Optional[uuid.UUID]:
    """Retorna el organization_id para filtrar queries.
    Super admins ven todo (retorna None), los demás ven solo su org."""
    if current_user.role == UserRole.SUPER_ADMIN:
        return None  # Sin filtro
    return current_user.organization_id
