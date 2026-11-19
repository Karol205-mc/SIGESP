from fastapi import FastAPI, Depends, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import JSONResponse, FileResponse
from pathlib import Path
import os
import logging

from app.core.config import settings
from app.core.database import engine, Base
from app.api.v1.api_router import api_router

# Configuración de logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("sigesp.main")

# Inicialización de la aplicación FastAPI
app = FastAPI(
    title=settings.APP_NAME,
    description="""
    ## SIGESP - Sistema Integral de Gestión de Servicios Policiales del Ecuador
    **Norma Técnica:** IEEE 830-1998 (Especificación de Requisitos de Software - ERS)  
    **Entidad:** Grupo 3 - Policía Nacional del Ecuador (DINAPEN / Policía Judicial / Flagrancia)  
    **Ecosistema:** Universidad Técnica "Luis Vargas Torres" de Esmeraldas (5 Grupos Interoperables)  
    
    ### Características principales:
    * **Autenticación Dual:** JWT Local + Keycloak SSO (:8080 con realm `Policia`).
    * **RBAC:** Roles estrictos (Admin, Flagrancia, Judicial, Supervisor, Ciudadano).
    * **Trazabilidad:** Flujo estricto de 6 estados de denuncias y bitácora inmutable de auditoría.
    * **Interoperabilidad:** Endpoints con autenticación por API Key (`X-Api-Key: RC-POLICIA-KEY-2026`) para Migración, Registro Civil, Banco e IESS.
    """,
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json"
)

# Configuración de CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.get_cors_origins(),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Montaje de Rutas de la API v1
app.include_router(api_router, prefix=settings.API_V1_STR)

# Endpoints de Monitoreo y Salud del Servicio (Healthcheck)
@app.get("/health", tags=["Monitoreo"], summary="Health check global")
@app.get("/api/v1/health", tags=["Monitoreo"], summary="Health check API v1")
def health_check():
    """Retorna el estado operativo del microservicio policial."""
    return {
        "status": "online",
        "service": "SIGESP - Policia Nacional del Ecuador",
        "puerto": settings.PORT,
        "database": "PostgreSQL 18 (Aiven Cloud)",
        "interoperabilidad": "Activa (X-Api-Key)",
        "sso_keycloak": "Habilitado (:8080)"
    }

# Servir Frontend SPA estático si existe
static_dir = Path(__file__).resolve().parent / "static"
assets_dir = static_dir / "assets"

if assets_dir.exists():
    app.mount("/assets", StaticFiles(directory=str(assets_dir)), name="assets")

@app.get("/", tags=["Sistema SIGESP"], summary="Portal Web del Sistema")
def root_view():
    index_file = static_dir / "index.html"
    if index_file.exists():
        return FileResponse(str(index_file))
    return {
        "sistema": "SIGESP: Sistema Integral de Gestión de Servicios Policiales del Ecuador",
        "norma": "IEEE 830-1998",
        "grupo": "Grupo 3 - Policía Nacional del Ecuador",
        "version": "1.0.0",
        "docs": "/docs",
        "health": "/health"
    }

# Manejador SPA para recargas y navegación profunda en React Router
@app.get("/{full_path:path}", include_in_schema=False)
def serve_spa(full_path: str):
    # Si la ruta coincide con un archivo estático real en la carpeta static
    target_file = static_dir / full_path
    if target_file.is_file():
        return FileResponse(str(target_file))
    
    # En caso contrario, devolver index.html para que React Router resuelva la ruta
    index_file = static_dir / "index.html"
    if index_file.exists():
        return FileResponse(str(index_file))
    
    return JSONResponse(status_code=404, content={"detail": "Recurso no encontrado"})
