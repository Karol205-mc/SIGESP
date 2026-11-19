from sqlalchemy import Column, Integer, String, Boolean, DateTime, Text, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base

class EstadoTramite(Base):
    __tablename__ = "estados_tramite"

    id = Column(Integer, primary_key=True, index=True)
    codigo = Column(String(50), unique=True, nullable=False, index=True)
    nombre = Column(String(100), nullable=False)
    descripcion = Column(Text, nullable=True)
    color = Column(String(30), default="blue")
    orden = Column(Integer, default=1)

class CategoriaDelito(Base):
    __tablename__ = "categorias_delitos"

    id = Column(Integer, primary_key=True, index=True)
    codigo = Column(String(30), unique=True, nullable=False, index=True)
    nombre = Column(String(150), nullable=False)
    gravedad = Column(String(30), nullable=False) # LEVE, MEDIA, GRAVE, MUY GRAVE
    descripcion = Column(Text, nullable=True)
    es_dinapen = Column(Boolean, default=False)

    denuncias = relationship("DenunciaSolicitud", back_populates="categoria")

class DenunciaSolicitud(Base):
    __tablename__ = "denuncias_solicitudes"

    id = Column(Integer, primary_key=True, index=True)
    codigo_unico = Column(String(30), unique=True, nullable=False, index=True)
    ciudadano_id = Column(Integer, ForeignKey("ciudadanos.id"), nullable=False)
    categoria_id = Column(Integer, ForeignKey("categorias_delitos.id"), nullable=False)
    tipo_tramite = Column(String(50), nullable=False)
    descripcion_hechos = Column(Text, nullable=False)
    direccion_hechos = Column(Text, nullable=False)
    sector = Column(String(100), nullable=True)
    fecha_hechos = Column(DateTime(timezone=True), nullable=False)
    evidencia_url = Column(Text, nullable=True)
    estado = Column(String(40), nullable=False, default="Registrada", index=True)
    orden_captura_activa = Column(Boolean, default=False)
    medida_proteccion = Column(Boolean, default=False)
    tiene_sentencia_condenatoria = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    ciudadano = relationship("Ciudadano", back_populates="denuncias")
    categoria = relationship("CategoriaDelito", back_populates="denuncias")
    asignaciones = relationship("Asignacion", back_populates="denuncia", cascade="all, delete-orphan")
    diligencias = relationship("DiligenciaJudicial", back_populates="denuncia", cascade="all, delete-orphan")
    seguimientos = relationship("Seguimiento", back_populates="denuncia", cascade="all, delete-orphan", order_by="Seguimiento.fecha_cambio.desc()")

    @property
    def asignada(self) -> bool:
        return any(a.activo for a in self.asignaciones) if self.asignaciones else False

    @property
    def agente_asignado(self) -> str | None:
        if not self.asignaciones:
            return None
        activas = [a for a in self.asignaciones if a.activo]
        if activas and activas[0].usuario_asignado:
            u = activas[0].usuario_asignado
            return f"{u.nombres} {u.apellidos} ({u.placa or 'S/N'})"
        return None
