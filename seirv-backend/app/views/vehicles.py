from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from app.database.base import get_db
from app.models.user import User
from app.models.vehicle import Vehicle
from app.models.category import Category
from app.schemas.vehicle import (
    VehicleCreate,
    VehicleUpdate,
    VehicleResponse,
    VehicleListResponse,
    VehicleDetailResponse,
    VehicleRecallsResponse
)
from app.utils.dependencies import get_current_user
from app.services.nhtsa_service import NHTSAService

router = APIRouter(prefix="/vehicles", tags=["Vehicles"])


@router.get("", response_model=List[VehicleListResponse])
def list_my_vehicles(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Listar todos mis vehículos
    
    Retorna lista simplificada de vehículos del usuario autenticado
    """
    vehicles = db.query(Vehicle).filter(
        Vehicle.user_id == current_user.id
    ).all()
    
    # Agregar el nombre de la categoría a cada vehículo
    result = []
    for vehicle in vehicles:
        category = db.query(Category).filter(Category.id == vehicle.category_id).first()
        vehicle_dict = {
            "id": vehicle.id,
            "make": vehicle.make,
            "model": vehicle.model,
            "year": vehicle.year,
            "license_plate": vehicle.license_plate,
            "mileage": vehicle.mileage,
            "irv_value": vehicle.irv_value,
            "irv_level": vehicle.irv_level,
            "category_name": category.name if category else "Sin categoría",
            "created_at": vehicle.created_at
        }
        result.append(vehicle_dict)
    
    return result


@router.post("", response_model=VehicleResponse, status_code=status.HTTP_201_CREATED)
def create_vehicle(
    vehicle_data: VehicleCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Crear un nuevo vehículo
    
    Valida con NHTSA que el vehículo existe antes de crearlo
    Verifica que la placa no esté duplicada
    """
    # Verificar que la placa no esté en uso
    existing_plate = db.query(Vehicle).filter(
        Vehicle.license_plate == vehicle_data.license_plate
    ).first()
    
    if existing_plate:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"La placa {vehicle_data.license_plate} ya está registrada en el sistema"
        )
    
    # Verificar que la categoría existe
    category = db.query(Category).filter(Category.id == vehicle_data.category_id).first()
    if not category:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Categoría con ID {vehicle_data.category_id} no encontrada"
        )
    
    # TODO: Validar con NHTSA (opcional por ahora)
    # nhtsa_service = NHTSAService()
    # is_valid = nhtsa_service.validate_vehicle(
    #     make=vehicle_data.make,
    #     model=vehicle_data.model,
    #     year=vehicle_data.year
    # )
    # if not is_valid:
    #     raise HTTPException(
    #         status_code=status.HTTP_400_BAD_REQUEST,
    #         detail="El vehículo no existe en la base de datos de NHTSA"
    #     )
    
    # Crear el vehículo
    new_vehicle = Vehicle(
        user_id=current_user.id,
        category_id=vehicle_data.category_id,
        make=vehicle_data.make,
        model=vehicle_data.model,
        year=vehicle_data.year,
        license_plate=vehicle_data.license_plate,
        mileage=vehicle_data.mileage,
        irv_value=0.0,
        irv_level="N/A"
    )
    
    db.add(new_vehicle)
    db.commit()
    db.refresh(new_vehicle)
    
    return new_vehicle


