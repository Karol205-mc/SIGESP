from sqlalchemy import Column, Integer, String, Boolean, DateTime, Date, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base

class Ciudadano(Base):
    __tablename__ = "ciudadanos"

    id = Column(Integer, primary_key=True, index=True)
    cedula = Column(String(10), unique=True, nullable=False, index=True)
    nombres = Column(String(100), nullable=False)
    apellidos = Column(String(100), nullable=False)
    telefono = Column(String(20), nullable=True)
    email = Column(String(150), nullable=True)
    direccion = Column(Text, nullable=True)
    fecha_nacimiento = Column(Date, nullable=True)
    fecha_expedicion = Column(Date, nullable=True)
    codigo_dactilar = Column(String(20), nullable=True)
    foto_anverso = Column(Text, nullable=True)
    foto_reverso = Column(Text, nullable=True)
    es_menor = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    denuncias = relationship("DenunciaSolicitud", back_populates="ciudadano")
