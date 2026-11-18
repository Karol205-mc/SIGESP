from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from app.schemas.usuario import UsuarioOut

class SeguimientoOut(BaseModel):
    id: int
    denuncia_id: int
    estado_anterior: Optional[str] = None
    estado_nuevo: str
    usuario_id: Optional[int] = None
    usuario: Optional[UsuarioOut] = None
    observaciones: Optional[str] = None
    fecha_cambio: Optional[datetime] = None

    class Config:
        from_attributes = True

class ConsultaPublicaOut(BaseModel):
    codigo_unico: str
    estado_actual: str
    tipo_tramite: str
    categoria_delito: str
    gravedad: str
    fecha_hechos: datetime
    sector: Optional[str] = None
    historial_seguimiento: list[SeguimientoOut]
