from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database.base import get_db
from app.models.user import User
from app.schemas.user import UserResponse, UserUpdate
from app.utils.dependencies import get_current_user

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
