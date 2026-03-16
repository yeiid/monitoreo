import uuid
from datetime import datetime, timezone
from typing import Optional
from sqlmodel import Field, SQLModel
from sqlalchemy.dialects.postgresql import UUID as PG_UUID
import sqlalchemy as sa

class BaseModel(SQLModel):
    id: uuid.UUID = Field(
        default_factory=uuid.uuid4,
        primary_key=True,
        sa_type=PG_UUID(as_uuid=True)
    )
    created_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc),
        sa_type=sa.DateTime(timezone=True),
        sa_column_kwargs={"server_default": sa.func.now()}
    )
    updated_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc),
        sa_type=sa.DateTime(timezone=True),
        sa_column_kwargs={"server_default": sa.func.now(), "onupdate": sa.func.now()}
    )
