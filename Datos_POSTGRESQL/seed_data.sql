-- =============================================================================
-- SIGESP - SISTEMA INTEGRAL DE GESTIÓN DE SERVICIOS POLICIALES DEL ECUADOR
-- BASE DE DATOS: PostgreSQL 18 (policia_nacional)
-- NORMA TÉCNICA: IEEE 830-1998
-- SCRIPT: seed_data.sql (Datos iniciales oficiales y de prueba)
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. CARGA DE ROLES (RBAC)
-- -----------------------------------------------------------------------------
INSERT INTO roles (id, codigo, nombre, descripcion) VALUES
(1, 'ADMIN', 'Administrador General', 'Control total de usuarios, configuraciones globales y bitácora de auditoría inmutable.'),
(2, 'POLICIA_FLAGRANCIA', 'Policía de Flagrancia (PF)', 'Atención urgente inmediata, registro de actas de aprehensión y primeras diligencias.'),
(3, 'POLICIA_JUDICIAL', 'Policía Judicial (PJ)', 'Investigación técnica, peritajes forenses/balísticos y coordinación de audiencias judiciales.'),
(4, 'SUPERVISOR', 'Supervisor / Jefe de Operaciones', 'Despacho y asignación de casos, aprobación de cierres y control de reportes estadísticos.'),
(5, 'CIUDADANO', 'Ciudadano', 'Registro de denuncias o solicitudes públicas y consulta de trámites mediante código único.')
ON CONFLICT (id) DO UPDATE SET 
    codigo = EXCLUDED.codigo,
    nombre = EXCLUDED.nombre,
    descripcion = EXCLUDED.descripcion;

SELECT setval('roles_id_seq', (SELECT MAX(id) FROM roles));

-- -----------------------------------------------------------------------------
-- 2. CARGA DE USUARIOS OFICIALES DEL EQUIPO Y USUARIOS TEST
-- Passwords hasheadas con bcrypt ($2b$12$)
--   - jordan123  -> $2b$12$d.tqrdULdaRDdn3Zhln4HuMvfkmfq7i6/GPdAUszAj4xNqa.2Wyn6
--   - juliana123 -> $2b$12$VxwjBgTb88H9HGh60O4hMek.G4NFK2QsHLnHUayJ03gVB6m/z5hoS
--   - jany123    -> $2b$12$USJd9oojaa/aNbdpQk9qf.3HSPF3LsJeFruWOLWqkIyPG2aehtlrm
--   - karol123   -> $2b$12$Rf3MxaOCnQKqBBu7x3.K3OFZZSsBkft888b5JZ8ReXq4e65zrOlUG
--   - angelo123  -> $2b$12$AYC8jJQ9yuJDT2UQPhnVMetgmaCgCKi3EdULnGwGJrl8zN8XZ6bYa
--   - 12345      -> $2b$12$cOiwtS/PNrUUCk41TwyVr.SKuyygcRKMB23GeMi19Z6g2nYfwJwuy
-- -----------------------------------------------------------------------------
INSERT INTO usuarios (username, password_hash, nombres, apellidos, rango, placa, email, telefono, rol_id, activo) VALUES
-- 1. WILA JORDAN PORTILLA (ADMIN)
('jordan.wila', '$2b$12$d.tqrdULdaRDdn3Zhln4HuMvfkmfq7i6/GPdAUszAj4xNqa.2Wyn6', 'Jordan', 'Wila Portilla', 'Coronel de Policía', 'PN-00101', 'jordan.wila@policia.gob.ec', '0990000001', 1, TRUE),

-- 2. ENRIQUEZ JULIANA (POLICIA_FLAGRANCIA)
('juliana.enriquez', '$2b$12$VxwjBgTb88H9HGh60O4hMek.G4NFK2QsHLnHUayJ03gVB6m/z5hoS', 'Juliana', 'Enríquez', 'Subteniente de Flagrancia', 'PF-20261', 'juliana.enriquez@policia.gob.ec', '0990000002', 2, TRUE),

-- 3. PEREA JANY (POLICIA_JUDICIAL)
('jany.perea', '$2b$12$USJd9oojaa/aNbdpQk9qf.3HSPF3LsJeFruWOLWqkIyPG2aehtlrm', 'Jany', 'Perea', 'Capitán Investigador PJ', 'PJ-30302', 'jany.perea@policia.gob.ec', '0990000003', 3, TRUE),

