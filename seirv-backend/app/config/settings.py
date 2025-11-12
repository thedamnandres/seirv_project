from pydantic_settings import BaseSettings
from typing import List


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
    
    # CORS
    BACKEND_CORS_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://localhost:5173",
        "http://localhost:8080"
    ]
    
    class Config:
        env_file = ".env"
        case_sensitive = True


settings = Settings()