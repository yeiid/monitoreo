import uuid
from typing import List
from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import select
from fastapi import APIRouter, Depends, HTTPException, status
from geoalchemy2 import Geography
from sqlalchemy import func, cast

from ....db.session import get_session
from ....models.network import Route, FiberStrand
from ....models.auth import User
from ....schemas.network import RouteCreate, RouteRead, RouteUpdate
from ..deps import get_current_user, get_org_filter

router = APIRouter()

@router.post("", response_model=RouteRead, status_code=status.HTTP_201_CREATED)
async def create_route(
    data: RouteCreate,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    route_data = data.model_dump()
    if route_data.get("path"):
        coords = route_data["path"]["coordinates"]
        wkt_points = ", ".join(f"{c[0]} {c[1]}" for c in coords)
        route_data["path"] = f"LINESTRING({wkt_points})"
    db_route = Route(**route_data)
    session.add(db_route)
    await session.flush() # Get ID

    # Auto-generate strands
    TIA_598_COLORS = ["azul", "naranja", "verde", "marron", "gris", "blanco", "rojo", "negro", "amarillo", "violeta", "rosa", "aqua"]
    for i in range(db_route.capacity):
        color = TIA_598_COLORS[i % len(TIA_598_COLORS)]
        strand = FiberStrand(
            route_id=db_route.id,
            color=color,
            strand_number=i + 1,
            buffer_number=(i // 6) + 1
        )
        session.add(strand)

    await session.commit()
    await session.refresh(db_route)
    return db_route

@router.get("", response_model=List[RouteRead])
async def list_routes(
    node_id: str = None,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    statement = select(Route, func.ST_Length(cast(Route.path, Geography)))
    if node_id:
        statement = statement.where((Route.start_node_id == node_id) | (Route.end_node_id == node_id))
    statement = statement.order_by(Route.name)
    results = await session.execute(statement)
    
    routes = []
    for db_route, length in results.all():
        db_route.length_meters = length
        routes.append(db_route)
    return routes

@router.get("/{route_id}", response_model=RouteRead)
async def get_route(route_id: str, session: AsyncSession = Depends(get_session)):
    result = await session.execute(
        select(Route, func.ST_Length(cast(Route.path, Geography))).where(Route.id == route_id)
    )
    data = result.one_or_none()
    if not data:
        raise HTTPException(status_code=404, detail="Route not found")
    
    db_route, length = data
    db_route.length_meters = length
    return db_route

@router.put("/{route_id}", response_model=RouteRead)
async def update_route(route_id: str, data: RouteUpdate, session: AsyncSession = Depends(get_session)):
    result = await session.execute(select(Route).where(Route.id == route_id))
    route = result.scalar_one_or_none()
    if not route:
        raise HTTPException(status_code=404, detail="Route not found")
    update_data = data.model_dump(exclude_unset=True)
    if "path" in update_data and update_data["path"]:
        coords = update_data["path"]["coordinates"]
        wkt_points = ", ".join(f"{c[0]} {c[1]}" for c in coords)
        update_data["path"] = f"LINESTRING({wkt_points})"
    for key, value in update_data.items():
        setattr(route, key, value)
    session.add(route)
    await session.commit()
    await session.refresh(route)
    return route

@router.delete("/{route_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_route(route_id: uuid.UUID, session: AsyncSession = Depends(get_session)):
    result = await session.execute(select(Route).where(Route.id == route_id))
    route = result.scalar_one_or_none()
    if not route:
        raise HTTPException(status_code=404, detail="Route not found")
        
    strands_result = await session.execute(select(FiberStrand).where(FiberStrand.route_id == route_id))
    for strand in strands_result.scalars().all():
        await session.delete(strand)
        
    await session.delete(route)
    await session.commit()
