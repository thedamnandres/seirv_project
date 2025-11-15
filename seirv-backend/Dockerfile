FROM python:3.11-slim

WORKDIR /code

RUN apt-get update && apt-get install -y \
    postgresql-client \
    && rm -rf /var/lib/apt/lists/*

# Copiar requirements
COPY requirements.txt .

# Instalar dependencias Python
RUN pip install --no-cache-dir -r requirements.txt

# Copiar el código
COPY . .

# Copiar entrypoint y dar permisos de ejecución
COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

# Exponer puerto
EXPOSE 8000

# Usar el entrypoint para hacer la carga inicial y luego lanzar Uvicorn
ENTRYPOINT ["/entrypoint.sh"]

# Comando que ejecutará el entrypoint al final
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]
