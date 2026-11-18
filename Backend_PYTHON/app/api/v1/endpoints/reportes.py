from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.core.database import get_db
from app.core.security import require_roles
from app.models.denuncia import DenunciaSolicitud, CategoriaDelito
from app.models.novedad import Novedad
from app.models.usuario import Usuario

router = APIRouter()

@router.get("/estadisticas", summary="Estadísticas consolidadas para dashboard policial")
def obtener_estadisticas(
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_roles(["ADMIN", "SUPERVISOR", "POLICIA_FLAGRANCIA", "POLICIA_JUDICIAL"]))
):
    total_denuncias = db.query(DenunciaSolicitud).count()
    total_en_proceso = db.query(DenunciaSolicitud).filter(DenunciaSolicitud.estado == "En proceso").count()
    total_atendidas = db.query(DenunciaSolicitud).filter(DenunciaSolicitud.estado == "Atendida / Cerrada").count()
    total_judicializadas = db.query(DenunciaSolicitud).filter(DenunciaSolicitud.estado == "Audiencia / Judicializada").count()
    total_novedades = db.query(Novedad).count()
    total_agentes = db.query(Usuario).filter(Usuario.activo == True).count()

    # Agrupado por estado
    estados_group = (
        db.query(DenunciaSolicitud.estado, func.count(DenunciaSolicitud.id))
        .group_by(DenunciaSolicitud.estado)
        .all()
    )

    # Agrupado por categoría de delito
    delitos_group = (
        db.query(CategoriaDelito.nombre, func.count(DenunciaSolicitud.id))
        .join(DenunciaSolicitud, DenunciaSolicitud.categoria_id == CategoriaDelito.id)
        .group_by(CategoriaDelito.nombre)
        .all()
    )

    # Agrupado por tipo de trámite
    tramites_group = (
        db.query(DenunciaSolicitud.tipo_tramite, func.count(DenunciaSolicitud.id))
        .group_by(DenunciaSolicitud.tipo_tramite)
        .all()
    )

    return {
        "resumen": {
            "total_denuncias": total_denuncias,
            "en_proceso": total_en_proceso,
            "atendidas_cerradas": total_atendidas,
            "judicializadas": total_judicializadas,
            "total_novedades": total_novedades,
            "agentes_activos": total_agentes
        },
        "por_estado": [{"estado": eg[0], "total": eg[1]} for eg in estados_group],
        "por_delito": [{"delito": dg[0], "total": dg[1]} for dg in delitos_group],
        "por_tipo_tramite": [{"tipo": tg[0], "total": tg[1]} for tg in tramites_group]
    }
