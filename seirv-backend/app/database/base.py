from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from app.config.settings import settings

# Crear el engine de la base de datos
engine = create_engine(
    settings.DATABASE_URL,
    echo=settings.DEBUG,
    pool_pre_ping=True,
    pool_size=10,
    max_overflow=20
)

# Crear la sesión
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Base para los modelos
Base = declarative_base()


# Dependency para obtener la sesión de base de datos
def get_db():
    """
    Genera una sesión de base de datos y la cierra al finalizar.
    Se usa como dependencia en los endpoints.
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()