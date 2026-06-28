import os
from dotenv import load_dotenv
load_dotenv()

import sqlalchemy as sa
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.trustedhost import TrustedHostMiddleware
from uvicorn.middleware.proxy_headers import ProxyHeadersMiddleware
from .db.session import init_db
from .api.v1.router import api_router as network_router

app = FastAPI(
    title="FTTH Mapping API",
    description="""
## FTTH Mapper - API de Monitoreo de Red de Fibra Óptica

Sistema completo para el diseño y monitoreo de plantas externas FTTH (Fiber To The Home).

### Funcionalidades Principales

- **Gestión de Nodos**: OLT, ODF, Muflas, Cajas NAP, Clientes ONU
- **Trazado de Rutas**: Cables de fibra óptica con cálculo automático de longitud
- **Inventario de Fibra**: Hilos TIA-598, Splitters, Empalmes
- **Presupuesto Óptico**: Cálculo de pérdida de señal (dB) end-to-end
- **Multi-tenant**: Soporte para múltiples organizaciones (ISPs)
- **Mapa Interactivo**: Visualización geoespacial con MapLibre GL

### Autenticación

Todos los endpoints requieren JWT Bearer token excepto `/auth/login` y `/health`.

Obtener token: `POST /api/v1/auth/login`

### Documentación

- [API Reference](https://github.com/tu-org/ftth-mapper/docs/API_REFERENCE.md)
- [Architecture Guide](https://github.com/tu-org/ftth-mapper/docs/ARCHITECTURE.md)
- [Security Audit](https://github.com/tu-org/ftth-mapper/docs/SECURITY_AUDIT.md)
    """,
    version="2.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_tags=[
        {"name": "Auth", "description": "Autenticación y manejo de sesiones"},
        {"name": "Organizations", "description": "Gestión de organizaciones (solo super_admin)"},
        {"name": "Users", "description": "Gestión de usuarios y técnicos"},
        {"name": "Nodes", "description": "CRUD de nodos de red (OLT, ODF, Mufla, NAP, Cliente)"},
        {"name": "Routes", "description": "CRUD de cables y rutas de fibra óptica"},
        {"name": "Fiber", "description": "Hilos, Splitters y Empalmes de fibra"},
        {"name": "Analytics", "description": "Trazado continuo y presupuesto óptico"},
    ]
)

# Trust proxy headers (Dokploy/Traefik)
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
    await run_migrations()


async def run_migrations():
    """Apply missing columns to existing tables. Safe to run on every startup."""
    from .db.session import engine
    try:
        async with engine.begin() as conn:
            # Check if diagram_id column exists on splitters
            result = await conn.execute(sa.text(
                "SELECT column_name FROM information_schema.columns "
                "WHERE table_name='splitters' AND column_name='diagram_id'"
            ))
            if result.scalar() is None:
                await conn.execute(sa.text(
                    "ALTER TABLE splitters ADD COLUMN diagram_id VARCHAR"
                ))
                await conn.execute(sa.text(
                    "CREATE INDEX ix_splitters_diagram_id ON splitters(diagram_id)"
                ))
                print("Migration: Added splitters.diagram_id column")
    except Exception as e:
        print(f"Migration warning (non-fatal): {e}")

# Routers
app.include_router(network_router, prefix="/api/v1", tags=["FTTH Network"])

# CORS configuration
raw_origins = os.getenv("CORS_ORIGINS", "").split(",")
origins = [o.strip() for o in raw_origins if o.strip()]

# Common production and development origins
additional = [
    "https://ftthmapper.neuraljira.tech",
    "https://api2.neuraljira.tech",
    "https://tiles.neuraljira.tech",
    "http://localhost:3000",
    "http://localhost:4321",
    "http://localhost:5173",
    "http://localhost:8080",
]

if not origins or "*" in origins:
    # If using *, we MUST specify origins if allow_credentials=True, 
    # or FastAPI will have issues echoing the origin.
    origins = additional
else:
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
