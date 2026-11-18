from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime, date
from app.core.database import get_db
from app.core.security import require_roles, get_current_user_token_payload
from app.models.novedad import Novedad
from app.schemas.novedad import NovedadCreate, NovedadOut

router = APIRouter()

@router.get("/", response_model=List[NovedadOut], summary="Consultar libro de guardia / novedades policiales")
def listar_novedades(
    sector: Optional[str] = None,
    tipo: Optional[str] = None,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_roles(["ADMIN", "SUPERVISOR", "POLICIA_FLAGRANCIA", "POLICIA_JUDICIAL"]))
):
    q = db.query(Novedad)
    if sector:
        q = q.filter(Novedad.sector.ilike(f"%{sector.strip()}%"))
    if tipo:
        q = q.filter(Novedad.tipo_novedad == tipo)
    return q.order_by(Novedad.id.desc()).offset(skip).limit(limit).all()

@router.post("/", response_model=NovedadOut, status_code=status.HTTP_201_CREATED, summary="Registrar novedad policial")
def registrar_novedad(
    datos: NovedadCreate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_roles(["ADMIN", "SUPERVISOR", "POLICIA_FLAGRANCIA", "POLICIA_JUDICIAL"]))
):
    user_id = current_user.get("user_id")
    nueva = Novedad(
        usuario_id=user_id,
        sector=datos.sector,
        tipo_novedad=datos.tipo_novedad,
        descripcion=datos.descripcion
    )
    db.add(nueva)
    db.commit()
    db.refresh(nueva)
    return nueva
