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
        {
            "name": "Sedán", 
            "description": "Vehículos de pasajeros de 4 puertas",
            "avg_recalls": 3.5  
        },
        {
            "name": "SUV", 
            "description": "Vehículos utilitarios deportivos",
            "avg_recalls": 4.0  
        },
        {
            "name": "Crossover", 
            "description": "SUVs compactos urbanos",
            "avg_recalls": 2.8  
        },
        {
            "name": "Hatchback", 
            "description": "Compactos y subcompactos",
            "avg_recalls": 2.5
        },
        {
            "name": "Van", 
            "description": "Vehículos comerciales",
            "avg_recalls": 2.0
        },
        {
            "name": "Lujo", 
            "description": "Vehículos premium/ejecutivos",
            "avg_recalls": 1.8
        },
        {
            "name": "Pickup", 
            "description": "Camionetas pickup",
            "avg_recalls": 3.8
        },
        {
            "name": "Deportivo", 
            "description": "Alto rendimiento",
            "avg_recalls": 1.5
        },
    ]
    
    try:
        for cat_data in categories_data:
            # Verificar si ya existe
            existing = db.query(Category).filter(
                Category.name == cat_data["name"]
            ).first()
            
            if existing:
                # Actualizar avg_recalls si no tiene valor o es 0
                if existing.avg_recalls == 0.0 or existing.avg_recalls is None:
                    existing.avg_recalls = cat_data.get("avg_recalls", 0.0)
                    print(f"✓ '{cat_data['name']}' actualizada con avg_recalls = {cat_data.get('avg_recalls', 0.0)}")
                else:
                    print(f"✓ '{cat_data['name']}' ya existe con avg_recalls = {existing.avg_recalls}")
                continue
            
            # Crear nueva categoría
            category = Category(**cat_data)
            db.add(category)
            print(f"✓ Creada: {cat_data['name']} (avg_recalls = {cat_data.get('avg_recalls', 0.0)})")
        
        db.commit()
        print("\n Categorías pobladas/actualizadas exitosamente!")
        print("\n Valores de avg_recalls asignados:")
        print("   - SUV: 4.0 (muy populares, alta complejidad)")
        print("   - Pickup: 3.8 (muy populares, muchos modelos)")
        print("   - Sedán: 3.5 (alto volumen, muchos modelos)")
        print("   - Crossover: 2.8 (similar a SUV pero más nuevos)")
        print("   - Hatchback: 2.5 (menos complejos)")
        print("   - Van: 2.0 (menos modelos)")
        print("   - Lujo: 1.8 (mejor control de calidad)")
        print("   - Deportivo: 1.5 (menos modelos, especializados)")
        
    except Exception as e:
        db.rollback()
        print(f"\nError: {e}")
    finally:
        db.close()


if __name__ == "__main__":
    print("Poblando categorías...\n")
    seed_categories()