@router.get("/{vehicle_id}", response_model=VehicleDetailResponse)
def get_vehicle_detail(
    vehicle_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Obtener detalle de un vehículo específico
    
    Solo puede ver vehículos propios
    """
    vehicle = db.query(Vehicle).filter(
        Vehicle.id == vehicle_id,
        Vehicle.user_id == current_user.id
    ).first()
    
    if not vehicle:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Vehículo no encontrado"
        )
    
    # Agregar nombre de categoría
    category = db.query(Category).filter(Category.id == vehicle.category_id).first()
    
    vehicle_dict = {
        "id": vehicle.id,
        "user_id": vehicle.user_id,
        "make": vehicle.make,
        "model": vehicle.model,
        "year": vehicle.year,
        "license_plate": vehicle.license_plate,
        "mileage": vehicle.mileage,
        "category_id": vehicle.category_id,
        "irv_value": vehicle.irv_value,
        "irv_level": vehicle.irv_level,
        "last_irv_calculation": vehicle.last_irv_calculation,
        "created_at": vehicle.created_at,
        "updated_at": vehicle.updated_at,
        "category_name": category.name if category else None,
        "total_recalls": 0  # TODO: calcular recalls reales
    }
    
    return vehicle_dict


@router.put("/{vehicle_id}", response_model=VehicleResponse)
def update_vehicle(
    vehicle_id: int,
    vehicle_data: VehicleUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Actualizar kilometraje del vehículo
    
    Solo se puede actualizar el kilometraje (debe ser mayor al actual)
    """
    vehicle = db.query(Vehicle).filter(
        Vehicle.id == vehicle_id,
        Vehicle.user_id == current_user.id
    ).first()
    
    if not vehicle:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Vehículo no encontrado"
        )
    
    # Validar que el nuevo kilometraje sea mayor
    if vehicle_data.mileage < vehicle.mileage:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"El nuevo kilometraje ({vehicle_data.mileage} km) no puede ser menor al actual ({vehicle.mileage} km)"
        )
    
    vehicle.mileage = vehicle_data.mileage
    
    db.commit()
    db.refresh(vehicle)
    
    return vehicle


@router.delete("/{vehicle_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_vehicle(
    vehicle_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Eliminar un vehículo
    
    Solo puede eliminar vehículos propios
    """
    vehicle = db.query(Vehicle).filter(
        Vehicle.id == vehicle_id,
        Vehicle.user_id == current_user.id
    ).first()
    
    if not vehicle:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Vehículo no encontrado"
        )
    
    db.delete(vehicle)
    db.commit()
    
    return None


@router.get("/{vehicle_id}/recalls", response_model=VehicleRecallsResponse)
async def get_vehicle_recalls(
    vehicle_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Obtener recalls (llamados a revisión) de NHTSA para un vehículo
    
    Consulta en tiempo real la API oficial de NHTSA (National Highway Traffic Safety Administration)
    para obtener todos los recalls activos del vehículo según su marca, modelo y año.
    
    **Ejemplo de uso:**
    - GET /api/v1/vehicles/2/recalls
    
    **Retorna:**
    - Lista de recalls con número de campaña, componente afectado, resumen, consecuencias y remedio
    - Total de recalls encontrados
    - Información del vehículo consultado
    
    **Casos de uso:**
    - Verificar si un vehículo tiene problemas de seguridad conocidos antes de comprarlo
    - Revisar recalls pendientes de un vehículo en tu flota
    - Evaluar el nivel de riesgo de un vehículo específico
    """
    # Verificar que el vehículo existe y pertenece al usuario
    vehicle = db.query(Vehicle).filter(
        Vehicle.id == vehicle_id,
        Vehicle.user_id == current_user.id
    ).first()
    
    if not vehicle:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Vehículo no encontrado"
        )
    
    # Consultar recalls desde NHTSA
    try:
        recalls_data = await NHTSAService.fetch_recalls(
            make=vehicle.make,
            model=vehicle.model,
            year=vehicle.year
        )
        
        # Mapear los campos relevantes de cada recall
        recalls_list = []
        for recall in recalls_data:
            recalls_list.append({
                "NHTSACampaignNumber": recall.get("NHTSACampaignNumber"),
                "Component": recall.get("Component"),
                "Summary": recall.get("Summary"),
                "Consequence": recall.get("Consequence"),
                "Remedy": recall.get("Remedy"),
                "ReportReceivedDate": recall.get("ReportReceivedDate"),
                "Manufacturer": recall.get("Manufacturer")
            })
        
        return {
            "vehicle_id": vehicle.id,
            "make": vehicle.make,
            "model": vehicle.model,
            "year": vehicle.year,
            "total_recalls": len(recalls_list),
            "recalls": recalls_list
        }
        
    except HTTPException:
        # Re-lanzar excepciones HTTP (404, timeouts, etc)
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al obtener recalls: {str(e)}"
        )
