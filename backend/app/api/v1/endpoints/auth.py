"""
Endpoints de autenticación: login, perfil, cambio de contraseña.
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import select
from pydantic import BaseModel as PydanticModel

from ....db.session import get_session
from ....models.auth import User
from ....core.security import verify_password, get_password_hash, create_access_token
from ..deps import get_current_user

router = APIRouter()


# ── Schemas ──

class LoginRequest(PydanticModel):
    email: str
    password: str

class LoginResponse(PydanticModel):
    access_token: str
    token_type: str = "bearer"
    user: dict

class ChangePasswordRequest(PydanticModel):
    current_password: str
    new_password: str


# ── Endpoints ──

@router.post("/login", response_model=LoginResponse)
async def login(data: LoginRequest, session: AsyncSession = Depends(get_session)):
    """Autenticar usuario con email y contraseña."""
    result = await session.execute(select(User).where(User.email == data.email))
    user = result.scalar_one_or_none()

    if not user or not verify_password(data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Email o contraseña incorrectos"
        )
    
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Cuenta desactivada. Contacta al administrador."
        )

    token = create_access_token(data={"sub": str(user.id), "role": user.role})

    return LoginResponse(
        access_token=token,
        user={
            "id": str(user.id),
            "email": user.email,
            "full_name": user.full_name,
            "role": user.role,
            "organization_id": str(user.organization_id) if user.organization_id else None,
        }
    )


@router.get("/me")
async def get_me(current_user: User = Depends(get_current_user)):
    """Obtener datos del usuario autenticado."""
    return {
        "id": str(current_user.id),
        "email": current_user.email,
        "full_name": current_user.full_name,
        "role": current_user.role,
        "organization_id": str(current_user.organization_id) if current_user.organization_id else None,
        "is_active": current_user.is_active,
    }


@router.post("/change-password")
async def change_password(
    data: ChangePasswordRequest,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session)
):
    """Cambiar la contraseña del usuario autenticado."""
    if not verify_password(data.current_password, current_user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="La contraseña actual es incorrecta"
        )
    
    current_user.hashed_password = get_password_hash(data.new_password)
    session.add(current_user)
    await session.commit()
    
    return {"message": "Contraseña actualizada exitosamente"}
