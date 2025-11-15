from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config.settings import settings
from app.database.base import engine, Base
from app.views import auth, users, vehicles, vehicle_catalog

# Crear las tablas en la base de datos
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="Sistema de Evaluación del Índice de Riesgo Vehicular",
    docs_url="/docs",
    redoc_url="/redoc"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.BACKEND_CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix=settings.API_V1_PREFIX)
app.include_router(users.router, prefix=settings.API_V1_PREFIX)
app.include_router(vehicles.router, prefix=settings.API_V1_PREFIX)
app.include_router(vehicle_catalog.router, prefix=settings.API_V1_PREFIX)


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
