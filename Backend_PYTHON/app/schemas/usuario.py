from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime

class RolOut(BaseModel):
    id: int
    codigo: str
    nombre: str
    descripcion: Optional[str] = None

    class Config:
        from_attributes = True

class UsuarioBase(BaseModel):
    username: str
    nombres: str
    apellidos: str
    rango: Optional[str] = None
    placa: Optional[str] = None
    email: Optional[str] = None
    telefono: Optional[str] = None
    rol_id: int
    activo: bool = True

class UsuarioCreate(UsuarioBase):
    password: str

class UsuarioUpdate(BaseModel):
    nombres: Optional[str] = None
    apellidos: Optional[str] = None
    rango: Optional[str] = None
    placa: Optional[str] = None
    email: Optional[str] = None
    telefono: Optional[str] = None
    rol_id: Optional[int] = None
    activo: Optional[bool] = None
    password: Optional[str] = None

class UsuarioOut(BaseModel):
    id: int
    username: str
    nombres: str
    apellidos: str
    rango: Optional[str] = None
    placa: Optional[str] = None
    email: Optional[str] = None
    telefono: Optional[str] = None
    rol_id: int
    rol: Optional[RolOut] = None
    activo: bool
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True
