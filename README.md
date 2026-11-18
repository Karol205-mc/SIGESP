# SIGESP - Sistema Integral de Gestión de Servicios Policiales del Ecuador

> **Norma Técnica:** IEEE 830-1998 (Especificación de Requisitos de Software - ERS)  
> **Entidad:** Grupo 3 - Policía Nacional del Ecuador (DINAPEN / Policía Judicial / Flagrancia)  
> **Ecosistema:** Universidad Técnica "Luis Vargas Torres" de Esmeraldas (5 Grupos Interoperables)  
> **Puerto Asignado:** `:8083`  
> **Base de Datos:** PostgreSQL 18 en la nube (Aiven Cloud)

---

## 👥 Equipo Oficial y Matriz de Control de Acceso (RBAC)

El sistema cuenta con las cuentas oficiales asignadas con contraseñas seguras hasheadas con `bcrypt`:

| Integrante | Rol en el Sistema | Username | Contraseña | Rango Institucional | Módulo Asignado |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **WILA JORDAN PORTILLA** | `ADMIN` | `jordan.wila` | `jordan123` | Coronel de Policía | Mando General, Personal y Auditoría Forense |
| **ENRIQUEZ JULIANA** | `POLICIA_FLAGRANCIA` | `juliana.enriquez` | `juliana123` | Subteniente de Flagrancia | Bandeja Urgente, Aprehensiones y Actas |
| **PEREA JANY** | `POLICIA_JUDICIAL` | `jany.perea` | `jany123` | Capitán Investigador PJ | Peritajes Forenses, Cautelares y Audiencias |
| **MENA KAROL** | `SUPERVISOR` | `karol.mena` | `karol123` | Mayor / Jefe de Operaciones | Despacho Operativo, Asignación y Métricas |
| **CABEZAS ANGELO** | `CIUDADANO` | `angelo.cabezas` | `angelo123` | Ciudadano Registrado | Denuncias Virtuales y Rastrear Trámites |

*(Cuentas de compatibilidad para evaluación intergrupal: `admin` / `12345`, `agente.pf` / `12345`, `agente.pj` / `12345`)*.

---

## 🏛️ Estructura del Proyecto

```text
Policia_nacional/
├── Backend_PYTHON/                     # Backend FastAPI (Python 3.12+)
│   ├── app/
│   │   ├── api/v1/endpoints/           # 27 rutas implementadas
│   │   │   ├── auth.py                 # JWT Local + Keycloak SSO
│   │   │   ├── usuarios.py             # Personal y roles
│   │   │   ├── ciudadanos.py           # Ciudadanos registrados
│   │   │   ├── denuncias.py            # Trámites y código POL-2026-XXXX
│   │   │   ├── asignaciones.py         # Despacho a agentes PF/PJ
│   │   │   ├── diligencias.py          # Jueces, fiscales y audiencias
│   │   │   ├── novedades.py            # Libro de guardia policial
│   │   │   ├── seguimiento.py          # Consulta pública ciudadana
│   │   │   ├── reportes.py             # Estadísticas consolidadas
│   │   │   ├── auditoria.py            # Bitácora inmutable
│   │   │   └── interoperabilidad.py    # Migración, Registro Civil, Banco e IESS
│   │   ├── core/                       # config, database, security
│   │   ├── models/                     # 10 modelos relacionales SQLAlchemy
│   │   ├── schemas/                    # Validación Pydantic
│   │   ├── services/                   # Códigos correlativos, transiciones de estado
│   │   └── static/                     # Assets compilados del Frontend SPA
│   ├── main.py
│   ├── requirements.txt
│   └── test_backend.py                 # Suite de pruebas automatizadas
├── Frontend_JAVASCRIPT/                # Frontend React 18 + Vite (SPA)
│   ├── public/assets/                  # Emblema alterno estilizado SIGESP
│   ├── src/
│   │   ├── components/                 # Navbar, Sidebar, TimelineSeguimiento
│   │   ├── pages/                      # PortalCiudadano, Login, Bandejas, Audiencias
│   │   └── services/api.js             # Cliente Axios con interceptores JWT
│   └── package.json
├── Datos_POSTGRESQL/
│   ├── init.sql                        # DDL de tablas e índices (PostgreSQL 18)
│   └── seed_data.sql                   # Datos semilla del equipo y causas de prueba
├── docs/
│   └── APIs.txt                        # Catálogo de interoperabilidad
├── Dockerfile                          # Multi-stage build (Node build + Python runtime)
├── docker-compose.yml                  # Orquestador puerto 8083
└── .env
```

---

## 🚀 Despliegue y Ejecución

### Opción 1: Ejecución Directa en Desarrollo

#### 1. Iniciar el Backend (FastAPI):
```powershell
cd Backend_PYTHON
python main.py
```
El backend iniciará en `http://localhost:8083` sirviendo tanto el Frontend como la API REST y la documentación OpenAPI en `/docs`.

#### 2. (Opcional) Servidor de Desarrollo del Frontend:
```powershell
cd Frontend_JAVASCRIPT
npm run dev
```

---

### Opción 2: Despliegue en Docker en un Solo Comando

```bash
docker compose up -d --build
```
El contenedor compilará el frontend en la primera etapa y levantará el backend en el puerto **`:8083`**.

---

## 🌐 Endpoints de Interoperabilidad (Cabecera Obligatoria)

Todas las peticiones interinstitucionales deben incluir la cabecera:
`X-Api-Key: RC-POLICIA-KEY-2026`

1. **Antecedentes para Migración (SGIM):**
   `GET /api/v1/policia/antecedentes/{cedula}`
2. **Verificación de Menores DINAPEN / Impedimentos de Salida:**
   `GET /api/v1/policia/verificar-menor/{cedula_menor}`
3. **Expediente de Denuncia para Bancos, Registro Civil e IESS:**
   `GET /api/v1/policia/denuncias/{codigo_unico}`

---

## 🔄 Trazabilidad del Flujo de Estados

Toda denuncia recorre de manera transparente y auditable el flujo de 6 estados:
1. `Registrada` → Ingreso público por ciudadano o ventanilla (genera `POL-2026-XXXX`).
2. `En revisión` → Calificación inicial por el supervisor operativo.
3. `Asignada` → Asignada a un oficial de Flagrancia o Policía Judicial.
4. `En proceso` → Investigaciones periciales y levantamiento de evidencias.
5. `Audiencia / Judicializada` → Causa penal sorteada con juez, fiscal, fecha y sala.
6. `Atendida / Cerrada` → Procedimiento concluido con sentencia o archivo.
