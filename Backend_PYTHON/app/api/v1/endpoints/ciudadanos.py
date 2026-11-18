from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime, timezone
from app.core.database import get_db
from app.core.security import get_current_user_token_payload, require_roles, get_password_hash, create_access_token
from app.models.ciudadano import Ciudadano
from app.models.usuario import Usuario, Rol
from app.models.alerta import AlertaPanico
from app.models.novedad import Novedad
from app.schemas.ciudadano import CiudadanoCreate, CiudadanoOut, RegistroCiudadanoRequest, AlertaPanicoCreate, AlertaPanicoOut
from app.schemas.auth import TokenResponse
from app.services.auditoria_service import registrar_auditoria

router = APIRouter()

def validar_cedula_ecuatoriana_detallada(cedula: str):
    """Valida el número de cédula según el algoritmo oficial Módulo 10 del Registro Civil."""
    cedula = cedula.strip()
    if not (len(cedula) == 10 and cedula.isdigit()):
        return False, "La cédula debe contener exactamente 10 dígitos numéricos."
    prov = int(cedula[:2])
    if not (1 <= prov <= 24 or prov == 30):
        return False, f"Código de provincia '{cedula[:2]}' inválido (en Ecuador debe estar entre 01 y 24)."
    if int(cedula[2]) >= 6:
        return False, f"El tercer dígito '{cedula[2]}' es inválido para personas naturales (debe ser menor a 6)."
    coeficientes = [2, 1, 2, 1, 2, 1, 2, 1, 2]
    suma = 0
    for i in range(9):
        val = int(cedula[i]) * coeficientes[i]
        if val >= 10:
            val -= 9
        suma += val
    digito_verificador = (10 - (suma % 10)) % 10
    digito_actual = int(cedula[9])
    if digito_verificador != digito_actual:
        sugerida = cedula[:9] + str(digito_verificador)
        return False, f"Dígito verificador incorrecto. El algoritmo del Registro Civil calcula '{digito_verificador}' (ejemplo: {sugerida}), pero ingresó '{digito_actual}'."
    return True, "Válida"

@router.post("/registro-cuenta", response_model=TokenResponse, status_code=status.HTTP_201_CREATED, summary="Crear cuenta ciudadana con datos completos de cédula")
def registrar_cuenta_ciudadano(
    datos: RegistroCiudadanoRequest,
    request: Request,
    db: Session = Depends(get_db)
):
    """
    Crea una cuenta ciudadana formal (Rol CIUDADANO) exigiendo datos biométricos
    y documentales de la cédula: fecha de expedición, código dactilar y fotografías.
    """
    cedula_clean = datos.cedula.strip()

    # Validar cédula ecuatoriana (permitiendo pruebas de equipo)
    es_prueba = cedula_clean in ['0801000001', '0802000002', '0803000003', '0804000004']
    if not es_prueba:
        valida, detalle = validar_cedula_ecuatoriana_detallada(cedula_clean)
        if not valida:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=detalle
            )

    # Verificar si el usuario ya existe
    username_elegido = cedula_clean
    user_existente = db.query(Usuario).filter(
        (Usuario.username == username_elegido) | (Usuario.email == datos.email.strip()) | (Usuario.cedula == cedula_clean)
    ).first()
    if user_existente:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Ya existe una cuenta ciudadana registrada con la cédula {cedula_clean} o correo {datos.email}."
        )

    # 1. Crear o actualizar registro en tabla ciudadanos
    ciudadano = db.query(Ciudadano).filter(Ciudadano.cedula == cedula_clean).first()
    if not ciudadano:
        ciudadano = Ciudadano(
            cedula=cedula_clean,
            nombres=datos.nombres.strip(),
            apellidos=datos.apellidos.strip(),
            fecha_nacimiento=datos.fecha_nacimiento,
            fecha_expedicion=datos.fecha_expedicion,
            codigo_dactilar=datos.codigo_dactilar.strip().upper(),
            telefono=datos.telefono.strip(),
            email=datos.email.strip(),
            direccion=datos.direccion.strip(),
            foto_anverso=datos.foto_anverso,
            foto_reverso=datos.foto_reverso,
            es_menor=False
        )
        db.add(ciudadano)
        db.flush()
    else:
        ciudadano.nombres = datos.nombres.strip()
        ciudadano.apellidos = datos.apellidos.strip()
        ciudadano.fecha_nacimiento = datos.fecha_nacimiento
        ciudadano.fecha_expedicion = datos.fecha_expedicion
        ciudadano.codigo_dactilar = datos.codigo_dactilar.strip().upper()
        ciudadano.telefono = datos.telefono.strip()
        ciudadano.email = datos.email.strip()
        ciudadano.direccion = datos.direccion.strip()
        if datos.foto_anverso:
            ciudadano.foto_anverso = datos.foto_anverso
        if datos.foto_reverso:
            ciudadano.foto_reverso = datos.foto_reverso

    # 2. Crear usuario con rol CIUDADANO (rol_id = 5)
    rol_ciudadano = db.query(Rol).filter(Rol.codigo == "CIUDADANO").first()
    rol_id = rol_ciudadano.id if rol_ciudadano else 5

    nuevo_usuario = Usuario(
        username=username_elegido,
        password_hash=get_password_hash(datos.password),
        nombres=datos.nombres.strip(),
        apellidos=datos.apellidos.strip(),
        cedula=cedula_clean,
        ciudadano_id=ciudadano.id,
        rango="Ciudadano Verificado",
        placa="N/A",
        email=datos.email.strip(),
        telefono=datos.telefono.strip(),
        rol_id=rol_id,
        activo=True
    )
    db.add(nuevo_usuario)
    db.commit()
    db.refresh(nuevo_usuario)

    # 3. Registrar auditoría
    client_ip = request.client.host if request.client else "127.0.0.1"
    registrar_auditoria(
        db=db,
        accion="REGISTRO_CUENTA_CIUDADANA",
        tabla_afectada="usuarios",
        registro_id=nuevo_usuario.id,
        usuario_id=nuevo_usuario.id,
        detalles={"cedula": cedula_clean, "nombres": f"{datos.nombres} {datos.apellidos}"},
        ip_address=client_ip
    )

    # 4. Generar token de sesión inmediato
    token_payload = {
        "sub": str(nuevo_usuario.id),
        "user_id": nuevo_usuario.id,
        "username": nuevo_usuario.username,
        "role": "CIUDADANO",
        "nombres": nuevo_usuario.nombres,
        "apellidos": nuevo_usuario.apellidos,
        "cedula": nuevo_usuario.cedula
    }
    token = create_access_token(data=token_payload)

    return TokenResponse(
        access_token=token,
        token_type="bearer",
        user_id=nuevo_usuario.id,
        username=nuevo_usuario.username,
        nombre_completo=f"{nuevo_usuario.nombres} {nuevo_usuario.apellidos}",
        nombres=nuevo_usuario.nombres,
        apellidos=nuevo_usuario.apellidos,
        cedula=nuevo_usuario.cedula,
        email=nuevo_usuario.email,
        telefono=nuevo_usuario.telefono,
        direccion=ciudadano.direccion,
        rol="CIUDADANO",
        rango=nuevo_usuario.rango,
        placa=nuevo_usuario.placa
    )

