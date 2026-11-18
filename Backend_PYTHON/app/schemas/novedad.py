from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from app.schemas.usuario import UsuarioOut

class NovedadCreate(BaseModel):
    sector: str
    tipo_novedad: str # PATRULLAJE, OPERATIVO, DETENCION, INCIDENTE, RELEVO
    descripcion: str

class NovedadOut(BaseModel):
    id: int
    usuario_id: int
    usuario: Optional[UsuarioOut] = None
    sector: str
    tipo_novedad: str
    descripcion: str
    fecha_reporte: Optional[datetime] = None

    class Config:
        from_attributes = True
