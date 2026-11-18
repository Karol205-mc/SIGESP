# ==============================================================================
# DOCKERFILE MULTI-STAGE: SIGESP - POLICÍA NACIONAL DEL ECUADOR (PUERTO :8083)
# Norma Técnica: IEEE 830-1998
# ==============================================================================

# STAGE 1: Compilación de Assets del Frontend (Node.js)
FROM node:22-alpine AS frontend-builder
WORKDIR /build

# Instalar dependencias
COPY Frontend_JAVASCRIPT/package*.json ./
RUN npm ci || npm install

# Copiar código fuente y compilar SPA
COPY Frontend_JAVASCRIPT/ ./
RUN npm run build

# STAGE 2: Entorno de Ejecución Backend (Python 3.12 Slim)
FROM python:3.12-slim AS runtime

# Variables de entorno
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PORT=8083 \
    HOST=0.0.0.0

WORKDIR /app

# Instalar dependencias del sistema requeridas para PostgreSQL (libpq)
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    libpq-dev \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Instalar dependencias de Python
COPY Backend_PYTHON/requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

# Copiar aplicación backend
COPY Backend_PYTHON/app ./app
COPY Backend_PYTHON/main.py ./
COPY Backend_PYTHON/.env.example ./.env

# Copiar los assets compilados del Frontend (Stage 1) hacia la carpeta estática del Backend
COPY --from=frontend-builder /build/../Backend_PYTHON/app/static ./app/static
COPY Frontend_JAVASCRIPT/public/assets/* ./app/static/assets/

# Exponer el puerto asignado en el ecosistema de 5 grupos
EXPOSE 8083

# Healthcheck institucional
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:${PORT:-8083}/health || exit 1

# Comando de inicio del servidor ASGI (compatible con Render y Docker local)
CMD ["sh", "-c", "uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8083}"]
