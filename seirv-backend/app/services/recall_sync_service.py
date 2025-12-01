from sqlalchemy.orm import Session
from sqlalchemy.sql import func
from datetime import datetime
from typing import Optional, List
import logging

from app.models.vehicle import Vehicle
from app.models.recall import Recall
from app.services.nhtsa_service import NHTSAService
from app.services.recall_severity_service import RecallSeverityService

logger = logging.getLogger(__name__)


class RecallSyncService:
    """
    Servicio para sincronizar recalls de vehículos con NHTSA y guardarlos en BD
    """
    
    @staticmethod
    def parse_date(date_str: Optional[str]) -> Optional[datetime]:
        """
        Parsea una fecha de string a datetime
        
        Soporta múltiples formatos:
        - ISO: "2023-01-15" o "2023-01-15T00:00:00"
        - DD/MM/YYYY: "01/12/2021"
        - MM/DD/YYYY: "12/01/2021" (formato alternativo)
        """
        if not date_str:
            return None
        
        # Limpiar espacios
        date_str = date_str.strip()
        
        try:
            # Formato ISO con tiempo: "2023-01-15T00:00:00" o "2023-01-15T00:00:00Z"
            if 'T' in date_str:
                return datetime.fromisoformat(date_str.replace('Z', '+00:00'))
            
            # Formato ISO simple: "2023-01-15"
            if '-' in date_str and len(date_str.split('-')[0]) == 4:
                return datetime.strptime(date_str, "%Y-%m-%d")
            
            # Formato DD/MM/YYYY: "01/12/2021"
            if '/' in date_str:
                parts = date_str.split('/')
                if len(parts) == 3:
                    # Intentar DD/MM/YYYY primero (más común en formato internacional)
                    try:
                        day, month, year = parts
                        # Validar que sea DD/MM/YYYY (día <= 31, mes <= 12)
                        if int(day) <= 31 and int(month) <= 12:
                            return datetime.strptime(date_str, "%d/%m/%Y")
                    except (ValueError, IndexError):
                        pass
                    
                    # Si falla, intentar MM/DD/YYYY (formato americano)
                    try:
                        return datetime.strptime(date_str, "%m/%d/%Y")
                    except ValueError:
                        pass
            
            # Si ningún formato funciona, loguear y retornar None
            logger.warning(f"No se pudo parsear la fecha en formato reconocido: {date_str}")
            return None
            
        except Exception as e:
            logger.warning(f"Error parseando fecha {date_str}: {e}")
            return None
    
    @classmethod
    async def sync_vehicle_recalls(
        cls,
        vehicle: Vehicle,
        db: Session
    ) -> dict:
        """
        Sincroniza los recalls de un vehículo con NHTSA y los guarda en BD
        
        Si un recall ya existe, se actualiza con los datos más recientes.
        Si no existe, se crea uno nuevo.
        
        Args:
            vehicle: Vehículo a sincronizar
            db: Sesión de base de datos
            
        Returns:
            Dict con estadísticas de la sincronización
        """
        try:
            # Obtener recalls de NHTSA
            nhtsa_recalls = await NHTSAService.fetch_recalls(
                make=vehicle.make,
                model=vehicle.model,
                year=vehicle.year
            )
            
            # Obtener recalls existentes en BD
            existing_recalls = {
                r.nhtsa_campaign_number: r
                for r in db.query(Recall).filter(Recall.vehicle_id == vehicle.id).all()
            }
            
            stats = {
                "total_nhtsa": len(nhtsa_recalls),
                "created": 0,
                "updated": 0,
                "errors": []
            }
            
            # Procesar cada recall de NHTSA
            for recall_data in nhtsa_recalls:
                campaign_number = recall_data.get("NHTSACampaignNumber")
                
                if not campaign_number:
                    stats["errors"].append("Recall sin número de campaña")
                    continue
                
                # Verificar si ya existe
                if campaign_number in existing_recalls:
                    # Actualizar recall existente con datos más recientes
                    existing_recall = existing_recalls[campaign_number]
                    
                    existing_recall.component = recall_data.get("Component")
                    existing_recall.summary = recall_data.get("Summary")
                    existing_recall.consequence = recall_data.get("Consequence")
                    existing_recall.remedy = recall_data.get("Remedy")
                    existing_recall.manufacturer = recall_data.get("Manufacturer")
                    existing_recall.report_received_date = cls.parse_date(
                        recall_data.get("ReportReceivedDate")
                    )
                    existing_recall.last_synced_at = func.now()
                    
                    # IMPORTANTE: NO sobrescribir severity ni severity_score si fueron editados manualmente
                    # Solo actualizar si no tienen valor (recalls nuevos sin severidad asignada)
                    # Si un admin editó la severidad, mantenerla
                    if existing_recall.severity is None:
                        # Solo calcular severidad si no tiene valor asignado
                        severity, score = RecallSeverityService.calculate_severity(recall_data)
                        existing_recall.severity = severity
                        existing_recall.severity_score = score
                    # Si ya tiene severity, mantenerlo (fue editado por admin o ya calculado)
                    # El severity_score se mantiene igual, no se recalcula
                    
                    stats["updated"] += 1
                else:
                    # Crear nuevo recall
                    severity, score = RecallSeverityService.calculate_severity(recall_data)
                    
                    new_recall = Recall(
                        vehicle_id=vehicle.id,
                        nhtsa_campaign_number=campaign_number,
                        component=recall_data.get("Component"),
                        summary=recall_data.get("Summary"),
                        consequence=recall_data.get("Consequence"),
                        remedy=recall_data.get("Remedy"),
                        manufacturer=recall_data.get("Manufacturer"),
                        report_received_date=cls.parse_date(recall_data.get("ReportReceivedDate")),
                        severity=severity,
                        severity_score=score
                    )
                    
                    db.add(new_recall)
                    stats["created"] += 1
            
            db.commit()
            
            logger.info(
                f"Sincronización completada para vehículo {vehicle.id}: "
                f"{stats['created']} creados, {stats['updated']} actualizados"
            )
            
            return stats
            
        except Exception as e:
            db.rollback()
            logger.error(f"Error sincronizando recalls para vehículo {vehicle.id}: {e}")
            raise
    
    @classmethod
    async def sync_all_vehicles(
        cls,
        db: Session,
        limit: Optional[int] = None,
        offset: int = 0
    ) -> dict:
        """
        Sincroniza recalls de todos los vehículos en la BD
        
        Args:
            db: Sesión de base de datos
            limit: Límite de vehículos a procesar (None = todos)
            offset: Offset para paginación
            
        Returns:
            Dict con estadísticas generales
        """
        vehicles = db.query(Vehicle).offset(offset)
        
        if limit:
            vehicles = vehicles.limit(limit)
        
        vehicles = vehicles.all()
        
        total_stats = {
            "total_vehicles": len(vehicles),
            "successful": 0,
            "failed": 0,
            "total_recalls_created": 0,
            "total_recalls_updated": 0,
            "errors": []
        }
        
        for vehicle in vehicles:
            try:
                stats = await cls.sync_vehicle_recalls(vehicle, db)
                total_stats["successful"] += 1
                total_stats["total_recalls_created"] += stats["created"]
                total_stats["total_recalls_updated"] += stats["updated"]
            except Exception as e:
                total_stats["failed"] += 1
                total_stats["errors"].append({
                    "vehicle_id": vehicle.id,
                    "error": str(e)
                })
                logger.error(f"Error sincronizando vehículo {vehicle.id}: {e}")
        
        return total_stats

