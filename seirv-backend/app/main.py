import logging
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config.settings import settings
from app.database.base import engine, Base
from app.views import auth, users, vehicles, vehicle_catalog

# Configurar el logging de SQLAlchemy para reducir logs informativos
logging.getLogger("sqlalchemy.engine").setLevel(logging.WARNING)
logging.getLogger("sqlalchemy.pool").setLevel(logging.WARNING)

# Crear las tablas en la base de datos
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="Sistema de Evaluación del Índice de Riesgo Vehicular",
    docs_url="/docs",
    redoc_url="/redoc"
)

# Preparar origins para CORS
# En producción (Render), usar CORS_ORIGINS si está definido, sino usar defaults
import os
cors_origins = settings.BACKEND_CORS_ORIGINS.copy()

# Si hay variable de entorno CORS_ORIGINS, usarla (separada por comas)
if os.getenv("CORS_ORIGINS"):
    cors_origins = [origin.strip() for origin in os.getenv("CORS_ORIGINS").split(",")]

app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

from app.routers import reports

app.include_router(auth.router, prefix=settings.API_V1_PREFIX)
app.include_router(users.router, prefix=settings.API_V1_PREFIX)
app.include_router(vehicles.router, prefix=settings.API_V1_PREFIX)
app.include_router(vehicle_catalog.router, prefix=settings.API_V1_PREFIX)
app.include_router(reports.router)


@app.get("/")
def root():
    return {
        "message": "SEIRV API - Sistema de Evaluación del Índice de Riesgo Vehicular",
        "version": settings.VERSION,
        "docs": "/docs",
        "status": "online"
    }


@app.get("/health")
def health_check():
    return {"status": "healthy"}
