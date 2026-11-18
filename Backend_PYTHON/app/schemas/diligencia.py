from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

class DiligenciaCreate(BaseModel):
    denuncia_id: int
    juez_nombre: Optional[str] = None
    fiscal_nombre: Optional[str] = None
    fecha_audiencia: Optional[datetime] = None
    sala_audiencia: Optional[str] = None
    numero_causa_judicial: Optional[str] = None
    observaciones: Optional[str] = None

class DiligenciaOut(BaseModel):
    id: int
    denuncia_id: int
    juez_nombre: Optional[str] = None
    fiscal_nombre: Optional[str] = None
    fecha_audiencia: Optional[datetime] = None
    sala_audiencia: Optional[str] = None
    numero_causa_judicial: Optional[str] = None
    observaciones: Optional[str] = None
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class JuezOut(BaseModel):
    id: int
    nombre: str
    unidad_judicial: str
    canton: Optional[str] = "Esmeraldas"
    activo: bool

    class Config:
        from_attributes = True

class FiscalOut(BaseModel):
    id: int
    nombre: str
    fiscalia_unidad: str
    canton: Optional[str] = "Esmeraldas"
    activo: bool

    class Config:
        from_attributes = True

class SalaAudienciaOut(BaseModel):
    id: int
    nombre: str
    edificio: str
    piso: Optional[str] = "Piso 1"
    canton: Optional[str] = "Esmeraldas"
    activa: bool

    class Config:
        from_attributes = True

class CatalogoJudicialOut(BaseModel):
    jueces: List[JuezOut]
    fiscales: List[FiscalOut]
    salas: List[SalaAudienciaOut]
    siguiente_causa: str
