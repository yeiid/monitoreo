"""
Endpoints de gestión de usuarios (técnicos) — Solo para admins de organización.
"""
import uuid
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import select, func
from pydantic import BaseModel as PydanticModel

from ....db.session import get_session
from ....models.auth import User, UserRole, Organization, PLAN_LIMITS, SubscriptionPlan
from ....core.security import get_password_hash
from ..deps import get_current_user, require_admin

router = APIRouter()


# ── Schemas ──

class CreateUserRequest(PydanticModel):
    email: str
    full_name: str
    password: str
    role: str = UserRole.TECHNICIAN  # Default: técnico

class UpdateUserRequest(PydanticModel):
    full_name: str | None = None
    email: str | None = None
    is_active: bool | None = None

class UserResponse(PydanticModel):
    id: str
    email: str
    full_name: str
    role: str
    is_active: bool
    organization_id: str | None = None
    created_at: str


# ── Endpoints ──

@router.get("", response_model=List[UserResponse])
async def list_users(
    admin: User = Depends(require_admin),
    session: AsyncSession = Depends(get_session)
):
    """Listar los usuarios de la organización del admin."""
    query = select(User).where(User.organization_id == admin.organization_id)
    result = await session.execute(query)
    users = result.scalars().all()
    
    return [
        UserResponse(
            id=str(u.id), email=u.email, full_name=u.full_name,
            role=u.role, is_active=u.is_active,
            organization_id=str(u.organization_id) if u.organization_id else None,
            created_at=u.created_at.isoformat()
        )
        for u in users
    ]


@router.post("", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def create_user(
    data: CreateUserRequest,
    admin: User = Depends(require_admin),
    session: AsyncSession = Depends(get_session)
):
    """Crear un nuevo técnico en la organización del admin."""
    # Verificar límite del plan
    count_result = await session.execute(
        select(func.count()).select_from(User).where(
            User.organization_id == admin.organization_id,
            User.role == UserRole.TECHNICIAN,
            User.is_active == True
        )
    )
    current_count = count_result.scalar_one()
    
    # Obtener la organización para verificar el límite
    org_result = await session.execute(
        select(Organization).where(Organization.id == admin.organization_id)
    )
    org = org_result.scalar_one_or_none()
    if org and current_count >= org.max_technicians:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Límite de técnicos alcanzado ({org.max_technicians}). Actualiza tu plan."
        )
    
    # Verificar email duplicado
    existing = await session.execute(select(User).where(User.email == data.email))
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="El email ya está registrado")
    
    # Solo se pueden crear técnicos (no admins)
    if data.role not in [UserRole.TECHNICIAN]:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Solo se pueden crear cuentas de técnico")
    
    user = User(
        email=data.email,
        full_name=data.full_name,
        hashed_password=get_password_hash(data.password),
        role=UserRole.TECHNICIAN,
        organization_id=admin.organization_id,
        is_active=True
    )
    session.add(user)
    await session.commit()
    await session.refresh(user)
    
    return UserResponse(
        id=str(user.id), email=user.email, full_name=user.full_name,
        role=user.role, is_active=user.is_active,
        organization_id=str(user.organization_id) if user.organization_id else None,
        created_at=user.created_at.isoformat()
    )


@router.put("/{user_id}", response_model=UserResponse)
async def update_user(
    user_id: uuid.UUID,
    data: UpdateUserRequest,
    admin: User = Depends(require_admin),
    session: AsyncSession = Depends(get_session)
):
    """Editar un técnico de la organización."""
    result = await session.execute(
        select(User).where(User.id == user_id, User.organization_id == admin.organization_id)
    )
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Usuario no encontrado")
    
    if data.full_name is not None:
        user.full_name = data.full_name
    if data.email is not None:
        user.email = data.email
    if data.is_active is not None:
        user.is_active = data.is_active
    
    session.add(user)
    await session.commit()
    await session.refresh(user)
    
    return UserResponse(
        id=str(user.id), email=user.email, full_name=user.full_name,
        role=user.role, is_active=user.is_active,
        organization_id=str(user.organization_id) if user.organization_id else None,
        created_at=user.created_at.isoformat()
    )


@router.delete("/{user_id}")
async def deactivate_user(
    user_id: uuid.UUID,
    admin: User = Depends(require_admin),
    session: AsyncSession = Depends(get_session)
):
    """Desactivar un técnico (soft delete)."""
    result = await session.execute(
        select(User).where(User.id == user_id, User.organization_id == admin.organization_id)
    )
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Usuario no encontrado")
    
    if user.role == UserRole.ORG_ADMIN:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="No se puede desactivar al administrador")
    
    user.is_active = False
    session.add(user)
    await session.commit()
    
    return {"message": f"Usuario {user.full_name} desactivado exitosamente"}
