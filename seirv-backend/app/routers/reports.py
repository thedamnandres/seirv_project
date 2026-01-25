from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.database.base import get_db
from app.models.vehicle import Vehicle
from app.models.category import Category
from app.models.recall import Recall

router = APIRouter(prefix="/api/v1/reports", tags=["Reports"])


@router.get("/least-recalls-by-type")
def least_recalls_by_type(
    vehicle_type: str = Query(..., description="Tipo de vehículo (Category.name), ej: SUV"),
    db: Session = Depends(get_db),
):
    row = (
        db.query(
            Vehicle.id.label("vehicle_id"),
            Vehicle.make,
            Vehicle.model,
            Vehicle.year,
            Category.name.label("type"),
            func.count(Recall.id).label("recalls_count"),
        )
        .join(Category, Vehicle.category_id == Category.id)
        .outerjoin(Recall, Recall.vehicle_id == Vehicle.id)
        .filter(Category.name == vehicle_type)
        .group_by(Vehicle.id, Category.name, Vehicle.make, Vehicle.model, Vehicle.year)
        .order_by(func.count(Recall.id).asc(), Vehicle.year.desc())
        .first()
    )

    if not row:
        raise HTTPException(status_code=404, detail=f"No hay vehículos para el tipo '{vehicle_type}'")

    return {
        "type": row.type,
        "vehicle": {
            "id": row.vehicle_id,
            "make": row.make,
            "model": row.model,
            "year": row.year,
            "recalls": int(row.recalls_count),
        },
    }


@router.get("/vehicles-by-type")
def vehicles_by_type(
    vehicle_type: str = Query(..., description="Tipo de vehículo (Category.name), ej: SUV"),
    db: Session = Depends(get_db),
):
    rows = (
        db.query(
            Vehicle.id.label("vehicle_id"),
            Vehicle.make,
            Vehicle.model,
            Vehicle.year,
            Vehicle.license_plate,
            Vehicle.mileage,
            Vehicle.irv_value,
            Vehicle.irv_level,
            Category.name.label("type"),
            func.count(Recall.id).label("recalls_count"),
        )
        .join(Category, Vehicle.category_id == Category.id)
        .outerjoin(Recall, Recall.vehicle_id == Vehicle.id)
        .filter(Category.name == vehicle_type)
        .group_by(
            Vehicle.id,
            Vehicle.make,
            Vehicle.model,
            Vehicle.year,
            Vehicle.license_plate,
            Vehicle.mileage,
            Vehicle.irv_value,
            Vehicle.irv_level,
            Category.name,
        )
        .order_by(func.count(Recall.id).asc(), Vehicle.year.desc())
        .all()
    )

    if not rows:
        raise HTTPException(status_code=404, detail=f"No hay vehículos para el tipo '{vehicle_type}'")

    vehicles = [
        {
            "id": r.vehicle_id,
            "make": r.make,
            "model": r.model,
            "year": r.year,
            "license_plate": r.license_plate,
            "mileage": r.mileage,
            "irv_value": r.irv_value,
            "irv_level": r.irv_level,
            "type": r.type,
            "recalls": int(r.recalls_count),
        }
        for r in rows
    ]

    return {
        "type": vehicle_type,
        "count": len(vehicles),
        "least_recalls_vehicle": vehicles[0],  # ya viene ordenado asc por recalls
        "vehicles": vehicles,
    }

@router.get("/top-brands-by-recalls")
def top_brands_by_recalls(
    limit: int = Query(10, ge=1, le=50, description="Número de marcas a devolver"),
    db: Session = Depends(get_db),
):
    rows = (
        db.query(
            Vehicle.make.label("make"),
            func.count(Recall.id).label("total_recalls"),
        )
        .join(Recall, Recall.vehicle_id == Vehicle.id)
        .group_by(Vehicle.make)
        .order_by(func.count(Recall.id).desc(), Vehicle.make.asc())
        .limit(limit)
        .all()
    )

    # Si no hay recalls en la DB (tabla vacía), devuelve lista vacía
    return {
        "limit": limit,
        "brands": [
            {"make": r.make, "total_recalls": int(r.total_recalls)}
            for r in rows
        ],
    }


