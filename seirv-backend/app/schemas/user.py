from pydantic import BaseModel, EmailStr, Field, validator
from typing import Optional
from datetime import datetime


class UserBase(BaseModel):
    """Schema base con campos comunes"""
    email: EmailStr
    username: str = Field(..., min_length=3, max_length=50)
    full_name: str = Field(..., min_length=2, max_length=100)


class UserCreate(UserBase):
    """
    Schema para REGISTRAR un usuario
    """
    password: str = Field(..., min_length=8, max_length=100)
    
    @validator('password')
    def validate_password_strength(cls, v):
        """
        Validación de contraseña segura
        
        Requisitos:
        - Mínimo 8 caracteres
        - Al menos una mayúscula
        - Al menos un número
        """
        if not any(c.isupper() for c in v):
            raise ValueError('La contraseña debe contener al menos una mayúscula')
        if not any(c.isdigit() for c in v):
            raise ValueError('La contraseña debe contener al menos un número')
        return v


class UserLogin(BaseModel):
    """
    Schema para LOGIN
    
    El usuario envía solo:
    - username o email
    - password
    """
    username: str
    password: str


class UserUpdate(BaseModel):
    """
    Schema para ACTUALIZAR datos del usuario
    """
    email: Optional[EmailStr] = None
    full_name: Optional[str] = Field(None, min_length=2, max_length=100)
    password: Optional[str] = Field(None, min_length=8, max_length=100)

    @validator('password')
    def validate_password_strength(cls, v):
        if v is not None:
            if not any(c.isupper() for c in v):
                raise ValueError('La contraseña debe contener al menos una mayúscula')
            if not any(c.isdigit() for c in v):
                raise ValueError('La contraseña debe contener al menos un número')
        return v


class UserResponse(UserBase):
    """
    Schema de RESPUESTA
    
    Lo que devuelve la API
    """
    id: int
    role: str
    is_active: bool
    created_at: datetime
    
    class Config:
        from_attributes = True  # Convertir desde SQLAlchemy models


class Token(BaseModel):
    """Respuesta del login con el token JWT"""
    access_token: str
    token_type: str = "bearer"
    user: UserResponse


class TokenData(BaseModel):
    """Datos que van dentro del token JWT"""
    user_id: Optional[int] = None