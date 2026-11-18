from sqlalchemy import Column, Integer, String, Boolean, DateTime, Text, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base

class Asignacion(Base):
    __tablename__ = "asignaciones"

    id = Column(Integer, primary_key=True, index=True)
    denuncia_id = Column(Integer, ForeignKey("denuncias_solicitudes.id", ondelete="CASCADE"), nullable=False, index=True)
    usuario_asignado_id = Column(Integer, ForeignKey("usuarios.id"), nullable=False, index=True)
    asignado_por_id = Column(Integer, ForeignKey("usuarios.id"), nullable=True)
    fecha_asignacion = Column(DateTime(timezone=True), server_default=func.now())
    prioridad = Column(String(20), default="MEDIA") # BAJA, MEDIA, ALTA, URGENTE
    notas = Column(Text, nullable=True)
    activo = Column(Boolean, default=True)

    denuncia = relationship("DenunciaSolicitud", back_populates="asignaciones")
    usuario_asignado = relationship("Usuario", foreign_keys=[usuario_asignado_id], back_populates="asignaciones_recibidas")
    asignado_por = relationship("Usuario", foreign_keys=[asignado_por_id], back_populates="asignaciones_realizadas")
