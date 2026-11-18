from sqlalchemy import Column, Integer, String, Boolean, DateTime, Text, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base

class Rol(Base):
    __tablename__ = "roles"

    id = Column(Integer, primary_key=True, index=True)
    codigo = Column(String(50), unique=True, nullable=False, index=True)
    nombre = Column(String(100), nullable=False)
    descripcion = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    usuarios = relationship("Usuario", back_populates="rol")

class Usuario(Base):
    __tablename__ = "usuarios"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=False)
    nombres = Column(String(100), nullable=False)
    apellidos = Column(String(100), nullable=False)
    cedula = Column(String(10), nullable=True, index=True)
    ciudadano_id = Column(Integer, ForeignKey("ciudadanos.id"), nullable=True)
    rango = Column(String(100), nullable=True)
    placa = Column(String(50), nullable=True)
    email = Column(String(150), nullable=True)
    telefono = Column(String(20), nullable=True)
    rol_id = Column(Integer, ForeignKey("roles.id"), nullable=False)
    activo = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    rol = relationship("Rol", back_populates="usuarios")
    ciudadano = relationship("Ciudadano")
    asignaciones_recibidas = relationship("Asignacion", foreign_keys="Asignacion.usuario_asignado_id", back_populates="usuario_asignado")
    asignaciones_realizadas = relationship("Asignacion", foreign_keys="Asignacion.asignado_por_id", back_populates="asignado_por")
    novedades = relationship("Novedad", back_populates="usuario")
