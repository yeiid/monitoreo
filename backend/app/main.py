import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.trustedhost import TrustedHostMiddleware
from uvicorn.middleware.proxy_headers import ProxyHeadersMiddleware
from .db.session import init_db
from .api.v1.router import api_router as network_router

app = FastAPI(
    title="FTTH Mapping API",
    description="Backend para el sistema de mapeo manual de planta externa FTTH",
    version="2.0.0"
)

# Trust proxy headers (Coolify/Traefik)
from uvicorn.middleware.proxy_headers import ProxyHeadersMiddleware
app.add_middleware(ProxyHeadersMiddleware, trusted_hosts="*")

from fastapi import Request
@app.middleware("http")
async def force_https_middleware(request: Request, call_next):
    # If the proxy (Traefik/Coolify) tells us it's HTTPS, force the scheme to https
    # This prevents Starlette/FastAPI from generating insecure HTTP redirects
    if request.headers.get("x-forwarded-proto") == "https":
        request.scope["scheme"] = "https"
    response = await call_next(request)
    return response

@app.on_event("startup")
async def on_startup():
    await init_db()

# Routers
app.include_router(network_router, prefix="/api/v1", tags=["FTTH Network"])

# CORS configuration
origins = os.getenv("CORS_ORIGINS", "*").split(",")
if "*" not in origins:
    # Always include the production and common development origins
    additional = [
        "https://fttpmapper.neuraljira.tech",
        "https://api2.neuraljira.tech",
        "https://tiles.neuraljira.tech",
        "http://localhost:3000",
        "http://localhost:4321",
        "http://localhost:5173", # Vite default
    ]
    for origin in additional:
        if origin not in origins:
            origins.append(origin)

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
)

@app.get("/")
async def root():
    return {"message": "FTTH Mapping API is running", "version": "2.0.0"}

@app.get("/health")
async def health_check():
    return {"status": "healthy"}
