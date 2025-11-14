from datetime import datetime, timedelta
from typing import Optional
from jose import JWTError, jwt
from passlib.context import CryptContext
from sqlalchemy.orm import Session
import hashlib

from app.models.user import User
from app.config.settings import settings

# Configuración de bcrypt para hashear passwords
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


class AuthService:
    
    @staticmethod
    def hash_password(password: str) -> str:
        """
        Hashea una contraseña usando bcrypt.
        Pre-hashea con SHA256 para evitar el límite de 72 bytes de bcrypt.
        """
        # Pre-hash con SHA256 para evitar límite de 72 bytes de bcrypt
        password_bytes = password.encode('utf-8')
        sha256_hash = hashlib.sha256(password_bytes).hexdigest()
        return pwd_context.hash(sha256_hash)
    
    @staticmethod
    def verify_password(plain_password: str, hashed_password: str) -> bool:
        """
        Verifica si una contraseña coincide con su hash.
        Pre-hashea con SHA256 antes de verificar con bcrypt.
        """
        # Pre-hash con SHA256 (mismo proceso que al crear el hash)
        password_bytes = plain_password.encode('utf-8')
        sha256_hash = hashlib.sha256(password_bytes).hexdigest()
        return pwd_context.verify(sha256_hash, hashed_password)
    
    @staticmethod
    def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
        """
        Crea un token JWT
        """
        to_encode = data.copy()
        
        # Calcular fecha de expiración
        if expires_delta:
            expire = datetime.utcnow() + expires_delta
        else:
            expire = datetime.utcnow() + timedelta(
                minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES
            )
        
        to_encode.update({"exp": expire})
        
        # Crear el token
        encoded_jwt = jwt.encode(
            to_encode, 
            settings.SECRET_KEY, 
            algorithm=settings.ALGORITHM
        )
        
        return encoded_jwt
    
    @staticmethod
    def authenticate_user(db: Session, username: str, password: str) -> Optional[User]:
        """
        Autentica un usuario usando username o email
        """
        # Buscar usuario por username o email
        user = db.query(User).filter(
            (User.username == username) | (User.email == username)
        ).first()
        
        if not user:
            return None
        
        # Verificar contraseña
        if not AuthService.verify_password(password, user.hashed_password):
            return None
        
        return user