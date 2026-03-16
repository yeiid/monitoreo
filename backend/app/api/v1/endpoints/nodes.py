import uuid
from typing import List
import sqlalchemy as sa
from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import select
from fastapi import APIRouter, Depends, HTTPException, status
from geoalchemy2 import Geography
from sqlalchemy import func, cast

from ....db.session import get_session
from ....models.network import Node, Route, FiberStrand, Splitter, Splice
from ....models.auth import User
from ....schemas.network import (
    NodeCreate, NodeRead, NodeUpdate,
    ContinuousTraceRequest, ContinuousTraceResponse,
    RouteCreate
)
from ..deps import get_current_user, get_org_filter

from typing import List, Optional, Any

router = APIRouter()

@router.get("", response_model=List[NodeRead])
async def list_nodes(
    node_type: str = None,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    statement = select(Node)
    # Filtrar por organización del usuario
    org_id = get_org_filter(current_user)
    if org_id:
        statement = statement.where(Node.organization_id == org_id)
    if node_type:
        statement = statement.where(Node.node_type == node_type)
    results = await session.execute(statement)
    return results.scalars().all()

@router.post("", response_model=NodeRead, status_code=status.HTTP_201_CREATED)
async def create_node(
    data: NodeCreate,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    node_data = data.model_dump()
    if node_data.get("location"):
        loc = node_data["location"]
        node_data["location"] = f"POINT({loc['lng']} {loc['lat']})"
    # Asignar organización y creador
    node_data["organization_id"] = current_user.organization_id
    node_data["created_by"] = current_user.id
    db_node = Node(**node_data)
    session.add(db_node)
    await session.commit()
    await session.refresh(db_node)
    return db_node

def to_uuid(val: Any) -> Optional[uuid.UUID]:
    if not val or val == "null":
        return None
    if isinstance(val, uuid.UUID):
        return val
    try:
        return uuid.UUID(str(val))
    except (ValueError, AttributeError):
        return None

@router.get("/{node_id}", response_model=NodeRead)
async def get_node(node_id: str, session: AsyncSession = Depends(get_session)):
    # Handle both UUID and string IDs (like "cable-in")
    clean_id = to_uuid(node_id)
    if not clean_id:
         raise HTTPException(status_code=400, detail="Invalid UUID format")
         
    result = await session.execute(select(Node).where(Node.id == clean_id))
    db_node = result.scalar_one_or_none()
    if not db_node:
        raise HTTPException(status_code=404, detail="Nodo no encontrado")
    return db_node

@router.post("/{node_id}/sync-splices")
async def sync_node_splices(
    node_id: uuid.UUID, 
    data: dict, # Contains { "splices": [...], "splitters": [...] }
    session: AsyncSession = Depends(get_session)
):
    """
    Atomic sync of all internal connections (splices and splitters) for a node.
    Clears existing records for this node and recreates them from the payload.
    """
    try:
        # 1. Verify node exists
        node_result = await session.execute(select(Node).where(Node.id == node_id))
        db_node = node_result.scalar_one_or_none()
        if not db_node:
            raise HTTPException(status_code=404, detail="Nodo no encontrado")

        # 2. Delete existing splices and splitters for this node using SQLAlchemy's delete
        from sqlalchemy import delete
        await session.execute(delete(Splice).where(Splice.node_id == node_id))
        await session.execute(delete(Splitter).where(Splitter.node_id == node_id))
        
        # 3. Create new Splitters
        splitter_id_map = {}
        for s_data in data.get("splitters", []):
            diag_id = s_data.get("diagram_id")
            new_s = Splitter(
                node_id=node_id,
                splitter_type=s_data.get("splitter_type", "1x8"),
                name=s_data.get("name", "Splitter"),
                configuration=s_data.get("configuration", {})
            )
            session.add(new_s)
            await session.flush() # Get UUID
            if diag_id:
                splitter_id_map[diag_id] = str(new_s.id)

        # 4. Create new Splices
        new_splices = []
        for sp_data in data.get("splices", []):
            # Resolve source/target IDs if they refer to diagram splitters
            src_id = sp_data.get("source_id")
            if sp_data.get("source_type") in ["splitter_in", "splitter_out"] and src_id in splitter_id_map:
                src_id = splitter_id_map[src_id]
                
            tgt_id = sp_data.get("target_id")
            if sp_data.get("target_type") in ["splitter_in", "splitter_out"] and tgt_id in splitter_id_map:
                tgt_id = splitter_id_map[tgt_id]

            # SANITIZE UUIDs (handle "cable-in", "cable-out" etc)
            clean_src_id = to_uuid(src_id)
            clean_tgt_id = to_uuid(tgt_id)

            splice = Splice(
                node_id=node_id,
                source_type=sp_data.get("source_type"),
                source_id=clean_src_id,
                source_port=sp_data.get("source_port"),
                target_type=sp_data.get("target_type"),
                target_id=clean_tgt_id,
                target_port=sp_data.get("target_port"),
                extra_metadata=sp_data.get("extra_metadata", {})
            )
            new_splices.append(splice)
            session.add(splice)

        await session.commit()
        return {"status": "ok", "message": f"Sincronizados {len(new_splices)} empalmes y {len(splitter_id_map)} splitters"}
        
    except Exception as e:
        await session.rollback()
        import traceback
        err_msg = f"{type(e).__name__}: {str(e)}"
        print(f"ERROR in sync_node_splices: {err_msg}\n{traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=f"Error en sincronización: {err_msg}")

@router.put("/{node_id}", response_model=NodeRead)
async def update_node(node_id: str, data: NodeUpdate, session: AsyncSession = Depends(get_session)):
    result = await session.execute(select(Node).where(Node.id == node_id))
    node = result.scalar_one_or_none()
    if not node:
        raise HTTPException(status_code=404, detail="Node not found")
    update_data = data.model_dump(exclude_unset=True)
    if "location" in update_data and update_data["location"]:
        loc = update_data["location"]
        update_data["location"] = f"POINT({loc['lng']} {loc['lat']})"
    for key, value in update_data.items():
        setattr(node, key, value)
    session.add(node)
    await session.commit()
    await session.refresh(node)
    return node

@router.delete("/{node_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_node(node_id: uuid.UUID, session: AsyncSession = Depends(get_session)):
    result = await session.execute(select(Node).where(Node.id == node_id))
    node = result.scalar_one_or_none()
    if not node:
        raise HTTPException(status_code=404, detail="Node not found")
        
    # Cascade deletes
    routes_result = await session.execute(
        select(Route).where((Route.start_node_id == node_id) | (Route.end_node_id == node_id))
    )
    for route in routes_result.scalars().all():
        strands_result = await session.execute(select(FiberStrand).where(FiberStrand.route_id == route.id))
        for strand in strands_result.scalars().all():
            await session.delete(strand)
        await session.delete(route)
        
    splitters_result = await session.execute(select(Splitter).where(Splitter.node_id == node_id))
    for splitter in splitters_result.scalars().all():
        await session.delete(splitter)
        
    splices_result = await session.execute(select(Splice).where(Splice.node_id == node_id))
    for splice in splices_result.scalars().all():
        await session.delete(splice)
        
    await session.delete(node)
    await session.commit()

