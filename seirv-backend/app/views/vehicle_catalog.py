from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import List, Dict

from app.database.base import get_db
from app.models.vehicle_catalog import VehicleCatalog
from app.models.category import Category

router = APIRouter(prefix="/catalog", tags=["Vehicle Catalog"])


@router.get("/makes", response_model=List[str])
def get_makes(db: Session = Depends(get_db)):
    """
    Devuelve la lista de marcas disponibles en el catálogo.
    """
    rows = (
        db.query(VehicleCatalog.make)
        .distinct()
        .order_by(VehicleCatalog.make)
        .all()
    )
    return [r[0] for r in rows]


@router.get("/models", response_model=List[str])
def get_models(
    make: str = Query(..., description="Marca del vehículo"),
    db: Session = Depends(get_db),
):
    """
    Devuelve la lista de modelos disponibles para una marca dada.
    Se llama como: /api/v1/catalog/models?make=BMW
    """
    rows = (
        db.query(VehicleCatalog.model)
        .filter(VehicleCatalog.make == make)
        .distinct()
        .order_by(VehicleCatalog.model)
        .all()
    )

    # Si no hay modelos, simplemente devolvemos lista vacía
    return [r[0] for r in rows]


@router.get("/years", response_model=List[int])
def get_years(
    make: str = Query(..., description="Marca del vehículo"),
    model: str = Query(..., description="Modelo del vehículo"),
    db: Session = Depends(get_db),
):
    """
    Devuelve la lista de años disponibles para una marca+modelo.
    Se llama como: /api/v1/catalog/years?make=BMW&model=X5
    """
    rows = (
        db.query(VehicleCatalog.year)
        .filter(
            VehicleCatalog.make == make,
            VehicleCatalog.model == model,
        )
        .distinct()
        .order_by(VehicleCatalog.year)
        .all()
    )
    return [r[0] for r in rows]


@router.get("/dropdown")
def get_dropdown(db: Session = Depends(get_db)):
    """
    Devuelve todos los datos de catálogo necesarios para el formulario:
    - makes: lista de marcas
    - models: dict marca -> [modelos]
    - years: dict "marca|modelo" -> [años]
    - categories: lista de categorías de riesgo (id, name)
    """
    # Marcas
    makes_rows = (
        db.query(VehicleCatalog.make)
        .distinct()
        .order_by(VehicleCatalog.make)
        .all()
    )
    makes = [r[0] for r in makes_rows]

    # Modelos por marca
    models_by_make: Dict[str, List[str]] = {}
    for make in makes:
        model_rows = (
            db.query(VehicleCatalog.model)
            .filter(VehicleCatalog.make == make)
            .distinct()
            .order_by(VehicleCatalog.model)
            .all()
        )
        models_by_make[make] = [m[0] for m in model_rows]

    # Años por marca+modelo
    years_by_make_model: Dict[str, List[int]] = {}
    for make in makes:
        for model in models_by_make[make]:
            year_rows = (
                db.query(VehicleCatalog.year)
                .filter(
                    VehicleCatalog.make == make,
                    VehicleCatalog.model == model,
                )
                .distinct()
                .order_by(VehicleCatalog.year)
                .all()
            )
            years_by_make_model[f"{make}|{model}"] = [y[0] for y in year_rows]

    # Categorías desde la tabla categories
    categories_rows = (
        db.query(Category)
        .order_by(Category.name.asc())
        .all()
    )
    categories_payload = [
        {"id": c.id, "name": c.name}
        for c in categories_rows
    ]

    return {
        "makes": makes,
        "models": models_by_make,
        "years": years_by_make_model,
        "categories": categories_payload,
    }


@router.get("/validate")
def validate_vehicle(
    make: str = Query(...),
    model: str = Query(...),
    year: int = Query(...),
    db: Session = Depends(get_db),
):
    """
    Valida que una combinación marca+modelo+año exista en el catálogo.
    """
    exists = (
        db.query(VehicleCatalog)
        .filter(
            VehicleCatalog.make == make,
            VehicleCatalog.model == model,
            VehicleCatalog.year == year,
        )
        .first()
        is not None
    )
    return {"is_valid": exists}
