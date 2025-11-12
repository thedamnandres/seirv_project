from pydantic import BaseModel, Field, validator
from typing import Optional
from datetime import datetime


class VehicleBase(BaseModel):
    """
    Schema base de vehículo
    """
    make: str = Field(
        ..., 
        min_length=2, 
        max_length=50,
        description="Marca del vehículo (ej: Honda, Toyota)"
    )
    model: str = Field(
        ..., 
        min_length=2, 
        max_length=50,
        description="Modelo del vehículo (ej: Civic, Camry)"
    )
    year: int = Field(
        ..., 
        ge=1990,
        description="Año del vehículo (mínimo 1990)"
    )
    mileage: int = Field(
        ..., 
        ge=0, 
        le=500000,
        description="Kilometraje del vehículo (0-500,000 km)"
    )
    category_id: int = Field(
        ..., 
        gt=0,
        description="ID de la categoría del vehículo"
    )
    
    @validator('make', 'model')
    def normalize_text(cls, v):
        """
        Normaliza el texto:
        """
        if v:
            return v.strip().title()
        return v
    
    @validator('year')
    def validate_year_range(cls, v):
        """
        Valida que el año esté en el rango correcto
        """
        from datetime import datetime
        current_year = datetime.now().year
        
        if v < 1990:
            raise ValueError('El año no puede ser anterior a 1990')
        if v > current_year + 1:
            raise ValueError(f'El año no puede ser posterior a {current_year + 1}')
        return v
    
    @validator('mileage')
    def validate_mileage_positive(cls, v):
        """
        Valida que el kilometraje sea positivo
        """
        if v < 0:
            raise ValueError('El kilometraje no puede ser negativo')
        if v > 500000:
            raise ValueError('El kilometraje excede el límite máximo de 500,000 km')
        return v


class VehicleCreate(VehicleBase):
    """
    Schema para CREAR un vehículo
    """
    pass


class VehicleUpdate(BaseModel):
    """
    Schema para ACTUALIZAR un vehículo
    """
    mileage: int = Field(
        ...,
        ge=0,
        le=500000,
        description="Nuevo kilometraje del vehículo"
    )
    
    @validator('mileage')
    def validate_mileage(cls, v):
        if v < 0:
            raise ValueError('El kilometraje no puede ser negativo')
        if v > 500000:
            raise ValueError('El kilometraje excede el límite de 500,000 km')
        return v


class VehicleResponse(VehicleBase):
    """
    Schema de RESPUESTA de vehículo
    """
    id: int
    user_id: int
    
    # IRV (por ahora en 0, futuro cálculo)
    irv_value: float = 0.0
    irv_level: str = "N/A"
    last_irv_calculation: Optional[datetime] = None
    
    # Timestamps
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    # Información adicional
    category_name: Optional[str] = None  # Nombre de la categoría
    total_recalls: int = 0  # Número de recalls (futuro)
    
    class Config:
        from_attributes = True


class VehicleListResponse(BaseModel):
    """
    Schema simplificado para listas de vehículos
    """
    id: int
    make: str
    model: str
    year: int
    mileage: int
    irv_value: float = 0.0
    irv_level: str = "N/A"
    category_name: str
    created_at: datetime
    
    class Config:
        from_attributes = True


class VehicleDetailResponse(VehicleResponse):
    """
    Schema detallado con información completa
    """
    pass