-- 4. MENA KAROL (SUPERVISOR)
('karol.mena', '$2b$12$Rf3MxaOCnQKqBBu7x3.K3OFZZSsBkft888b5JZ8ReXq4e65zrOlUG', 'Karol', 'Mena', 'Mayor / Supervisor Operativo', 'SUP-40403', 'karol.mena@policia.gob.ec', '0990000004', 4, TRUE),

-- 5. CABEZAS ANGELO (CIUDADANO REGISTRADO)
('angelo.cabezas', '$2b$12$AYC8jJQ9yuJDT2UQPhnVMetgmaCgCKi3EdULnGwGJrl8zN8XZ6bYa', 'Angelo', 'Cabezas', 'Ciudadano Registrado', 'N/A', 'angelo.cabezas@example.com', '0987654321', 5, TRUE),

-- Usuarios de compatibilidad y evaluación unificada del ecosistema
('admin', '$2b$12$cOiwtS/PNrUUCk41TwyVr.SKuyygcRKMB23GeMi19Z6g2nYfwJwuy', 'Administrador', 'General SIGESP', 'Administrador de Sistemas', 'PN-SYS01', 'admin@policia.gob.ec', '0999999999', 1, TRUE),
('agente.pf', '$2b$12$cOiwtS/PNrUUCk41TwyVr.SKuyygcRKMB23GeMi19Z6g2nYfwJwuy', 'Agente', 'Flagrancia Nacional', 'Teniente PF', 'PF-10001', 'flagrancia@policia.gob.ec', '0999999998', 2, TRUE),
('agente.pj', '$2b$12$cOiwtS/PNrUUCk41TwyVr.SKuyygcRKMB23GeMi19Z6g2nYfwJwuy', 'Agente', 'Judicial Operativo', 'Capitán PJ', 'PJ-10002', 'judicial@policia.gob.ec', '0999999997', 3, TRUE)
ON CONFLICT (username) DO NOTHING;

-- -----------------------------------------------------------------------------
-- 3. CARGA DE CIUDADANOS (Ecosistema Interoperable con Registro Civil y Migración)
-- -----------------------------------------------------------------------------
INSERT INTO ciudadanos (cedula, nombres, apellidos, telefono, email, direccion, fecha_nacimiento, es_menor) VALUES
-- Ciudadano Unificado de prueba estándar intergrupal
('0801000001', 'Juan Carlos', 'Pérez Mendoza', '0991234567', 'juan.perez@example.com', 'Av. Jaime Roldós y Olmedo, Esmeraldas', '1988-05-14', FALSE),

-- Ciudadano del equipo
('0802000002', 'Angelo', 'Cabezas', '0987654321', 'angelo.cabezas@example.com', 'Calle Bolívar y Sucre, Esmeraldas', '1998-11-20', FALSE),

-- Menor de edad para DINAPEN / Verificación de Migración
('0803000003', 'Carlos Andrés', 'Pérez Salazar', '0991234567', 'carlos.menor@example.com', 'Sector Las Palmas, Esmeraldas', '2012-08-10', TRUE),

-- Ciudadano con orden de requerimiento judicial
('0804000004', 'Roberto Xavier', 'Zambrano Quiñónez', '0978889999', 'r.zambrano@example.com', 'Barrio Caliente, Esmeraldas', '1992-03-22', FALSE)
ON CONFLICT (cedula) DO NOTHING;

-- -----------------------------------------------------------------------------
-- 4. CARGA DE CATEGORÍAS DE DELITOS
-- -----------------------------------------------------------------------------
INSERT INTO categorias_delitos (codigo, nombre, gravedad, descripcion, es_dinapen) VALUES
('DEL-ROBO', 'Robo y Asalto a Mano Armada', 'GRAVE', 'Sustracción de bienes con intimidación o uso de fuerza física o armas de fuego.', FALSE),
('DEL-HURTO', 'Hurto Simple', 'MEDIA', 'Apoderamiento ilegítimo de bienes muebles sin violencia ni fuerza en las cosas.', FALSE),
('DEL-VIF', 'Violencia Intrafamiliar o de Género', 'GRAVE', 'Agresión física, psicológica o patrimonial en el núcleo familiar.', FALSE),
('DEL-EXT', 'Extorsión y Vacunas Extorsivas', 'MUY GRAVE', 'Exigencia de pagos indebidos bajo amenazas de muerte o daños a propiedad privada.', FALSE),
('DEL-HOM', 'Homicidio / Asesinato', 'MUY GRAVE', 'Atentados contra la vida y la integridad física de las personas.', FALSE),
('DEL-DIN-01', 'Vulneración de Derechos de Menores (DINAPEN)', 'GRAVE', 'Riesgo, abandono, negligencia o maltrato de niños, niñas y adolescentes.', TRUE),
('DEL-DIN-02', 'Desaparición o Alerta Emilia (DINAPEN)', 'MUY GRAVE', 'Desaparición involuntaria o presunto rapto de menores de edad.', TRUE),
('DEL-TRA', 'Infracción de Tránsito con Daños Mayores', 'LEVE', 'Siniestros viales con afectación a bienes públicos o privados sin víctimas mortales.', FALSE)
ON CONFLICT (codigo) DO NOTHING;

