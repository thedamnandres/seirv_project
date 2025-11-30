from pydantic import BaseModel, Field, validator
from typing import Optional
from datetime import datetime


class RecallUpdate(BaseModel):
    """
    Schema para actualizar la severidad de un recall (solo admin)
    """
    severity: int = Field(..., ge=1, le=3, description="Nivel de severidad: 1 (Baja), 2 (Media), 3 (Alta)")
    severity_score: Optional[float] = Field(
        None, 
        ge=0.0, 
        le=10.0, 
        description="Score numérico para cálculos IRV. Si no se proporciona, se calcula basado en la severidad"
    )
    notes: Optional[str] = Field(None, max_length=500, description="Notas sobre la corrección manual")
    
    @validator('severity')
    def validate_severity(cls, v):
        if v not in [1, 2, 3]:
            raise ValueError('La severidad debe ser 1 (Baja), 2 (Media) o 3 (Alta)')
        return v


class RecallResponse(BaseModel):
    """
    Schema de respuesta para un recall
    """
    id: int
    vehicle_id: int
    nhtsa_campaign_number: str
    component: Optional[str] = None
    summary: Optional[str] = None
    consequence: Optional[str] = None
    remedy: Optional[str] = None
    manufacturer: Optional[str] = None
    report_received_date: Optional[datetime] = None
    severity: int
    severity_score: float
    created_at: datetime
    updated_at: Optional[datetime] = None
    last_synced_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True

