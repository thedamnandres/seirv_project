from pydantic import BaseModel, Field
from typing import List
from datetime import datetime


class VehicleCatalogBase(BaseModel):
    """Schema base del catálogo de vehículos"""
    make: str = Field(..., description="Marca del vehículo")
    model: str = Field(..., description="Modelo del vehículo")
    year: int = Field(..., description="Año del vehículo")


class VehicleCatalogCreate(VehicleCatalogBase):
    """Schema para crear entradas en el catálogo"""
    pass


class VehicleCatalogResponse(VehicleCatalogBase):
    """Schema de respuesta del catálogo"""
    id: int
    created_at: datetime
    
    class Config:
        from_attributes = True


# Schemas para dropdowns en cascada
class MakeResponse(BaseModel):
    """Respuesta con lista de marcas únicas"""
    make: str
    
    class Config:
        from_attributes = True


class YearResponse(BaseModel):
    """Respuesta con lista de años únicos"""
    year: int
    
    class Config:
        from_attributes = True


class ModelResponse(BaseModel):
    """Respuesta con lista de modelos únicos"""
    model: str
    
    class Config:
        from_attributes = True


class DropdownResponse(BaseModel):
    """
    Respuesta completa para dropdowns en cascada
    Ociones disponibles según los filtros aplicados
    """
    makes: List[str] = Field(default_factory=list, description="Lista de marcas disponibles")
    years: List[int] = Field(default_factory=list, description="Lista de años disponibles")
    models: List[str] = Field(default_factory=list, description="Lista de modelos disponibles")
    
    class Config:
        json_schema_extra = {
            "example": {
                "makes": ["Toyota", "Honda", "Ford"],
                "years": [2020, 2021, 2022, 2023],
                "models": ["Corolla", "Camry", "RAV4"]
            }
        }
