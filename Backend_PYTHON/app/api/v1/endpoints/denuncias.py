from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
from typing import List, Optional
from app.core.database import get_db
from app.core.security import get_current_user_token_payload, require_roles
from app.models.denuncia import DenunciaSolicitud, CategoriaDelito, EstadoTramite
from app.models.ciudadano import Ciudadano
from app.models.asignacion import Asignacion
from app.schemas.denuncia import DenunciaCreate, EstadoUpdate, DenunciaOut, CategoriaDelitoOut
from app.services.denuncia_service import crear_denuncia, cambiar_estado_denuncia
from app.services.auditoria_service import registrar_auditoria

router = APIRouter()

@router.get("/categorias", response_model=List[CategoriaDelitoOut], summary="Listar catálogo de categorías de delitos")
def listar_categorias(db: Session = Depends(get_db)):
    """Retorna las tipificaciones policiales disponibles para denuncias."""
    return db.query(CategoriaDelito).all()

@router.get("/estados", summary="Listar catálogo oficial de estados de trámites")
def listar_estados_tramite(db: Session = Depends(get_db)):
    """Retorna las fases procedimentales específicas guardadas en la base de datos."""
    return db.query(EstadoTramite).order_by(EstadoTramite.orden.asc()).all()

@router.post("/", response_model=DenunciaOut, status_code=status.HTTP_201_CREATED, summary="Inscribir denuncia o solicitud pública")
def registrar_denuncia_endpoint(
    request: Request,
    datos: DenunciaCreate,
    db: Session = Depends(get_db)
):
    """
    Permite registrar denuncias ciudadanas.
    Genera automáticamente el Código Único alfanumérico (ej. POL-2026-0005)
    e inicializa el seguimiento en estado 'Esperando documentos' o 'Registrada'.
    """
    client_ip = request.client.host if request.client else "127.0.0.1"
    user_agent = request.headers.get("user-agent")
    nueva = crear_denuncia(db, datos, ip_address=client_ip, user_agent=user_agent)
    return nueva

@router.get("/", response_model=List[DenunciaOut], summary="Bandeja de denuncias con filtrado RBAC")
def listar_denuncias(
    estado: Optional[str] = None,
    tipo_tramite: Optional[str] = None,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user_token_payload)
):
    q = db.query(DenunciaSolicitud)
    user_role = current_user.get("role")
    user_id = current_user.get("user_id")

    if user_role == "CIUDADANO":
        q = q.join(Ciudadano).filter(Ciudadano.email.ilike(f"%{current_user.get('username')}%"))
    elif user_role in ["POLICIA_FLAGRANCIA", "POLICIA_JUDICIAL"]:
        # Los agentes operativos ÚNICAMENTE visualizan los expedientes asignados formalmente a ellos
        q = q.join(Asignacion, Asignacion.denuncia_id == DenunciaSolicitud.id).filter(
            Asignacion.usuario_asignado_id == user_id,
            Asignacion.activo == True
        ).distinct()
    # SUPERVISOR y ADMIN visualizan todos los casos (tanto los asignados como los no asignados)

    if estado:
        q = q.filter(DenunciaSolicitud.estado == estado)
    if tipo_tramite:
        q = q.filter(DenunciaSolicitud.tipo_tramite == tipo_tramite)

    return q.order_by(DenunciaSolicitud.id.desc()).offset(skip).limit(limit).all()

@router.get("/{id}", response_model=DenunciaOut, summary="Obtener detalles de una denuncia por ID")
def obtener_denuncia(id: int, db: Session = Depends(get_db)):
    denuncia = db.query(DenunciaSolicitud).filter(DenunciaSolicitud.id == id).first()
    if not denuncia:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Denuncia no encontrada.")
    return denuncia

@router.put("/{id}/estado", response_model=DenunciaOut, summary="Actualizar estado de la denuncia")
def actualizar_estado(
    id: int,
    datos: EstadoUpdate,
    request: Request,
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_roles(["ADMIN", "SUPERVISOR", "POLICIA_FLAGRANCIA", "POLICIA_JUDICIAL"]))
):
    user_id = current_user.get("user_id")
    client_ip = request.client.host if request.client else "127.0.0.1"
    user_agent = request.headers.get("user-agent")
    
    return cambiar_estado_denuncia(
        db=db,
        denuncia_id=id,
        nuevo_estado=datos.nuevo_estado,
        usuario_id=user_id,
        observaciones=datos.observaciones,
        ip_address=client_ip,
        user_agent=user_agent
    )

@router.put("/{id}/medidas", response_model=DenunciaOut, summary="Gestionar medidas cautelares u órdenes de captura")
def gestionar_medidas(
    id: int,
    orden_captura: Optional[bool] = None,
    medida_proteccion: Optional[bool] = None,
    tiene_sentencia: Optional[bool] = None,
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_roles(["ADMIN", "SUPERVISOR", "POLICIA_JUDICIAL"]))
):
    denuncia = db.query(DenunciaSolicitud).filter(DenunciaSolicitud.id == id).first()
    if not denuncia:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Denuncia no encontrada.")

    if orden_captura is not None:
        denuncia.orden_captura_activa = orden_captura
    if medida_proteccion is not None:
        denuncia.medida_proteccion = medida_proteccion
    if tiene_sentencia is not None:
        denuncia.tiene_sentencia_condenatoria = tiene_sentencia

    db.commit()
    db.refresh(denuncia)
    return denuncia
