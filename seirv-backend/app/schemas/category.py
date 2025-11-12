from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime


class CategoryBase(BaseModel):
    """Schema base de categoría"""
    name: str = Field(..., min_length=2, max_length=50)
    description: Optional[str] = Field(None, max_length=200)


class CategoryResponse(CategoryBase):
    """
    Schema de respuesta de categoría
    """
    id: int
    avg_recalls: float = 0.0
    created_at: datetime
    
    class Config:
        from_attributes = True


class CategoryListResponse(BaseModel):
    """Lista simplificada para dropdowns"""
    id: int
    name: str
    
    class Config:
        from_attributes = True