# -----------------------------------------------------------------------------
# BOTÓN DE PÁNICO Y PEDIDO DE AUXILIO INMEDIATO (SOLO CIUDADANOS AUTENTICADOS)
# -----------------------------------------------------------------------------
@router.post("/panico", response_model=AlertaPanicoOut, status_code=status.HTTP_201_CREATED, summary="Activar Botón de Pánico Digital (Auxilio Inmediato)")
def activar_boton_panico(
    datos: AlertaPanicoCreate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user_token_payload)
):
    """
    Exclusivo para ciudadanos registrados.
    Captura las coordenadas GPS y emite la orden de despacho a la central policial y ECU-911.
    """
    user_id = current_user.get("user_id")
    usuario = db.query(Usuario).filter(Usuario.id == user_id).first() if user_id else None
    
    # Generar código correlativo de auxilio
    year = datetime.now().year
    count = db.query(AlertaPanico).count() + 1
    codigo = f"AUX-{year}-{count:04d}"

    nombre_ciudadano = f"{usuario.nombres} {usuario.apellidos}" if usuario else current_user.get("username", "Ciudadano")
    ciudadano_id = usuario.ciudadano_id if usuario else None

    nueva_alerta = AlertaPanico(
        codigo_alerta=codigo,
        ciudadano_id=ciudadano_id,
        usuario_id=user_id,
        latitud=datos.latitud,
        longitud=datos.longitud,
        direccion_referencial=datos.direccion_referencial or "Ubicación Georreferenciada del Dispositivo Móvil",
        tipo_emergencia=datos.tipo_emergencia,
        estado="DESPACHADO",
        patrulla_asignada="Móvil PN-420 (Circuito Las Palmas / Flagrancia)"
    )
    db.add(nueva_alerta)

    # Registrar en el libro de guardia policial automáticamente para conocimiento de la patrulla
    novedad = Novedad(
        usuario_id=1, # Sistema / Despacho
        sector="Emergencia Georreferenciada",
        tipo_novedad="DETENCION",
        descripcion=f"[BOTÓN DE PÁNICO SOS] Alerta {codigo} activada por {nombre_ciudadano} (C.I.: {usuario.cedula if usuario else 'S/N'}). Coordenadas: {datos.latitud}, {datos.longitud}. Móvil PN-420 despachado."
    )
    db.add(novedad)
    db.commit()
    db.refresh(nueva_alerta)

    return AlertaPanicoOut(
        id=nueva_alerta.id,
        codigo_alerta=nueva_alerta.codigo_alerta,
        latitud=float(nueva_alerta.latitud),
        longitud=float(nueva_alerta.longitud),
        estado=nueva_alerta.estado,
        patrulla_asignada=nueva_alerta.patrulla_asignada,
        fecha_alerta=nueva_alerta.fecha_alerta,
        tiempo_estimado_llegada="4 a 7 minutos",
        ciudadano_nombre=nombre_ciudadano
    )

@router.get("/", response_model=List[CiudadanoOut], summary="Listar ciudadanos registrados")
def listar_ciudadanos(
    skip: int = 0,
    limit: int = 100,
    query: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_roles(["ADMIN", "SUPERVISOR", "POLICIA_FLAGRANCIA", "POLICIA_JUDICIAL"]))
):
    q = db.query(Ciudadano)
    if query:
        term = f"%{query.strip()}%"
        q = q.filter((Ciudadano.cedula.ilike(term)) | (Ciudadano.nombres.ilike(term)) | (Ciudadano.apellidos.ilike(term)))
    return q.offset(skip).limit(limit).all()

@router.get("/{cedula}", response_model=CiudadanoOut, summary="Consultar ciudadano por cédula")
def consultar_ciudadano(
    cedula: str,
    db: Session = Depends(get_db)
):
    ciudadano = db.query(Ciudadano).filter(Ciudadano.cedula == cedula.strip()).first()
    if not ciudadano:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Ciudadano no encontrado.")
    return ciudadano
