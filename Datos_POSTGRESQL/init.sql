-- =============================================================================
-- SIGESP - SISTEMA INTEGRAL DE GESTIÓN DE SERVICIOS POLICIALES DEL ECUADOR
-- BASE DE DATOS: PostgreSQL 18 (policia_nacional)
-- NORMA TÉCNICA: IEEE 830-1998 (Especificación de Requisitos de Software)
-- SCRIPT: init.sql (DDL - Estructura de Tablas, Claves, Restricciones e Índices)
-- =============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Limpieza preventiva en orden de dependencias
DROP TABLE IF EXISTS auditoria CASCADE;
DROP TABLE IF EXISTS seguimiento CASCADE;
DROP TABLE IF EXISTS diligencias_judiciales CASCADE;
DROP TABLE IF EXISTS asignaciones CASCADE;
DROP TABLE IF EXISTS novedades CASCADE;
DROP TABLE IF EXISTS denuncias_solicitudes CASCADE;
DROP TABLE IF EXISTS estados_tramite CASCADE;
DROP TABLE IF EXISTS categorias_delitos CASCADE;
DROP TABLE IF EXISTS ciudadanos CASCADE;
DROP TABLE IF EXISTS usuarios CASCADE;
DROP TABLE IF EXISTS roles CASCADE;

