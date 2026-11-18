-- =============================================================================
-- ACTUALIZACIÓN DE ESTADOS DETALLADOS Y RESPETO A PRESUNCIÓN DE INOCENCIA
-- =============================================================================

CREATE TABLE IF NOT EXISTS estados_tramite (
    id SERIAL PRIMARY KEY,
    codigo VARCHAR(50) UNIQUE NOT NULL,
    nombre VARCHAR(100) NOT NULL,
    descripcion TEXT,
    color VARCHAR(30) DEFAULT 'blue',
    orden INT DEFAULT 1
);

INSERT INTO estados_tramite (codigo, nombre, descripcion, color, orden) VALUES
('ESPERANDO_DOCUMENTOS', 'Esperando documentos', 'Se requieren recaudos, versiones o peritajes documentales complementarios', 'amber', 1),
('TRAMITANDO', 'Tramitando', 'Investigacion preliminar y actuaciones de campo en curso', 'blue', 2),
('PROCESADO', 'Procesado', 'Expediente analizado por la fiscalia e informe tecnico policial emitido', 'indigo', 3),
('EN_JUICIO', 'En juicio', 'Causa elevada a audiencia de juicio ante juez competente', 'purple', 4),
('APLAZADO', 'Aplazado', 'Diligencia o audiencia suspendida temporalmente por disposicion judicial', 'orange', 5),
('FINALIZADO', 'Finalizado', 'Procedimiento concluido con sentencia judicial o archivo definitivo', 'emerald', 6)
ON CONFLICT (codigo) DO UPDATE SET 
    nombre = EXCLUDED.nombre,
    descripcion = EXCLUDED.descripcion,
    color = EXCLUDED.color,
    orden = EXCLUDED.orden;

-- Modificar check constraint de denuncias_solicitudes
ALTER TABLE denuncias_solicitudes DROP CONSTRAINT IF EXISTS denuncias_solicitudes_estado_check;
ALTER TABLE denuncias_solicitudes ADD CONSTRAINT denuncias_solicitudes_estado_check CHECK (
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
);

-- Agregar indicador de sentencia condenatoria para respeto a derechos constitucionales
ALTER TABLE denuncias_solicitudes ADD COLUMN IF NOT EXISTS tiene_sentencia_condenatoria BOOLEAN DEFAULT FALSE;

-- En la causa POL-2026-0004 colocar sentencia condenatoria para pruebas de antecedentes penales
UPDATE denuncias_solicitudes 
SET tiene_sentencia_condenatoria = TRUE, estado = 'En juicio' 
WHERE codigo_unico = 'POL-2026-0004';
