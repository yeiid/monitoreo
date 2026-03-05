import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .db.session import init_db
from .api.v1.router import api_router as network_router

app = FastAPI(
    title="FTTH Mapping API",
    description="Backend para el sistema de mapeo manual de planta externa FTTH",
    version="2.0.0"
)

@app.on_event("startup")
async def on_startup():
    await init_db()

# Routers
app.include_router(network_router, prefix="/api/v1", tags=["FTTH Network"])

# CORS configuration
cors_origins = os.getenv("CORS_ORIGINS", "*").split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=True if os.getenv("CORS_ALLOW_CREDENTIALS") == "true" else False,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def root():
    return {"message": "FTTH Mapping API is running", "version": "2.0.0"}

@app.get("/health")
async def health_check():
    return {"status": "healthy"}