-- -----------------------------------------------------------------------------
-- 5. CARGA DE DENUNCIAS / SOLICITUDES DE PRUEBA INICIAL
-- -----------------------------------------------------------------------------
INSERT INTO denuncias_solicitudes (
    codigo_unico, ciudadano_id, categoria_id, tipo_tramite,
    descripcion_hechos, direccion_hechos, sector, fecha_hechos,
    estado, orden_captura_activa, medida_proteccion
) VALUES
-- Caso 1: En Proceso (Robo)
(
    'POL-2026-0001',
    (SELECT id FROM ciudadanos WHERE cedula = '0801000001'),
    (SELECT id FROM categorias_delitos WHERE codigo = 'DEL-ROBO'),
    'FLAGRANCIA',
    'Sustracción de teléfono celular y documentos personales mediante amenaza con arma blanca en parada de autobús.',
    'Av. Olmedo y Salinas',
    'Centro Histórico',
    NOW() - INTERVAL '2 days',
    'En proceso',
    FALSE,
    FALSE
),
-- Caso 2: Registrada (Hurto)
(
    'POL-2026-0002',
    (SELECT id FROM ciudadanos WHERE cedula = '0802000002'),
    (SELECT id FROM categorias_delitos WHERE codigo = 'DEL-HURTO'),
    'INVESTIGACION_PREVIA',
    'Pérdida de billetera con cédula y tarjetas de crédito al descender de taxi cooperativo.',
    'Malecón de Las Palmas',
    'Las Palmas',
    NOW() - INTERVAL '1 day',
    'Registrada',
    FALSE,
    FALSE
),
-- Caso 3: DINAPEN con medida de protección activa (Clave para Interoperabilidad con Migración)
(
    'POL-2026-0003',
    (SELECT id FROM ciudadanos WHERE cedula = '0803000003'),
    (SELECT id FROM categorias_delitos WHERE codigo = 'DEL-DIN-01'),
    'DINAPEN_MENOR',
    'Solicitud de custodia cautelar y alerta fronteriza por conflicto de patria potestad.',
    'Av. Kennedy y Tercera',
    'La Propicia',
    NOW() - INTERVAL '5 days',
    'En proceso',
    FALSE,
    TRUE
),
-- Caso 4: Judicializado con orden de captura activa (Clave para Interoperabilidad con Migración)
(
    'POL-2026-0004',
    (SELECT id FROM ciudadanos WHERE cedula = '0804000004'),
    (SELECT id FROM categorias_delitos WHERE codigo = 'DEL-EXT'),
    'INVESTIGACION_PREVIA',
    'Entrega de panfletos extorsivos a comerciantes del sector comercial de Esmeraldas.',
    'Calle Colón y 10 de Agosto',
    'Zona Comercial',
    NOW() - INTERVAL '10 days',
    'Audiencia / Judicializada',
    TRUE,
    FALSE
)
ON CONFLICT (codigo_unico) DO NOTHING;

-- -----------------------------------------------------------------------------
-- 6. ASIGNACIONES DE CASOS
-- -----------------------------------------------------------------------------
INSERT INTO asignaciones (denuncia_id, usuario_asignado_id, asignado_por_id, prioridad, notas) VALUES
(
    (SELECT id FROM denuncias_solicitudes WHERE codigo_unico = 'POL-2026-0001'),
    (SELECT id FROM usuarios WHERE username = 'juliana.enriquez'),
    (SELECT id FROM usuarios WHERE username = 'karol.mena'),
    'ALTA',
    'Proceder con la recolección de grabaciones del ECU-911 del sector Centro.'
),
(
    (SELECT id FROM denuncias_solicitudes WHERE codigo_unico = 'POL-2026-0004'),
    (SELECT id FROM usuarios WHERE username = 'jany.perea'),
    (SELECT id FROM usuarios WHERE username = 'jordan.wila'),
    'URGENTE',
    'Coordinar con Unidad Antisecuestro y Extorsión (UNASE) y Juzgado de Garantías Penales.'
)
ON CONFLICT DO NOTHING;

