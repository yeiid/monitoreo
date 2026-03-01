import uuid
import enum
from typing import Optional, List, Any
from sqlalchemy import func, cast
from sqlmodel import Field, SQLModel, Relationship, Column
from geoalchemy2 import Geometry, Geography
from .base import BaseModel
import os
from dotenv import load_dotenv
import sqlalchemy as sa
from geoalchemy2 import Geometry, Geography

load_dotenv()
IS_SQLITE = os.getenv("DATABASE_URL", "").startswith("sqlite")

# Use String for geometry data when using SQLite to avoid PostGIS requirements
def get_geometry_column(geom_type: str, srid: int = 4326):
    if IS_SQLITE:
        return sa.Column(sa.String)
    return sa.Column(Geometry(geometry_type=geom_type, srid=srid))


class NodeType(str, enum.Enum):
    OLT = "OLT"
    ODF = "ODF"
    MUFLA = "MUFLA"
    CAJA_NAP = "CAJA_NAP"
    CLIENTE_ONU = "CLIENTE_ONU"


class SplitterType(str, enum.Enum):
    S1X4 = "1x4"
    S1X8 = "1x8"
    S1X16 = "1x16"


class RouteType(str, enum.Enum):
    PATCHCORD = "PATCHCORD"      # Fibre patch from OLT to ODF
    TRONCAL = "TRONCAL"         # Fibra principal desde ODF a Mufla
    DISTRIBUCION = "DISTRIBUCION" # Fibra secundaria entre Mufla y NAPs
    ACOMETIDA = "ACOMETIDA"       # Drop cable al cliente


# TIA-598 Color Standard for fiber
class FiberColor(str, enum.Enum):
    AZUL = "azul"
    NARANJA = "naranja"
    VERDE = "verde"
    MARRON = "marron"
    GRIS = "gris"
    BLANCO = "blanco"
    ROJO = "rojo"
    NEGRO = "negro"
    AMARILLO = "amarillo"
    VIOLETA = "violeta"
    ROSA = "rosa"
    AQUA = "aqua"


# ──────────────── Physical World ────────────────

class Node(BaseModel, table=True):
    """A physical point on the map: OLT, Mufla, NAP, or Client ONU."""
    __tablename__ = "nodes"

    name: str = Field(index=True)
    node_type: str = Field(index=True)  # Values from NodeType enum
    description: Optional[str] = None

    # Optical power measurement (dBm) - for MUFLA / NAP auditing
    optical_power_dbm: Optional[float] = Field(default=None)

    # Hardware details (JSONB) - for OLT: {"cards": 5, "ports_per_card": 16}
    hardware_details: Optional[dict] = Field(
        default=None,
        sa_column=sa.Column(sa.JSON)
    )

    # PostGIS Point
    location: Optional[Any] = Field(
        default=None,
        sa_column=get_geometry_column('POINT', srid=4326)
    )

    # Relationships
    splitters: List["Splitter"] = Relationship(
        back_populates="node",
        sa_relationship_kwargs={"cascade": "all, delete-orphan"}
    )
    
    routes_starting: List["Route"] = Relationship(
        back_populates="start_node",
        sa_relationship_kwargs={
            "primaryjoin": "Node.id==Route.start_node_id",
            "cascade": "all, delete-orphan"
        }
    )
    
    routes_ending: List["Route"] = Relationship(
        back_populates="end_node",
        sa_relationship_kwargs={
            "primaryjoin": "Node.id==Route.end_node_id",
            "cascade": "all, delete-orphan"
        }
    )


