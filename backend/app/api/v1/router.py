from fastapi import APIRouter
from .endpoints import nodes, routes, fiber, analytics

api_router = APIRouter()

api_router.include_router(nodes.router, prefix="/nodes", tags=["Nodes"])
api_router.include_router(routes.router, prefix="/routes", tags=["Routes"])
api_router.include_router(fiber.router, prefix="/fiber", tags=["Fiber & Splices"])
api_router.include_router(analytics.router, prefix="", tags=["Analytics"])