-- -----------------------------------------------------------------------------
-- 7. DILIGENCIAS JUDICIALES
-- -----------------------------------------------------------------------------
INSERT INTO diligencias_judiciales (
    denuncia_id, juez_nombre, fiscal_nombre, fecha_audiencia, sala_audiencia, numero_causa_judicial, observaciones
) VALUES
(
    (SELECT id FROM denuncias_solicitudes WHERE codigo_unico = 'POL-2026-0004'),
    'Dra. Carmen Mendoza Villamar',
    'Dr. Juan Carlos Falconí Realpe',
    CURRENT_DATE + INTERVAL '5 days' + TIME '10:30:00',
    'Sala 3 - Unidad Judicial Penal de Esmeraldas',
    '08281-2026-00142G',
    'Audiencia preparatoria de juicio y formulación de cargos.'
)
ON CONFLICT DO NOTHING;

-- -----------------------------------------------------------------------------
-- 8. SEGUIMIENTO DE ESTADOS
-- -----------------------------------------------------------------------------
INSERT INTO seguimiento (denuncia_id, estado_anterior, estado_nuevo, usuario_id, observaciones) VALUES
(
    (SELECT id FROM denuncias_solicitudes WHERE codigo_unico = 'POL-2026-0001'),
    'Registrada',
    'En revisión',
    (SELECT id FROM usuarios WHERE username = 'karol.mena'),
    'Revisión inicial del supervisor de turno.'
),
(
    (SELECT id FROM denuncias_solicitudes WHERE codigo_unico = 'POL-2026-0001'),
    'En revisión',
    'Asignada',
    (SELECT id FROM usuarios WHERE username = 'karol.mena'),
    'Asignado a Subteniente Juliana Enríquez para flagrancia.'
),
(
    (SELECT id FROM denuncias_solicitudes WHERE codigo_unico = 'POL-2026-0001'),
    'Asignada',
    'En proceso',
    (SELECT id FROM usuarios WHERE username = 'juliana.enriquez'),
    'Toma de versión libre y voluntaria a la víctima.'
),
(
    (SELECT id FROM denuncias_solicitudes WHERE codigo_unico = 'POL-2026-0002'),
    NULL,
    'Registrada',
    (SELECT id FROM usuarios WHERE username = 'angelo.cabezas'),
    'Ingreso formal a través del portal ciudadano.'
),
(
    (SELECT id FROM denuncias_solicitudes WHERE codigo_unico = 'POL-2026-0004'),
    'En proceso',
    'Audiencia / Judicializada',
    (SELECT id FROM usuarios WHERE username = 'jany.perea'),
    'Causa sorteada a la Unidad Judicial Penal de Esmeraldas.'
)
ON CONFLICT DO NOTHING;

-- -----------------------------------------------------------------------------
-- 9. NOVEDADES POLICIALES (Libro de Guardia)
-- -----------------------------------------------------------------------------
INSERT INTO novedades (usuario_id, sector, tipo_novedad, descripcion) VALUES
(
    (SELECT id FROM usuarios WHERE username = 'juliana.enriquez'),
    'Circuito Centro - Las Palmas',
    'PATRULLAJE',
    'Patrullaje preventivo móvil a bordo de la unidad móvil PN-420 sin novedades de alteración pública.'
),
(
    (SELECT id FROM usuarios WHERE username = 'jany.perea'),
    'Zona Comercial Esmeraldas',
    'OPERATIVO',
    'Inspección ocular técnica y levantamiento de evidencias balísticas en local comercial.'
),
(
    (SELECT id FROM usuarios WHERE username = 'karol.mena'),
    'Distrito Esmeraldas',
    'RELEVO',
    'Pase de lista y novedades del personal de guardia entrante sin faltantes.'
)
ON CONFLICT DO NOTHING;

-- -----------------------------------------------------------------------------
-- 10. AUDITORÍA INICIAL
-- -----------------------------------------------------------------------------
INSERT INTO auditoria (usuario_id, accion, tabla_afectada, registro_id, detalles, ip_address) VALUES
(
    (SELECT id FROM usuarios WHERE username = 'jordan.wila'),
    'SISTEMA_INIT',
    'todas',
    0,
    '{"evento": "Inicialización del sistema SIGESP con base de datos en la nube Aiven"}',
    '127.0.0.1'
);
