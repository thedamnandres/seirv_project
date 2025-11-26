from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import timedelta

from app.database.base import get_db
from app.models.user import User, UserRole
from app.schemas.user import UserCreate, UserLogin, Token, UserResponse
from app.services.auth_service import AuthService
from app.config.settings import settings
from app.utils.dependencies import get_current_user

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def register(user_data: UserCreate, db: Session = Depends(get_db)):
    """
    Registrar un nuevo usuario
    """
    
    # Verificar si el email existe
    existing_email = db.query(User).filter(User.email == user_data.email).first()
    if existing_email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="El email ya está registrado"
        )
    
    # Verificar si el username existe
    existing_username = db.query(User).filter(User.username == user_data.username).first()
    if existing_username:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="El username ya está registrado"
        )
    
    # Hashear la contraseña
    hashed_password = AuthService.hash_password(user_data.password)
    
    user_count = db.query(User).count()
    if user_count == 0:
        role = UserRole.ADMIN
    else:
        role = UserRole.USER

    # Crear el usuario
    new_user = User(
        email=user_data.email,
        username=user_data.username,
        full_name=user_data.full_name,
        hashed_password=hashed_password,
        role=role,
        is_active=True
    )
    
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    return new_user


@router.post("/login", response_model=Token)
def login(credentials: UserLogin, db: Session = Depends(get_db)):
    """
    Iniciar sesión
    """
    
    # Autenticar usuario
    user = AuthService.authenticate_user(db, credentials.username, credentials.password)
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Username o contraseña incorrectos",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Crear token JWT
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = AuthService.create_access_token(
        data={"sub": str(user.id)},
        expires_delta=access_token_expires
    )
    
    # Convertir el usuario a UserResponse usando el método helper que garantiza la serialización correcta del rol
    user_response = UserResponse.from_orm_user(user)
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": user_response
    }


@router.get("/me", response_model=UserResponse)
def get_current_user_info(current_user: User = Depends(get_current_user)):
    """
    Obtener información del usuario actual
    
    Esta ruta está PROTEGIDA. Solo funciona con un token válido.
    """
    # Convertir explícitamente a UserResponse usando el método helper que garantiza la serialización correcta del rol
    user_response = UserResponse.from_orm_user(current_user)
    return user_response


# Importar la dependency
from app.utils.dependencies import get_current_user