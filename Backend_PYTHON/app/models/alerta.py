from sqlalchemy import Column, Integer, String, Numeric, Text, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base

class AlertaPanico(Base):
    __tablename__ = "alertas_panico"

    id = Column(Integer, primary_key=True, index=True)
    codigo_alerta = Column(String(30), unique=True, nullable=False, index=True)
    ciudadano_id = Column(Integer, ForeignKey("ciudadanos.id"), nullable=True)
    usuario_id = Column(Integer, ForeignKey("usuarios.id"), nullable=True)
    latitud = Column(Numeric(10, 6), nullable=False)
    longitud = Column(Numeric(10, 6), nullable=False)
    direccion_referencial = Column(Text, nullable=True)
    tipo_emergencia = Column(String(50), default="BOTON_PANICO_SOS")
    estado = Column(String(30), default="DESPACHADO")
    patrulla_asignada = Column(String(50), default="Móvil PN-420 (Flagrancia)")
    fecha_alerta = Column(DateTime(timezone=True), server_default=func.now())

    ciudadano = relationship("Ciudadano")
    usuario = relationship("Usuario")
