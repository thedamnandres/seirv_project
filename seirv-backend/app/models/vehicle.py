from sqlalchemy import Column, Integer, String, Float, ForeignKey, DateTime, CheckConstraint
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database.base import Base
from datetime import datetime


class Vehicle(Base):
    """
    Modelo de Vehículo

    VALIDACIONES:
    - Datos de NHTSA verificados antes de crear
    """
    __tablename__ = "vehicles"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    category_id = Column(Integer, ForeignKey("categories.id"), nullable=False)  # ← NUEVO
    
    # Datos del vehículo (verificados con NHTSA)
    make = Column(String(50), nullable=False)
    model = Column(String(50), nullable=False)
    year = Column(Integer, nullable=False)
    mileage = Column(Integer, nullable=False)
    
    # IRV (futuro)
    irv_value = Column(Float, default=0.0)
    irv_level = Column(String(20), default="N/A")
    last_irv_calculation = Column(DateTime(timezone=True))
    
    # Metadatos
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Validaciones BD
    __table_args__ = (
        CheckConstraint('mileage >= 0 AND mileage <= 500000', name='check_mileage_range'),
        CheckConstraint(f'year >= 1990 AND year <= {datetime.now().year + 1}', name='check_year_range'),
    )
    
    user = relationship("User", back_populates="vehicles")
    category = relationship("Category", back_populates="vehicles")  # ← NUEVO
    
    def __repr__(self):
        return f"<Vehicle(id={self.id}, {self.year} {self.make} {self.model})>"