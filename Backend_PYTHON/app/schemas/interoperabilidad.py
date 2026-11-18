from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

class DelitoResumen(BaseModel):
    codigo_unico: str
    delito: str
    gravedad: str
    fecha_hechos: datetime
    estado: str
    orden_captura: bool
    medida_proteccion: bool
    sentencia_condenatoria: bool

class AntecedentesOut(BaseModel):
    cedula: str
    nombres_completos: str
    posee_antecedentes: bool
    orden_captura_activa: bool
    medidas_cautelares_activas: bool
    alerta_migratoria: bool
    total_denuncias_asociadas: int
    total_condenas_o_juicios: int
    observaciones: str
    detalle_causas: List[DelitoResumen]
    entidad_emisora: str = "Policía Nacional del Ecuador - SIGESP"
    fecha_consulta: datetime

class MenorVerificacionOut(BaseModel):
    cedula_menor: str
    nombres_completos: str
    es_menor_confirmado: bool
    alerta_desaparicion_emilia: bool
    medida_proteccion_dinapen: bool
    impedimento_salida_pais: bool
    total_reportes_dinapen: int
    observaciones: Optional[str] = None
    fecha_consulta: datetime
    entidad_emisora: str = "Policía Nacional del Ecuador - DINAPEN"

class ExpedienteInteropOut(BaseModel):
    codigo_unico: str
    estado: str
    tipo_tramite: str
    delito: str
    gravedad: str
    fecha_hechos: datetime
    sector: Optional[str] = None
    tiene_orden_captura: bool
    tiene_medida_proteccion: bool
    unidad_policial_a_cargo: str
    fecha_consulta: datetime
