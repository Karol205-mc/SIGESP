from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from app.core.config import settings
import logging

logger = logging.getLogger("sigesp.database")

# Normalizar URL de PostgreSQL para soportar diferentes formatos de proveedores cloud (Render / Heroku / Aiven)
db_url = settings.DATABASE_URL
if db_url.startswith("postgres://"):
    db_url = db_url.replace("postgres://", "postgresql://", 1)

# Crear el motor SQLAlchemy
engine = create_engine(
    db_url,
    pool_pre_ping=True,
    pool_size=10,
    max_overflow=20,
    pool_recycle=1800
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    """Generador de sesión de base de datos para inyección de dependencias."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
