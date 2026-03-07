import uuid
from pydantic import BaseModel, ConfigDict, field_validator
from typing import Optional, List, Dict, Any
from geoalchemy2.shape import to_shape

# ──────── GeoJSON Helpers ────────

class LocationPoint(BaseModel):
    lat: float
    lng: float

class LineCoordinates(BaseModel):
    coordinates: List[List[float]]  # [[lng, lat], [lng, lat], ...]

# ──────── Node Schemas ────────

class NodeBase(BaseModel):
    name: str
    node_type: str  # OLT, MUFLA, CAJA_NAP, CLIENTE_ONU
    description: Optional[str] = None
    optical_power_dbm: Optional[float] = None
    status: str = "online"
    hardware_details: Optional[Dict[str, Any]] = None
    location: Optional[LocationPoint] = None

class NodeCreate(NodeBase):
    pass

class NodeUpdate(BaseModel):
    name: Optional[str] = None
    node_type: Optional[str] = None
    description: Optional[str] = None
    optical_power_dbm: Optional[float] = None
    status: Optional[str] = None
    hardware_details: Optional[Dict[str, Any]] = None
    location: Optional[LocationPoint] = None

class NodeRead(NodeBase):
    id: uuid.UUID

    @field_validator("location", mode="before")
    @classmethod
    def convert_geometry(cls, v: Any) -> Optional[Dict[str, float]]:
        if v is None:
            return None
        try:
            shape = to_shape(v)
            return {"lat": shape.y, "lng": shape.x}
        except Exception:
            return v

    model_config = ConfigDict(from_attributes=True)

# ──────── Route Schemas ────────

class RouteBase(BaseModel):
    name: str
    route_type: str = "TRONCAL"
    capacity: int = 12
    description: Optional[str] = None
    start_node_id: Optional[uuid.UUID] = None
    end_node_id: Optional[uuid.UUID] = None
    length_meters: Optional[float] = None
    source_card: Optional[int] = None
    source_port: Optional[int] = None
    path: Optional[LineCoordinates] = None

class RouteCreate(RouteBase):
    pass

class RouteUpdate(BaseModel):
    name: Optional[str] = None
    route_type: Optional[str] = None
    capacity: Optional[int] = None
    description: Optional[str] = None
    start_node_id: Optional[uuid.UUID] = None
    end_node_id: Optional[uuid.UUID] = None
    length_meters: Optional[float] = None
    source_card: Optional[int] = None
    source_port: Optional[int] = None
    path: Optional[LineCoordinates] = None

class RouteRead(RouteBase):
    id: uuid.UUID

    @field_validator("path", mode="before")
    @classmethod
    def convert_linestring(cls, v: Any) -> Optional[Dict]:
        if v is None:
            return None
        try:
            shape = to_shape(v)
            coords = [[c[0], c[1]] for c in shape.coords]
            return {"coordinates": coords}
        except Exception:
            return v

    model_config = ConfigDict(from_attributes=True)

# ──────── FiberStrand Schemas ────────

class FiberStrandBase(BaseModel):
    color: str  # TIA-598 color
    strand_number: int
    buffer_number: int = 1
    optical_power_dbm: Optional[float] = None
    route_id: Optional[uuid.UUID] = None

class FiberStrandCreate(FiberStrandBase):
    pass

class FiberStrandRead(FiberStrandBase):
    id: uuid.UUID
    model_config = ConfigDict(from_attributes=True)

# ──────── Splitter Schemas ────────

class SplitterBase(BaseModel):
    node_id: Optional[uuid.UUID] = None
    splitter_type: str  # 1x4, 1x8, 1x16
    name: str = "Splitter"
    input_strand_id: Optional[uuid.UUID] = None
    configuration: Optional[Dict[str, Any]] = None

class SplitterCreate(SplitterBase):
    pass

class SplitterRead(SplitterBase):
    id: uuid.UUID
    model_config = ConfigDict(from_attributes=True)

# ──────── Splice Schemas ────────

class SpliceBase(BaseModel):
    node_id: Optional[uuid.UUID] = None
    optical_power_dbm: Optional[float] = None
    source_type: str  # 'strand', 'splitter_in', 'splitter_out'
    source_id: Optional[uuid.UUID] = None
    source_port: Optional[int] = None
    target_type: str
    target_id: Optional[uuid.UUID] = None
    target_port: Optional[int] = None
    
    # Audit fields
    input_node_id: Optional[uuid.UUID] = None
    output_node_id: Optional[uuid.UUID] = None
    input_fiber_index: Optional[int] = None
    output_fiber_index: Optional[int] = None
    loss_db: float = 0.1
    
    extra_metadata: Optional[Dict[str, Any]] = None

class SpliceCreate(SpliceBase):
    pass

class SpliceRead(SpliceBase):
    id: uuid.UUID
    model_config = ConfigDict(from_attributes=True)

# ──────── Bulk strand generation helper ────────

class GenerateStrandsRequest(BaseModel):
    """Generate all fiber strands for a route based on its capacity."""
    route_id: uuid.UUID

# ──────── Continuous Trace Schemas ────────

class ContinuousTraceRequest(BaseModel):
    """Initial payload for the continuous drafting flow."""
    path: LineCoordinates
    start_node_id: uuid.UUID
    node_data: NodeCreate  # Data for the NEW node to create at the end
    route_data: RouteCreate # Data for the NEW cable/route

class ContinuousTraceResponse(BaseModel):
    """Response containing both the created node and route."""
    node: NodeRead
    route: RouteRead
