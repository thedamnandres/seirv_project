from sqlalchemy.orm import Session
from app.models.category import Category

default_categories = [
    {"name": "Sedán", "description": "Vehículos de pasajeros de 4 puertas"},
    {"name": "SUV", "description": "Vehículos utilitarios deportivos"},
    {"name": "Crossover", "description": "SUVs compactos urbanos"},
    {"name": "Hatchback", "description": "Compactos y subcompactos"},
    {"name": "Van", "description": "Vehículos comerciales"},
    {"name": "Lujo", "description": "Vehículos premium/ejecutivos"},
    {"name": "Pickup", "description": "Camionetas pickup"},
    {"name": "Deportivo", "description": "Alto rendimiento"},
]

def seed_categories(db: Session):
    for cat in default_categories:
        existing = db.query(Category).filter(Category.name == cat["name"]).first()
        if not existing:
            db.add(Category(**cat))
    db.commit()
