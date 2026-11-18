from pydantic import BaseModel
from typing import Optional, Any
from datetime import datetime
from app.schemas.usuario import UsuarioOut

class AuditoriaOut(BaseModel):
    id: int
    usuario_id: Optional[int] = None
    usuario: Optional[UsuarioOut] = None
    accion: str
    tabla_afectada: Optional[str] = None
    registro_id: Optional[int] = None
    detalles: Optional[Any] = None
    ip_address: Optional[str] = None
    user_agent: Optional[str] = None
    timestamp: Optional[datetime] = None

    class Config:
        from_attributes = True
