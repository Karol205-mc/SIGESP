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
    
    # ── SUJETO ACTIVO: DENUNCIANTE / VÍCTIMA ──────────────────────────────────
    ciudadano_id = Column(Integer, ForeignKey("ciudadanos.id"), nullable=False)
    
    # ── SUJETO PASIVO / IMPUTADO: DENUNCIADO O SOSPECHOSO ──────────────────
    denunciado_id = Column(Integer, ForeignKey("ciudadanos.id"), nullable=True)
    denunciado_cedula = Column(String(10), nullable=True)
    denunciado_nombres = Column(String(150), nullable=True)
    denunciado_alias = Column(String(100), nullable=True)
    orden_captura_denunciado = Column(Boolean, default=False)
    impedimento_salida_denunciado = Column(Boolean, default=False)

    categoria_id = Column(Integer, ForeignKey("categorias_delitos.id"), nullable=False)
    tipo_tramite = Column(String(50), nullable=False)
    descripcion_hechos = Column(Text, nullable=False)
    direccion_hechos = Column(Text, nullable=False)
    sector = Column(String(100), nullable=True)
    fecha_hechos = Column(DateTime(timezone=True), nullable=False)
    evidencia_url = Column(Text, nullable=True)
    estado = Column(String(40), nullable=False, default="Registrada", index=True)
    
    # Medidas cautelares del caso
    orden_captura_activa = Column(Boolean, default=False) # Histórico / Directo sobre el denunciado
    medida_proteccion = Column(Boolean, default=False)    # A FAVOR DE LA VÍCTIMA (Art. 558 COIP)
    tiene_sentencia_condenatoria = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # Relaciones SQLAlchemy
    ciudadano = relationship("Ciudadano", foreign_keys=[ciudadano_id], back_populates="denuncias")
    denunciado = relationship("Ciudadano", foreign_keys=[denunciado_id])
    categoria = relationship("CategoriaDelito", back_populates="denuncias")
    asignaciones = relationship("Asignacion", back_populates="denuncia", cascade="all, delete-orphan")
    diligencias = relationship("DiligenciaJudicial", back_populates="denuncia", cascade="all, delete-orphan")
    seguimientos = relationship("Seguimiento", back_populates="denuncia", cascade="all, delete-orphan", order_by="Seguimiento.fecha_cambio.desc()")
    implicados = relationship("ImplicadoDenuncia", back_populates="denuncia", cascade="all, delete-orphan")

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

class ImplicadoDenuncia(Base):
    __tablename__ = "implicados_denuncia"

    id = Column(Integer, primary_key=True, index=True)
    denuncia_id = Column(Integer, ForeignKey("denuncias_solicitudes.id", ondelete="CASCADE"), nullable=False, index=True)
    ciudadano_id = Column(Integer, ForeignKey("ciudadanos.id", ondelete="SET NULL"), nullable=True)
    cedula = Column(String(10), nullable=True)
    nombres = Column(String(150), nullable=False)
    apellidos = Column(String(150), nullable=True)
    alias = Column(String(100), nullable=True)
    rol = Column(String(50), nullable=False, default="DENUNCIADO") # DENUNCIANTE, VICTIMA, DENUNCIADO, SOSPECHOSO, TESTIGO
    orden_captura = Column(Boolean, default=False)
    medida_proteccion = Column(Boolean, default=False)
    impedimento_salida = Column(Boolean, default=False)
    tiene_sentencia = Column(Boolean, default=False)
    observaciones = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    denuncia = relationship("DenunciaSolicitud", back_populates="implicados")
    ciudadano = relationship("Ciudadano")
