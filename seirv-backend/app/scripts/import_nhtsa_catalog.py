"""
Script de importación de catálogo NHTSA

CSV esperado: ID, MAKE, MODEL, MODEL YEAR

Ejecutar: docker exec seirv-backend python -m app.scripts.import_nhtsa_catalog
"""
import sys
import os
import csv

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '../..')))

from app.database.base import SessionLocal
from app.models.vehicle_catalog import VehicleCatalog

# CONFIGURACIÓN: Marcas permitidas (dejar vacío [] para importar todas)
ALLOWED_MAKES = [
    'TOYOTA',
    'CHEVROLET',
    'NISSAN',
    'FORD',
    'HYUNDAI',
    'KIA',
    'MAZDA',
    'HONDA',
    'VOLKSWAGEN',
    'RENAULT',
    'BMW',
    'SUZUKI'
]


def import_catalog(csv_path: str):
    """Importa el catálogo desde CSV"""
    db = SessionLocal()

    total_rows = 0
    added = 0
    skipped = 0
    skipped_by_make = 0
    errors = 0

    print(f"\nIMPORTACIÓN DE CATÁLOGO NHTSA")
    print(f"Archivo: {csv_path}")
    
    if ALLOWED_MAKES:
        print(f"Filtro activo: Solo {len(ALLOWED_MAKES)} marcas permitidas")
        print(f"Marcas: {', '.join(ALLOWED_MAKES[:5])}")
        if len(ALLOWED_MAKES) > 5:
            print(f"        ... y {len(ALLOWED_MAKES) - 5} más")
    else:
        print("Sin filtro: Importando TODAS las marcas")
    print()

    try:
        with open(csv_path, 'r', encoding='utf-8') as f:
            # Detectar delimitador
            sample = f.read(1024)
            f.seek(0)
            try:
                delimiter = csv.Sniffer().sniff(sample).delimiter
            except Exception:
                delimiter = ','  # Default

            reader = csv.DictReader(f, delimiter=delimiter)

            # Validar columnas
            required = {'MAKE', 'MODEL'}
            year_col = 'MODEL YEAR' if 'MODEL YEAR' in (reader.fieldnames or []) else 'YEAR'

            if not required.issubset(set(reader.fieldnames or [])):
                print("Error: faltan columnas requeridas.")
                print(f"   Requeridas: MAKE, MODEL, {year_col}")
                print(f"   Encontradas: {reader.fieldnames}\n")
                return

            for row in reader:
                total_rows += 1

                try:
                    make = row['MAKE'].strip().upper()
                    model = row['MODEL'].strip().upper()
                    year = int(row[year_col])

                    # Validaciones
                    if not make or not model or not year:
                        skipped += 1
                        continue

                    if year < 1990 or year > 2030:
                        skipped += 1
                        continue

                    # Filtro por marca
                    if ALLOWED_MAKES and make not in ALLOWED_MAKES:
                        skipped_by_make += 1
                        continue

                    # Verificar duplicado en BD
                    exists = (
                        db.query(VehicleCatalog)
                        .filter(
                            VehicleCatalog.make == make,
                            VehicleCatalog.model == model,
                            VehicleCatalog.year == year,
                        )
                        .first()
                    )

                    if exists:
                        skipped += 1
                        continue

                    # Crear registro (PostgreSQL asigna ID automáticamente)
                    catalog_entry = VehicleCatalog(
                        make=make,
                        model=model,
                        year=year,
                    )

                    db.add(catalog_entry)
                    added += 1

                    # Commit cada 100
                    if added % 100 == 0:
                        db.commit()

                except Exception as e:
                    errors += 1
                    # Muestra solo los primeros 5 errores concretos
                    if errors <= 5:
                        print(f"⚠️  Error en fila {total_rows}: {e}")
                    continue

            # Commit final
            db.commit()

            # Estadísticas
            total_db = db.query(VehicleCatalog).count()
            makes_count = db.query(VehicleCatalog.make).distinct().count()
            years_count = db.query(VehicleCatalog.year).distinct().count()

            print("\nRESUMEN IMPORTACIÓN")
            print("-------------------")
            print(f"Filas procesadas:     {total_rows}")
            print(f"Importados:           {added}")
            print(f"Omitidos (validación): {skipped}")
            if ALLOWED_MAKES:
                print(f"Omitidos (marca):     {skipped_by_make}")
            print(f"Errores:              {errors}")

            print("\nESTADO DEL CATÁLOGO")
            print("-------------------")
            print(f"Total vehículos:  {total_db}")
            print(f"Marcas:           {makes_count}")
            print(f"Años:             {years_count}\n")

    except FileNotFoundError:
        print(f"\nArchivo no encontrado: {csv_path}\n")
    except Exception as e:
        db.rollback()
        print(f"\nError general: {str(e)}\n")
        import traceback

        traceback.print_exc()
    finally:
        db.close()


if __name__ == "__main__":
    default_csv = "/code/data/RCL_FROM_2020_2024_final.csv"
    csv_path = sys.argv[1] if len(sys.argv) > 1 else default_csv

    print("\n🚀 Iniciando importación...\n")
    import_catalog(csv_path)
    print("✅ Importación completada.\n")