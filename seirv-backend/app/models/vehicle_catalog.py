from sqlalchemy import Column, Integer, String, Index
from sqlalchemy.sql import func
from sqlalchemy import DateTime
from app.database.base import Base


class VehicleCatalog(Base):
    """
    Catálogo de vehículos para dropdowns en cascada
    """
    __tablename__ = "vehicle_catalog"
    
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    make = Column(String(100), nullable=False, index=True)
    model = Column(String(100), nullable=False, index=True)
    year = Column(Integer, nullable=False, index=True)
    
    # Metadata
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Índices compuestos para búsquedas rápidas
    __table_args__ = (
        Index('idx_make_year', 'make', 'year'),
        Index('idx_make_model_year', 'make', 'model', 'year'),
    )
    
    def __repr__(self):
        return f"<VehicleCatalog(id={self.id}, {self.year} {self.make} {self.model})>"