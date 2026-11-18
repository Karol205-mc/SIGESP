from sqlalchemy import Column, Integer, String, DateTime, Text, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base

class Seguimiento(Base):
    __tablename__ = "seguimiento"

    id = Column(Integer, primary_key=True, index=True)
    denuncia_id = Column(Integer, ForeignKey("denuncias_solicitudes.id", ondelete="CASCADE"), nullable=False, index=True)
    estado_anterior = Column(String(40), nullable=True)
    estado_nuevo = Column(String(40), nullable=False)
    usuario_id = Column(Integer, ForeignKey("usuarios.id"), nullable=True)
    observaciones = Column(Text, nullable=True)
    fecha_cambio = Column(DateTime(timezone=True), server_default=func.now())

    denuncia = relationship("DenunciaSolicitud", back_populates="seguimientos")
    usuario = relationship("Usuario")
