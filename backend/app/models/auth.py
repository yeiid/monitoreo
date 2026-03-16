import uuid
import enum
from typing import Optional, List
from sqlmodel import Field, SQLModel, Relationship
from .base import BaseModel
import sqlalchemy as sa


class UserRole(str, enum.Enum):
    SUPER_ADMIN = "super_admin"
    ORG_ADMIN = "org_admin"
    TECHNICIAN = "technician"


class SubscriptionPlan(str, enum.Enum):
    FREE = "free"          # 1 admin, 2 técnicos
    BASIC = "basic"        # 1 admin, 5 técnicos
    PRO = "pro"            # 1 admin, 20 técnicos
    ENTERPRISE = "enterprise"  # Ilimitado


# Límites por plan
PLAN_LIMITS = {
    SubscriptionPlan.FREE: {"max_technicians": 2},
    SubscriptionPlan.BASIC: {"max_technicians": 5},
    SubscriptionPlan.PRO: {"max_technicians": 20},
    SubscriptionPlan.ENTERPRISE: {"max_technicians": 999},
}


class Organization(BaseModel, table=True):
    """Empresa ISP que contrata el servicio."""
    __tablename__ = "organizations"

    name: str = Field(index=True)
    slug: str = Field(unique=True, index=True)  # URL-friendly name, e.g. "isp-alpha"
    plan: str = Field(default=SubscriptionPlan.FREE)
    max_technicians: int = Field(default=2)
    is_active: bool = Field(default=True)
    description: Optional[str] = None

    # Relationships
    users: List["User"] = Relationship(
        back_populates="organization",
        sa_relationship_kwargs={"cascade": "all, delete-orphan"}
    )


class User(BaseModel, table=True):
    """Usuario del sistema (Super Admin, Admin de Org, o Técnico)."""
    __tablename__ = "users"

    email: str = Field(unique=True, index=True)
    hashed_password: str
    full_name: str
    role: str = Field(default=UserRole.TECHNICIAN, index=True)
    is_active: bool = Field(default=True)

    # Organización a la que pertenece (null para super_admin)
    organization_id: Optional[uuid.UUID] = Field(default=None, foreign_key="organizations.id")

    # Relationships
    organization: Optional[Organization] = Relationship(back_populates="users")
