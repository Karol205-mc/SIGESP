import React, { useState, useEffect, useMemo } from 'react';
import api from '../services/api';
import { 
  Scale, 
  FileText, 
  CheckCircle2, 
  AlertTriangle, 
  ShieldCheck, 
  UserCheck, 
  Calendar,
  Search,
  X,
  User,
  ChevronRight
} from 'lucide-react';

export default function BandejaJudicial({ user, onNavigateToAudiencias }) {
  const [casos, setCasos] = useState([]);
  const [cargando, setCargando] = useState(false);
  const [casoSeleccionado, setCasoSeleccionado] = useState(null);
  const [informePericial, setInformePericial] = useState('');
  const [nuevoEstado, setNuevoEstado] = useState('En proceso');

  // Filtros y búsqueda
  const [busqueda, setBusqueda] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('TODOS');

  useEffect(() => {
    cargarCasos();
  }, []);

  const cargarCasos = async () => {
    setCargando(true);
    try {
      const res = await api.get('/denuncias/');
      setCasos(res.data);
    } catch (err) {
      console.error("Error al cargar casos judiciales", err);
    } finally {
      setCargando(false);
    }
  };

  const handleActualizarInforme = async (e) => {
    e.preventDefault();
    if (!casoSeleccionado) return;

    try {
      await api.put(`/denuncias/${casoSeleccionado.id}/estado`, {
        nuevo_estado: nuevoEstado,
        observaciones: `[INFORME PJ - Capitán ${user?.nombre_completo || 'Jany Perea'}]: ${informePericial}`
      });
      setInformePericial('');
      setCasoSeleccionado(null);
      cargarCasos();
      alert("Informe pericial y estado actualizado correctamente.");
    } catch (err) {
      alert("Error al guardar el informe pericial.");
    }
  };

  const toggleMedida = async (campo, valorActual) => {
    if (!casoSeleccionado) return;
    try {
      const nuevoValor = !valorActual;
      const paramName = campo === 'orden_captura_activa' ? 'orden_captura' : campo;
      await api.put(`/denuncias/${casoSeleccionado.id}/medidas?${paramName}=${nuevoValor}`);
      cargarCasos();
      setCasoSeleccionado(prev => ({
        ...prev,
        [campo]: nuevoValor,
        orden_captura_denunciado: campo === 'orden_captura_activa' ? nuevoValor : prev.orden_captura_denunciado,
        orden_captura_activa: campo === 'orden_captura_activa' ? nuevoValor : prev.orden_captura_activa,
        medida_proteccion: campo === 'medida_proteccion' ? nuevoValor : prev.medida_proteccion
      }));
    } catch (err) {
      alert("Error al modificar medidas procesales.");
    }
  };

  const esCasoCerrado = (estado) => {
    if (!estado) return false;
    const est = estado.toLowerCase();
    return est.includes('cerrad') || est.includes('finaliz') || est.includes('archiv');
  };

  // Filtrado y ordenamiento de expedientes judiciales (cerrados al final)
  const casosProcesados = useMemo(() => {
    return casos
      .filter(c => {
        if (filtroEstado === 'PENDIENTES') {
          if (esCasoCerrado(c.estado)) return false;
        } else if (filtroEstado === 'EN_PROCESO') {
          if (c.estado !== 'En proceso') return false;
        } else if (filtroEstado === 'EN_JUICIO') {
          if (c.estado !== 'En juicio' && !c.estado?.includes('Audiencia')) return false;
        } else if (filtroEstado === 'CERRADAS') {
          if (!esCasoCerrado(c.estado)) return false;
        }

        if (busqueda.trim()) {
          const term = busqueda.toLowerCase().trim();
          const matchCodigo = c.codigo_unico?.toLowerCase().includes(term);
          const matchCedula = c.ciudadano?.cedula?.includes(term);
          const matchNombre = `${c.ciudadano?.nombres || ''} ${c.ciudadano?.apellidos || ''}`.toLowerCase().includes(term);
          const matchDenunciado = `${c.denunciado_nombres || ''} ${c.denunciado_alias || ''} ${c.denunciado_cedula || ''}`.toLowerCase().includes(term);
          const matchCategoria = c.categoria?.nombre?.toLowerCase().includes(term);
          return matchCodigo || matchCedula || matchNombre || matchDenunciado || matchCategoria;
        }

        return true;
      })
      .sort((a, b) => {
        const cerradoA = esCasoCerrado(a.estado);
        const cerradoB = esCasoCerrado(b.estado);
        if (cerradoA && !cerradoB) return 1;
        if (!cerradoA && cerradoB) return -1;
        return b.id - a.id;
      });
  }, [casos, busqueda, filtroEstado]);

  const conteos = useMemo(() => {
    const total = casos.length;
    const pendientes = casos.filter(c => !esCasoCerrado(c.estado)).length;
    const enProceso = casos.filter(c => c.estado === 'En proceso').length;
    const enJuicio = casos.filter(c => c.estado === 'En juicio' || c.estado?.includes('Audiencia')).length;
    const cerradas = casos.filter(c => esCasoCerrado(c.estado)).length;
    return { total, pendientes, enProceso, enJuicio, cerradas };
  }, [casos]);

  return (
    <div className="space-y-6">
      <div className="pb-4 border-b border-slate-200 flex flex-col sm:flex-row justify-between sm:items-center gap-3">
        <div>
          <span className="text-[11px] font-bold text-police-700 uppercase tracking-wider flex items-center space-x-1">
            <Scale className="w-3.5 h-3.5" />
            <span>Investigación Técnica y Peritajes Forenses</span>
          </span>
          <h1 className="text-xl font-black text-slate-900">Bandeja de Policía Judicial (PJ)</h1>
          <p className="text-xs text-slate-500">Mando Operativo: Capitán Jany Perea</p>
        </div>

        <button
          onClick={onNavigateToAudiencias}
          className="px-4 py-2 bg-police-800 hover:bg-police-900 text-white font-bold text-xs rounded-xl shadow-sm flex items-center space-x-2 shrink-0 transition-colors"
        >
          <Calendar className="w-3.5 h-3.5 text-accent-gold" />
          <span>Agendar Audiencia / Diligencia</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Lista de Casos Complejos */}
        <div className="lg:col-span-2 space-y-3">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
            <h2 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Casos Asignados e Investigaciones ({casosProcesados.length})
            </h2>
            {conteos.cerradas > 0 && (
              <span className="text-[10px] text-slate-400 font-semibold">
                * Casos cerrados se ubican automáticamente al final
              </span>
            )}
          </div>

          {/* Barra de Búsqueda por Cédula o Código */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Buscar por código (ej: POL-2026-0001) o cédula del denunciante (ej: 0802070318)..."
              className="w-full pl-9 pr-9 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-police-700 focus:border-police-700 shadow-sm"
            />
            {busqueda && (
              <button 
                onClick={() => setBusqueda('')} 
                className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Botones de Filtro Rápido */}
          <div className="flex items-center space-x-2 overflow-x-auto pb-1 text-xs">
            <button
              onClick={() => setFiltroEstado('TODOS')}
              className={`px-3 py-1.5 rounded-lg font-bold border transition-colors shrink-0 flex items-center space-x-1.5 ${
                filtroEstado === 'TODOS'
                  ? 'bg-police-900 text-white border-police-900 shadow-sm'
                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
              }`}
            >
              <span>Todos</span>
              <span className="text-[10px] bg-slate-700/30 px-1.5 py-0.2 rounded-full">{conteos.total}</span>
            </button>

            <button
              onClick={() => setFiltroEstado('PENDIENTES')}
              className={`px-3 py-1.5 rounded-lg font-bold border transition-colors shrink-0 flex items-center space-x-1.5 ${
                filtroEstado === 'PENDIENTES'
                  ? 'bg-amber-600 text-white border-amber-600 shadow-sm'
                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
              }`}
            >
              <span>Pendientes</span>
              <span className="text-[10px] bg-amber-500/20 text-amber-800 px-1.5 py-0.2 rounded-full">{conteos.pendientes}</span>
            </button>

            <button
              onClick={() => setFiltroEstado('EN_PROCESO')}
              className={`px-3 py-1.5 rounded-lg font-bold border transition-colors shrink-0 flex items-center space-x-1.5 ${
                filtroEstado === 'EN_PROCESO'
                  ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
              }`}
            >
              <span>En Proceso</span>
              <span className="text-[10px] bg-blue-500/20 text-blue-800 px-1.5 py-0.2 rounded-full">{conteos.enProceso}</span>
            </button>

            <button
              onClick={() => setFiltroEstado('EN_JUICIO')}
              className={`px-3 py-1.5 rounded-lg font-bold border transition-colors shrink-0 flex items-center space-x-1.5 ${
                filtroEstado === 'EN_JUICIO'
                  ? 'bg-purple-600 text-white border-purple-600 shadow-sm'
                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
              }`}
            >
              <span>En Juicio / Audiencia</span>
              <span className="text-[10px] bg-purple-500/20 text-purple-800 px-1.5 py-0.2 rounded-full">{conteos.enJuicio}</span>
            </button>

            <button
              onClick={() => setFiltroEstado('CERRADAS')}
              className={`px-3 py-1.5 rounded-lg font-bold border transition-colors shrink-0 flex items-center space-x-1.5 ${
                filtroEstado === 'CERRADAS'
                  ? 'bg-slate-700 text-white border-slate-700 shadow-sm'
                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
              }`}
            >
              <span>Cerradas</span>
              <span className="text-[10px] bg-slate-500/20 text-slate-800 px-1.5 py-0.2 rounded-full">{conteos.cerradas}</span>
            </button>
          </div>

          <div className="space-y-2.5">
            {casosProcesados.length === 0 ? (
              <div className="bg-white rounded-xl p-8 border border-slate-200 text-center text-slate-500 text-xs">
                <FileText className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                <p className="font-semibold text-slate-700">No se encontraron expedientes con los criterios seleccionados.</p>
                <p className="mt-1 text-slate-400">Intente modificar los términos de búsqueda o el filtro.</p>
              </div>
            ) : (
              casosProcesados.map(c => {
                const cerrado = esCasoCerrado(c.estado);
                return (
                  <div
                    key={c.id}
                    onClick={() => setCasoSeleccionado(c)}
                    className={`p-4 rounded-xl border transition-all cursor-pointer ${
                      casoSeleccionado?.id === c.id
                        ? 'bg-blue-50/70 border-blue-400 ring-2 ring-blue-200'
                        : cerrado
                        ? 'bg-slate-50/80 hover:bg-slate-100/90 border-slate-200 opacity-80'
                        : 'bg-white hover:bg-slate-50 border-slate-200 shadow-sm'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center space-x-2">
                          <span className="font-mono font-bold text-xs text-police-900">{c.codigo_unico}</span>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                            cerrado ? 'bg-slate-200 text-slate-700 border-slate-300' :
                            c.estado === 'En proceso' ? 'bg-blue-100 text-blue-800 border-blue-200' :
                            c.estado === 'En juicio' ? 'bg-purple-100 text-purple-800 border-purple-200' :
                            'bg-slate-100 text-slate-800 border-slate-200'
                          }`}>
                            {c.estado}
                          </span>
                          {(c.orden_captura_denunciado || c.orden_captura_activa) && (
                            <span className="px-2 py-0.5 rounded bg-rose-600 text-white text-[9px] font-black">
                              ORDEN DE CAPTURA (Denunciado)
                            </span>
                          )}
                          {c.medida_proteccion && (
                            <span className="px-2 py-0.5 rounded bg-blue-600 text-white text-[9px] font-black">
                              PROTECCIÓN (Víctima)
                            </span>
                          )}
                          {cerrado && (
                            <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded bg-slate-300 text-slate-800">
                              Cerrado
                            </span>
                          )}
                        </div>

                        <h3 className="text-xs font-bold text-slate-900">{c.categoria?.nombre}</h3>

                        {/* Partes Procesales Diferenciadas */}
                        <div className="flex flex-col sm:flex-row sm:items-center gap-2 text-[11px] text-slate-600 mt-1">
                          {c.ciudadano && (
                            <div className="flex items-center space-x-1.5">
                              <span className="px-1.5 py-0.5 rounded bg-blue-50 text-blue-800 font-bold border border-blue-200 text-[10px]">
                                🛡️ Víctima:
                              </span>
                              <span className="font-semibold text-slate-800">{c.ciudadano.nombres} {c.ciudadano.apellidos}</span>
                              <span className="font-mono bg-slate-100 px-1 py-0.2 rounded border border-slate-200 text-slate-600 text-[10px]">
                                C.I. {c.ciudadano.cedula}
                              </span>
                            </div>
                          )}

                          {(c.denunciado_nombres || c.denunciado_alias || c.denunciado_cedula) && (
                            <div className="flex items-center space-x-1.5">
                              <span className="px-1.5 py-0.5 rounded bg-rose-50 text-rose-800 font-bold border border-rose-200 text-[10px]">
                                ⚠️ Denunciado:
                              </span>
                              <span className="font-semibold text-slate-800">
                                {c.denunciado_nombres || 'En averiguación'}
                              </span>
                              {c.denunciado_alias && (
                                <span className="text-rose-700 font-bold text-[10px]">[{c.denunciado_alias}]</span>
                              )}
                              {c.denunciado_cedula && (
                                <span className="font-mono bg-slate-100 px-1 py-0.2 rounded border border-slate-200 text-slate-600 text-[10px]">
                                  C.I. {c.denunciado_cedula}
                                </span>
                              )}
                            </div>
                          )}
                        </div>

                        <p className="text-xs text-slate-600 mt-1 line-clamp-2">{c.descripcion_hechos}</p>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-400 shrink-0 mt-1" />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Panel de Gestión del Caso */}
        <div>
          {casoSeleccionado ? (
            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-4 sticky top-20">
              <div className="border-b border-slate-200 pb-3">
                <span className="text-[10px] font-bold uppercase text-slate-400">Expediente PJ</span>
                <h3 className="text-base font-extrabold text-police-900">{casoSeleccionado.codigo_unico}</h3>
                <p className="text-xs text-slate-600">{casoSeleccionado.categoria?.nombre}</p>
              </div>

              {/* GESTIÓN DE SUJETOS PROCESALES (Garantía Legal) */}
              <div className="space-y-3 pt-1">
                {/* 1. VÍCTIMA / DENUNCIANTE */}
                <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-xl space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase text-blue-900 tracking-wider">
                      🛡️ Víctima / Denunciante
                    </span>
                    <span className="text-[10px] bg-blue-100 text-blue-800 font-mono font-bold px-1.5 py-0.5 rounded">
                      C.I. {casoSeleccionado.ciudadano?.cedula}
                    </span>
                  </div>
                  <p className="text-xs font-extrabold text-slate-900">
                    {casoSeleccionado.ciudadano?.nombres} {casoSeleccionado.ciudadano?.apellidos}
                  </p>
                  <p className="text-[11px] text-slate-500">
                    Telf: <strong>{casoSeleccionado.ciudadano?.telefono || 'S/N'}</strong> • Residencia: {casoSeleccionado.ciudadano?.direccion || 'Esmeraldas'}
                  </p>

                  <button
                    onClick={() => toggleMedida('medida_proteccion', casoSeleccionado.medida_proteccion)}
                    className={`w-full px-3 py-2 rounded-lg font-bold text-xs flex items-center justify-between border transition-all ${
                      casoSeleccionado.medida_proteccion
                        ? 'bg-blue-600 text-white border-blue-700 shadow-sm'
                        : 'bg-white text-blue-900 border-blue-300 hover:bg-blue-100'
                    }`}
                  >
                    <div className="flex items-center space-x-2">
                      <span className={`w-2.5 h-2.5 rounded-full ${casoSeleccionado.medida_proteccion ? 'bg-accent-gold animate-pulse' : 'bg-slate-300'}`}></span>
                      <span>Medida de Protección (Art. 558 COIP)</span>
                    </div>
                    <span className="text-[10px] uppercase font-black">
                      {casoSeleccionado.medida_proteccion ? 'ACTIVA' : 'INACTIVA'}
                    </span>
                  </button>
                  <p className="text-[10px] text-blue-800/80 italic">
                    * Boleta de auxilio a la víctima. No genera antecedentes penales.
                  </p>
                </div>

                {/* 2. DENUNCIADO / IMPUTADO / SOSPECHOSO */}
                <div className="p-3 bg-rose-50/70 border border-rose-200 rounded-xl space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase text-rose-900 tracking-wider">
                      ⚠️ Denunciado / Imputado
                    </span>
                    {casoSeleccionado.denunciado_cedula ? (
                      <span className="text-[10px] bg-rose-100 text-rose-800 font-mono font-bold px-1.5 py-0.5 rounded">
                        C.I. {casoSeleccionado.denunciado_cedula}
                      </span>
                    ) : (
                      <span className="text-[10px] bg-amber-100 text-amber-800 font-bold px-1.5 py-0.5 rounded">
                        Por Identificar
                      </span>
                    )}
                  </div>
                  <p className="text-xs font-extrabold text-slate-900">
                    {casoSeleccionado.denunciado_nombres || 'Sospechoso en averiguación'}
                    {casoSeleccionado.denunciado_alias && (
                      <span className="text-rose-700 font-bold ml-1">[{casoSeleccionado.denunciado_alias}]</span>
                    )}
                  </p>

                  <button
                    onClick={() => toggleMedida('orden_captura_activa', casoSeleccionado.orden_captura_denunciado || casoSeleccionado.orden_captura_activa)}
                    className={`w-full px-3 py-2 rounded-lg font-bold text-xs flex items-center justify-between border transition-all ${
                      (casoSeleccionado.orden_captura_denunciado || casoSeleccionado.orden_captura_activa)
                        ? 'bg-rose-600 text-white border-rose-700 shadow-sm'
                        : 'bg-white text-rose-900 border-rose-300 hover:bg-rose-100'
                    }`}
                  >
                    <div className="flex items-center space-x-2">
                      <span className={`w-2.5 h-2.5 rounded-full ${(casoSeleccionado.orden_captura_denunciado || casoSeleccionado.orden_captura_activa) ? 'bg-accent-gold animate-pulse' : 'bg-slate-300'}`}></span>
                      <span>Impedimento de Salida / Captura (SGIM)</span>
                    </div>
                    <span className="text-[10px] uppercase font-black">
                      {(casoSeleccionado.orden_captura_denunciado || casoSeleccionado.orden_captura_activa) ? 'VIGENTE' : 'SIN ORDEN'}
                    </span>
                  </button>
                  <p className="text-[10px] text-rose-800/80 italic">
                    * Alerta roja para Migración (SGIM) y Software Central contra el imputado.
                  </p>
                </div>
              </div>

              {/* Formulario de Informe Pericial */}
              <form onSubmit={handleActualizarInforme} className="space-y-3 text-xs pt-2">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Fase del Trámite Judicial</label>
                  <select
                    value={nuevoEstado}
                    onChange={(e) => setNuevoEstado(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-police-700 font-bold"
                  >
                    <option value="En proceso">En Investigación Previa (Peritajes)</option>
                    <option value="En juicio">Instrucción Fiscal / Juicio</option>
                    <option value="Audiencia / Judicializada">Preparatoria de Juicio (SATJE)</option>
                    <option value="Atendida / Cerrada">Atendida / Cerrada (Sentencia / Archivo)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Informe Técnico Pericial</label>
                  <textarea
                    rows={4}
                    value={informePericial}
                    onChange={(e) => setInformePericial(e.target.value)}
                    placeholder="Conclusiones periciales, fijación fotográfica, experticias balísticas o documentológicas..."
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-police-700"
                  ></textarea>
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 bg-police-800 hover:bg-police-900 text-white font-bold rounded-lg transition-colors flex items-center justify-center space-x-2"
                >
                  <FileText className="w-4 h-4 text-accent-gold" />
                  <span>Guardar Informe y Actualizar Estado</span>
                </button>
              </form>
            </div>
          ) : (
            <div className="bg-slate-50 rounded-2xl p-8 border border-dashed border-slate-300 text-center text-slate-400 text-xs">
              <Scale className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="font-semibold text-slate-600">Seleccione un expediente de investigación</p>
              <p className="mt-1">Podrá emitir informes técnicos periciales y gestionar medidas restrictivas.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
