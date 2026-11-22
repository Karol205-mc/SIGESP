from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import datetime, timezone
from app.models.denuncia import DenunciaSolicitud, CategoriaDelito
from app.models.ciudadano import Ciudadano
from app.models.seguimiento import Seguimiento
from app.schemas.denuncia import DenunciaCreate
from app.services.auditoria_service import registrar_auditoria
from fastapi import HTTPException, status
from typing import Optional

def generar_codigo_unico(db: Session) -> str:
    """Genera un código único institucional en formato POL-YYYY-XXXX (ej. POL-2026-0005)."""
    current_year = datetime.now().year
    prefix = f"POL-{current_year}-"
    
    # Buscar el mayor correlativo existente en el año actual
    ultimo = (
        db.query(DenunciaSolicitud.codigo_unico)
        .filter(DenunciaSolicitud.codigo_unico.like(f"{prefix}%"))
        .order_by(DenunciaSolicitud.id.desc())
        .first()
    )
    
    if ultimo and ultimo[0]:
        try:
            ultimo_num = int(ultimo[0].split("-")[-1])
            nuevo_num = ultimo_num + 1
        except Exception:
            count = db.query(DenunciaSolicitud).count()
            nuevo_num = count + 1
    else:
        nuevo_num = 1

    return f"{prefix}{nuevo_num:04d}"

def crear_denuncia(
    db: Session,
    datos: DenunciaCreate,
    ip_address: Optional[str] = None,
    user_agent: Optional[str] = None
) -> DenunciaSolicitud:
    """Crea una denuncia o solicitud policial con su ciudadano y seguimiento inicial."""
    
    # 1. Verificar o crear el ciudadano
    ciudadano = db.query(Ciudadano).filter(Ciudadano.cedula == datos.cedula.strip()).first()
    if not ciudadano:
        ciudadano = Ciudadano(
            cedula=datos.cedula.strip(),
            nombres=(datos.nombres or "Ciudadano").strip(),
            apellidos=(datos.apellidos or "No especificado").strip(),
            telefono=datos.telefono,
            email=datos.email,
            direccion=datos.direccion_ciudadano or datos.direccion_hechos,
            es_menor=datos.es_menor_victima
        )
        db.add(ciudadano)
        db.flush()
    else:
        # Actualizar datos de contacto si fueron provistos
        if datos.telefono:
            ciudadano.telefono = datos.telefono
        if datos.email:
            ciudadano.email = datos.email
        if datos.direccion_ciudadano:
            ciudadano.direccion = datos.direccion_ciudadano

    # 2. Verificar categoría
    categoria = db.query(CategoriaDelito).filter(CategoriaDelito.id == datos.categoria_id).first()
    if not categoria:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"La categoría de delito con id {datos.categoria_id} no existe."
        )

    # 3. Determinar flags especiales (DINAPEN / Medidas de Protección / Captura)
    medida_proteccion = categoria.es_dinapen or datos.es_menor_victima or "DINAPEN" in datos.tipo_tramite.upper()
    orden_captura = categoria.gravedad in ["GRAVE", "MUY GRAVE"] and datos.tipo_tramite == "FLAGRANCIA"

    # 4. Generar código y crear denuncia
    codigo_unico = generar_codigo_unico(db)
    fecha_hechos = datos.fecha_hechos or datetime.now(timezone.utc)

    denunciado_ciudadano = None
    if getattr(datos, 'denunciado_cedula', None):
        denunciado_ciudadano = db.query(Ciudadano).filter(Ciudadano.cedula == datos.denunciado_cedula.strip()).first()

    nueva_denuncia = DenunciaSolicitud(
        codigo_unico=codigo_unico,
        ciudadano_id=ciudadano.id,
        denunciado_id=denunciado_ciudadano.id if denunciado_ciudadano else None,
        denunciado_cedula=datos.denunciado_cedula.strip() if getattr(datos, 'denunciado_cedula', None) else None,
        denunciado_nombres=datos.denunciado_nombres.strip() if getattr(datos, 'denunciado_nombres', None) else None,
        denunciado_alias=datos.denunciado_alias.strip() if getattr(datos, 'denunciado_alias', None) else None,
        orden_captura_denunciado=orden_captura,
        impedimento_salida_denunciado=orden_captura,
        categoria_id=categoria.id,
        tipo_tramite=datos.tipo_tramite,
        descripcion_hechos=datos.descripcion_hechos,
        direccion_hechos=datos.direccion_hechos,
        sector=datos.sector or "Distrito Esmeraldas",
        fecha_hechos=fecha_hechos,
        evidencia_url=datos.evidencia_url,
        estado="Registrada",
        orden_captura_activa=orden_captura,
        medida_proteccion=medida_proteccion
    )
    db.add(nueva_denuncia)
    db.flush()

    # Registrar al denunciante como parte procesal protegida
    from app.models.denuncia import ImplicadoDenuncia
    implicado_denunciante = ImplicadoDenuncia(
        denuncia_id=nueva_denuncia.id,
        ciudadano_id=ciudadano.id,
        cedula=ciudadano.cedula,
        nombres=ciudadano.nombres,
        apellidos=ciudadano.apellidos,
        rol="DENUNCIANTE / VICTIMA",
        medida_proteccion=medida_proteccion,
        orden_captura=False
    )
    db.add(implicado_denunciante)

    # Si se especificó denunciado, registrarlo como imputado
    if getattr(datos, 'denunciado_nombres', None) or getattr(datos, 'denunciado_cedula', None):
        implicado_denunciado = ImplicadoDenuncia(
            denuncia_id=nueva_denuncia.id,
            ciudadano_id=denunciado_ciudadano.id if denunciado_ciudadano else None,
            cedula=datos.denunciado_cedula.strip() if getattr(datos, 'denunciado_cedula', None) else None,
            nombres=datos.denunciado_nombres.strip() if getattr(datos, 'denunciado_nombres', None) else "Sospechoso no identificado",
            alias=datos.denunciado_alias.strip() if getattr(datos, 'denunciado_alias', None) else None,
            rol="DENUNCIADO / IMPUTADO",
            orden_captura=orden_captura,
            impedimento_salida=orden_captura
        )
        db.add(implicado_denunciado)

    # 5. Registro automático en seguimiento (Estado inicial 'Registrada')
    primer_seguimiento = Seguimiento(
        denuncia_id=nueva_denuncia.id,
        estado_anterior=None,
        estado_nuevo="Registrada",
        observaciones="Registro inicial formal de la denuncia en la plataforma SIGESP."
    )
    db.add(primer_seguimiento)

    db.commit()
    db.refresh(nueva_denuncia)

    # 6. Registrar en auditoría
    registrar_auditoria(
        db=db,
        accion="REGISTRO_DENUNCIA",
        tabla_afectada="denuncias_solicitudes",
        registro_id=nueva_denuncia.id,
        usuario_id=None,
        detalles={"codigo_unico": codigo_unico, "tipo": datos.tipo_tramite, "cedula": datos.cedula},
        ip_address=ip_address,
        user_agent=user_agent
    )

    return nueva_denuncia

