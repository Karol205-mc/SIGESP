from pydantic import BaseModel
from typing import Optional

class LoginRequest(BaseModel):
    username: str
    password: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user_id: int
    username: str
    nombre_completo: str
    nombres: Optional[str] = None
    apellidos: Optional[str] = None
    cedula: Optional[str] = None
    email: Optional[str] = None
    telefono: Optional[str] = None
    direccion: Optional[str] = None
    rol: str
    rango: Optional[str] = None
    placa: Optional[str] = None

class TokenPayload(BaseModel):
    sub: Optional[str] = None
    username: Optional[str] = None
    role: Optional[str] = None
    exp: Optional[int] = None
