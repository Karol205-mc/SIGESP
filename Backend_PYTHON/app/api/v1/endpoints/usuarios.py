from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from app.core.database import get_db
from app.core.security import require_roles, get_password_hash
from app.models.usuario import Usuario, Rol
from app.schemas.usuario import UsuarioCreate, UsuarioUpdate, UsuarioOut, RolOut

router = APIRouter()

@router.get("/roles", response_model=List[RolOut], summary="Listar roles RBAC disponibles")
def listar_roles(
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_roles(["ADMIN", "SUPERVISOR"]))
):
    return db.query(Rol).all()

@router.get("/", response_model=List[UsuarioOut], summary="Listar usuarios policiales")
def listar_usuarios(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_roles(["ADMIN", "SUPERVISOR"]))
):
    return db.query(Usuario).order_by(Usuario.id.asc()).offset(skip).limit(limit).all()

@router.post("/", response_model=UsuarioOut, status_code=status.HTTP_201_CREATED, summary="Crear nuevo usuario policial")
def crear_usuario(
    datos: UsuarioCreate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_roles(["ADMIN"]))
):
    existente = db.query(Usuario).filter(Usuario.username == datos.username.strip()).first()
    if existente:
        raise HTTPException(status_code=400, detail="El nombre de usuario ya está registrado.")

    nuevo = Usuario(
        username=datos.username.strip(),
        password_hash=get_password_hash(datos.password),
        nombres=datos.nombres,
        apellidos=datos.apellidos,
        rango=datos.rango,
        placa=datos.placa,
        email=datos.email,
        telefono=datos.telefono,
        rol_id=datos.rol_id,
        activo=datos.activo
    )
    db.add(nuevo)
    db.commit()
    db.refresh(nuevo)
    return nuevo

@router.put("/{id}", response_model=UsuarioOut, summary="Actualizar usuario policial")
def actualizar_usuario(
    id: int,
    datos: UsuarioUpdate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_roles(["ADMIN"]))
):
    user = db.query(Usuario).filter(Usuario.id == id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado.")

    if datos.nombres is not None:
        user.nombres = datos.nombres
    if datos.apellidos is not None:
        user.apellidos = datos.apellidos
    if datos.rango is not None:
        user.rango = datos.rango
    if datos.placa is not None:
        user.placa = datos.placa
    if datos.email is not None:
        user.email = datos.email
    if datos.telefono is not None:
        user.telefono = datos.telefono
    if datos.rol_id is not None:
        user.rol_id = datos.rol_id
    if datos.activo is not None:
        user.activo = datos.activo
    if datos.password is not None and datos.password.strip():
        user.password_hash = get_password_hash(datos.password)

    db.commit()
    db.refresh(user)
    return user
