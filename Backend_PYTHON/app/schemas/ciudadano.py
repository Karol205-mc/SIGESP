from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import date, datetime

class CiudadanoBase(BaseModel):
    cedula: str
    nombres: str
    apellidos: str
    telefono: Optional[str] = None
    email: Optional[str] = None
    direccion: Optional[str] = None
    fecha_nacimiento: Optional[date] = None
    fecha_expedicion: Optional[date] = None
    codigo_dactilar: Optional[str] = None
    foto_anverso: Optional[str] = None
    foto_reverso: Optional[str] = None
    es_menor: bool = False

class CiudadanoCreate(CiudadanoBase):
    pass

class RegistroCiudadanoRequest(BaseModel):
    cedula: str
    nombres: str
    apellidos: str
    fecha_nacimiento: Optional[date] = None
    fecha_expedicion: Optional[date] = None
    codigo_dactilar: str
    telefono: str
    email: str
    direccion: str
    password: str
    foto_anverso: Optional[str] = None
    foto_reverso: Optional[str] = None

class CiudadanoOut(CiudadanoBase):
    id: int
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class AlertaPanicoCreate(BaseModel):
    latitud: float
    longitud: float
    direccion_referencial: Optional[str] = None
    tipo_emergencia: str = "BOTON_PANICO_SOS"

class AlertaPanicoOut(BaseModel):
    id: int
    codigo_alerta: str
    latitud: float
    longitud: float
    estado: str
    patrulla_asignada: str
    fecha_alerta: Optional[datetime] = None
    tiempo_estimado_llegada: str = "4 a 7 minutos"
    ciudadano_nombre: Optional[str] = None

    class Config:
        from_attributes = True
