from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import distinct
from typing import List, Optional

from app.database.base import get_db
from app.models.vehicle_catalog import VehicleCatalog
from app.schemas.vehicle_catalog import (
    MakeResponse,
    YearResponse,
    ModelResponse,
    DropdownResponse
)

router = APIRouter(prefix="/catalog", tags=["Vehicle Catalog"])


@router.get("/makes", response_model=List[str])
def get_available_makes(
    year: Optional[int] = Query(None, description="Filtrar marcas por año"),
    db: Session = Depends(get_db)
):
    """
    Obtener lista de marcas disponibles
    """
    query = db.query(distinct(VehicleCatalog.make))
    
    if year:
        query = query.filter(VehicleCatalog.year == year)
    
    makes = query.order_by(VehicleCatalog.make).all()
    
    return [make[0] for make in makes]


@router.get("/years", response_model=List[int])
def get_available_years(
    make: Optional[str] = Query(None, description="Filtrar años por marca"),
    db: Session = Depends(get_db)
):
    """
    Obtener lista de años disponibles
    
    Si se proporciona 'make', retorna solo años disponibles para esa marca
    """
    query = db.query(distinct(VehicleCatalog.year))
    
    if make:
        query = query.filter(VehicleCatalog.make == make)
    
    years = query.order_by(VehicleCatalog.year.desc()).all()
    
    return [year[0] for year in years]


@router.get("/models", response_model=List[str])
def get_available_models(
    make: str = Query(..., description="Marca del vehículo (requerida)"),
    year: Optional[int] = Query(None, description="Año del vehículo"),
    db: Session = Depends(get_db)
):
    """
    Obtener lista de modelos disponibles
    
    Requiere 'make' (marca)
    Opcionalmente filtra por 'year'
    """
    query = db.query(distinct(VehicleCatalog.model)).filter(
        VehicleCatalog.make == make
    )
    
    if year:
        query = query.filter(VehicleCatalog.year == year)
    
    models = query.order_by(VehicleCatalog.model).all()
    
    return [model[0] for model in models]


@router.get("/dropdown", response_model=DropdownResponse)
def get_dropdown_data(
    make: Optional[str] = Query(None, description="Marca seleccionada"),
    year: Optional[int] = Query(None, description="Año seleccionado"),
    db: Session = Depends(get_db)
):
    """
    Obtener datos completos para dropdowns en cascada
    
    Casos de uso:
    1. Sin parámetros: retorna todas las marcas y años
    2. Con 'make': retorna años y modelos para esa marca
    3. Con 'make' y 'year': retorna modelos para esa marca y año
    
    Ejemplo de flujo:
    - Usuario selecciona marca → obtener años y modelos para esa marca
    - Usuario selecciona año → refinar modelos para marca + año
    """
    response = {
        "makes": [],
        "years": [],
        "models": []
    }
    
    # Caso 1: Sin filtros - retornar todas las marcas y años
    if not make and not year:
        makes = db.query(distinct(VehicleCatalog.make)).order_by(VehicleCatalog.make).all()
        years = db.query(distinct(VehicleCatalog.year)).order_by(VehicleCatalog.year.desc()).all()
        
        response["makes"] = [m[0] for m in makes]
        response["years"] = [y[0] for y in years]
        
    # Caso 2: Solo marca seleccionada
    elif make and not year:
        # Años disponibles para esta marca
        years = db.query(distinct(VehicleCatalog.year)).filter(
            VehicleCatalog.make == make
        ).order_by(VehicleCatalog.year.desc()).all()
        
        # Todos los modelos de esta marca (sin filtro de año aún)
        models = db.query(distinct(VehicleCatalog.model)).filter(
            VehicleCatalog.make == make
        ).order_by(VehicleCatalog.model).all()
        
        response["years"] = [y[0] for y in years]
        response["models"] = [m[0] for m in models]
        
    # Caso 3: Marca y año seleccionados
    elif make and year:
        # Modelos específicos para marca + año
        models = db.query(distinct(VehicleCatalog.model)).filter(
            VehicleCatalog.make == make,
            VehicleCatalog.year == year
        ).order_by(VehicleCatalog.model).all()
        
        response["models"] = [m[0] for m in models]
    
    return response


@router.get("/validate")
def validate_vehicle(
    make: str = Query(..., description="Marca del vehículo"),
    model: str = Query(..., description="Modelo del vehículo"),
    year: int = Query(..., description="Año del vehículo"),
    db: Session = Depends(get_db)
):
    """
    Validar que un vehículo específico existe en el catálogo
    
    Útil antes de crear un vehículo en el sistema
    """
    vehicle_exists = db.query(VehicleCatalog).filter(
        VehicleCatalog.make == make,
        VehicleCatalog.model == model,
        VehicleCatalog.year == year
    ).first()
    
    return {
        "exists": vehicle_exists is not None,
        "make": make,
        "model": model,
        "year": year
    }
