import uuid
from typing import List
from sqlalchemy.ext.asyncio import AsyncSession
from ..models.network import FiberStrand, FiberColor

TIA_598_COLORS = [e.value for e in FiberColor]

async def generate_fiber_strands(
    session: AsyncSession,
    route_id: uuid.UUID,
    capacity: int
) -> List[FiberStrand]:
    """
    Centralized utility to generate fiber strands for a route according to TIA-598 standards.
    """
    strands = []
    for i in range(capacity):
        color = TIA_598_COLORS[i % len(TIA_598_COLORS)]
        buffer_num = (i // 6) + 1  # 6 strands per tube/buffer
        strand = FiberStrand(
            route_id=route_id,
            color=color,
            strand_number=i + 1,
            buffer_number=buffer_num
        )
        session.add(strand)
        strands.append(strand)
    return strands
