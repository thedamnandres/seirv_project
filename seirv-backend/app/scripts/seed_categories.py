"""
Script para poblar categorías iniciales
Ejecutar: docker exec seirv-backend python -m app.scripts.seed_categories
"""
import sys
import os

# Agregar el directorio raíz al path para que funcione desde cualquier ubicación
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '../..')))

from app.database.base import SessionLocal
from app.models.category import Category


def seed_categories():
    """Pobla las categorías iniciales"""
    
    db = SessionLocal()
    
    categories_data = [
        {"name": "Sedán", "description": "Vehículos de pasajeros de 4 puertas"},
        {"name": "SUV", "description": "Vehículos utilitarios deportivos"},
        {"name": "Crossover", "description": "SUVs compactos urbanos"},
        {"name": "Hatchback", "description": "Compactos y subcompactos"},
        {"name": "Van", "description": "Vehículos comerciales"},
        {"name": "Lujo", "description": "Vehículos premium/ejecutivos"},
        {"name": "Pickup", "description": "Camionetas pickup"},
        {"name": "Deportivo", "description": "Alto rendimiento"},
    ]
    
    try:
        for cat_data in categories_data:
            # Verificar si ya existe
            existing = db.query(Category).filter(
                Category.name == cat_data["name"]
            ).first()
            
            if existing:
                print(f"✓ '{cat_data['name']}' ya existe")
                continue
            
            # Crear
            category = Category(**cat_data)
            db.add(category)
            print(f"✓ Creada: {cat_data['name']}")
        
        db.commit()
        print("\nCategorías pobladas exitosamente!")
        
    except Exception as e:
        db.rollback()
        print(f"\nError: {e}")
    finally:
        db.close()


if __name__ == "__main__":
    print("Poblando categorías...\n")
    seed_categories()