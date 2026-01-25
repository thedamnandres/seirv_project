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