class Route(BaseModel, table=True):
    """A cable drawn on the map as a geographic line."""
    __tablename__ = "routes"
    model_config = {}

    name: str = Field(index=True)
    route_type: str = Field(default="TRONCAL")  # TRONCAL, DISTRIBUCION, ACOMETIDA
    capacity: int = Field(default=12)  # Number of fiber strands in the cable (6, 12, 24, 48...)
    description: Optional[str] = None

    # OLT origin - which card/port this cable leaves from
    source_card: Optional[int] = Field(default=None)
    source_port: Optional[int] = Field(default=None)

    # PostGIS LineString
    path: Optional[Any] = Field(
        default=None,
        sa_column=get_geometry_column('LINESTRING', srid=4326)
    )

    # Foreign keys to related nodes (start and end)
    start_node_id: Optional[uuid.UUID] = Field(default=None, foreign_key="nodes.id")
    end_node_id: Optional[uuid.UUID] = Field(default=None, foreign_key="nodes.id")

    # Relationships
    strands: List["FiberStrand"] = Relationship(
        back_populates="route",
        sa_relationship_kwargs={"cascade": "all, delete-orphan"}
    )
    start_node: Optional["Node"] = Relationship(
        back_populates="routes_starting",
        sa_relationship_kwargs={"foreign_keys": "[Route.start_node_id]"}
    )
    end_node: Optional["Node"] = Relationship(
        back_populates="routes_ending",
        sa_relationship_kwargs={"foreign_keys": "[Route.end_node_id]"}
    )

    @property
    def length_meters(self) -> Optional[float]:
        return getattr(self, "_length_meters", None)

    @length_meters.setter
    def length_meters(self, value: float):
        self._length_meters = value


# ──────────────── Logical World ────────────────

class FiberStrand(BaseModel, table=True):
    """A single fiber thread within a cable/Route."""
    __tablename__ = "fiber_strands"

    route_id: Optional[uuid.UUID] = Field(default=None, foreign_key="routes.id")
    color: str  # Values from FiberColor enum (TIA-598 standard)
    strand_number: int  # Position within the cable (1-based)
    buffer_number: int = Field(default=1)  # Tube/Buffer index (e.g. 1-4 for 24f cable)
    optical_power_dbm: Optional[float] = Field(default=None)

    # Relationships
    route: Optional[Route] = Relationship(back_populates="strands")


class Splitter(BaseModel, table=True):
    """A fiber splitter device located inside a Node (Mufla or NAP)."""
    __tablename__ = "splitters"

    node_id: Optional[uuid.UUID] = Field(default=None, foreign_key="nodes.id")
    splitter_type: str  # Values from SplitterType enum
    name: str = Field(default="Splitter")
    
    # The strand providing light to this splitter
    input_strand_id: Optional[uuid.UUID] = Field(default=None, foreign_key="fiber_strands.id")
    
    # Configuration and port state (JSON)
    # e.g. {"input_connected": true, "ports": [{"id": 0, "status": "active"}]}
    configuration: Optional[dict] = Field(
        default_factory=dict,
        sa_column=sa.Column(sa.JSON)
    )

    # Relationships
    node: Optional[Node] = Relationship(back_populates="splitters")


class Splice(BaseModel, table=True):
    """A logical connection (splice) between fiber elements inside a Node."""
    __tablename__ = "splices"

    node_id: Optional[uuid.UUID] = Field(default=None, index=True)

    # Power resulting from this splice
    optical_power_dbm: Optional[float] = Field(default=None)

    # Source side of the splice
    source_type: str  # 'strand' | 'splitter_in' | 'splitter_out'
    source_id: Optional[uuid.UUID] = None
    source_port: Optional[int] = None  # Port number on splitter output
    
    # Audit fields for professional inventory tracking
    input_node_id: Optional[uuid.UUID] = None       # ID of the remote node at the other end of the input cable
    output_node_id: Optional[uuid.UUID] = None      # ID of the remote node at the other end of the output cable
    input_fiber_index: Optional[int] = None         # Physical strand number in the input cable
    output_fiber_index: Optional[int] = None        # Physical strand number in the output cable
    loss_db: float = Field(default=0.1)             # Signal loss for this specific junction (default 0.1 for fusion)

    # Target side of the splice
    target_type: str  # 'strand' | 'splitter_in' | 'splitter_out'
    target_id: Optional[uuid.UUID] = None
    target_port: Optional[int] = None  # Port number on splitter output

    # Visual metadata for React Flow diagram positions
    extra_metadata: Optional[dict] = Field(
        default_factory=dict,
        sa_column=sa.Column(sa.JSON)
    )
