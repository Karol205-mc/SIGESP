from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
from datetime import datetime, timezone
from app.core.database import get_db
from app.core.security import verify_interop_api_key
from app.models.ciudadano import Ciudadano
from app.models.denuncia import DenunciaSolicitud, CategoriaDelito
from app.schemas.interoperabilidad import AntecedentesOut, MenorVerificacionOut, ExpedienteInteropOut, DelitoResumen
from app.services.auditoria_service import registrar_auditoria

router = APIRouter()

@router.get(
    "/antecedentes/{cedula}",
    response_model=AntecedentesOut,
    dependencies=[Depends(verify_interop_api_key)],
    summary="[INTEROPERABILIDAD] Consulta de antecedentes y órdenes de captura con presunción de inocencia"
)
def verificar_antecedentes_interop(
    cedula: str,
    request: Request,
    db: Session = Depends(get_db)
):
    """
    Endpoint interinstitucional para el SGIM de Migración y Registro Civil.
    Garantiza el principio constitucional de presunción de inocencia:
    - Una denuncia en investigación preliminar NO constituye antecedente penal público.
    - Únicamente se reporta antecedente penal si la persona tiene:
      1. Sentencia judicial condenatoria ejecutoriada (tiene_sentencia_condenatoria = True).
      2. Orden judicial de captura activa (orden_captura_activa = True).
      3. Causa formalmente elevada a etapa de juicio penal.
    Requiere cabecera: X-Api-Key: RC-POLICIA-KEY-2026.
    """
    cedula_clean = cedula.strip()
    ciudadano = db.query(Ciudadano).filter(Ciudadano.cedula == cedula_clean).first()

    client_ip = request.client.host if request.client else "127.0.0.1"
    user_agent = request.headers.get("user-agent")

    registrar_auditoria(
        db=db,
        accion="CONSULTA_INTEROP_ANTECEDENTES",
        tabla_afectada="ciudadanos",
        registro_id=ciudadano.id if ciudadano else None,
        detalles={"cedula_consultada": cedula_clean, "origen": "Ecosistema UTE-LVT (Migración/RC)"},
        ip_address=client_ip,
        user_agent=user_agent
    )

    if not ciudadano:
        return AntecedentesOut(
            cedula=cedula_clean,
            nombres_completos="CIUDADANO NO REGISTRADO EN BASE POLICIAL",
            posee_antecedentes=False,
            orden_captura_activa=False,
            medidas_cautelares_activas=False,
            alerta_migratoria=False,
            total_denuncias_asociadas=0,
            total_condenas_o_juicios=0,
            observaciones="Sin registros activos en el sistema policial ni judicial.",
            detalle_causas=[],
            fecha_consulta=datetime.now(timezone.utc)
        )

    # Buscar denuncias asociadas
    todas_denuncias = db.query(DenunciaSolicitud).filter(DenunciaSolicitud.ciudadano_id == ciudadano.id).all()
    
    # Filtrar solo causas formalmente procesadas (sentencia o juicio o captura)
    causas_judicializadas = [
        d for d in todas_denuncias 
        if d.tiene_sentencia_condenatoria or d.orden_captura_activa or d.estado in ['En juicio', 'Finalizado', 'Audiencia / Judicializada']
    ]

    tiene_orden_captura = any(d.orden_captura_activa for d in todas_denuncias)
    tiene_medida_cautelar = any(d.medida_proteccion for d in todas_denuncias)
    tiene_condena = any(d.tiene_sentencia_condenatoria for d in todas_denuncias)

    # Solo posee antecedentes penales si hay condena ejecutoriada o proceso en juicio formal
    posee_antecedentes = tiene_condena or tiene_orden_captura or len(causas_judicializadas) > 0
    alerta_migratoria = tiene_orden_captura or tiene_medida_cautelar

    if posee_antecedentes:
        obs = "REGISTRA ANTECEDENTES O CAUSA PENAL JUDICIALIZADA: Existen órdenes judiciales vigentes o sentencias condenatorias."
    else:
        obs = "SIN ANTECEDENTES PENALES: No registra sentencias condenatorias ejecutoriadas ni órdenes de captura. Conforme al Art. 584 del COIP y Art. 76 num. 2 de la Constitución, se garantiza la presunción de inocencia."

    causas_detalle = [
        DelitoResumen(
            codigo_unico=d.codigo_unico,
            delito=d.categoria.nombre if d.categoria else "General",
            gravedad=d.categoria.gravedad if d.categoria else "MEDIA",
            fecha_hechos=d.fecha_hechos,
            estado=d.estado,
            orden_captura=d.orden_captura_activa,
            medida_proteccion=d.medida_proteccion,
            sentencia_condenatoria=d.tiene_sentencia_condenatoria
        )
        for d in causas_judicializadas
    ]

    return AntecedentesOut(
        cedula=ciudadano.cedula,
        nombres_completos=f"{ciudadano.nombres} {ciudadano.apellidos}",
        posee_antecedentes=posee_antecedentes,
        orden_captura_activa=tiene_orden_captura,
        medidas_cautelares_activas=tiene_medida_cautelar,
        alerta_migratoria=alerta_migratoria,
        total_denuncias_asociadas=len(todas_denuncias),
        total_condenas_o_juicios=len(causas_judicializadas),
        observaciones=obs,
        detalle_causas=causas_detalle,
        fecha_consulta=datetime.now(timezone.utc)
    )

