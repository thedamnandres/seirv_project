from sqlalchemy import Column, Integer, String, Float, ForeignKey, DateTime, Text, Index
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database.base import Base


class IRVHistory(Base):
    """
    Historial de cambios del IRV de un vehículo
    
    Permite rastrear la evolución del IRV a lo largo del tiempo,
    útil para análisis de tendencias y auditoría.
    """
    __tablename__ = "irv_history"
    
    id = Column(Integer, primary_key=True, index=True)
    vehicle_id = Column(Integer, ForeignKey("vehicles.id", ondelete="CASCADE"), nullable=False, index=True)
    irv_value = Column(Float, nullable=False)  # IRV normalizado
    irv_raw = Column(Float, nullable=False)  # IRV crudo
    irv_level = Column(String(20), nullable=False)  # Nivel de riesgo
    total_recalls = Column(Integer, default=0)
    mileage_factor = Column(Float)
    category_factor = Column(Float)
    calculation_reason = Column(String(100))  # Razón del cálculo: "sync", "manual", "auto", etc.
    notes = Column(Text)
    calculated_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False, index=True)
    
    # Relaciones
    vehicle = relationship("Vehicle", back_populates="irv_history")
    
    # Índices
    __table_args__ = (
        Index('idx_vehicle_calculated_at', 'vehicle_id', 'calculated_at'),
    )
    
    def __repr__(self):
        return f"<IRVHistory(id={self.id}, vehicle_id={self.vehicle_id}, irv={self.irv_value}, date={self.calculated_at})>"

