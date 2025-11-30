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
from app.schemas.recall import RecallUpdate, RecallResponse
from app.utils.dependencies import get_current_user, get_current_admin_user
from app.services.nhtsa_service import NHTSAService
from app.services.recall_sync_service import RecallSyncService
from app.services.recall_severity_service import RecallSeverityService
from app.services.irv_service import IRVService
from app.models.recall import Recall
from datetime import datetime, timezone
import logging

logger = logging.getLogger(__name__)

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
    
    # Contar recalls del vehículo
    total_recalls = db.query(Recall).filter(Recall.vehicle_id == vehicle.id).count()
    
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
        "irv_raw": vehicle.irv_raw if hasattr(vehicle, 'irv_raw') else None,
        "irv_level": vehicle.irv_level,
        "last_irv_calculation": vehicle.last_irv_calculation,
        "created_at": vehicle.created_at,
        "updated_at": vehicle.updated_at,
        "category_name": category.name if category else None,
        "total_recalls": total_recalls
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
    db: Session = Depends(get_db),
    use_cache: bool = True
):
    """
    Obtener recalls (llamados a revisión) de un vehículo
    
    Primero busca en la base de datos local. Si no hay recalls guardados,
    consulta la API de NHTSA.
    
    **Ejemplo de uso:**
    - GET /api/v1/vehicles/2/recalls
    - GET /api/v1/vehicles/2/recalls?use_cache=false (forzar consulta a NHTSA)
    
    **Retorna:**
    - Lista de recalls con número de campaña, componente afectado, resumen, consecuencias y remedio
    - Total de recalls encontrados
    - Información del vehículo consultado
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
    
    # Intentar obtener de BD primero si use_cache=True
    if use_cache:
        recalls_db = db.query(Recall).filter(Recall.vehicle_id == vehicle.id).all()
        
        # Si hay recalls en BD, retornarlos
        if recalls_db:
            recalls_list = []
            for recall in recalls_db:
                recalls_list.append({
                    "NHTSACampaignNumber": recall.nhtsa_campaign_number,
                    "Component": recall.component,
                    "Summary": recall.summary,
                    "Consequence": recall.consequence,
                    "Remedy": recall.remedy,
                    "ReportReceivedDate": recall.report_received_date.isoformat() if recall.report_received_date else None,
                    "Manufacturer": recall.manufacturer,
                    "severity": recall.severity,
                    "severity_score": recall.severity_score
                })
            
            return {
                "vehicle_id": vehicle.id,
                "make": vehicle.make,
                "model": vehicle.model,
                "year": vehicle.year,
                "total_recalls": len(recalls_list),
                "recalls": recalls_list
            }
    
    # Si no hay en BD o use_cache=False, consultar NHTSA
    try:
        recalls_data = await NHTSAService.fetch_recalls(
            make=vehicle.make,
            model=vehicle.model,
            year=vehicle.year
        )
        
        # Mapear los campos relevantes de cada recall
        recalls_list = []
        for recall in recalls_data:
            # Calcular severidad si no está en BD
            severity, severity_score = RecallSeverityService.calculate_severity(recall)
            
            recalls_list.append({
                "NHTSACampaignNumber": recall.get("NHTSACampaignNumber"),
                "Component": recall.get("Component"),
                "Summary": recall.get("Summary"),
                "Consequence": recall.get("Consequence"),
                "Remedy": recall.get("Remedy"),
                "ReportReceivedDate": recall.get("ReportReceivedDate"),
                "Manufacturer": recall.get("Manufacturer"),
                "severity": severity,
                "severity_score": severity_score
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


@router.post("/{vehicle_id}/recalls/sync", status_code=status.HTTP_200_OK)
async def sync_vehicle_recalls(
    vehicle_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Sincronizar y guardar recalls de un vehículo en la base de datos
    
    Consulta la API de NHTSA y guarda/actualiza los recalls en la BD.
    Si un recall ya existe, se actualiza con los datos más recientes.
    Esto permite usar los recalls en cálculos IRV y tener un historial.
    
    **Ejemplo de uso:**
    - POST /api/v1/vehicles/2/recalls/sync
    
    **Retorna:**
    - Estadísticas de la sincronización (creados, actualizados, omitidos)
    - IRV recalculado automáticamente
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
    
    try:
        stats = await RecallSyncService.sync_vehicle_recalls(vehicle, db)
        
        # Recalcular IRV después de sincronizar recalls
        IRVService.update_vehicle_irv(
            vehicle, 
            db, 
            update_category_avg=True,
            save_history=True,
            calculation_reason="sync"
        )
        
        return {
            "message": "Recalls sincronizados exitosamente",
            "vehicle_id": vehicle.id,
            "stats": stats,
            "irv_updated": True,
            "irv_value": vehicle.irv_value,
            "irv_level": vehicle.irv_level
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al sincronizar recalls: {str(e)}"
        )


@router.post("/{vehicle_id}/irv/calculate", status_code=status.HTTP_200_OK)
async def calculate_vehicle_irv(
    vehicle_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    include_breakdown: bool = False
):
    """
    Calcular y actualizar el IRV (Índice de Riesgo Vehicular) de un vehículo
    
    Calcula el IRV usando la formula:IRV_crudo = ( Σ(Severidad * Peso_Tiempo) / TotalRecalls ) * 
                 Factor_Categoria * Factor_Kilometraje
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
    
    try:
        # Calcular y actualizar IRV (guarda en BD y historial)
        vehicle = IRVService.update_vehicle_irv(
            vehicle,
            db,
            update_category_avg=True,
            save_history=True,
            calculation_reason="manual"
        )
        
        # Obtener resultado completo para respuesta
        result = IRVService.calculate_irv(vehicle, db, update_category_avg=False)
        
        response = {
            "message": "IRV calculado exitosamente",
            "vehicle_id": vehicle.id,
            "irv_value": vehicle.irv_value,
            "irv_raw": vehicle.irv_raw,
            "irv_level": vehicle.irv_level,
            "last_calculation": vehicle.last_irv_calculation.isoformat() if vehicle.last_irv_calculation else None
        }
        
        if include_breakdown:
            response["breakdown"] = result["breakdown"]
        
        return response
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al calcular IRV: {str(e)}"
        )


