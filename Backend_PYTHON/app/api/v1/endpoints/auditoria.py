from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List, Optional
from app.core.database import get_db
from app.core.security import require_roles
from app.models.auditoria import Auditoria
from app.schemas.auditoria import AuditoriaOut

router = APIRouter()

@router.get("/", response_model=List[AuditoriaOut], summary="Consultar bitácora inmutable de auditoría")
def listar_auditoria(
    skip: int = 0,
    limit: int = 100,
    accion: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_roles(["ADMIN"]))
):
    """
    Exclusivo para el Administrador General (Coronel Jordan Wila Portilla).
    Muestra la trazabilidad de accesos, creación de registros, consultas interinstitucionales y cambios de estado con IP y timestamp.
    """
    q = db.query(Auditoria)
    if accion:
        q = q.filter(Auditoria.accion.ilike(f"%{accion.strip()}%"))
    return q.order_by(Auditoria.timestamp.desc()).offset(skip).limit(limit).all()
