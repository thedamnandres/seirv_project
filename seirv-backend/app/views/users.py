from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List

from app.database.base import get_db
from app.models.user import User, UserRole
from app.schemas.user import (
    UserResponse, 
    UserUpdate,
    AdminUserUpdate,
    AdminUserListResponse,
    AdminUserDetailResponse
)
from app.utils.dependencies import get_current_user, get_current_admin_user

router = APIRouter(prefix="/users", tags=["Users"])


@router.get("/me", response_model=UserResponse)
def get_my_profile(current_user: User = Depends(get_current_user)):
    """
    Obtener mi perfil de usuario
    
    Endpoint protegido que retorna la información del usuario autenticado
    """
    return current_user


@router.put("/me", response_model=UserResponse)
def update_my_profile(
    user_data: UserUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Actualizar mi perfil
    
    Permite actualizar:
    - full_name
    - email (si no está en uso)
    """
    # Si quiere cambiar el email, verificar que no esté en uso
    if user_data.email and user_data.email != current_user.email:
        existing_email = db.query(User).filter(
            User.email == user_data.email,
            User.id != current_user.id
        ).first()
        
        if existing_email:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="El email ya está en uso por otro usuario"
            )
        
        current_user.email = user_data.email
    
    # Actualizar nombre completo
    if user_data.full_name:
        current_user.full_name = user_data.full_name
    
    db.commit()
    db.refresh(current_user)
    
    return current_user


@router.get("/me/stats")
def get_my_stats(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Obtener estadísticas del usuario
    
    Retorna:
    - Cantidad de vehículos registrados
    - IRV promedio
    - Vehículo más antiguo
    - Vehículo más nuevo
    """
    from app.models.vehicle import Vehicle
    from sqlalchemy import func
    
    # Cantidad de vehículos
    vehicle_count = db.query(Vehicle).filter(
        Vehicle.user_id == current_user.id
    ).count()
    
    # IRV promedio
    avg_irv = db.query(func.avg(Vehicle.irv_value)).filter(
        Vehicle.user_id == current_user.id
    ).scalar() or 0.0
    
    # Vehículo más antiguo y más nuevo
    oldest_vehicle = db.query(Vehicle).filter(
        Vehicle.user_id == current_user.id
    ).order_by(Vehicle.year.asc()).first()
    
    newest_vehicle = db.query(Vehicle).filter(
        Vehicle.user_id == current_user.id
    ).order_by(Vehicle.year.desc()).first()
    
    return {
        "total_vehicles": vehicle_count,
        "average_irv": round(avg_irv, 2),
        "oldest_vehicle_year": oldest_vehicle.year if oldest_vehicle else None,
        "newest_vehicle_year": newest_vehicle.year if newest_vehicle else None,
        "user_since": current_user.created_at
    }


# ============ ENDPOINTS DE ADMINISTRACIÓN (Solo ADMIN) ============

@router.get("/admin/all", response_model=List[AdminUserListResponse])
def list_all_users(
    current_user: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100)
):
    """
    Listar todos los usuarios del sistema (SOLO ADMIN)
    
    Permite paginación con skip y limit
    """
    from app.models.vehicle import Vehicle
    from sqlalchemy import func
    
    # Obtener usuarios con paginación
    users = db.query(User).order_by(User.created_at.desc()).offset(skip).limit(limit).all()
    
    result = []
    for user in users:
        # Contar vehículos del usuario
        vehicle_count = db.query(Vehicle).filter(Vehicle.user_id == user.id).count()
        
        result.append({
            "id": user.id,
            "email": user.email,
            "username": user.username,
            "full_name": user.full_name,
            "role": user.role.value if isinstance(user.role, UserRole) else user.role,
            "is_active": user.is_active,
            "created_at": user.created_at,
            "total_vehicles": vehicle_count
        })
    
    return result


@router.get("/admin/{user_id}", response_model=AdminUserDetailResponse)
def get_user_detail(
    user_id: int,
    current_user: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    """
    Obtener detalle completo de un usuario (SOLO ADMIN)
    
    Incluye información adicional como cantidad de vehículos
    """
    from app.models.vehicle import Vehicle
    
    user = db.query(User).filter(User.id == user_id).first()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Usuario no encontrado"
        )
    
    # Contar vehículos
    vehicle_count = db.query(Vehicle).filter(Vehicle.user_id == user.id).count()
    
    return {
        "id": user.id,
        "email": user.email,
        "username": user.username,
        "full_name": user.full_name,
        "role": user.role.value if isinstance(user.role, UserRole) else user.role,
        "is_active": user.is_active,
        "created_at": user.created_at,
        "updated_at": user.updated_at,
        "total_vehicles": vehicle_count
    }


@router.put("/admin/{user_id}", response_model=UserResponse)
def update_user(
    user_id: int,
    user_data: AdminUserUpdate,
    current_user: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    """
    Actualizar un usuario (SOLO ADMIN)
    
    Permite cambiar:
    - email
    - full_name
    - role (admin/user)
    - is_active (activar/desactivar)
    """
    user = db.query(User).filter(User.id == user_id).first()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Usuario no encontrado"
        )
    
    # No permitir desactivarse a sí mismo
    if user_id == current_user.id and user_data.is_active is False:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No puedes desactivar tu propia cuenta"
        )
    
    # No permitir cambiar tu propio rol de admin
    if user_id == current_user.id and user_data.role and user_data.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No puedes cambiar tu propio rol de administrador"
        )
    
    # Actualizar email si se proporciona
    if user_data.email and user_data.email != user.email:
        existing_email = db.query(User).filter(
            User.email == user_data.email,
            User.id != user_id
        ).first()
        
        if existing_email:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="El email ya está en uso por otro usuario"
            )
        user.email = user_data.email
    
    # Actualizar nombre completo
    if user_data.full_name:
        user.full_name = user_data.full_name
    
    # Actualizar rol
    if user_data.role is not None:
        user.role = UserRole(user_data.role)
    
    # Actualizar estado activo
    if user_data.is_active is not None:
        user.is_active = user_data.is_active
    
    db.commit()
    db.refresh(user)
    
    return user


@router.delete("/admin/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_user(
    user_id: int,
    current_user: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    """
    Eliminar un usuario (SOLO ADMIN)
    
    No permite eliminarse a sí mismo
    """
    user = db.query(User).filter(User.id == user_id).first()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Usuario no encontrado"
        )
    
    # No permitir eliminarse a sí mismo
    if user_id == current_user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No puedes eliminar tu propia cuenta"
        )
    
    db.delete(user)
    db.commit()
    
    return None