@router.get(
    "/verificar-menor/{cedula_menor}",
    response_model=MenorVerificacionOut,
    dependencies=[Depends(verify_interop_api_key)],
    summary="[INTEROPERABILIDAD] Consulta de medidas de protección y alertas DINAPEN / Migración"
)
def verificar_menor_interop(
    cedula_menor: str,
    request: Request,
    db: Session = Depends(get_db)
):
    cedula_clean = cedula_menor.strip()
    menor = db.query(Ciudadano).filter(Ciudadano.cedula == cedula_clean).first()

    client_ip = request.client.host if request.client else "127.0.0.1"
    user_agent = request.headers.get("user-agent")

    registrar_auditoria(
        db=db,
        accion="CONSULTA_INTEROP_DINAPEN",
        tabla_afectada="ciudadanos",
        registro_id=menor.id if menor else None,
        detalles={"cedula_menor": cedula_clean, "origen": "Control Fronterizo / DINAPEN"},
        ip_address=client_ip,
        user_agent=user_agent
    )

    if not menor:
        return MenorVerificacionOut(
            cedula_menor=cedula_clean,
            nombres_completos="MENOR NO REGISTRADO EN EL SISTEMA POLICIAL",
            es_menor_confirmado=False,
            alerta_desaparicion_emilia=False,
            medida_proteccion_dinapen=False,
            impedimento_salida_pais=False,
            total_reportes_dinapen=0,
            observaciones="Sin registros activos en base de datos de DINAPEN.",
            fecha_consulta=datetime.now(timezone.utc)
        )

    denuncias_dinapen = (
        db.query(DenunciaSolicitud)
        .join(CategoriaDelito)
        .filter(
            DenunciaSolicitud.ciudadano_id == menor.id,
            (CategoriaDelito.es_dinapen == True) | (DenunciaSolicitud.medida_proteccion == True)
        )
        .all()
    )

    tiene_alerta_emilia = any("DEL-DIN-02" in (d.categoria.codigo if d.categoria else "") for d in denuncias_dinapen)
    tiene_medida_proteccion = any(d.medida_proteccion for d in denuncias_dinapen) or len(denuncias_dinapen) > 0

    return MenorVerificacionOut(
        cedula_menor=menor.cedula,
        nombres_completos=f"{menor.nombres} {menor.apellidos}",
        es_menor_confirmado=menor.es_menor,
        alerta_desaparicion_emilia=tiene_alerta_emilia,
        medida_proteccion_dinapen=tiene_medida_proteccion,
        impedimento_salida_pais=tiene_medida_proteccion or tiene_alerta_emilia,
        total_reportes_dinapen=len(denuncias_dinapen),
        observaciones="ALERTA: Medida cautelar o de protección vigente. Se requiere autorización judicial para movilización." if tiene_medida_proteccion else "Menor sin impedimentos cautelares registrados.",
        fecha_consulta=datetime.now(timezone.utc)
    )

@router.get(
    "/denuncias/{codigo_unico}",
    response_model=ExpedienteInteropOut,
    dependencies=[Depends(verify_interop_api_key)],
    summary="[INTEROPERABILIDAD] Consulta de estado de denuncia para Banco, Registro Civil e IESS"
)
def consultar_denuncia_interop(
    codigo_unico: str,
    request: Request,
    db: Session = Depends(get_db)
):
    cod = codigo_unico.strip().upper()
    denuncia = db.query(DenunciaSolicitud).filter(DenunciaSolicitud.codigo_unico == cod).first()

    if not denuncia:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Expediente policial '{cod}' no encontrado."
        )

    client_ip = request.client.host if request.client else "127.0.0.1"
    user_agent = request.headers.get("user-agent")

    registrar_auditoria(
        db=db,
        accion="CONSULTA_INTEROP_EXPEDIENTE",
        tabla_afectada="denuncias_solicitudes",
        registro_id=denuncia.id,
        detalles={"codigo_unico": cod},
        ip_address=client_ip,
        user_agent=user_agent
    )

    return ExpedienteInteropOut(
        codigo_unico=denuncia.codigo_unico,
        estado=denuncia.estado,
        tipo_tramite=denuncia.tipo_tramite,
        delito=denuncia.categoria.nombre if denuncia.categoria else "General",
        gravedad=denuncia.categoria.gravedad if denuncia.categoria else "MEDIA",
        fecha_hechos=denuncia.fecha_hechos,
        sector=denuncia.sector,
        tiene_orden_captura=denuncia.orden_captura_activa,
        tiene_medida_proteccion=denuncia.medida_proteccion,
        unidad_policial_a_cargo="Subzona Esmeraldas N° 8",
        fecha_consulta=datetime.now(timezone.utc)
    )
