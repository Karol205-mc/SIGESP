from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
from app.schemas.ciudadano import CiudadanoOut

class CategoriaDelitoOut(BaseModel):
    id: int
    codigo: str
    nombre: str
    gravedad: str
    descripcion: Optional[str] = None
    es_dinapen: bool

    class Config:
        from_attributes = True

class DenunciaCreate(BaseModel):
    # Datos del denunciante si es externo o existente
    cedula: str
    nombres: Optional[str] = None
    apellidos: Optional[str] = None
    telefono: Optional[str] = None
    email: Optional[str] = None
    direccion_ciudadano: Optional[str] = None

    # Datos del hecho
    categoria_id: int
    tipo_tramite: str = "FLAGRANCIA" # FLAGRANCIA, INVESTIGACION_PREVIA, DINAPEN_MENOR, AUXILIO, OTRO
    descripcion_hechos: str
    direccion_hechos: str
    sector: Optional[str] = None
    fecha_hechos: Optional[datetime] = None
    evidencia_url: Optional[str] = None
    es_menor_victima: bool = False

class EstadoUpdate(BaseModel):
    nuevo_estado: str # 'En revisión', 'Asignada', 'En proceso', 'Audiencia / Judicializada', 'Atendida / Cerrada', 'Archivada'
    observaciones: Optional[str] = None

class DenunciaOut(BaseModel):
    id: int
    codigo_unico: str
    ciudadano_id: int
    ciudadano: Optional[CiudadanoOut] = None
    categoria_id: int
    categoria: Optional[CategoriaDelitoOut] = None
    tipo_tramite: str
    descripcion_hechos: str
    direccion_hechos: str
    sector: Optional[str] = None
    fecha_hechos: datetime
    evidencia_url: Optional[str] = None
    estado: str
    orden_captura_activa: bool
    medida_proteccion: bool
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True
