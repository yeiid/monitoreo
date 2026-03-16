"""
Endpoints de gestión de organizaciones — Solo para Super Admin.
"""
import uuid
import re
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import select
from pydantic import BaseModel as PydanticModel

from ....db.session import get_session
from ....models.auth import Organization, User, UserRole, PLAN_LIMITS, SubscriptionPlan
from ....core.security import get_password_hash
from ..deps import require_super_admin

router = APIRouter()


# ── Schemas ──

class CreateOrgRequest(PydanticModel):
    name: str
    plan: str = SubscriptionPlan.FREE
    # Admin inicial
    admin_email: str
    admin_name: str
    admin_password: str

class UpdateOrgRequest(PydanticModel):
    name: str | None = None
    plan: str | None = None
    is_active: bool | None = None

class OrgResponse(PydanticModel):
    id: str
    name: str
    slug: str
    plan: str
    max_technicians: int
    is_active: bool
    user_count: int = 0


# ── Endpoints ──

@router.get("", response_model=List[OrgResponse])
async def list_organizations(
    _: User = Depends(require_super_admin),
    session: AsyncSession = Depends(get_session)
):
    """Listar todas las organizaciones."""
    result = await session.execute(select(Organization))
    orgs = result.scalars().all()
    
    responses = []
    for org in orgs:
        # Contar usuarios
        users_result = await session.execute(
            select(User).where(User.organization_id == org.id)
        )
        user_count = len(users_result.scalars().all())
        
        responses.append(OrgResponse(
            id=str(org.id), name=org.name, slug=org.slug,
            plan=org.plan, max_technicians=org.max_technicians,
            is_active=org.is_active, user_count=user_count
        ))
    
    return responses


@router.post("", response_model=OrgResponse, status_code=status.HTTP_201_CREATED)
async def create_organization(
    data: CreateOrgRequest,
    _: User = Depends(require_super_admin),
    session: AsyncSession = Depends(get_session)
):
    """Crear una nueva organización con su admin inicial."""
    # Generar slug
    slug = re.sub(r'[^a-z0-9]+', '-', data.name.lower()).strip('-')
    
    # Verificar slug duplicado
    existing = await session.execute(select(Organization).where(Organization.slug == slug))
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Ya existe una organización con ese nombre")
    
    # Verificar email duplicado
    existing_email = await session.execute(select(User).where(User.email == data.admin_email))
    if existing_email.scalar_one_or_none():
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="El email del admin ya está registrado")
    
    # Obtener límites del plan
    plan_enum = SubscriptionPlan(data.plan) if data.plan in [p.value for p in SubscriptionPlan] else SubscriptionPlan.FREE
    limits = PLAN_LIMITS[plan_enum]
    
    # Crear organización
    org = Organization(
        name=data.name,
        slug=slug,
        plan=data.plan,
        max_technicians=limits["max_technicians"],
        is_active=True
    )
    session.add(org)
    await session.flush()  # Obtener el ID
    
    # Crear admin de la organización
    admin_user = User(
        email=data.admin_email,
        full_name=data.admin_name,
        hashed_password=get_password_hash(data.admin_password),
        role=UserRole.ORG_ADMIN,
        organization_id=org.id,
        is_active=True
    )
    session.add(admin_user)
    await session.commit()
    await session.refresh(org)
    
    return OrgResponse(
        id=str(org.id), name=org.name, slug=org.slug,
        plan=org.plan, max_technicians=org.max_technicians,
        is_active=org.is_active, user_count=1
    )


@router.put("/{org_id}", response_model=OrgResponse)
async def update_organization(
    org_id: uuid.UUID,
    data: UpdateOrgRequest,
    _: User = Depends(require_super_admin),
    session: AsyncSession = Depends(get_session)
):
    """Editar una organización (plan, nombre, activación)."""
    result = await session.execute(select(Organization).where(Organization.id == org_id))
    org = result.scalar_one_or_none()
    if not org:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Organización no encontrada")
    
    if data.name is not None:
        org.name = data.name
    if data.plan is not None:
        plan_enum = SubscriptionPlan(data.plan) if data.plan in [p.value for p in SubscriptionPlan] else SubscriptionPlan.FREE
        org.plan = data.plan
        org.max_technicians = PLAN_LIMITS[plan_enum]["max_technicians"]
    if data.is_active is not None:
        org.is_active = data.is_active
    
    session.add(org)
    await session.commit()
    await session.refresh(org)
    
    # Contar usuarios
    users_result = await session.execute(select(User).where(User.organization_id == org.id))
    user_count = len(users_result.scalars().all())
    
    return OrgResponse(
        id=str(org.id), name=org.name, slug=org.slug,
        plan=org.plan, max_technicians=org.max_technicians,
        is_active=org.is_active, user_count=user_count
    )
