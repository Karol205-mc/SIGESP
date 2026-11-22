import React, { useState, useEffect, useMemo } from 'react';
import api from '../services/api';
import { 
  ShieldCheck, 
  UserCheck, 
  AlertCircle, 
  CheckCircle2, 
  ArrowRight, 
  Search, 
  X, 
  User, 
  FileText,
  Clock
} from 'lucide-react';

export default function DespachoSupervisor({ user }) {
  const [denuncias, setDenuncias] = useState([]);
  const [agentes, setAgentes] = useState([]);
  const [cargando, setCargando] = useState(false);

  // Filtros y Búsqueda
  const [busqueda, setBusqueda] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('TODOS');

  // Asignación seleccionada
  const [denunciaSeleccionada, setDenunciaSeleccionada] = useState(null);
  const [agenteId, setAgenteId] = useState('');
  const [prioridad, setPrioridad] = useState('MEDIA');
  const [notas, setNotas] = useState('');

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    setCargando(true);
    try {
      const [resDenuncias, resAgentes] = await Promise.all([
        api.get('/denuncias/'),
        api.get('/asignaciones/agentes')
      ]);
      setDenuncias(resDenuncias.data);
      setAgentes(resAgentes.data);
      if (resAgentes.data.length > 0) {
        setAgenteId(resAgentes.data[0].id);
      }
    } catch (err) {
      console.error("Error al cargar despacho", err);
    } finally {
      setCargando(false);
    }
  };

  const handleAsignar = async (e) => {
    e.preventDefault();
    if (!denunciaSeleccionada || !agenteId) return;

    try {
      await api.post('/asignaciones/', {
        denuncia_id: denunciaSeleccionada.id,
        usuario_asignado_id: parseInt(agenteId),
        prioridad,
        notas: notas || `Asignado por Mayor ${user?.nombre_completo || 'Karol Mena'}`
      });
      alert(`Caso ${denunciaSeleccionada.codigo_unico} asignado exitosamente.`);
      setDenunciaSeleccionada(null);
      setNotas('');
      cargarDatos();
    } catch (err) {
      alert(err.response?.data?.detail || "Error al asignar caso.");
    }
  };

  // Función para identificar si un caso ya está concluido o cerrado
  const esCasoCerrado = (estado) => {
    if (!estado) return false;
    const est = estado.toLowerCase();
    return est.includes('cerrad') || est.includes('finaliz') || est.includes('archiv');
  };

  // Procesamiento y ordenamiento de denuncias:
  // 1. Casos SIN ASIGNAR (doraditos) activos primero para despacho inmediato.
  // 2. Casos ya asignados activos a continuación.
  // 3. Casos cerrados al final de la lista.
  const denunciasProcesadas = useMemo(() => {
    return denuncias
      .filter(d => {
        // Filtro por botones de estado / procedimiento
        if (filtroEstado === 'SIN_ASIGNAR') {
          if (d.asignada) return false;
        } else if (filtroEstado === 'PENDIENTES') {
          if (esCasoCerrado(d.estado)) return false;
        } else if (filtroEstado === 'CERRADAS') {
          if (!esCasoCerrado(d.estado)) return false;
        } else if (filtroEstado === 'FLAGRANCIA') {
          if (d.tipo_tramite !== 'FLAGRANCIA') return false;
        } else if (filtroEstado === 'PJ') {
          if (d.tipo_tramite !== 'INVESTIGACION_PREVIA' && !d.tipo_tramite?.includes('PJ')) return false;
        }

        // Filtro por barra de búsqueda (Código de trámite o Cédula del denunciante o Nombre)
        if (busqueda.trim()) {
          const term = busqueda.toLowerCase().trim();
          const matchCodigo = d.codigo_unico?.toLowerCase().includes(term);
          const matchCedula = d.ciudadano?.cedula?.includes(term);
          const matchNombre = `${d.ciudadano?.nombres || ''} ${d.ciudadano?.apellidos || ''}`.toLowerCase().includes(term);
          const matchDenunciado = `${d.denunciado_nombres || ''} ${d.denunciado_alias || ''} ${d.denunciado_cedula || ''}`.toLowerCase().includes(term);
          const matchCategoria = d.categoria?.nombre?.toLowerCase().includes(term);
          return matchCodigo || matchCedula || matchNombre || matchDenunciado || matchCategoria;
        }

        return true;
      })
      .sort((a, b) => {
        const cerradoA = esCasoCerrado(a.estado);
        const cerradoB = esCasoCerrado(b.estado);

        // Si uno es cerrado y el otro no, el cerrado va al final
        if (cerradoA && !cerradoB) return 1;
        if (!cerradoA && cerradoB) return -1;

        // Entre los activos: los no asignados primero (doraditos prioritarios)
        if (!a.asignada && b.asignada) return -1;
        if (a.asignada && !b.asignada) return 1;

        // Si ambos son del mismo grupo, más reciente primero
        return b.id - a.id;
      });
  }, [denuncias, busqueda, filtroEstado]);

  // Contadores para los botones de filtro
  const conteos = useMemo(() => {
    const total = denuncias.length;
    const sinAsignar = denuncias.filter(d => !d.asignada && !esCasoCerrado(d.estado)).length;
    const pendientes = denuncias.filter(d => !esCasoCerrado(d.estado)).length;
    const cerradas = denuncias.filter(d => esCasoCerrado(d.estado)).length;
    const flagrancia = denuncias.filter(d => d.tipo_tramite === 'FLAGRANCIA').length;
    const pj = denuncias.filter(d => d.tipo_tramite === 'INVESTIGACION_PREVIA' || d.tipo_tramite?.includes('PJ')).length;
    return { total, sinAsignar, pendientes, cerradas, flagrancia, pj };
  }, [denuncias]);

  return (
    <div className="space-y-6">
      <div className="pb-4 border-b border-slate-200 flex flex-col sm:flex-row justify-between sm:items-center gap-2">
        <div>
          <span className="text-[11px] font-bold text-police-700 uppercase tracking-wider flex items-center space-x-1">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Supervisión y Control de Operaciones</span>
          </span>
          <h1 className="text-xl font-black text-slate-900">Despacho y Asignación de Casos</h1>
          <p className="text-xs text-slate-500">Mando Operativo: Mayor Karol Mena (Jefe de Operaciones)</p>
        </div>

        {conteos.sinAsignar > 0 && (
          <div className="bg-amber-100 text-amber-900 border border-amber-300 px-3 py-1.5 rounded-xl text-xs font-bold flex items-center space-x-1.5 shadow-xs">
            <AlertCircle className="w-4 h-4 text-accent-goldDark" />
            <span>{conteos.sinAsignar} expedientes pendientes de asignación</span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Bandeja de Casos por Despachar */}
        <div className="lg:col-span-2 space-y-3">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
            <h2 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Casos en Bandeja General ({denunciasProcesadas.length})
            </h2>
            <div className="flex items-center space-x-2 text-[10px] font-semibold text-slate-400">
              <span className="flex items-center space-x-1 text-amber-700">
                <span className="w-2 h-2 rounded-full bg-accent-gold"></span>
                <span>Dorados: Sin asignar</span>
              </span>
              <span>•</span>
              <span>Cerrados al final</span>
            </div>
          </div>

          {/* Barra de Búsqueda por Cédula del Denunciante o Código de Trámite */}
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

            {/* Botón Dorado Especial: Sin Asignar */}
            <button
              onClick={() => setFiltroEstado('SIN_ASIGNAR')}
              className={`px-3 py-1.5 rounded-lg font-black border transition-all shrink-0 flex items-center space-x-1.5 ${
                filtroEstado === 'SIN_ASIGNAR'
                  ? 'bg-accent-gold text-police-950 border-accent-goldDark shadow-sm ring-2 ring-accent-gold/40'
                  : 'bg-amber-50 text-amber-900 border-amber-300 hover:bg-amber-100'
              }`}
            >
              <AlertCircle className="w-3.5 h-3.5 text-accent-goldDark" />
              <span>Sin Asignar</span>
              <span className="text-[10px] bg-accent-goldDark text-white px-1.5 py-0.2 rounded-full">{conteos.sinAsignar}</span>
            </button>

            <button
              onClick={() => setFiltroEstado('PENDIENTES')}
              className={`px-3 py-1.5 rounded-lg font-bold border transition-colors shrink-0 flex items-center space-x-1.5 ${
                filtroEstado === 'PENDIENTES'
                  ? 'bg-blue-800 text-white border-blue-800 shadow-sm'
                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
              }`}
            >
              <span>Pendientes / Activas</span>
              <span className="text-[10px] bg-blue-500/20 text-blue-800 px-1.5 py-0.2 rounded-full">{conteos.pendientes}</span>
            </button>

            <button
              onClick={() => setFiltroEstado('FLAGRANCIA')}
              className={`px-3 py-1.5 rounded-lg font-bold border transition-colors shrink-0 flex items-center space-x-1.5 ${
                filtroEstado === 'FLAGRANCIA'
                  ? 'bg-rose-700 text-white border-rose-700 shadow-sm'
                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
              }`}
            >
              <span>Flagrancia</span>
              <span className="text-[10px] bg-rose-500/20 text-rose-800 px-1.5 py-0.2 rounded-full">{conteos.flagrancia}</span>
            </button>

            <button
              onClick={() => setFiltroEstado('PJ')}
              className={`px-3 py-1.5 rounded-lg font-bold border transition-colors shrink-0 flex items-center space-x-1.5 ${
                filtroEstado === 'PJ'
                  ? 'bg-indigo-700 text-white border-indigo-700 shadow-sm'
                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
              }`}
            >
              <span>Investigación PJ</span>
              <span className="text-[10px] bg-indigo-500/20 text-indigo-800 px-1.5 py-0.2 rounded-full">{conteos.pj}</span>
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

          {/* Listado de Casos Ordenados */}
          <div className="space-y-2.5">
            {denunciasProcesadas.length === 0 ? (
              <div className="bg-white rounded-xl p-8 border border-slate-200 text-center text-slate-500 text-xs">
                <FileText className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                <p className="font-semibold text-slate-700">No se encontraron expedientes con los criterios seleccionados.</p>
                <p className="mt-1 text-slate-400">Intente modificar los términos de búsqueda o el botón de filtro.</p>
              </div>
            ) : (
              denunciasProcesadas.map(d => {
                const cerrado = esCasoCerrado(d.estado);
                const sinAsignar = !d.asignada;

                return (
                  <div
                    key={d.id}
                    onClick={() => setDenunciaSeleccionada(d)}
                    className={`p-4 rounded-xl border transition-all cursor-pointer ${
                      denunciaSeleccionada?.id === d.id
                        ? 'bg-purple-50/70 border-purple-300 ring-2 ring-purple-200'
                        : sinAsignar && !cerrado
                        ? 'bg-amber-50/70 hover:bg-amber-100/80 border-accent-gold ring-1 ring-accent-gold/40 shadow-sm'
                        : cerrado
                        ? 'bg-slate-50/80 hover:bg-slate-100/90 border-slate-200 opacity-80'
                        : 'bg-white hover:bg-slate-50 border-slate-200 shadow-sm'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                          <span className="font-mono font-bold text-xs text-police-900">{d.codigo_unico}</span>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                            cerrado
                              ? 'bg-slate-200 text-slate-700 border-slate-300'
                              : d.estado === 'En proceso'
                              ? 'bg-blue-100 text-blue-800 border-blue-200'
                              : d.estado === 'En juicio'
                              ? 'bg-purple-100 text-purple-800 border-purple-200'
                              : 'bg-amber-100 text-amber-800 border-amber-200'
                          }`}>
                            {d.estado}
                          </span>
                          <span className="text-[10px] text-slate-500 font-semibold">{d.tipo_tramite}</span>

                          {/* Distintivo Dorado para Casos Sin Asignar */}
                          {sinAsignar && !cerrado && (
                            <span className="px-2 py-0.5 rounded text-[10px] font-black bg-accent-gold text-police-950 border border-accent-goldDark shadow-xs flex items-center space-x-1 animate-pulse">
                              <AlertCircle className="w-3 h-3 text-police-950" />
                              <span>SIN ASIGNAR</span>
                            </span>
                          )}

                          {/* Medidas Procesales Vigentes */}
                          {(d.orden_captura_denunciado || d.orden_captura_activa) && (
                            <span className="px-2 py-0.5 rounded bg-rose-600 text-white text-[9px] font-black">
                              CAPTURA DENUNCIADO
                            </span>
                          )}
                          {d.medida_proteccion && (
                            <span className="px-2 py-0.5 rounded bg-blue-600 text-white text-[9px] font-black">
                              PROTECCIÓN VÍCTIMA
                            </span>
                          )}

                          {/* Distintivo de Agente Asignado */}
                          {d.agente_asignado && (
                            <span className="text-[10px] font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded flex items-center space-x-1">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              <span>Asignado: {d.agente_asignado}</span>
                            </span>
                          )}

                          {cerrado && (
                            <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded bg-slate-300 text-slate-800">
                              Cerrado
                            </span>
                          )}
                        </div>

                        <h3 className="text-xs font-bold text-slate-900">{d.categoria?.nombre}</h3>

                        {/* Partes procesales diferenciadas: Denunciante (Víctima) vs Denunciado (Imputado) */}
                        <div className="flex flex-col sm:flex-row sm:items-center gap-2 text-[11px] text-slate-600 mt-1">
                          {d.ciudadano && (
                            <div className="flex items-center space-x-1.5">
                              <span className="px-1.5 py-0.5 rounded bg-blue-50 text-blue-800 font-bold border border-blue-200 text-[10px]">
                                🛡️ Víctima:
                              </span>
                              <span className="font-semibold text-slate-800">{d.ciudadano.nombres} {d.ciudadano.apellidos}</span>
                              <span className="font-mono bg-slate-100 px-1 py-0.2 rounded border border-slate-200 text-slate-600 text-[10px]">
                                C.I. {d.ciudadano.cedula}
                              </span>
                            </div>
                          )}

                          {(d.denunciado_nombres || d.denunciado_alias || d.denunciado_cedula) && (
                            <div className="flex items-center space-x-1.5">
                              <span className="px-1.5 py-0.5 rounded bg-rose-50 text-rose-800 font-bold border border-rose-200 text-[10px]">
                                ⚠️ Denunciado:
                              </span>
                              <span className="font-semibold text-slate-800">
                                {d.denunciado_nombres || 'En averiguación'}
                              </span>
                              {d.denunciado_alias && (
                                <span className="text-rose-700 font-bold text-[10px]">[{d.denunciado_alias}]</span>
                              )}
                              {d.denunciado_cedula && (
                                <span className="font-mono bg-slate-100 px-1 py-0.2 rounded border border-slate-200 text-slate-600 text-[10px]">
                                  C.I. {d.denunciado_cedula}
                                </span>
                              )}
                            </div>
                          )}
                        </div>

                        <p className="text-xs text-slate-600 line-clamp-2 mt-1">{d.descripcion_hechos}</p>
                      </div>
                      <ArrowRight className="w-4 h-4 text-slate-400 shrink-0 mt-1" />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Panel de Asignación a Agentes */}
        <div>
          {denunciaSeleccionada ? (
            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-4 sticky top-20">
              <div className="border-b border-slate-200 pb-3 space-y-2">
                <div>
                  <span className="text-[10px] font-bold uppercase text-slate-400">Asignar Expediente</span>
                  <h3 className="text-base font-extrabold text-police-900">{denunciaSeleccionada.codigo_unico}</h3>
                  <p className="text-xs text-slate-600 font-medium">{denunciaSeleccionada.categoria?.nombre}</p>
                </div>

                {/* Ficha de Sujetos Procesales */}
                <div className="space-y-1.5 pt-1 text-xs">
                  {denunciaSeleccionada.ciudadano && (
                    <div className="p-2.5 rounded-lg bg-blue-50/70 border border-blue-200">
                      <span className="text-[10px] font-black uppercase text-blue-900 block">🛡️ Víctima / Denunciante:</span>
                      <p className="font-bold text-slate-900">{denunciaSeleccionada.ciudadano.nombres} {denunciaSeleccionada.ciudadano.apellidos}</p>
                      <p className="text-[11px] text-slate-500 font-mono">C.I. {denunciaSeleccionada.ciudadano.cedula} | Telf: {denunciaSeleccionada.ciudadano.telefono || 'S/N'}</p>
                    </div>
                  )}

                  <div className="p-2.5 rounded-lg bg-rose-50/70 border border-rose-200">
                    <span className="text-[10px] font-black uppercase text-rose-900 block">⚠️ Denunciado / Imputado:</span>
                    <p className="font-bold text-slate-900">
                      {denunciaSeleccionada.denunciado_nombres || 'En investigación pericial'}
                      {denunciaSeleccionada.denunciado_alias && (
                        <span className="text-rose-700 font-bold ml-1">[{denunciaSeleccionada.denunciado_alias}]</span>
                      )}
                    </p>
                    <p className="text-[11px] text-slate-500 font-mono">
                      {denunciaSeleccionada.denunciado_cedula ? `C.I. ${denunciaSeleccionada.denunciado_cedula}` : 'Cédula no proporcionada'}
                    </p>
                  </div>
                </div>
                {!denunciaSeleccionada.asignada ? (
                  <div className="mt-2 inline-flex items-center space-x-1 px-2 py-0.5 rounded bg-accent-gold/20 text-accent-goldDark font-bold text-[10px] border border-accent-gold/40">
                    <Clock className="w-3 h-3" />
                    <span>Expediente actualmente sin asignar</span>
                  </div>
                ) : (
                  <div className="mt-2 text-[10px] text-emerald-700 font-semibold flex items-center space-x-1">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                    <span>Asignado a: {denunciaSeleccionada.agente_asignado}</span>
                  </div>
                )}
              </div>

              <form onSubmit={handleAsignar} className="space-y-3 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Agente Destinatario *</label>
                  <select
                    value={agenteId}
                    onChange={(e) => setAgenteId(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-police-700 font-bold"
                  >
                    {agentes.map(ag => (
                      <option key={ag.id} value={ag.id}>
                        {ag.nombres} {ag.apellidos} - {ag.rango || ag.rol?.nombre} (Placa: {ag.placa || 'S/N'})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Nivel de Prioridad *</label>
                  <select
                    value={prioridad}
                    onChange={(e) => setPrioridad(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-police-700 font-semibold"
                  >
                    <option value="BAJA">Baja</option>
                    <option value="MEDIA">Media</option>
                    <option value="ALTA">Alta</option>
                    <option value="URGENTE">Urgente (Atención Inmediata)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Instrucciones Operativas</label>
                  <textarea
                    rows={3}
                    value={notas}
                    onChange={(e) => setNotas(e.target.value)}
                    placeholder="Directrices para recolección de pruebas, entrevistas a testigos, inspección ocular..."
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-police-700"
                  ></textarea>
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 bg-police-800 hover:bg-police-900 text-white font-bold rounded-lg transition-colors flex items-center justify-center space-x-2"
                >
                  <UserCheck className="w-4 h-4 text-accent-gold" />
                  <span>Despachar y Notificar al Agente</span>
                </button>
              </form>
            </div>
          ) : (
            <div className="bg-slate-50 rounded-2xl p-8 border border-dashed border-slate-300 text-center text-slate-400 text-xs">
              <ShieldCheck className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="font-semibold text-slate-600">Seleccione un caso para asignar</p>
              <p className="mt-1">Podrá despacharlo a agentes de Flagrancia o Policía Judicial según jurisdicción.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
