from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
from datetime import datetime, timezone
from app.core.database import get_db
from app.core.security import verify_interop_api_key
from app.models.ciudadano import Ciudadano
from app.models.denuncia import DenunciaSolicitud, CategoriaDelito, ImplicadoDenuncia
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
    Garantiza el principio constitucional de presunción de inocencia y distinción de sujetos procesales:
    1. Una persona que presenta una denuncia en calidad de DENUNCIANTE o VÍCTIMA NUNCA adquiere
       antecedentes penales ni órdenes de captura por el simple hecho de denunciar.
    2. Las Órdenes Judiciales de Captura, Impedimento de Salida y Sentencias Condenatorias
       se imputan EXCLUSIVAMENTE a quienes constan como DENUNCIADOS / IMPUTADOS / PROCESADOS.
    3. Al Denunciante/Víctima se le pueden otorgar Medidas Cautelares de Protección (Art. 558 COIP:
       boleta de auxilio, resguardo), lo cual NO constituye antecedente penal ni impedimento de salida.
    Requiere cabecera: X-Api-Key: RC-POLICIA-KEY-2026.
    """
    cedula_clean = cedula.strip()
    ciudadano = db.query(Ciudadano).filter(Ciudadano.cedula == cedula_clean).first()

    # Buscar si aparece como denunciado en denuncias_solicitudes
    causas_como_denunciado = db.query(DenunciaSolicitud).filter(
        (DenunciaSolicitud.denunciado_cedula == cedula_clean) |
        (DenunciaSolicitud.denunciado_id == (ciudadano.id if ciudadano else -1))
    ).all()

    # Buscar en tabla de implicados (partes procesales)
    implicaciones = db.query(ImplicadoDenuncia).filter(
        (ImplicadoDenuncia.cedula == cedula_clean) |
        (ImplicadoDenuncia.ciudadano_id == (ciudadano.id if ciudadano else -1))
    ).all()

    # Denuncias donde el ciudadano figura como DENUNCIANTE / VÍCTIMA
    denuncias_como_denunciante = db.query(DenunciaSolicitud).filter(
        DenunciaSolicitud.ciudadano_id == (ciudadano.id if ciudadano else -1)
    ).all() if ciudadano else []

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

    if not ciudadano and not causas_como_denunciado and not implicaciones:
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

    # Identificar nombre completo
    nombres = f"{ciudadano.nombres} {ciudadano.apellidos}" if ciudadano else None
    if not nombres:
        if causas_como_denunciado and causas_como_denunciado[0].denunciado_nombres:
            nombres = causas_como_denunciado[0].denunciado_nombres
        elif implicaciones:
            nombres = f"{implicaciones[0].nombres} {implicaciones[0].apellidos or ''}".strip()
        else:
            nombres = "CIUDADANO REGISTRADO"

    # ── 1. EVALUAR CAUSAS PENALES COMO DENUNCIADO / IMPUTADO ───────────────────
    implicaciones_denunciado = [
        i for i in implicaciones 
        if i.rol in ["DENUNCIADO", "IMPUTADO", "SOSPECHOSO", "DENUNCIADO / IMPUTADO", "AUTOR"]
    ]

    tiene_orden_captura = (
        any(d.orden_captura_denunciado for d in causas_como_denunciado) or
        any(i.orden_captura for i in implicaciones_denunciado)
    )

    tiene_impedimento_salida = (
        any(d.impedimento_salida_denunciado for d in causas_como_denunciado) or
        any(i.impedimento_salida for i in implicaciones_denunciado)
    )

    tiene_sentencia_condenatoria = (
        any(d.tiene_sentencia_condenatoria for d in causas_como_denunciado) or
        any(i.tiene_sentencia for i in implicaciones_denunciado)
    )

    causas_judicializadas = [
        d for d in causas_como_denunciado 
        if d.tiene_sentencia_condenatoria or d.orden_captura_denunciado or d.estado in ['En juicio', 'Finalizado', 'Audiencia / Judicializada']
    ]

    posee_antecedentes = tiene_sentencia_condenatoria or tiene_orden_captura or len(causas_judicializadas) > 0
    alerta_migratoria = tiene_orden_captura or tiene_impedimento_salida

    # ── 2. EVALUAR MEDIDAS DE PROTECCIÓN A LA VÍCTIMA (DENUNCIANTE) ───────────
    implicaciones_victima = [
        i for i in implicaciones 
        if i.rol in ["DENUNCIANTE", "VICTIMA", "DENUNCIANTE / VICTIMA"]
    ]
    tiene_medida_proteccion_victima = (
        any(d.medida_proteccion for d in denuncias_como_denunciante) or
        any(i.medida_proteccion for i in implicaciones_victima)
    )

    total_denuncias = len(denuncias_como_denunciante) + len(causas_como_denunciado)
    total_condenas_o_juicios = len(causas_judicializadas)

    # ── 3. REDACCIÓN JURÍDICA DE OBSERVACIONES ─────────────────────────────────
    if tiene_orden_captura:
        obs = "REGISTRA REQUERIMIENTO JUDICIAL Y ORDEN DE CAPTURA ACTIVA: Existe Orden de Captura Judicial vigente en contra del ciudadano en calidad de DENUNCIADO / IMPUTADO (Alerta migratoria emitida)."
    elif posee_antecedentes:
        obs = "REGISTRA ANTECEDENTES O CAUSA PENAL: Consta como DENUNCIADO / IMPUTADO en proceso penal formalmente abierto."
    elif tiene_medida_proteccion_victima:
        obs = "SIN ANTECEDENTES PENALES: Consta en calidad de DENUNCIANTE / VÍCTIMA en el sistema judicial. Registra Medida Cautelar de Protección a su favor conforme al Art. 558 del COIP. Presunción de inocencia garantizada (Art. 76 num. 2 CRE)."
    elif len(denuncias_como_denunciante) > 0:
        obs = "SIN ANTECEDENTES PENALES: No registra sentencias condenatorias ni órdenes de captura. Consta como DENUNCIANTE en diligencias policiales con presunción de inocencia garantizada."
    else:
        obs = "SIN ANTECEDENTES PENALES: No registra sentencias condenatorias ejecutoriadas ni órdenes de captura. Conforme al Art. 584 del COIP y Art. 76 num. 2 de la Constitución, se garantiza la presunción de inocencia."

    causas_detalle = [
        DelitoResumen(
            codigo_unico=d.codigo_unico,
            delito=d.categoria.nombre if d.categoria else "General",
            gravedad=d.categoria.gravedad if d.categoria else "MEDIA",
            fecha_hechos=d.fecha_hechos,
            estado=d.estado,
            orden_captura=d.orden_captura_denunciado or False,
            medida_proteccion=d.medida_proteccion or False,
            sentencia_condenatoria=d.tiene_sentencia_condenatoria or False
        )
        for d in causas_judicializadas
    ]

    return AntecedentesOut(
        cedula=cedula_clean,
        nombres_completos=nombres,
        posee_antecedentes=posee_antecedentes,
        orden_captura_activa=tiene_orden_captura,
        medidas_cautelares_activas=tiene_medida_proteccion_victima or tiene_orden_captura,
        alerta_migratoria=alerta_migratoria,
        total_denuncias_asociadas=total_denuncias,
        total_condenas_o_juicios=total_condenas_o_juicios,
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
            observaciones="Sin reportes registrados en la Dirección Nacional de Policía Especializada para Niños, Niñas y Adolescentes (DINAPEN).",
            fecha_consulta=datetime.now(timezone.utc)
        )

    reportes_dinapen = db.query(DenunciaSolicitud).join(CategoriaDelito).filter(
        DenunciaSolicitud.ciudadano_id == menor.id,
        CategoriaDelito.es_dinapen == True
    ).all()

    es_alerta_emilia = any(r.categoria.codigo == "DEL-DIN-02" for r in reportes_dinapen if r.categoria)
    tiene_medida_proteccion = any(r.medida_proteccion for r in reportes_dinapen)
    impedimento_salida = es_alerta_emilia or tiene_medida_proteccion

    if es_alerta_emilia:
        obs = "ALERTA EMILIA ACTIVA: Notificación urgente de desaparición de menor de edad. Activar protocolo inmediato de cierre fronterizo."
    elif tiene_medida_proteccion:
        obs = "MEDIDA DE PROTECCIÓN DINAPEN VIGENTE: Requiere autorización judicial formal para salida del territorio nacional."
    else:
        obs = "SIN ALERTAS DINAPEN: No registra alertas de vulneración de derechos ni impedimentos fronterizos."

    return MenorVerificacionOut(
        cedula_menor=menor.cedula,
        nombres_completos=f"{menor.nombres} {menor.apellidos}",
        es_menor_confirmado=menor.es_menor,
        alerta_desaparicion_emilia=es_alerta_emilia,
        medida_proteccion_dinapen=tiene_medida_proteccion,
        impedimento_salida_pais=impedimento_salida,
        total_reportes_dinapen=len(reportes_dinapen),
        observaciones=obs,
        fecha_consulta=datetime.now(timezone.utc)
    )

@router.get(
    "/expediente/{codigo_unico}",
    response_model=ExpedienteInteropOut,
    dependencies=[Depends(verify_interop_api_key)],
    summary="[INTEROPERABILIDAD] Consulta de estado de causa policial por Código Único"
)
def consultar_expediente_interop(
    codigo_unico: str,
    request: Request,
    db: Session = Depends(get_db)
):
    denuncia = db.query(DenunciaSolicitud).filter(DenunciaSolicitud.codigo_unico == codigo_unico.strip()).first()
    if not denuncia:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Expediente policial con código {codigo_unico} no encontrado."
        )

    client_ip = request.client.host if request.client else "127.0.0.1"
    user_agent = request.headers.get("user-agent")

    registrar_auditoria(
        db=db,
        accion="CONSULTA_INTEROP_EXPEDIENTE",
        tabla_afectada="denuncias_solicitudes",
        registro_id=denuncia.id,
        detalles={"codigo_unico": codigo_unico, "origen": "Bus Central de Interoperabilidad"},
        ip_address=client_ip,
        user_agent=user_agent
    )

    unidad = "Policía Judicial (PJ)" if "INVESTIGACION" in denuncia.tipo_tramite else (
        "Policía de Flagrancia (PF)" if "FLAGRANCIA" in denuncia.tipo_tramite else "DINAPEN"
    )

    return ExpedienteInteropOut(
        codigo_unico=denuncia.codigo_unico,
        estado=denuncia.estado,
        tipo_tramite=denuncia.tipo_tramite,
        delito=denuncia.categoria.nombre if denuncia.categoria else "General",
        gravedad=denuncia.categoria.gravedad if denuncia.categoria else "MEDIA",
        fecha_hechos=denuncia.fecha_hechos,
        sector=denuncia.sector,
        tiene_orden_captura=denuncia.orden_captura_denunciado or denuncia.orden_captura_activa,
        tiene_medida_proteccion=denuncia.medida_proteccion,
        unidad_policial_a_cargo=unidad,
        fecha_consulta=datetime.now(timezone.utc)
    )
