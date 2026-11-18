import re
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime
from app.core.database import get_db
from app.core.security import require_roles, get_current_user_token_payload
from app.models.diligencia import DiligenciaJudicial
from app.models.denuncia import DenunciaSolicitud
from app.models.catalogo_judicial import Juez, Fiscal, SalaAudiencia
from app.schemas.diligencia import DiligenciaCreate, DiligenciaOut, CatalogoJudicialOut
from app.services.denuncia_service import cambiar_estado_denuncia

router = APIRouter()

def obtener_siguiente_causa_satje(db: Session, anio: int = 2026) -> str:
    """
    Consulta en la base de datos todas las causas registradas para el cantón Esmeraldas (08281)
    en el año actual, extrae el secuencial numérico más alto y genera el siguiente secuencial no repetible.
    Formato SATJE Oficial Ecuador: 08281-2026-00142G -> siguiente: 08281-2026-00143G
    """
    causas = db.query(DiligenciaJudicial.numero_causa_judicial).filter(
        DiligenciaJudicial.numero_causa_judicial.isnot(None)
    ).all()
    
    max_num = 141
    patron = re.compile(rf"^08281-{anio}-(\d+)[A-Z]?$", re.IGNORECASE)
    
    for (num_causa,) in causas:
        if not num_causa:
            continue
        m = patron.match(num_causa.strip())
        if m:
            val = int(m.group(1))
            if val > max_num:
                max_num = val
        else:
            digits = re.findall(r"\d+", num_causa)
            if digits:
                last_digits = int(digits[-1])
                if last_digits > max_num:
                    max_num = last_digits
                    
    siguiente_num = max_num + 1
    return f"08281-{anio}-{siguiente_num:05d}G"

@router.get("/siguiente-causa", summary="Consultar siguiente Número de Causa Judicial (SATJE) único y correlativo")
def siguiente_causa(db: Session = Depends(get_db)):
    """
    Retorna el siguiente número de causa judicial SATJE correlativo garantizando que nunca se repita.
    """
    proxima = obtener_siguiente_causa_satje(db)
    return {
        "siguiente_causa": proxima,
        "organo_judicial": "Unidad Judicial Penal con Sede en el Cantón Esmeraldas (08281)",
        "anio": 2026,
        "formato": "SATJE-PENAL-ECUADOR"
    }

@router.get("/catalogo-judicial", response_model=CatalogoJudicialOut, summary="Obtener catálogo de Jueces, Fiscales y Salas de Audiencia")
def catalogo_judicial(db: Session = Depends(get_db)):
    """
    Retorna el listado oficial de los 5 jueces, 5 fiscales y 5 salas de audiencia activas en Esmeraldas,
    junto con el siguiente número de causa correlativo.
    """
    jueces = db.query(Juez).filter(Juez.activo == True).order_by(Juez.id.asc()).all()
    fiscales = db.query(Fiscal).filter(Fiscal.activo == True).order_by(Fiscal.id.asc()).all()
    salas = db.query(SalaAudiencia).filter(SalaAudiencia.activa == True).order_by(SalaAudiencia.id.asc()).all()
    siguiente = obtener_siguiente_causa_satje(db)

    return {
        "jueces": jueces,
        "fiscales": fiscales,
        "salas": salas,
        "siguiente_causa": siguiente
    }

@router.get("/", response_model=List[DiligenciaOut], summary="Listar diligencias judiciales y audiencias")
def listar_diligencias(
    denuncia_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_roles(["ADMIN", "SUPERVISOR", "POLICIA_JUDICIAL", "POLICIA_FLAGRANCIA"]))
):
    q = db.query(DiligenciaJudicial)
    if denuncia_id:
        q = q.filter(DiligenciaJudicial.denuncia_id == denuncia_id)
    return q.order_by(DiligenciaJudicial.id.desc()).all()

@router.post("/", response_model=DiligenciaOut, status_code=status.HTTP_201_CREATED, summary="Registrar audiencia / sorteo judicial")
def crear_diligencia(
    datos: DiligenciaCreate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_roles(["ADMIN", "SUPERVISOR", "POLICIA_JUDICIAL"]))
):
    denuncia = db.query(DenunciaSolicitud).filter(DenunciaSolicitud.id == datos.denuncia_id).first()
    if not denuncia:
        raise HTTPException(status_code=404, detail="Denuncia no encontrada.")

    # Garantizar que el número de causa SATJE sea único y correlativo inmutable
    existente = None
    if datos.numero_causa_judicial:
        existente = db.query(DiligenciaJudicial).filter(
            DiligenciaJudicial.numero_causa_judicial == datos.numero_causa_judicial
        ).first()

    if not datos.numero_causa_judicial or existente:
        datos.numero_causa_judicial = obtener_siguiente_causa_satje(db)

    nueva = DiligenciaJudicial(**datos.model_dump())
    db.add(nueva)

    # Actualizar estado a 'Audiencia / Judicializada'
    user_id = current_user.get("user_id")
    obs = f"Causa judicializada N° {nueva.numero_causa_judicial}. Juez: {nueva.juez_nombre or 'Por sortear'}, Fiscal: {nueva.fiscal_nombre or 'Por asignar'}, Sala: {nueva.sala_audiencia or 'Por definir'}."
    cambiar_estado_denuncia(
        db=db,
        denuncia_id=denuncia.id,
        nuevo_estado="Audiencia / Judicializada",
        usuario_id=user_id,
        observaciones=obs
    )

    db.commit()
    db.refresh(nueva)
    return nueva
