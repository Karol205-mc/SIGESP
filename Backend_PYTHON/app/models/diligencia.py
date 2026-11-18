from sqlalchemy import Column, Integer, String, DateTime, Text, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base

class DiligenciaJudicial(Base):
    __tablename__ = "diligencias_judiciales"

    id = Column(Integer, primary_key=True, index=True)
    denuncia_id = Column(Integer, ForeignKey("denuncias_solicitudes.id", ondelete="CASCADE"), nullable=False, index=True)
    juez_nombre = Column(String(150), nullable=True)
    fiscal_nombre = Column(String(150), nullable=True)
    fecha_audiencia = Column(DateTime(timezone=True), nullable=True)
    sala_audiencia = Column(String(100), nullable=True)
    numero_causa_judicial = Column(String(50), nullable=True)
    observaciones = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    denuncia = relationship("DenunciaSolicitud", back_populates="diligencias")
