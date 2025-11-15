from pydantic_settings import BaseSettings
from typing import List
import os


class Settings(BaseSettings):
    """Configuración global de la aplicación"""
    
    # Database
    DATABASE_URL: str
    
    # Security
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    
    # NHTSA API
    NHTSA_API_BASE_URL: str = "https://api.nhtsa.gov/SafetyRatings"
    NHTSA_RECALLS_URL: str = "https://api.nhtsa.gov/recalls/recallsByVehicle"
    
    # Application
    DEBUG: bool = False
    API_V1_PREFIX: str = "/api/v1"
    PROJECT_NAME: str = "SEIRV - Sistema de Evaluación del Índice de Riesgo Vehicular"
    VERSION: str = "1.0.0"
    
    # CORS - Permitir desde variable de entorno o defaults locales
    BACKEND_CORS_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://localhost:5173",
        "http://localhost:8080",
        "https://*.onrender.com",  # Dominios de Render
    ]
    
    class Config:
        env_file = ".env"
        case_sensitive = True
    
    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        # Si hay una variable de entorno CORS_ORIGINS, usarla
        cors_env = os.getenv("CORS_ORIGINS")
        if cors_env:
            # Separar por comas y limpiar espacios
            self.BACKEND_CORS_ORIGINS = [origin.strip() for origin in cors_env.split(",")]


settings = Settings()