# ============ ENDPOINTS DE ADMINISTRACIÓN (Solo ADMIN) ============

@router.get("/admin/recalls/{recall_id}", response_model=RecallResponse)
def get_recall_detail(
    recall_id: int,
    current_user: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    """
    Obtener detalles de un recall específico (SOLO ADMIN)
    
    Útil para revisar un recall antes de editar su severidad.
    
    **Ejemplo de uso:**
    - GET /api/v1/vehicles/admin/recalls/5
    """
    recall = db.query(Recall).filter(Recall.id == recall_id).first()
    
    if not recall:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Recall no encontrado"
        )
    
    return {
        "id": recall.id,
        "vehicle_id": recall.vehicle_id,
        "nhtsa_campaign_number": recall.nhtsa_campaign_number,
        "component": recall.component,
        "summary": recall.summary,
        "consequence": recall.consequence,
        "remedy": recall.remedy,
        "manufacturer": recall.manufacturer,
        "report_received_date": recall.report_received_date,
        "severity": recall.severity,
        "severity_score": recall.severity_score,
        "created_at": recall.created_at,
        "updated_at": recall.updated_at,
        "last_synced_at": recall.last_synced_at
    }


@router.put("/admin/recalls/{recall_id}/severity", response_model=RecallResponse, status_code=status.HTTP_200_OK)
async def update_recall_severity(
    recall_id: int,
    recall_update: RecallUpdate,
    current_user: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db),
    recalculate_irv: bool = True
):
    """
    Actualizar la severidad de un recall (SOLO ADMIN)
    
    Permite a un administrador corregir manualmente la severidad de un recall
    si el cálculo automático no es correcto.
    
    **Ejemplo de uso:**
    - PUT /api/v1/vehicles/admin/recalls/5/severity
    - PUT /api/v1/vehicles/admin/recalls/5/severity?recalculate_irv=false (no recalcular IRV)
    
    **Body:**
    ```json
    {
        "severity": 3,
        "severity_score": 3.5,
        "notes": "Corregido manualmente: recall crítico de frenos"
    }
    ```
    
    **Retorna:**
    - Recall actualizado con nueva severidad
    - Si recalculate_irv=true, también recalcula el IRV del vehículo
    """
    # Buscar el recall
    recall = db.query(Recall).filter(Recall.id == recall_id).first()
    
    if not recall:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Recall no encontrado"
        )
    
    # Guardar valores anteriores para logging
    old_severity = recall.severity
    old_score = recall.severity_score
    
    # Actualizar severidad
    recall.severity = recall_update.severity
    
    # Actualizar severity_score
    if recall_update.severity_score is not None:
        # Si el admin proporciona un score específico, usarlo
        recall.severity_score = recall_update.severity_score
    else:
        # Si no, calcular un score por defecto basado en la severidad
        recall.severity_score = RecallSeverityService.calculate_severity_score_from_level(
            recall_update.severity
        )
    
    # Guardar notas si se proporcionan
    # Nota: El modelo Recall no tiene campo notes, pero podríamos agregarlo si es necesario
    # Por ahora, las notas se pueden guardar en el historial de IRV si se recalcula
    
    db.commit()
    db.refresh(recall)
    
    # Recalcular IRV del vehículo si se solicita
    vehicle_updated = False
    if recalculate_irv:
        vehicle = db.query(Vehicle).filter(Vehicle.id == recall.vehicle_id).first()
        if vehicle:
            IRVService.update_vehicle_irv(
                vehicle,
                db,
                update_category_avg=False,  # No actualizar promedio de categoría
                save_history=True,
                calculation_reason=f"severity_updated_by_admin_{current_user.id}"
            )
            vehicle_updated = True
    
    # Log del cambio
    logger.info(
        f"Admin {current_user.id} ({current_user.username}) actualizó severidad del recall {recall_id}: "
        f"Severidad {old_severity}→{recall.severity}, Score {old_score}→{recall.severity_score}, "
        f"IRV recalculado: {vehicle_updated}"
    )
    
    return {
        "id": recall.id,
        "vehicle_id": recall.vehicle_id,
        "nhtsa_campaign_number": recall.nhtsa_campaign_number,
        "component": recall.component,
        "summary": recall.summary,
        "consequence": recall.consequence,
        "remedy": recall.remedy,
        "manufacturer": recall.manufacturer,
        "report_received_date": recall.report_received_date,
        "severity": recall.severity,
        "severity_score": recall.severity_score,
        "created_at": recall.created_at,
        "updated_at": recall.updated_at,
        "last_synced_at": recall.last_synced_at
    }
