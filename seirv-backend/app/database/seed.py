from sqlalchemy.orm import Session
from app.models.category import Category

default_categories = [
    {"name": "Sedán", "description": "Vehículos de pasajeros de 4 puertas"},
    {"name": "SUV", "description": "Vehículos utilitarios deportivos"},
    {"name": "Camioneta", "description": "Vehículos de carga"},
    {"name": "Hatchback", "description": "Vehículos compactos"},
    {"name": "Coupé", "description": "Vehículos deportivos de 2 puertas"},
    {"name": "Minivan", "description": "Vehículos familiares"},
    {"name": "Pickup", "description": "Camionetas pickup"},
    {"name": "Convertible", "description": "Vehículos con techo retráctil"},
]

def seed_categories(db: Session):
    for cat in default_categories:
        existing = db.query(Category).filter(Category.name == cat["name"]).first()
        if not existing:
            db.add(Category(**cat))
    db.commit()
