#!/usr/bin/env bash
set -e

echo "===> Esperando a que la base de datos esté lista..."

python - <<'PY'
import time, os
from sqlalchemy import create_engine, text

url = os.environ.get("DATABASE_URL")
engine = create_engine(url)

for i in range(10):
    try:
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        print("Base de datos lista.")
        break
    except Exception as e:
        print(f"DB no lista, reintentando en 3s... ({e})")
        time.sleep(3)
else:
    print("No se pudo conectar a la base de datos después de varios intentos.")
PY

echo "===> Creando tablas si no existen (Base.metadata.create_all)..."

python - <<'PY'
from app.database import Base, engine
# Importa los modelos para que SQLAlchemy conozca todas las tablas
from app import models  # ajusta si tus modelos están en otro módulo

print("Creando/actualizando esquema...")
Base.metadata.create_all(bind=engine)
print("Esquema listo.")
PY

echo "===> Importando catálogo NHTSA (si no está cargado)..."
python -m app.scripts.import_nhtsa_catalog || echo "⚠️ No se pudo importar catálogo (o ya estaba cargado)"

echo "===> Sembrando categorías (si aplica)..."
python -m app.scripts.seed_categories || echo "⚠️ No se pudo sembrar categorías (o ya existían)"

echo "===> Arrancando Uvicorn..."
exec "$@"