@router.get("/worst-vehicles-by-brand")
def worst_vehicles_by_brand(
    make: str = Query(..., description="Marca exacta (Vehicle.make), ej: Toyota"),
    limit: int = Query(10, ge=1, le=100, description="Número de vehículos a devolver"),
    db: Session = Depends(get_db),
):
    rows = (
        db.query(
            Vehicle.id.label("vehicle_id"),
            Vehicle.make,
            Vehicle.model,
            Vehicle.year,
            Category.name.label("type"),
            func.count(Recall.id).label("recalls_count"),
        )
        .join(Category, Vehicle.category_id == Category.id)
        .join(Recall, Recall.vehicle_id == Vehicle.id)  # join normal: solo los que tienen recalls
        .filter(Vehicle.make == make)
        .group_by(
            Vehicle.id,
            Vehicle.make,
            Vehicle.model,
            Vehicle.year,
            Category.name,
        )
        .order_by(func.count(Recall.id).desc(), Vehicle.year.desc())
        .limit(limit)
        .all()
    )

    # Si no hay vehículos con recalls para esa marca, 404 o lista vacía (tú eliges).
    # Yo prefiero lista vacía para no romper el front:
    vehicles = [
        {
            "id": r.vehicle_id,
            "make": r.make,
            "model": r.model,
            "year": r.year,
            "type": r.type,
            "recalls": int(r.recalls_count),
        }
        for r in rows
    ]

    return {
        "make": make,
        "limit": limit,
        "count": len(vehicles),
        "vehicles": vehicles,
    }

@router.get("/safest-vehicle")
def safest_vehicle(
    vehicle_type: str | None = Query(None, description="Tipo (Category.name), ej: SUV"),
    make: str | None = Query(None, description="Marca (Vehicle.make), ej: Toyota"),
    model: str | None = Query(None, description="Modelo (Vehicle.model), ej: Supra"),
    db: Session = Depends(get_db),
):
    q = (
        db.query(
            Vehicle.id.label("vehicle_id"),
            Vehicle.make,
            Vehicle.model,
            Vehicle.year,
            Vehicle.license_plate,
            Vehicle.mileage,
            Vehicle.irv_value,
            Vehicle.irv_level,
            Category.name.label("type"),
            func.count(Recall.id).label("recalls_count"),
        )
        .join(Category, Vehicle.category_id == Category.id)
        .outerjoin(Recall, Recall.vehicle_id == Vehicle.id)
    )

    # Aplicar filtros opcionales
    if vehicle_type:
        q = q.filter(Category.name == vehicle_type)
    if make:
        q = q.filter(Vehicle.make == make)
    if model:
        q = q.filter(Vehicle.model == model)

    row = (
        q.group_by(
            Vehicle.id,
            Vehicle.make,
            Vehicle.model,
            Vehicle.year,
            Vehicle.license_plate,
            Vehicle.mileage,
            Vehicle.irv_value,
            Vehicle.irv_level,
            Category.name,
        )
        .order_by(func.count(Recall.id).asc(), Vehicle.year.desc())
        .first()
    )

    if not row:
        raise HTTPException(
            status_code=404,
            detail="No se encontraron vehículos con esos filtros.",
        )

    return {
        "filters": {
            "vehicle_type": vehicle_type,
            "make": make,
            "model": model,
        },
        "safest_vehicle": {
            "id": row.vehicle_id,
            "make": row.make,
            "model": row.model,
            "year": row.year,
            "license_plate": row.license_plate,
            "mileage": row.mileage,
            "type": row.type,
            "recalls": int(row.recalls_count),
            "irv_value": row.irv_value,
            "irv_level": row.irv_level,
        },
    }
