from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import verify_password, create_access_token, get_current_user_token_payload, decode_token
from app.models.usuario import Usuario, Rol
from app.models.ciudadano import Ciudadano
from app.schemas.auth import LoginRequest, TokenResponse
from app.services.auditoria_service import registrar_auditoria

router = APIRouter()

@router.post("/login", response_model=TokenResponse, summary="Inicio de sesión institucional y ciudadano")
def login(request: Request, login_data: LoginRequest, db: Session = Depends(get_db)):
    """
    Autentica usuarios policiales y ciudadanos registrados.
    Permite el login tanto con username como con el número de cédula.
    """
    input_user = login_data.username.strip()
    user = (
        db.query(Usuario)
        .filter(
            ((Usuario.username == input_user) | (Usuario.cedula == input_user)),
            Usuario.activo == True
        )
        .first()
    )

    if not user or not verify_password(login_data.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Credenciales incorrectas o usuario inactivo.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    rol_codigo = user.rol.codigo if user.rol else "CIUDADANO"
    nombre_completo = f"{user.nombres} {user.apellidos}"

    # Si es ciudadano, obtener sus datos de residencia de la tabla ciudadanos
    direccion_ciudadano = None
    if user.ciudadano_id:
        c = db.query(Ciudadano).filter(Ciudadano.id == user.ciudadano_id).first()
        if c:
            direccion_ciudadano = c.direccion

    # Crear token JWT con claims estándar
    token_payload = {
        "sub": str(user.id),
        "user_id": user.id,
        "username": user.username,
        "role": rol_codigo,
        "nombres": user.nombres,
        "apellidos": user.apellidos,
        "cedula": user.cedula,
        "placa": user.placa,
        "rango": user.rango
    }
    access_token = create_access_token(data=token_payload)

    # Registrar en auditoría
    client_ip = request.client.host if request.client else "127.0.0.1"
    user_agent = request.headers.get("user-agent")
    registrar_auditoria(
        db=db,
        accion="LOGIN_EXITOSO",
        tabla_afectada="usuarios",
        registro_id=user.id,
        usuario_id=user.id,
        detalles={"username": user.username, "rol": rol_codigo},
        ip_address=client_ip,
        user_agent=user_agent
    )

    return TokenResponse(
        access_token=access_token,
        token_type="bearer",
        user_id=user.id,
        username=user.username,
        nombre_completo=nombre_completo,
        nombres=user.nombres,
        apellidos=user.apellidos,
        cedula=user.cedula,
        email=user.email,
        telefono=user.telefono,
        direccion=direccion_ciudadano,
        rol=rol_codigo,
        rango=user.rango,
        placa=user.placa
    )

@router.get("/me", summary="Obtener perfil del usuario autenticado")
def get_me(current_user: dict = Depends(get_current_user_token_payload), db: Session = Depends(get_db)):
    user_id = current_user.get("user_id")
    if user_id:
        user = db.query(Usuario).filter(Usuario.id == int(user_id)).first()
        if user:
            dir_res = user.ciudadano.direccion if user.ciudadano else None
            return {
                "id": user.id,
                "username": user.username,
                "nombres": user.nombres,
                "apellidos": user.apellidos,
                "nombre_completo": f"{user.nombres} {user.apellidos}",
                "cedula": user.cedula,
                "rol": user.rol.codigo if user.rol else current_user.get("role"),
                "rango": user.rango,
                "placa": user.placa,
                "email": user.email,
                "telefono": user.telefono,
                "direccion": dir_res,
                "origen": "LOCAL"
            }
    return {
        "id": current_user.get("sub"),
        "username": current_user.get("username"),
        "nombre_completo": f"{current_user.get('nombres', '')} {current_user.get('apellidos', '')}".strip() or current_user.get("username"),
        "rol": current_user.get("role", "CIUDADANO"),
        "origen": "KEYCLOAK_SSO" if current_user.get("is_keycloak") else "LOCAL"
    }

@router.post("/keycloak-callback", summary="Validar e integrar sesión Keycloak SSO (:8080)")
def keycloak_callback(payload: dict):
    raw_token = payload.get("access_token")
    if not raw_token:
        raise HTTPException(status_code=400, detail="Token no suministrado.")
    
    decoded = decode_token(raw_token)
    return {
        "status": "success",
        "message": "Autenticación federada Keycloak SSO validada.",
        "user": decoded
    }
