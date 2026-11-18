from sqlalchemy.orm import Session
from app.models.auditoria import Auditoria
from typing import Optional, Any
import logging

logger = logging.getLogger("sigesp.auditoria")

def registrar_auditoria(
    db: Session,
    accion: str,
    tabla_afectada: Optional[str] = None,
    registro_id: Optional[int] = None,
    usuario_id: Optional[int] = None,
    detalles: Optional[Any] = None,
    ip_address: Optional[str] = None,
    user_agent: Optional[str] = None
) -> Auditoria:
    """Registra de manera inmutable un evento de auditoría en la base de datos."""
    try:
        evento = Auditoria(
            usuario_id=usuario_id,
            accion=accion,
            tabla_afectada=tabla_afectada,
            registro_id=registro_id,
            detalles=detalles,
            ip_address=ip_address,
            user_agent=user_agent
        )
        db.add(evento)
        db.commit()
        db.refresh(evento)
        return evento
    except Exception as e:
        db.rollback()
        logger.error(f"Error al registrar auditoría: {str(e)}")
        return None