-- 1. TABLA: roles
CREATE TABLE roles (
    id SERIAL PRIMARY KEY,
    codigo VARCHAR(50) UNIQUE NOT NULL,
    nombre VARCHAR(100) NOT NULL,
    descripcion TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. TABLA: usuarios
CREATE TABLE usuarios (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    nombres VARCHAR(100) NOT NULL,
    apellidos VARCHAR(100) NOT NULL,
    rango VARCHAR(100),
    placa VARCHAR(50),
    email VARCHAR(150),
    telefono VARCHAR(20),
    rol_id INT NOT NULL REFERENCES roles(id) ON DELETE RESTRICT,
    activo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. TABLA: ciudadanos
CREATE TABLE ciudadanos (
    id SERIAL PRIMARY KEY,
    cedula VARCHAR(10) UNIQUE NOT NULL,
    nombres VARCHAR(100) NOT NULL,
    apellidos VARCHAR(100) NOT NULL,
    telefono VARCHAR(20),
    email VARCHAR(150),
    direccion TEXT,
    fecha_nacimiento DATE,
    es_menor BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. TABLA: categorias_delitos
CREATE TABLE categorias_delitos (
    id SERIAL PRIMARY KEY,
    codigo VARCHAR(30) UNIQUE NOT NULL,
    nombre VARCHAR(150) NOT NULL,
    gravedad VARCHAR(30) NOT NULL CHECK (gravedad IN ('LEVE', 'MEDIA', 'GRAVE', 'MUY GRAVE')),
    descripcion TEXT,
    es_dinapen BOOLEAN DEFAULT FALSE
);

-- 5. TABLA: estados_tramite (Catálogo detallado de fases procedimentales)
CREATE TABLE estados_tramite (
    id SERIAL PRIMARY KEY,
    codigo VARCHAR(50) UNIQUE NOT NULL,
    nombre VARCHAR(100) NOT NULL,
    descripcion TEXT,
    color VARCHAR(30) DEFAULT 'blue',
    orden INT DEFAULT 1
);

-- 6. TABLA: denuncias_solicitudes
CREATE TABLE denuncias_solicitudes (
    id SERIAL PRIMARY KEY,
    codigo_unico VARCHAR(30) UNIQUE NOT NULL,
    ciudadano_id INT NOT NULL REFERENCES ciudadanos(id) ON DELETE RESTRICT,
    categoria_id INT NOT NULL REFERENCES categorias_delitos(id) ON DELETE RESTRICT,
    tipo_tramite VARCHAR(50) NOT NULL,
    descripcion_hechos TEXT NOT NULL,
    direccion_hechos TEXT NOT NULL,
    sector VARCHAR(100),
    fecha_hechos TIMESTAMP WITH TIME ZONE NOT NULL,
    evidencia_url TEXT,
    estado VARCHAR(40) NOT NULL DEFAULT 'Registrada' CHECK (
        estado IN (
            'Registrada',
            'En revisión',
            'Asignada',
            'En proceso',
            'Audiencia / Judicializada',
            'Atendida / Cerrada',
            'Archivada',
            'Esperando documentos',
            'Tramitando',
            'Procesado',
            'En juicio',
            'Aplazado',
            'Finalizado'
        )
    ),
    orden_captura_activa BOOLEAN DEFAULT FALSE,
    medida_proteccion BOOLEAN DEFAULT FALSE,
    tiene_sentencia_condenatoria BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 7. TABLA: asignaciones
CREATE TABLE asignaciones (
    id SERIAL PRIMARY KEY,
    denuncia_id INT NOT NULL REFERENCES denuncias_solicitudes(id) ON DELETE CASCADE,
    usuario_asignado_id INT NOT NULL REFERENCES usuarios(id) ON DELETE RESTRICT,
    asignado_por_id INT REFERENCES usuarios(id) ON DELETE SET NULL,
    fecha_asignacion TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    prioridad VARCHAR(20) DEFAULT 'MEDIA' CHECK (prioridad IN ('BAJA', 'MEDIA', 'ALTA', 'URGENTE')),
    notas TEXT,
    activo BOOLEAN DEFAULT TRUE
);

-- 8. TABLA: diligencias_judiciales
CREATE TABLE diligencias_judiciales (
    id SERIAL PRIMARY KEY,
    denuncia_id INT NOT NULL REFERENCES denuncias_solicitudes(id) ON DELETE CASCADE,
    juez_nombre VARCHAR(150),
    fiscal_nombre VARCHAR(150),
    fecha_audiencia TIMESTAMP WITH TIME ZONE,
    sala_audiencia VARCHAR(100),
    numero_causa_judicial VARCHAR(50),
    observaciones TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 9. TABLA: novedades
CREATE TABLE novedades (
    id SERIAL PRIMARY KEY,
    usuario_id INT NOT NULL REFERENCES usuarios(id) ON DELETE RESTRICT,
    sector VARCHAR(100) NOT NULL,
    tipo_novedad VARCHAR(100) NOT NULL,
    descripcion TEXT NOT NULL,
    fecha_reporte TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 10. TABLA: seguimiento
CREATE TABLE seguimiento (
    id SERIAL PRIMARY KEY,
    denuncia_id INT NOT NULL REFERENCES denuncias_solicitudes(id) ON DELETE CASCADE,
    estado_anterior VARCHAR(40),
    estado_nuevo VARCHAR(40) NOT NULL,
    usuario_id INT REFERENCES usuarios(id) ON DELETE SET NULL,
    observaciones TEXT,
    fecha_cambio TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 11. TABLA: auditoria
CREATE TABLE auditoria (
    id SERIAL PRIMARY KEY,
    usuario_id INT REFERENCES usuarios(id) ON DELETE SET NULL,
    accion VARCHAR(100) NOT NULL,
    tabla_afectada VARCHAR(100),
    registro_id INT,
    detalles JSONB,
    ip_address VARCHAR(50),
    user_agent TEXT,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_ciudadanos_cedula ON ciudadanos(cedula);
CREATE INDEX idx_denuncias_codigo ON denuncias_solicitudes(codigo_unico);
CREATE INDEX idx_denuncias_estado ON denuncias_solicitudes(estado);
CREATE INDEX idx_denuncias_ciudadano ON denuncias_solicitudes(ciudadano_id);
CREATE INDEX idx_denuncias_categoria ON denuncias_solicitudes(categoria_id);
CREATE INDEX idx_asignaciones_denuncia ON asignaciones(denuncia_id);
CREATE INDEX idx_asignaciones_usuario ON asignaciones(usuario_asignado_id);
CREATE INDEX idx_seguimiento_denuncia ON seguimiento(denuncia_id);
CREATE INDEX idx_auditoria_usuario ON auditoria(usuario_id);
CREATE INDEX idx_auditoria_timestamp ON auditoria(timestamp DESC);
CREATE INDEX idx_novedades_fecha ON novedades(fecha_reporte DESC);
