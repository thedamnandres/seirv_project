from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import datetime, timezone
from typing import Optional, Dict
import logging

from app.models.vehicle import Vehicle
from app.models.recall import Recall
from app.models.category import Category
from app.models.irv_history import IRVHistory

logger = logging.getLogger(__name__)


class IRVService:
    """
    Servicio para calcular el Índice de Riesgo Vehicular (IRV)
    
    Fórmula IRV Crudo:
    IRV_crudo = ( Σ(Severidad * Peso_Tiempo) / TotalRecalls ) * 
                 Factor_Categoria * Factor_Kilometraje
    
    Fórmula IRV Normalizado:
    IRV = ( IRV_crudo / IRV_max_teorico ) * 100
    
    """
    
    # IRV máximo teórico para normalización
    IRV_MAX_TEORICO = 15.0
    
    @staticmethod
    def calculate_time_weight(report_date: Optional[datetime]) -> float:
        """
        Calcula el Peso_Tiempo basado en días desde la fecha del recall
        
        Reglas:
        - < 90 días    → 1.0
        - 90–180 días  → 1.2
        - > 180 días   → 1.5

        """
        if not report_date:
            return 1.5
        
        # Calcular días desde la fecha del recall
        if report_date.tzinfo:
            now = datetime.now(timezone.utc)
        else:
            now = datetime.utcnow()
            report_date = report_date.replace(tzinfo=timezone.utc)
        
        days_elapsed = (now - report_date).days
        
        # Reglas
        if days_elapsed < 90:
            return 1.0
        elif days_elapsed <= 180:
            return 1.2
        else:  
            return 1.5
    
    @staticmethod
    def calculate_mileage_factor(mileage: int) -> float:
        """
        Calcula el Factor_Kilometraje basado en el kilometraje del vehículo
        
        Reglas:
        - < 70,000 km           → 1.0
        - 70,000–120,000 km     → 1.15
        - 120,000–200,000 km    → 1.35
        - > 200,000 km          → 1.5
        
        """
        if mileage < 70000:
            return 1.0
        elif mileage < 120000:
            return 1.15
        elif mileage < 200000:
            return 1.35
        else:  
            return 1.5
    
    @classmethod
    def calculate_category_factor(
        cls,
        vehicle_recalls_count: int,
        category_avg_recalls: float,
        db: Session,
        category_id: int
    ) -> float:
        """
        Calcula el Factor_Categoria
        
        Fórmula: min( RecallsVehiculo / PromedioRecallsCategoria , 2.0 )
        
        Si el promedio de la categoría es 0, se usa 1.0 como factor por defecto.

        """
        # Si no hay promedio calculado, calcularlo ahora
        if category_avg_recalls == 0.0:
            # Calcular promedio de recalls para la categoría
            vehicles_in_category = db.query(Vehicle).filter(
                Vehicle.category_id == category_id
            ).all()
            
            if not vehicles_in_category:
                return 1.0
            
            total_recalls = 0
            vehicles_with_recalls = 0
            
            for v in vehicles_in_category:
                recall_count = db.query(Recall).filter(
                    Recall.vehicle_id == v.id
                ).count()
                total_recalls += recall_count
                if recall_count > 0:
                    vehicles_with_recalls += 1
            
            if vehicles_with_recalls == 0:
                category_avg_recalls = 0.0
            else:
                category_avg_recalls = total_recalls / vehicles_with_recalls
        
        # Si el promedio es 0, usar 1.0
        if category_avg_recalls == 0.0:
            return 1.0
        
        # Calcular factor: min(recalls_vehiculo / promedio_categoria, 2.0)
        factor = vehicle_recalls_count / category_avg_recalls
        return min(factor, 2.0)
    
    @classmethod
    def calculate_irv(
        cls,
        vehicle: Vehicle,
        db: Session,
        update_category_avg: bool = True
    ) -> Dict:
        """
        Calcula el IRV crudo para un vehículo
        
        Fórmula:
        IRV_crudo = ( Σ(Severidad * Peso_Tiempo) / TotalRecalls ) * 
                     Factor_Categoria * Factor_Kilometraje
        
        """
        # Obtener todos los recalls del vehículo
        recalls = db.query(Recall).filter(Recall.vehicle_id == vehicle.id).all()
        
        if not recalls:
            return {
                "irv_value": 0,  # IRV normalizado
                "irv_level": "Sin Recalls",
                "irv_raw": 0.0,  # IRV crudo
                "breakdown": {
                    "total_recalls": 0,
                    "sum_severity_time": 0.0,
                    "average_severity_time": 0.0,
                    "mileage_factor": cls.calculate_mileage_factor(vehicle.mileage),
                    "category_factor": 1.0,
                    "irv_raw": 0.0,
                    "irv_max_teorico": cls.IRV_MAX_TEORICO,
                    "irv_normalized": 0
                }
            }
        
        # Calcular Σ(Severidad * Peso_Tiempo)
        sum_severity_time = 0.0
        recall_details = []
        
        for recall in recalls:
            time_weight = cls.calculate_time_weight(recall.report_received_date)
            severity_time = recall.severity * time_weight
            sum_severity_time += severity_time
            
            # Calcular días transcurridos para el desglose
            days_elapsed = None
            if recall.report_received_date:
                now = datetime.now(timezone.utc) if recall.report_received_date.tzinfo else datetime.utcnow()
                if not recall.report_received_date.tzinfo:
                    report_date_utc = recall.report_received_date.replace(tzinfo=timezone.utc)
                else:
                    report_date_utc = recall.report_received_date
                days_elapsed = (now - report_date_utc).days
            
            recall_details.append({
                "recall_id": recall.id,
                "severity": recall.severity,
                "time_weight": time_weight,
                "severity_time": severity_time,
                "days_elapsed": days_elapsed
            })
        
        # Σ(Severidad * Peso_Tiempo) / TotalRecalls
        total_recalls = len(recalls)
        average_severity_time = sum_severity_time / total_recalls
        
        # Factor_Kilometraje
        mileage_factor = cls.calculate_mileage_factor(vehicle.mileage)
        
        # Factor_Categoria
        category = db.query(Category).filter(Category.id == vehicle.category_id).first()
        category_avg_recalls = category.avg_recalls if category else 0.0
        
        category_factor = cls.calculate_category_factor(
            vehicle_recalls_count=total_recalls,
            category_avg_recalls=category_avg_recalls,
            db=db,
            category_id=vehicle.category_id
        )
        
        # Actualizar promedio de categoría si se solicita
        if update_category_avg and category:
            # Recalcular promedio de la categoría
            vehicles_in_category = db.query(Vehicle).filter(
                Vehicle.category_id == vehicle.category_id
            ).all()
            
            total_recalls_category = 0
            vehicles_with_recalls = 0
            
            for v in vehicles_in_category:
                recall_count = db.query(Recall).filter(
                    Recall.vehicle_id == v.id
                ).count()
                total_recalls_category += recall_count
                if recall_count > 0:
                    vehicles_with_recalls += 1
            
            if vehicles_with_recalls > 0:
                new_avg = total_recalls_category / vehicles_with_recalls
                category.avg_recalls = new_avg
                db.commit()
        
        # Calcular IRV_crudo
        irv_raw = average_severity_time * category_factor * mileage_factor
        
        # Normalizar IRV a escala 0-100
        irv_normalized = cls.normalize_irv(irv_raw)
        
        # Determinar nivel de riesgo basado en IRV normalizado
        irv_level = cls.determine_irv_level(irv_normalized)
        
        return {
            "irv_value": irv_normalized,  # IRV normalizado (0-100, sin decimales)
            "irv_level": irv_level,
            "irv_raw": round(irv_raw, 2),  # IRV crudo para referencia
            "breakdown": {
                "total_recalls": total_recalls,
                "sum_severity_time": round(sum_severity_time, 2),
                "average_severity_time": round(average_severity_time, 2),
                "mileage_factor": mileage_factor,
                "category_factor": round(category_factor, 2),
                "category_avg_recalls": round(category_avg_recalls, 2),
                "irv_raw": round(irv_raw, 2),
                "irv_max_teorico": cls.IRV_MAX_TEORICO,
                "irv_normalized": irv_normalized,
                "recall_details": recall_details
            }
        }
    
    @classmethod
    def normalize_irv(cls, irv_raw: float) -> int:
        """
        Normaliza el IRV crudo a un valor entre 0 y 100
        
        Fórmula: IRV = ( IRV_crudo / IRV_max_teorico ) * 100
        
        El resultado se redondea sin decimales y se limita entre 0 y 100.

        """
        if irv_raw <= 0:
            return 0
        
        # Calcular IRV normalizado
        irv_normalized = (irv_raw / cls.IRV_MAX_TEORICO) * 100
        
        # Limitar entre 0 y 100 y redondear sin decimales
        irv_normalized = max(0, min(100, round(irv_normalized)))
        
        return int(irv_normalized)
    
    @staticmethod
    def determine_irv_level(irv_normalized: int) -> str:
        """
        Determina el nivel de riesgo basado en el valor IRV normalizado (0-100)
        
        Clasificación:
        - 0: Sin Recalls
        - 1-33: Bajo
        - 34-66: Medio
        - 67-100: Alto
        
        """
        if irv_normalized == 0:
            return "Sin Recalls"
        elif irv_normalized <= 33:
            return "Bajo"
        elif irv_normalized <= 66:
            return "Medio"
        else:  # 67-100
            return "Alto"
    
    @classmethod
    def update_vehicle_irv(
        cls,
        vehicle: Vehicle,
        db: Session,
        update_category_avg: bool = True,
        save_history: bool = True,
        calculation_reason: str = "auto"
    ) -> Vehicle:
        """
        Calcula y actualiza el IRV de un vehículo en la base de datos
        
        Guarda:
        - IRV normalizado (0-100) en irv_value
        - IRV crudo en irv_raw
        - Nivel en irv_level
        - Historial en irv_history (si existe)

        """
        result = cls.calculate_irv(vehicle, db, update_category_avg)
        
        # Guardar valores actuales en el vehículo
        vehicle.irv_value = float(result["irv_value"])  # IRV normalizado (0-100)
        vehicle.irv_raw = result["irv_raw"]  # IRV crudo
        vehicle.irv_level = result["irv_level"]
        vehicle.last_irv_calculation = datetime.now(timezone.utc)
        
        # Guardar en historial si se solicita
        if save_history:
            breakdown = result["breakdown"]
            history_entry = IRVHistory(
                vehicle_id=vehicle.id,
                irv_value=float(result["irv_value"]),
                irv_raw=result["irv_raw"],
                irv_level=result["irv_level"],
                total_recalls=breakdown["total_recalls"],
                mileage_factor=breakdown["mileage_factor"],
                category_factor=breakdown["category_factor"],
                calculation_reason=calculation_reason
            )
            db.add(history_entry)
        
        db.commit()
        db.refresh(vehicle)
        
        logger.info(
            f"IRV actualizado para vehículo {vehicle.id}: "
            f"IRV={result['irv_value']} (normalizado), IRV_crudo={result['irv_raw']}, Nivel={result['irv_level']}"
        )
        
        return vehicle

