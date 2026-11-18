-- =============================================================================
-- ACTUALIZACIÓN PARA REGISTRO CIUDADANO CON DATOS BIOMÉTRICOS Y CÉDULA
-- =============================================================================

-- Ampliar tabla ciudadanos con datos completos de la cédula ecuatoriana
ALTER TABLE ciudadanos ADD COLUMN IF NOT EXISTS codigo_dactilar VARCHAR(20);
ALTER TABLE ciudadanos ADD COLUMN IF NOT EXISTS fecha_expedicion DATE;
ALTER TABLE ciudadanos ADD COLUMN IF NOT EXISTS foto_anverso TEXT;
ALTER TABLE ciudadanos ADD COLUMN IF NOT EXISTS foto_reverso TEXT;

-- Vincular usuario con cédula ciudadana
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS cedula VARCHAR(10);
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS ciudadano_id INT REFERENCES ciudadanos(id) ON DELETE SET NULL;

-- Vincular usuario Angelo Cabezas a su cédula y registro ciudadano
UPDATE usuarios 
SET cedula = '0802000002', 
    ciudadano_id = (SELECT id FROM ciudadanos WHERE cedula = '0802000002')
WHERE username = 'angelo.cabezas';

-- Actualizar datos de cédula de Angelo Cabezas
UPDATE ciudadanos
SET codigo_dactilar = 'V3838V4921',
    fecha_expedicion = '2023-04-15',
    fecha_nacimiento = '1998-11-20'
WHERE cedula = '0802000002';

-- Tabla para Botón de Pánico y Auxilio Inmediato
CREATE TABLE IF NOT EXISTS alertas_panico (
    id SERIAL PRIMARY KEY,
    codigo_alerta VARCHAR(30) UNIQUE NOT NULL,
    ciudadano_id INT REFERENCES ciudadanos(id) ON DELETE SET NULL,
    usuario_id INT REFERENCES usuarios(id) ON DELETE SET NULL,
    latitud NUMERIC(10, 6) NOT NULL,
    longitud NUMERIC(10, 6) NOT NULL,
    direccion_referencial TEXT,
    tipo_emergencia VARCHAR(50) DEFAULT 'BOTON_PANICO_SOS',
    estado VARCHAR(30) DEFAULT 'DESPACHADO', -- 'DESPACHADO', 'ATENDIENDO', 'FINALIZADO'
    patrulla_asignada VARCHAR(50) DEFAULT 'Móvil PN-420 (Flagrancia)',
    fecha_alerta TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
