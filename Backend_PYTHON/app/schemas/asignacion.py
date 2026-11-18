from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from app.schemas.usuario import UsuarioOut

class AsignacionCreate(BaseModel):
    denuncia_id: int
    usuario_asignado_id: int
    prioridad: str = "MEDIA" # BAJA, MEDIA, ALTA, URGENTE
    notas: Optional[str] = None

class AsignacionOut(BaseModel):
    id: int
    denuncia_id: int
    usuario_asignado_id: int
    usuario_asignado: Optional[UsuarioOut] = None
    asignado_por_id: Optional[int] = None
    asignado_por: Optional[UsuarioOut] = None
    fecha_asignacion: Optional[datetime] = None
    prioridad: str
    notas: Optional[str] = None
    activo: bool

    class Config:
        from_attributes = True
