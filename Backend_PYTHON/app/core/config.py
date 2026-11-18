from pydantic_settings import BaseSettings
from typing import List, Union
import json
import os
from pathlib import Path

# Raíz del backend para ubicar .env
BASE_DIR = Path(__file__).resolve().parent.parent.parent

class Settings(BaseSettings):
    ENVIRONMENT: str = "production"
    APP_NAME: str = "SIGESP - Policía Nacional del Ecuador"
    API_V1_STR: str = "/api/v1"
    PORT: int = int(os.getenv("PORT", "8083"))
    HOST: str = os.getenv("HOST", "0.0.0.0")

    # Base de Datos PostgreSQL (Aiven Cloud / Render / Local)
    DATABASE_URL: str = os.getenv(
        "DATABASE_URL", 
        "postgresql://avnadmin:postgres@localhost:5432/policia_nacional"
    )
    DB_HOST: str = os.getenv("DB_HOST", "sigesp-bd-bd-policia.d.aivencloud.com")
    DB_PORT: int = int(os.getenv("DB_PORT", "15393"))
    DB_USER: str = os.getenv("DB_USER", "avnadmin")
    DB_PASS: str = os.getenv("DB_PASS", "")
    DB_NAME: str = os.getenv("DB_NAME", "policia_nacional")
    DB_SSLMODE: str = os.getenv("DB_SSLMODE", "require")

    # Seguridad JWT Local
    SECRET_KEY: str = "sigesp-policia-secret-key-2026-seguridad-nacional-esmeraldas-ecuador"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 480

    # Keycloak SSO (Ecosistema 5 Grupos)
    KEYCLOAK_URL: str = "http://localhost:8080"
    KEYCLOAK_REALM: str = "esmeraldas-resiliente"
    KEYCLOAK_CLIENT_ID: str = "sigesp-policia"

    # Protocolo de Interoperabilidad Interinstitucional (5 Grupos UTE-LVT)
    INTEROP_API_KEY: str = "RC-POLICIA-KEY-2026"

    # CORS
    CORS_ORIGINS: Union[List[str], str] = ["*"]

    model_config = {
        "env_file": str(BASE_DIR / ".env"),
        "env_file_encoding": "utf-8",
        "extra": "ignore"
    }

    def get_cors_origins(self) -> List[str]:
        if isinstance(self.CORS_ORIGINS, str):
            try:
                return json.loads(self.CORS_ORIGINS)
            except Exception:
                return [origin.strip() for origin in self.CORS_ORIGINS.split(",") if origin.strip()]
        return self.CORS_ORIGINS

settings = Settings()
