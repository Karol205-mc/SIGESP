import React, { useState, useEffect, useMemo } from 'react';
import api from '../services/api';
import { 
  ShieldAlert, 
  Clock, 
  CheckCircle2, 
  FileText, 
  MapPin, 
  User, 
  ChevronRight, 
  AlertTriangle,
  Search,
  X
} from 'lucide-react';

export default function BandejaFlagrancia({ user }) {
  const [denuncias, setDenuncias] = useState([]);
  const [cargando, setCargando] = useState(false);
  const [casoSeleccionado, setCasoSeleccionado] = useState(null);
  const [observacion, setObservacion] = useState('');
  const [nuevoEstado, setNuevoEstado] = useState('En proceso');

  // Filtros y búsqueda
  const [busqueda, setBusqueda] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('TODOS');

  useEffect(() => {
    cargarCasosFlagrancia();
  }, []);

  const cargarCasosFlagrancia = async () => {
    setCargando(true);
    try {
      const res = await api.get('/denuncias/');
      setDenuncias(res.data);
    } catch (err) {
      console.error("Error al cargar casos de flagrancia", err);
    } finally {
      setCargando(false);
    }
  };

  const handleActualizarEstado = async (e) => {
    e.preventDefault();
    if (!casoSeleccionado) return;

    try {
      await api.put(`/denuncias/${casoSeleccionado.id}/estado`, {
        nuevo_estado: nuevoEstado,
        observaciones: observacion || `Diligencia urgente registrada por Subteniente ${user?.nombre_completo || 'PF'}`
      });
      setObservacion('');
      setCasoSeleccionado(null);
      cargarCasosFlagrancia();
      alert("Procedimiento registrado exitosamente.");
    } catch (err) {
      alert(err.response?.data?.detail || "Error al actualizar el estado");
    }
  };

  const esCasoCerrado = (estado) => {
    if (!estado) return false;
    const est = estado.toLowerCase();
    return est.includes('cerrad') || est.includes('finaliz') || est.includes('archiv');
  };

  // Filtrar y ordenar: casos cerrados al final
  const denunciasProcesadas = useMemo(() => {
    return denuncias
      .filter(d => {
        if (filtroEstado === 'PENDIENTES') {
          if (esCasoCerrado(d.estado)) return false;
        } else if (filtroEstado === 'EN_PROCESO') {
          if (d.estado !== 'En proceso') return false;
        } else if (filtroEstado === 'CERRADAS') {
          if (!esCasoCerrado(d.estado)) return false;
        }

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
        if (cerradoA && !cerradoB) return 1;
        if (!cerradoA && cerradoB) return -1;
        return b.id - a.id;
      });
  }, [denuncias, busqueda, filtroEstado]);

  const conteos = useMemo(() => {
    const total = denuncias.length;
    const pendientes = denuncias.filter(d => !esCasoCerrado(d.estado)).length;
    const enProceso = denuncias.filter(d => d.estado === 'En proceso').length;
    const cerradas = denuncias.filter(d => esCasoCerrado(d.estado)).length;
    return { total, pendientes, enProceso, cerradas };
  }, [denuncias]);

  return (
    <div className="space-y-6">
      {/* Cabecera */}
      <div className="pb-4 border-b border-slate-200">
        <span className="text-[11px] font-bold text-rose-600 uppercase tracking-wider flex items-center space-x-1">
          <ShieldAlert className="w-3.5 h-3.5" />
          <span>Atención Inmediata y Aprehensión</span>
        </span>
        <h1 className="text-xl font-black text-slate-900">Bandeja de Policía de Flagrancia (PF)</h1>
        <p className="text-xs text-slate-500">Mando Operativo: Subteniente Juliana Enríquez</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Lista de Casos */}
        <div className="lg:col-span-2 space-y-3">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
            <h2 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Expedientes en Flagrancia ({denunciasProcesadas.length})
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
              className="w-full pl-9 pr-9 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-rose-500 shadow-sm"
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
                  ? 'bg-rose-900 text-white border-rose-900 shadow-sm'
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
              <span>Pendientes / Urgentes</span>
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
            {denunciasProcesadas.length === 0 ? (
              <div className="bg-white rounded-xl p-8 border border-slate-200 text-center text-slate-500 text-xs">
                <FileText className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                <p className="font-semibold text-slate-700">No se encontraron expedientes con los criterios seleccionados.</p>
                <p className="mt-1 text-slate-400">Intente modificar los términos de búsqueda o el filtro.</p>
              </div>
            ) : (
              denunciasProcesadas.map(d => {
                const cerrado = esCasoCerrado(d.estado);
                return (
                  <div
                    key={d.id}
                    onClick={() => {
                      setCasoSeleccionado(d);
                      setNuevoEstado(d.estado === 'Registrada' ? 'En proceso' : 'Atendida / Cerrada');
                    }}
                    className={`p-4 rounded-xl border transition-all cursor-pointer ${
                      casoSeleccionado?.id === d.id
                        ? 'bg-rose-50/70 border-rose-300 ring-2 ring-rose-200'
                        : cerrado
                        ? 'bg-slate-50/80 hover:bg-slate-100/90 border-slate-200 opacity-80'
                        : 'bg-white hover:bg-slate-50 border-slate-200 shadow-sm'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="space-y-1">
                        <div className="flex items-center space-x-2">
                          <span className="font-mono font-bold text-xs text-police-900">{d.codigo_unico}</span>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            cerrado ? 'bg-slate-200 text-slate-700 border border-slate-300' :
                            d.estado === 'Registrada' ? 'bg-amber-100 text-amber-800' :
                            d.estado === 'En proceso' ? 'bg-blue-100 text-blue-800' :
                            'bg-slate-100 text-slate-700'
                          }`}>
                            {d.estado}
                          </span>
                          {(d.orden_captura_denunciado || d.orden_captura_activa) && (
                            <span className="px-1.5 py-0.5 rounded bg-rose-600 text-white font-black text-[9px]">
                              CAPTURA / APREHENSIÓN
                            </span>
                          )}
                          {d.medida_proteccion && (
                            <span className="px-1.5 py-0.5 rounded bg-blue-600 text-white font-black text-[9px]">
                              PROTECCIÓN VÍCTIMA
                            </span>
                          )}
                          {cerrado && (
                            <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded bg-slate-300 text-slate-800">
                              Cerrado
                            </span>
                          )}
                        </div>

                        <h3 className="text-xs font-bold text-slate-800">{d.categoria?.nombre || 'Delito'}</h3>

                        {/* Partes Procesales Diferenciadas: Víctima vs Sospechoso */}
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
                                🚨 Sospechoso:
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

                        <p className="text-xs text-slate-600 mt-1 line-clamp-2">{d.descripcion_hechos}</p>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-400 shrink-0 mt-1" />
                    </div>

                    <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                      <span className="flex items-center space-x-1">
                        <MapPin className="w-3 h-3 text-slate-400" />
                        <span>{d.direccion_hechos}</span>
                      </span>
                      <span>{new Date(d.fecha_hechos).toLocaleDateString('es-EC')}</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Panel de Gestión del Caso Seleccionado */}
        <div>
          {casoSeleccionado ? (
            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-4 sticky top-20">
              <div className="border-b border-slate-200 pb-3">
                <span className="text-[10px] font-bold uppercase text-slate-400">Expediente Seleccionado</span>
                <h3 className="text-base font-extrabold text-police-900">{casoSeleccionado.codigo_unico}</h3>
                <p className="text-xs text-slate-600 font-medium">{casoSeleccionado.categoria?.nombre}</p>
              </div>

              {/* Ficha de Partes Procesales (Flagrancia) */}
              <div className="space-y-2 text-xs">
                {/* Víctima */}
                <div className="p-2.5 rounded-lg bg-blue-50/70 border border-blue-200">
                  <span className="text-[10px] font-black uppercase text-blue-900 block">🛡️ Víctima / Denunciante:</span>
                  <div className="text-slate-900 font-bold">{casoSeleccionado.ciudadano?.nombres} {casoSeleccionado.ciudadano?.apellidos}</div>
                  <div className="text-slate-500 text-[11px] font-mono">C.I.: {casoSeleccionado.ciudadano?.cedula} | Telf: {casoSeleccionado.ciudadano?.telefono || 'S/N'}</div>
                </div>

                {/* Sospechoso / Aprehendido */}
                <div className="p-2.5 rounded-lg bg-rose-50/70 border border-rose-200">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase text-rose-900 block">🚨 Sospechoso / Aprehendido:</span>
                    {(casoSeleccionado.orden_captura_denunciado || casoSeleccionado.orden_captura_activa) ? (
                      <span className="text-[9px] bg-rose-600 text-white font-black px-1.5 py-0.2 rounded">
                        BAJO CUSTODIA
                      </span>
                    ) : (
                      <span className="text-[9px] bg-amber-100 text-amber-800 font-bold px-1.5 py-0.2 rounded">
                        FLAGRANTE
                      </span>
                    )}
                  </div>
                  <div className="text-slate-900 font-bold">
                    {casoSeleccionado.denunciado_nombres || 'Sospechoso en averiguación'}
                    {casoSeleccionado.denunciado_alias && (
                      <span className="text-rose-700 font-bold ml-1">[{casoSeleccionado.denunciado_alias}]</span>
                    )}
                  </div>
                  <div className="text-slate-500 text-[11px] font-mono">
                    {casoSeleccionado.denunciado_cedula ? `C.I.: ${casoSeleccionado.denunciado_cedula}` : 'Cédula no proporcionada'}
                  </div>
                </div>
              </div>

              {/* Formulario de Diligencia Policial */}
              <form onSubmit={handleActualizarEstado} className="space-y-3 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Cambio de Estado Policial</label>
                  <select
                    value={nuevoEstado}
                    onChange={(e) => setNuevoEstado(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-police-700 font-bold"
                  >
                    <option value="En proceso">En proceso (Diligencias Periciales Activas)</option>
                    <option value="Audiencia / Judicializada">Traslado a Fiscalía / Audiencia</option>
                    <option value="Atendida / Cerrada">Atendida / Cerrada (Procedimiento Culminado)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Acta de Aprehensión / Diligencias de Guardia</label>
                  <textarea
                    rows={4}
                    value={observacion}
                    onChange={(e) => setObservacion(e.target.value)}
                    placeholder="Detalle de aprehensión de sospechosos, indicios fijados, traslado a la sala de aseguramiento transitorio..."
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-police-700"
                  ></textarea>
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 bg-rose-700 hover:bg-rose-800 text-white font-bold rounded-lg transition-colors flex items-center justify-center space-x-2"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Registrar Diligencia Urgente</span>
                </button>
              </form>
            </div>
          ) : (
            <div className="bg-slate-50 rounded-2xl p-8 border border-dashed border-slate-300 text-center text-slate-400 text-xs">
              <ShieldAlert className="w-8 h-8 mx-auto mb-2 opacity-50 text-rose-500" />
              <p className="font-semibold text-slate-600">Seleccione un expediente de flagrancia</p>
              <p className="mt-1">Podrá asentar partes policiales de guardia y remitir indicios periciales.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
