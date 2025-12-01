from sqlalchemy import Column, Integer, String, Float, ForeignKey, DateTime, CheckConstraint, UniqueConstraint
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database.base import Base
from datetime import datetime


class Vehicle(Base):
    """
    Modelo de Vehículo
    """
    __tablename__ = "vehicles"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    category_id = Column(Integer, ForeignKey("categories.id"), nullable=False)  # ← NUEVO
    
    # Datos del vehículo (verificados con NHTSA)
    make = Column(String(50), nullable=False)
    model = Column(String(50), nullable=False)
    year = Column(Integer, nullable=False)
    license_plate = Column(String(8), nullable=False, index=True)  
    mileage = Column(Integer, nullable=False)
    
    # IRV 
    irv_value = Column(Float, default=0.0)  # IRV normalizado
    irv_raw = Column(Float, default=0.0)  # IRV crudo (para referencia y análisis)
    irv_level = Column(String(20), default="N/A")  # Nivel: Sin Recalls, Bajo, Medio, Alto
    last_irv_calculation = Column(DateTime(timezone=True))  # Ultimo cálculo
    
    # Metadatos
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Validaciones BD
    __table_args__ = (
        CheckConstraint('mileage >= 0 AND mileage <= 500000', name='check_mileage_range'),
        CheckConstraint(f'year >= 1990 AND year <= {datetime.now().year + 1}', name='check_year_range'),
        UniqueConstraint('license_plate', name='unique_license_plate'),  # Placa única en todo el sistema
    )
    
    user = relationship("User", back_populates="vehicles")
    category = relationship("Category", back_populates="vehicles")  # ← NUEVO
    recalls = relationship("Recall", back_populates="vehicle", cascade="all, delete-orphan")
    irv_history = relationship("IRVHistory", back_populates="vehicle", cascade="all, delete-orphan")
    
    def __repr__(self):
        return f"<Vehicle(id={self.id}, {self.year} {self.make} {self.model})>"