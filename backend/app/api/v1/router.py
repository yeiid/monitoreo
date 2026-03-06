from fastapi import APIRouter
from .endpoints import nodes, routes, fiber, analytics, auth, users, organizations

api_router = APIRouter()

api_router.include_router(auth.router, prefix="/auth", tags=["Auth"])
api_router.include_router(users.router, prefix="/users", tags=["Users"])
api_router.include_router(organizations.router, prefix="/organizations", tags=["Organizations"])
api_router.include_router(nodes.router, prefix="/nodes", tags=["Nodes"])
api_router.include_router(routes.router, prefix="/routes", tags=["Routes"])
api_router.include_router(fiber.router, prefix="/fiber", tags=["Fiber & Splices"])
api_router.include_router(analytics.router, prefix="", tags=["Analytics"])
