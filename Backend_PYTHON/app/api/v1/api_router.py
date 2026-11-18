from fastapi import APIRouter
from app.api.v1.endpoints import (
    auth,
    ciudadanos,
    denuncias,
    asignaciones,
    diligencias,
    novedades,
    seguimiento,
    reportes,
    interoperabilidad,
    auditoria,
    usuarios
)

api_router = APIRouter()

# 1. Autenticación Local y Keycloak SSO
api_router.include_router(auth.router, prefix="/auth", tags=["Autenticación"])

# 2. Gestión de Usuarios y Roles (Admin)
api_router.include_router(usuarios.router, prefix="/usuarios", tags=["Gestión de Personal Policial"])

# 3. Ciudadanos
api_router.include_router(ciudadanos.router, prefix="/ciudadanos", tags=["Ciudadanos"])

# 4. Denuncias y Solicitudes Policiales
api_router.include_router(denuncias.router, prefix="/denuncias", tags=["Denuncias y Casos"])

# 5. Asignaciones a Agentes (PF y PJ)
api_router.include_router(asignaciones.router, prefix="/asignaciones", tags=["Asignaciones Operativas"])

# 6. Diligencias Judiciales y Audiencias
api_router.include_router(diligencias.router, prefix="/diligencias", tags=["Diligencias y Audiencias Judiciales"])

# 7. Libro de Guardia y Novedades Policiales
api_router.include_router(novedades.router, prefix="/novedades", tags=["Libro de Guardia y Novedades"])

# 8. Seguimiento y Consulta Pública Ciudadana
api_router.include_router(seguimiento.router, prefix="/seguimiento", tags=["Trazabilidad y Consulta Pública"])

# 9. Estadísticas y Reportes Consolidados
api_router.include_router(reportes.router, prefix="/reportes", tags=["Estadísticas y Métricas"])

# 10. Auditoría Inmutable
api_router.include_router(auditoria.router, prefix="/auditoria", tags=["Auditoría de Seguridad"])

# 11. Interoperabilidad Interinstitucional (5 Grupos: Migración, Registro Civil, Banco, IESS)
api_router.include_router(interoperabilidad.router, prefix="/policia", tags=["Interoperabilidad Interinstitucional"])
