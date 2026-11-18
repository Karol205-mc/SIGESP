from sqlalchemy import Column, Integer, String, DateTime, Text, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base

class Novedad(Base):
    __tablename__ = "novedades"

    id = Column(Integer, primary_key=True, index=True)
    usuario_id = Column(Integer, ForeignKey("usuarios.id"), nullable=False, index=True)
    sector = Column(String(100), nullable=False)
    tipo_novedad = Column(String(100), nullable=False) # PATRULLAJE, OPERATIVO, DETENCION, INCIDENTE, RELEVO
    descripcion = Column(Text, nullable=False)
    fecha_reporte = Column(DateTime(timezone=True), server_default=func.now(), index=True)

    usuario = relationship("Usuario", back_populates="novedades")
