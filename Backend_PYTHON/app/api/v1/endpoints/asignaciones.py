from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from app.core.database import get_db
from app.core.security import require_roles, get_current_user_token_payload
from app.models.asignacion import Asignacion
from app.models.denuncia import DenunciaSolicitud
from app.models.usuario import Usuario, Rol
from app.schemas.asignacion import AsignacionCreate, AsignacionOut
from app.schemas.usuario import UsuarioOut
from app.services.denuncia_service import cambiar_estado_denuncia

router = APIRouter()

@router.get("/agentes", response_model=List[UsuarioOut], summary="Listar agentes policiales disponibles")
def listar_agentes_disponibles(
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_roles(["ADMIN", "SUPERVISOR", "POLICIA_FLAGRANCIA", "POLICIA_JUDICIAL"]))
):
    """Lista personal operativo de Flagrancia (PF) y Judicial (PJ)."""
    return (
        db.query(Usuario)
        .join(Rol)
        .filter(Rol.codigo.in_(["POLICIA_FLAGRANCIA", "POLICIA_JUDICIAL"]), Usuario.activo == True)
        .all()
    )

@router.get("/", response_model=List[AsignacionOut], summary="Listar asignaciones de casos")
def listar_asignaciones(
    denuncia_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_roles(["ADMIN", "SUPERVISOR", "POLICIA_FLAGRANCIA", "POLICIA_JUDICIAL"]))
):
    q = db.query(Asignacion).filter(Asignacion.activo == True)
    if denuncia_id:
        q = q.filter(Asignacion.denuncia_id == denuncia_id)
    return q.order_by(Asignacion.id.desc()).all()

@router.post("/", response_model=AsignacionOut, status_code=status.HTTP_201_CREATED, summary="Asignar caso a agente")
def crear_asignacion(
    datos: AsignacionCreate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_roles(["ADMIN", "SUPERVISOR"]))
):
    # Verificar denuncia
    denuncia = db.query(DenunciaSolicitud).filter(DenunciaSolicitud.id == datos.denuncia_id).first()
    if not denuncia:
        raise HTTPException(status_code=404, detail="Denuncia no encontrada.")

    # Verificar agente asignado
    agente = db.query(Usuario).filter(Usuario.id == datos.usuario_asignado_id, Usuario.activo == True).first()
    if not agente:
        raise HTTPException(status_code=404, detail="Agente policial no encontrado o inactivo.")

    asignador_id = current_user.get("user_id")

    nueva = Asignacion(
        denuncia_id=datos.denuncia_id,
        usuario_asignado_id=datos.usuario_asignado_id,
        asignado_por_id=asignador_id,
        prioridad=datos.prioridad,
        notas=datos.notas,
        activo=True
    )
    db.add(nueva)

    # Actualizar estado de la denuncia a 'Asignada' si estaba en 'Registrada' o 'En revisión'
    if denuncia.estado in ["Registrada", "En revisión"]:
        cambiar_estado_denuncia(
            db=db,
            denuncia_id=denuncia.id,
            nuevo_estado="Asignada",
            usuario_id=asignador_id,
            observaciones=f"Caso asignado al agente {agente.nombres} {agente.apellidos} ({agente.placa}). Prioridad: {datos.prioridad}."
        )

    db.commit()
    db.refresh(nueva)
    return nueva
