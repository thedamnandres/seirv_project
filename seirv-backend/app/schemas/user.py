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
    
    @validator('role', pre=True)
    def normalize_role(cls, v):
        """Convierte enum a string si es necesario"""
        if v is None:
            return None
        # Si es un enum, obtener el value
        if hasattr(v, 'value'):
            result = str(v.value).lower().strip()
            return result
        # Si ya es string, asegurarse de que esté en minúsculas y sin espacios
        result = str(v).lower().strip()
        return result
    
    @classmethod
    def from_orm_user(cls, user):
        """Método helper para convertir un User ORM a UserResponse"""
        role_value = user.role
        if hasattr(role_value, 'value'):
            role_value = role_value.value
        role_str = str(role_value).lower().strip()
        
        return cls(
            id=user.id,
            email=user.email,
            username=user.username,
            full_name=user.full_name,
            role=role_str,
            is_active=user.is_active,
            created_at=user.created_at
        )
    
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


class AdminUserUpdate(BaseModel):
    """
    Schema para que el ADMIN actualice usuarios
    Permite cambiar: role, is_active, email, full_name
    """
    email: Optional[EmailStr] = None
    full_name: Optional[str] = Field(None, min_length=2, max_length=100)
    role: Optional[str] = Field(None, description="Rol del usuario: 'admin' o 'user'")
    is_active: Optional[bool] = None
    
    @validator('role')
    def validate_role(cls, v):
        if v is not None and v not in ['admin', 'user']:
            raise ValueError('El rol debe ser "admin" o "user"')
        return v


class AdminUserListResponse(BaseModel):
    """
    Schema para listar usuarios en el admin
    """
    id: int
    email: str
    username: str
    full_name: str
    role: str
    is_active: bool
    created_at: datetime
    total_vehicles: int = 0  # Número de vehículos del usuario
    
    class Config:
        from_attributes = True


class AdminUserDetailResponse(UserResponse):
    """
    Schema detallado de usuario para admin
    Incluye información adicional
    """
    total_vehicles: int = 0
    updated_at: Optional[datetime] = None