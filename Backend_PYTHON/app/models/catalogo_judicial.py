from sqlalchemy import Column, Integer, String, Boolean, DateTime
from sqlalchemy.sql import func
from app.core.database import Base

class Juez(Base):
    __tablename__ = "jueces"

    id = Column(Integer, primary_key=True, index=True)
    nombre = Column(String(150), nullable=False)
    unidad_judicial = Column(String(200), nullable=False)
    canton = Column(String(100), default="Esmeraldas")
    activo = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class Fiscal(Base):
    __tablename__ = "fiscales"

    id = Column(Integer, primary_key=True, index=True)
    nombre = Column(String(150), nullable=False)
    fiscalia_unidad = Column(String(200), nullable=False)
    canton = Column(String(100), default="Esmeraldas")
    activo = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class SalaAudiencia(Base):
    __tablename__ = "salas_audiencia"

    id = Column(Integer, primary_key=True, index=True)
    nombre = Column(String(150), nullable=False)
    edificio = Column(String(200), nullable=False)
    piso = Column(String(50), default="Piso 1")
    canton = Column(String(100), default="Esmeraldas")
    activa = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
