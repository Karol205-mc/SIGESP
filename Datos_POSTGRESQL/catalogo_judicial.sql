-- Migración: Creación de tablas de catálogo judicial (Jueces, Fiscales, Salas de Audiencia)
-- Base de Datos SIGESP - Policía Nacional del Ecuador (Aiven Cloud)

CREATE TABLE IF NOT EXISTS jueces (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(150) NOT NULL,
    unidad_judicial VARCHAR(200) NOT NULL,
    canton VARCHAR(100) DEFAULT 'Esmeraldas',
    activo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS fiscales (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(150) NOT NULL,
    fiscalia_unidad VARCHAR(200) NOT NULL,
    canton VARCHAR(100) DEFAULT 'Esmeraldas',
    activo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS salas_audiencia (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(150) NOT NULL,
    edificio VARCHAR(200) NOT NULL,
    piso VARCHAR(50) DEFAULT 'Piso 1',
    canton VARCHAR(100) DEFAULT 'Esmeraldas',
    activa BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Limpiar e insertar los 5 Jueces Oficiales de Esmeraldas
TRUNCATE TABLE jueces RESTART IDENTITY CASCADE;
INSERT INTO jueces (nombre, unidad_judicial, canton, activo) VALUES
('Dra. Carmen Mendoza Villamar', 'Tribunal de Garantías Penales de Esmeraldas', 'Esmeraldas', TRUE),
('Dr. Roberto Carlos Caicedo Quiñónez', 'Unidad Judicial Penal con Sede en el Cantón Esmeraldas', 'Esmeraldas', TRUE),
('Dra. María Elena Montalvo Zambrano', 'Unidad Especializada contra la Violencia a la Mujer y Familia', 'Esmeraldas', TRUE),
('Dr. Walter Holguín Mina', 'Tribunal de Garantías Penales de Esmeraldas', 'Esmeraldas', TRUE),
('Dra. Sonia Patricia Barba Andrade', 'Sala de lo Penal de la Corte Provincial de Justicia de Esmeraldas', 'Esmeraldas', TRUE);

-- Limpiar e insertar los 5 Fiscales Oficiales de la FGE Esmeraldas
TRUNCATE TABLE fiscales RESTART IDENTITY CASCADE;
INSERT INTO fiscales (nombre, fiscalia_unidad, canton, activo) VALUES
('Dr. Juan Carlos Falconí Realpe', 'Fiscalía Especializada en Soluciones Rápidas N° 2 (FEDOT)', 'Esmeraldas', TRUE),
('Dra. Ana Lucía Preciado Tenorio', 'Unidad Especializada en Delitos contra la Vida y Muerte Violenta (DINASED)', 'Esmeraldas', TRUE),
('Dr. Diego Fabricio Narváez Cárdenas', 'Fiscalía de Delitos contra la Propiedad e Investigaciones Especiales', 'Esmeraldas', TRUE),
('Dra. Tatiana Estupiñán Bone', 'Fiscalía de Menores Infractores y Delitos Sexuales', 'Esmeraldas', TRUE),
('Dr. Marlon Javier Bastidas Reyes', 'Fiscalía Especializada en Flagrancia de Esmeraldas', 'Esmeraldas', TRUE);

-- Limpiar e insertar las 5 Salas de Audiencias Penales de Esmeraldas
TRUNCATE TABLE salas_audiencia RESTART IDENTITY CASCADE;
INSERT INTO salas_audiencia (nombre, edificio, piso, canton, activa) VALUES
('Sala 1 - Audiencias de Flagrancia y Turno Penal', 'Complejo Judicial de Esmeraldas', 'Planta Baja', 'Esmeraldas', TRUE),
('Sala 2 - Tribunal de Garantías Penales', 'Edificio Judicial Central', 'Piso 2', 'Esmeraldas', TRUE),
('Sala 3 - Unidad Judicial Penal Ordinaria', 'Complejo Judicial de Esmeraldas', 'Piso 1', 'Esmeraldas', TRUE),
('Sala 4 - Audiencias Telemáticas y Diligencias Periciales', 'Edificio Corte Provincial de Esmeraldas', 'Piso 3', 'Esmeraldas', TRUE),
('Sala 5 - Cámara de Gesell y Menores Infractores', 'Unidad Especializada DINAPEN', 'Piso 1', 'Esmeraldas', TRUE);

-- Restricción UNIQUE en diligencias_judiciales.numero_causa_judicial si no existe
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'uq_diligencias_numero_causa'
    ) THEN
        ALTER TABLE diligencias_judiciales ADD CONSTRAINT uq_diligencias_numero_causa UNIQUE (numero_causa_judicial);
    END IF;
END $$;
