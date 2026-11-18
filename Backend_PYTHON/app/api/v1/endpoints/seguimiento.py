from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.core.database import get_db
from app.models.denuncia import DenunciaSolicitud
from app.models.seguimiento import Seguimiento
from app.schemas.seguimiento import SeguimientoOut, ConsultaPublicaOut

router = APIRouter()

@router.get("/consulta/{codigo_unico}", response_model=ConsultaPublicaOut, summary="Consulta pública ciudadana por Código Único")
def consultar_tramite_publico(codigo_unico: str, db: Session = Depends(get_db)):
    """
    Permite al ciudadano consultar en tiempo real el avance y trazabilidad de su caso
    usando su código (ej. POL-2026-0001) sin necesidad de iniciar sesión.
    """
    denuncia = (
        db.query(DenunciaSolicitud)
        .filter(DenunciaSolicitud.codigo_unico == codigo_unico.strip().upper())
        .first()
    )
    if not denuncia:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"No se encontró ningún trámite con el código: {codigo_unico}"
        )

    seguimientos = (
        db.query(Seguimiento)
        .filter(Seguimiento.denuncia_id == denuncia.id)
        .order_by(Seguimiento.fecha_cambio.asc())
        .all()
    )

    return ConsultaPublicaOut(
        codigo_unico=denuncia.codigo_unico,
        estado_actual=denuncia.estado,
        tipo_tramite=denuncia.tipo_tramite,
        categoria_delito=denuncia.categoria.nombre if denuncia.categoria else "General",
        gravedad=denuncia.categoria.gravedad if denuncia.categoria else "MEDIA",
        fecha_hechos=denuncia.fecha_hechos,
        sector=denuncia.sector,
        historial_seguimiento=seguimientos
    )

@router.get("/denuncia/{denuncia_id}", response_model=List[SeguimientoOut], summary="Historial interno de seguimiento por ID de caso")
def historial_seguimiento(denuncia_id: int, db: Session = Depends(get_db)):
    return (
        db.query(Seguimiento)
        .filter(Seguimiento.denuncia_id == denuncia_id)
        .order_by(Seguimiento.fecha_cambio.desc())
        .all()
    )
