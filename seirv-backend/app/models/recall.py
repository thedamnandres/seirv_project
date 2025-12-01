from sqlalchemy import Column, Integer, String, Float, ForeignKey, DateTime, Text, Index, CheckConstraint
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database.base import Base


class Recall(Base):
    """
    Modelo de Recall (llamado a revisión) de NHTSA
    """
    __tablename__ = "recalls"
    
    id = Column(Integer, primary_key=True, index=True)
    vehicle_id = Column(Integer, ForeignKey("vehicles.id", ondelete="CASCADE"), nullable=False, index=True)
    
    # Identificación del recall
    nhtsa_campaign_number = Column(String(50), nullable=False, index=True)
    
    # Información del recall
    component = Column(String(200))  # Componente afectado
    summary = Column(Text)  # Resumen del problema
    consequence = Column(Text)  # Consecuencias del problema
    remedy = Column(Text)  # Solución/remedio
    
    # Metadatos
    manufacturer = Column(String(100))
    report_received_date = Column(DateTime(timezone=True))  
    
    # Severidad calculada (para uso en fórmulas IRV)
    severity = Column(Integer, default=2, nullable=False) 
    severity_score = Column(Float, default=2.0) 
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    last_synced_at = Column(DateTime(timezone=True), server_default=func.now())  
    
    # Relaciones
    vehicle = relationship("Vehicle", back_populates="recalls")
    
    # Índices compuestos y validaciones
    __table_args__ = (
        Index('idx_vehicle_severity', 'vehicle_id', 'severity'),
        Index('idx_campaign_number', 'nhtsa_campaign_number'),
        CheckConstraint('severity >= 1 AND severity <= 3', name='check_severity_range'),
    )
    
    def __repr__(self):
        return f"<Recall(id={self.id}, campaign={self.nhtsa_campaign_number}, severity={self.severity})>"