def cambiar_estado_denuncia(
    db: Session,
    denuncia_id: int,
    nuevo_estado: str,
    usuario_id: Optional[int] = None,
    observaciones: Optional[str] = None,
    ip_address: Optional[str] = None,
    user_agent: Optional[str] = None
) -> DenunciaSolicitud:
    """Realiza una transición de estado con registro de seguimiento y auditoría."""
    denuncia = db.query(DenunciaSolicitud).filter(DenunciaSolicitud.id == denuncia_id).first()
    if not denuncia:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Denuncia no encontrada.")

    estado_anterior = denuncia.estado
    denuncia.estado = nuevo_estado
    denuncia.updated_at = datetime.now(timezone.utc)

    # Registrar en seguimiento
    seguimiento = Seguimiento(
        denuncia_id=denuncia.id,
        estado_anterior=estado_anterior,
        estado_nuevo=nuevo_estado,
        usuario_id=usuario_id,
        observaciones=observaciones or f"Cambio de estado de '{estado_anterior}' a '{nuevo_estado}'"
    )
    db.add(seguimiento)
    db.commit()
    db.refresh(denuncia)

    # Registrar en auditoría
    registrar_auditoria(
        db=db,
        accion="CAMBIO_ESTADO",
        tabla_afectada="denuncias_solicitudes",
        registro_id=denuncia.id,
        usuario_id=usuario_id,
        detalles={
            "codigo_unico": denuncia.codigo_unico,
            "estado_anterior": estado_anterior,
            "estado_nuevo": nuevo_estado,
            "observaciones": observaciones
        },
        ip_address=ip_address,
        user_agent=user_agent
    )

    return denuncia
