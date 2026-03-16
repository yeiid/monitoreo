from typing import List
from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import select
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import func, cast
from geoalchemy2 import Geography

from ....db.session import get_session
from ....models.network import Node, Route, FiberStrand, Splitter, Splice
from ....utils.optical_physics import (
    calculate_route_loss, CONNECTOR_LOSS, OLT_LAUNCH_POWER, SPLITTER_LOSS, power_level
)

from ....schemas.network import (
    NodeRead, ContinuousTraceRequest, ContinuousTraceResponse
)

router = APIRouter()

@router.post("/continuous-trace", response_model=ContinuousTraceResponse)
async def continuous_trace(data: ContinuousTraceRequest, session: AsyncSession = Depends(get_session)):
    """Initial payload for the continuous drafting flow."""
    try:
        start_node = await session.get(Node, data.start_node_id)
        if not start_node:
            raise HTTPException(status_code=404, detail=f"Start node {data.start_node_id} not found")

        node_params = data.node_data.model_dump()
        last_point = data.path.coordinates[-1]
        node_params["location"] = f"POINT({last_point[0]} {last_point[1]})"
        
        if node_params.get("node_type") == "OLT" and not node_params.get("hardware_details"):
            node_params["hardware_details"] = {"cards": 5, "ports_per_card": 16}
        elif node_params.get("node_type") == "ODF" and not node_params.get("hardware_details"):
            node_params["hardware_details"] = {"capacity": 48, "used_ports": 0}

        db_node = Node(**node_params)
        session.add(db_node)
        await session.flush()
        
        route_params = data.route_data.model_dump()
        route_params["start_node_id"] = data.start_node_id
        route_params["end_node_id"] = db_node.id

        target_type = db_node.node_type
        start_type = start_node.node_type

        if start_type == "OLT" and target_type == "ODF":
            route_params["route_type"] = "PATCHCORD"
        elif start_type == "ODF" and target_type == "MUFLA":
            route_params["route_type"] = "TRONCAL"
        elif start_type == "OLT" or (start_type == "MUFLA" and target_type == "MUFLA"):
            route_params["route_type"] = "TRONCAL"
        elif target_type == "CLIENTE_ONU":
            route_params["route_type"] = "ACOMETIDA"
        else:
            route_params["route_type"] = "DISTRIBUCION"
        
        if route_params["route_type"] == "PATCHCORD" and target_type == "ODF":
            odf_details = db_node.hardware_details or {}
            capacity = odf_details.get("capacity", 48)
            used = odf_details.get("used_ports", 0)
            if used >= capacity:
                raise HTTPException(status_code=400, detail="ODF sin puertos disponibles.")
            db_node.hardware_details = {**odf_details, "used_ports": used + 1}
            session.add(db_node)
            await session.flush()

        coords = data.path.coordinates
        wkt_points = ", ".join(f"{c[0]} {c[1]}" for c in coords)
        route_params["path"] = f"LINESTRING({wkt_points})"
        
        db_route = Route(**route_params)
        session.add(db_route)
        await session.flush()
        
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
        await session.refresh(db_node)
        
        result = await session.execute(
            select(Route, func.ST_Length(cast(Route.path, Geography)).label("calc_length"))
            .where(Route.id == db_route.id)
        )
        db_data = result.one()
        db_route_obj = db_data[0]
        calc_length = db_data[1]
        db_route_obj.length_meters = calc_length
        session.add(db_route_obj)
        await session.commit()
        await session.refresh(db_route_obj)
        
        return ContinuousTraceResponse(node=db_node, route=db_route_obj)
        
    except Exception as e:
        await session.rollback()
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/power-budget/{node_id}")
async def get_power_budget(node_id: str, session: AsyncSession = Depends(get_session)):
    """
    Recursive backward path-finding from a node to the OLT.
    Accumulates fiber loss, connector losses, and splitter losses.
    """
    try:
        # 1. Load all routes
        routes_result = await session.execute(
            select(Route, func.ST_Length(cast(Route.path, Geography)).label("length_m"))
        )
        all_routes_raw = routes_result.all()

        routes_by_end = {}
        for route, length_m in all_routes_raw:
            if route.end_node_id:
                routes_by_end[str(route.end_node_id)] = (route, length_m or 0)

        # 2. Load all nodes
        nodes_result = await session.execute(select(Node))
        all_nodes = {str(n.id): n for n in nodes_result.scalars().all()}

        # 3. Load all splitters per node
        splitters_result = await session.execute(select(Splitter))
        splitters_by_node = {}
        for s in splitters_result.scalars().all():
            key = str(s.node_id)
            splitters_by_node.setdefault(key, []).append(s)

        # 4. Traverse backwards
        target = all_nodes.get(node_id)
        if not target:
            raise HTTPException(status_code=404, detail="Nodo no encontrado")

        hop_chain = []
        total_fiber_loss = 0.0
        total_splitter_loss = 0.0
        total_connector_loss = 0.0
        total_splice_loss = 0.0

        current_id = node_id
        visited = set()
        olt_found = False
        max_hops = 30

        for _ in range(max_hops):
            if current_id in visited:
                break
            visited.add(current_id)

            current_node = all_nodes.get(current_id)
            if not current_node:
                break

            if current_node.node_type == "OLT":
                olt_found = True
                hop_chain.append({
                    "node_id": current_id,
                    "name": current_node.name,
                    "type": "OLT",
                    "loss_dB": 0.0,
                    "detail": f"Potencia de salida OLT: +{OLT_LAUNCH_POWER} dBm"
                })
                break

            incoming = routes_by_end.get(current_id)
            if not incoming:
                break

            route, length_m = incoming
            fiber_loss = calculate_route_loss(length_m)
            total_fiber_loss += fiber_loss
            total_connector_loss += CONNECTOR_LOSS
            total_splice_loss += 0.1

            node_splitter_loss = 0.0
            node_splitters = splitters_by_node.get(current_id, [])
            for splitter in node_splitters:
                sl = SPLITTER_LOSS.get(splitter.splitter_type, 0)
                node_splitter_loss += sl
                total_splitter_loss += sl

            hop_chain.append({
                "node_id": current_id,
                "name": current_node.name,
                "type": current_node.node_type,
                "cable_name": route.name,
                "cable_length_m": round(length_m, 1),
                "fiber_loss_dB": round(fiber_loss, 3),
                "connector_loss_dB": CONNECTOR_LOSS,
                "splitter_loss_dB": round(node_splitter_loss, 2),
            })
            current_id = str(route.start_node_id)

        if not olt_found:
            raise HTTPException(status_code=422, detail="No se encontró un camino a la OLT.")

        total_loss = total_fiber_loss + total_connector_loss + total_splitter_loss + total_splice_loss
        received_power = round(OLT_LAUNCH_POWER - total_loss, 2)
        hop_chain.reverse()

        return {
            "node_id": node_id,
            "node_name": target.name,
            "node_type": target.node_type,
            "olt_launch_power_dbm": OLT_LAUNCH_POWER,
            "received_power_dbm": received_power,
            "level": power_level(received_power),
            "total_loss_dB": round(total_loss, 2),
            "breakdown": {
                "fiber_loss_dB": round(total_fiber_loss, 3),
                "connector_loss_dB": round(total_connector_loss, 2),
                "splitter_loss_dB": round(total_splitter_loss, 2),
                "splice_loss_dB": round(total_splice_loss, 2),
            },
            "hop_chain": hop_chain,
        }

    except Exception as e:
        if isinstance(e, HTTPException): raise e
        raise HTTPException(status_code=500, detail=str(e))
