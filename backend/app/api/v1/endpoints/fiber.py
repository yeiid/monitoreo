import uuid
from typing import List, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import select
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import func, cast

from ....db.session import get_session
from ....models.network import Node, Route, FiberStrand, Splitter, Splice, FiberColor
from ....schemas.network import (
    FiberStrandCreate, FiberStrandRead, GenerateStrandsRequest,
    SplitterCreate, SplitterRead,
    SpliceCreate, SpliceRead
)
from ....utils.optical_physics import (
    calculate_output_power, calculate_route_loss
)

router = APIRouter()

TIA_598_COLORS = [e.value for e in FiberColor]

# ──────────────── FIBER STRANDS ────────────────

@router.post("/strands", response_model=FiberStrandRead, status_code=status.HTTP_201_CREATED)
async def create_strand(data: FiberStrandCreate, session: AsyncSession = Depends(get_session)):
    db_strand = FiberStrand(**data.model_dump())
    session.add(db_strand)
    await session.commit()
    await session.refresh(db_strand)
    return db_strand

@router.get("/strands", response_model=List[FiberStrandRead])
async def list_strands(route_id: str = None, session: AsyncSession = Depends(get_session)):
    statement = select(FiberStrand)
    if route_id:
        statement = statement.where(FiberStrand.route_id == route_id)
    results = await session.execute(statement)
    return results.scalars().all()

@router.post("/strands/generate", response_model=List[FiberStrandRead], status_code=status.HTTP_201_CREATED)
async def generate_strands(data: GenerateStrandsRequest, session: AsyncSession = Depends(get_session)):
    """Auto-generate all fiber strands for a route based on its capacity using TIA-598 colors."""
    result = await session.execute(select(Route).where(Route.id == data.route_id))
    route = result.scalar_one_or_none()
    if not route:
        raise HTTPException(status_code=404, detail="Route not found")

    strands = []
    for i in range(route.capacity):
        color = TIA_598_COLORS[i % len(TIA_598_COLORS)]
        buffer_num = (i // 6) + 1  # 6 strands per tube/buffer
        strand = FiberStrand(
            route_id=route.id,
            color=color,
            strand_number=i + 1,
            buffer_number=buffer_num
        )
        session.add(strand)
        strands.append(strand)

    await session.commit()
    for s in strands:
        await session.refresh(s)
    return strands

@router.delete("/strands/{strand_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_strand(strand_id: str, session: AsyncSession = Depends(get_session)):
    result = await session.execute(select(FiberStrand).where(FiberStrand.id == strand_id))
    strand = result.scalar_one_or_none()
    if not strand:
        raise HTTPException(status_code=404, detail="Strand not found")
    await session.delete(strand)
    await session.commit()

# ──────────────── SPLITTERS ────────────────

@router.post("/splitters", response_model=SplitterRead, status_code=status.HTTP_201_CREATED)
async def create_splitter(data: SplitterCreate, session: AsyncSession = Depends(get_session)):
    db_splitter = Splitter(**data.model_dump())
    session.add(db_splitter)
    await session.commit()
    await session.refresh(db_splitter)
    return db_splitter

@router.get("/splitters", response_model=List[SplitterRead])
async def list_splitters(node_id: str = None, session: AsyncSession = Depends(get_session)):
    statement = select(Splitter)
    if node_id:
        statement = statement.where(Splitter.node_id == node_id)
    results = await session.execute(statement)
    return results.scalars().all()

@router.delete("/splitters/{splitter_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_splitter(splitter_id: str, session: AsyncSession = Depends(get_session)):
    result = await session.execute(select(Splitter).where(Splitter.id == splitter_id))
    splitter = result.scalar_one_or_none()
    if not splitter:
        raise HTTPException(status_code=404, detail="Splitter not found")
    await session.delete(splitter)
    await session.commit()

# ──────────────── SPLICES ────────────────

@router.post("/splices", response_model=SpliceRead, status_code=status.HTTP_201_CREATED)
async def create_splice(data: SpliceCreate, session: AsyncSession = Depends(get_session)):
    try:
        splice_data = data.model_dump()
        input_power = -3.0  # Default starting power
        
        if splice_data["source_type"] == "strand" and splice_data.get("source_id"):
            try:
                result = await session.execute(
                    select(FiberStrand, Route)
                    .join(Route)
                    .where(FiberStrand.id == splice_data["source_id"])
                )
                src_data = result.one_or_none()
                if src_data:
                    src, route = src_data
                    if src.optical_power_dbm is not None:
                        route_loss = calculate_route_loss(route.length_meters or 0)
                        input_power = src.optical_power_dbm - route_loss
            except Exception:
                pass

        elif splice_data["source_type"] == "splitter_out" and splice_data.get("source_id"):
            try:
                res = await session.execute(select(Splice).where(
                    Splice.target_type == "splitter_in", 
                    Splice.target_id == splice_data["source_id"]
                ))
                parent_splice = res.scalar_one_or_none()
                if parent_splice:
                    input_power = parent_splice.optical_power_dbm or -3.0
            except Exception:
                pass

        splitter_type = None
        if splice_data["target_type"] == "splitter_in" and splice_data.get("target_id"):
            try:
                res = await session.execute(select(Splitter).where(Splitter.id == splice_data["target_id"]))
                split = res.scalar_one_or_none()
                if split:
                    splitter_type = split.splitter_type
            except Exception:
                pass

        output_power = calculate_output_power(input_power, splitter_type)
        splice_data["optical_power_dbm"] = output_power

        if splice_data["target_type"] == "strand" and splice_data.get("target_id"):
            try:
                result = await session.execute(select(FiberStrand).where(FiberStrand.id == splice_data["target_id"]))
                tgt = result.scalar_one_or_none()
                if tgt:
                    tgt.optical_power_dbm = output_power
                    session.add(tgt)
            except Exception:
                pass

        db_splice = Splice(**splice_data)
        session.add(db_splice)
        await session.commit()
        await session.refresh(db_splice)
        return db_splice

    except Exception as e:
        await session.rollback()
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/splices", response_model=List[SpliceRead])
async def list_splices(node_id: str = None, session: AsyncSession = Depends(get_session)):
    statement = select(Splice)
    if node_id:
        statement = statement.where(Splice.node_id == node_id)
    results = await session.execute(statement)
    return results.scalars().all()

@router.delete("/splices/{splice_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_splice(splice_id: str, session: AsyncSession = Depends(get_session)):
    result = await session.execute(select(Splice).where(Splice.id == splice_id))
    splice = result.scalar_one_or_none()
    if not splice:
        raise HTTPException(status_code=404, detail="Splice not found")
    await session.delete(splice)
    await session.commit()
