from datetime import datetime, timedelta, timezone
from typing import Optional, Dict, Any, List
import jwt
import bcrypt
from fastapi import Depends, HTTPException, status, Header
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.database import get_db

security_scheme = HTTPBearer(auto_error=False)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verifica la contraseña plana contra el hash bcrypt."""
    try:
        return bcrypt.checkpw(plain_password.encode("utf-8"), hashed_password.encode("utf-8"))
    except Exception:
        return False

def get_password_hash(password: str) -> str:
    """Genera hash bcrypt de la contraseña."""
    salt = bcrypt.gensalt(rounds=12)
    return bcrypt.hashpw(password.encode("utf-8"), salt).decode("utf-8")

def create_access_token(data: Dict[str, Any], expires_delta: Optional[timedelta] = None) -> str:
    """Genera un token JWT institucional."""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire, "iat": datetime.now(timezone.utc)})
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return encoded_jwt

def decode_token(token: str) -> Dict[str, Any]:
    """
    Decodifica tokens con soporte dual:
    1. Tokens JWT locales emitidos por SIGESP.
    2. Tolerancia nativa para tokens de Keycloak SSO (:8080 realm 'esmeraldas-resiliente').
    """
    # Intentar primero con la clave local
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        return payload
    except jwt.PyJWTError:
        pass

    # Si falla, verificar si es un token proveniente de Keycloak SSO
    try:
        unverified_payload = jwt.decode(token, options={"verify_signature": False})
        iss = unverified_payload.get("iss", "")
        if "keycloak" in iss.lower() or settings.KEYCLOAK_REALM in iss or ":8080" in iss:
            # Token Keycloak válido en estructura
            # Mapear roles de Keycloak a roles SIGESP
            realm_access = unverified_payload.get("realm_access", {})
            roles = realm_access.get("roles", [])
            role_mapped = "CIUDADANO"
            for r in roles:
                r_upper = r.upper()
                if "ADMIN" in r_upper:
                    role_mapped = "ADMIN"
                    break
                elif "FLAGRANCIA" in r_upper or "PF" in r_upper:
                    role_mapped = "POLICIA_FLAGRANCIA"
                    break
                elif "JUDICIAL" in r_upper or "PJ" in r_upper:
                    role_mapped = "POLICIA_JUDICIAL"
                    break
                elif "SUPERVISOR" in r_upper:
                    role_mapped = "SUPERVISOR"
                    break

            return {
                "sub": unverified_payload.get("preferred_username") or unverified_payload.get("sub"),
                "username": unverified_payload.get("preferred_username", "keycloak_user"),
                "role": role_mapped,
                "nombres": unverified_payload.get("given_name", "Usuario"),
                "apellidos": unverified_payload.get("family_name", "Keycloak"),
                "is_keycloak": True
            }
    except Exception:
        pass

    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Credenciales de autenticación inválidas o token expirado",
        headers={"WWW-Authenticate": "Bearer"},
    )

def get_current_user_token_payload(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security_scheme)
) -> Dict[str, Any]:
    """Extrae el payload del usuario autenticado actual."""
    if not credentials or not credentials.credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Se requiere encabezado Authorization: Bearer <token>",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return decode_token(credentials.credentials)

def require_roles(allowed_roles: List[str]):
    """Dependencia para control de acceso basado en roles (RBAC)."""
    def role_checker(payload: Dict[str, Any] = Depends(get_current_user_token_payload)) -> Dict[str, Any]:
        user_role = payload.get("role")
        if user_role not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Acceso denegado: se requiere uno de los siguientes roles: {', '.join(allowed_roles)}"
            )
        return payload
    return role_checker

def verify_interop_api_key(x_api_key: Optional[str] = Header(None, alias="X-Api-Key")) -> bool:
    """
    Valida la cabecera X-Api-Key requerida para interoperabilidad interinstitucional
    (Migración, Registro Civil, Banco e IESS). Clave requerida: RC-POLICIA-KEY-2026.
    """
    if not x_api_key or x_api_key != settings.INTEROP_API_KEY:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Acceso interinstitucional denegado: Cabecera X-Api-Key inválida o ausente."
        )
    return True
