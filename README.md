# SEIRV — Sistema de Evaluación del Índice de Riesgo Vehicular 🚗

Sistema web full-stack para gestionar vehículos y evaluar riesgo vehicular con validaciones avanzadas y dropdowns en cascada.

## Descripción del Proyecto

**SEIRV** es una aplicación que permite:
- Registrar vehículos con validación de placas ecuatorianas
- Seleccionar marca, modelo y año desde un catálogo NHTSA
- Asignación automática de categorías según el vehículo
- Autenticación JWT y gestión de usuarios

**Stack tecnológico:**
- **Frontend:** React + Vite + SCSS
- **Backend:** FastAPI + SQLAlchemy + PostgreSQL
- **Infraestructura:** Docker Compose

---

## Ejecución con Docker

### 1. Configurar variables de entorno

Crea un archivo `.env` en la raíz del proyecto:

```env
# Database
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres123
POSTGRES_DB=seirv_db
POSTGRES_PORT=5432

# Backend
DATABASE_URL=postgresql://postgres:postgres123@db:5432/seirv_db
SECRET_KEY=tu-clave-secreta-super-segura
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
DEBUG=True
API_V1_PREFIX=/api/v1
```

### 2. Levantar los servicios

```bash
docker-compose up --build -d
```

Esto iniciará:
- **PostgreSQL** (base de datos)
- **Backend** (FastAPI) → http://localhost:8000
- **Frontend** (Vite/React) → http://localhost:3000

### 3. Inicializar datos

Ejecuta el seed de categorías:

```bash
docker-compose exec backend python -m app.scripts.seed_categories
```

### Nota sobre el error "env: 'bash\r': No such file or directory"

Si ves este error al arrancar el contenedor del backend:

- Causa: normalmente indica que el archivo `entrypoint.sh` tiene finales de línea Windows (CRLF) y el shebang (`#!/usr/bin/env bash`) termina con un CR (`\r`) que provoca el fallo dentro del contenedor Linux.
- Soluciones rápidas:
	- Forzar LF en el repositorio (ya viene incluido `.gitattributes` en este proyecto) y normalizar:

```bash
# Renormaliza todos los archivos según .gitattributes
git add --renormalize .
git commit -m "Normalize line endings"
```

	- Si no quieres tocar git, puedes convertir manualmente el script y reconstruir la imagen:

```powershell
# En Windows con WSL o Git Bash: dos2unix seirv-backend/entrypoint.sh
dos2unix seirv-backend/entrypoint.sh

# Después, reconstruye el contenedor:
docker-compose down -v
docker-compose up --build --force-recreate -d
```

	- Otra opción (Windows PowerShell) sin herramientas adicionales:

```powershell
(Get-Content .\\seirv-backend\\entrypoint.sh) -replace "\r" | Set-Content .\\seirv-backend\\entrypoint.sh -NoNewline
docker-compose down -v; docker-compose up --build --force-recreate -d
```

Después de esto el contenedor debe dejar de mostrar `env: 'bash\r'` y arrancar correctamente.

*(Opcional)* Importar catálogo de vehículos desde CSV:

```bash
docker-compose exec backend python -m app.scripts.import_nhtsa_catalog /code/data/RCL_FROM_2020_2024_final.csv
```

---

## Uso de la Aplicación

**Entorno local:**
1. Accede al frontend en http://localhost:3000
2. Regístrate y haz login
3. Navega a **Mis Vehículos** → **Agregar Vehículo**
4. Selecciona Marca → Modelo → Año (el sistema sugiere la categoría automáticamente)
5. Ingresa la placa (formato ecuatoriano: ABC-123 o ABC-1234)

**Producción:**  
La aplicación está desplegada en: **https://seirv-frontend.onrender.com**

La API valida formato, normaliza la placa y previene duplicados.

---

## API Endpoints

Documentación interactiva en: http://localhost:8000/docs

**Autenticación:**
- `POST /api/v1/auth/register`
- `POST /api/v1/auth/login`

**Vehículos:**
- `GET /api/v1/vehicles` (listar)
- `POST /api/v1/vehicles` (crear)
- `PUT /api/v1/vehicles/{id}` (actualizar)
- `DELETE /api/v1/vehicles/{id}` (eliminar)

**Catálogo:**
- `GET /api/v1/catalog/makes` (marcas disponibles)
- `GET /api/v1/catalog/models?make=...` (modelos filtrados)
- `GET /api/v1/catalog/years?make=...&model=...` (años disponibles)

---

## Créditos

Desarrollado como parte de un proyecto académico para la evaluación de riesgo vehicular.

**Tecnologías principales:** React, FastAPI, PostgreSQL, Docker

Para más información o soporte, consulta la documentación de la API en `/docs` o revisa el código fuente en este repositorio.


