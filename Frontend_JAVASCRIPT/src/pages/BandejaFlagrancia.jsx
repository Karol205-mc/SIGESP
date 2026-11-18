import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { ShieldAlert, Clock, CheckCircle2, FileText, MapPin, User, ChevronRight, AlertTriangle } from 'lucide-react';

export default function BandejaFlagrancia({ user }) {
  const [denuncias, setDenuncias] = useState([]);
  const [cargando, setCargando] = useState(false);
  const [casoSeleccionado, setCasoSeleccionado] = useState(null);
  const [observacion, setObservacion] = useState('');
  const [nuevoEstado, setNuevoEstado] = useState('En proceso');

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
          <h2 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center justify-between">
            <span>Expedientes en Flagrancia</span>
            <span className="text-[11px] font-normal text-slate-500">{denuncias.length} registrados</span>
          </h2>

          <div className="space-y-2.5">
            {denuncias.map(d => (
              <div
                key={d.id}
                onClick={() => {
                  setCasoSeleccionado(d);
                  setNuevoEstado(d.estado === 'Registrada' ? 'En proceso' : 'Atendida / Cerrada');
                }}
                className={`p-4 rounded-xl border transition-all cursor-pointer ${
                  casoSeleccionado?.id === d.id
                    ? 'bg-rose-50/50 border-rose-300 ring-2 ring-rose-200'
                    : 'bg-white hover:bg-slate-50 border-slate-200'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center space-x-2 mb-1">
                      <span className="font-mono font-bold text-xs text-police-900">{d.codigo_unico}</span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        d.estado === 'Registrada' ? 'bg-amber-100 text-amber-800' :
                        d.estado === 'En proceso' ? 'bg-blue-100 text-blue-800' :
                        'bg-slate-100 text-slate-700'
                      }`}>
                        {d.estado}
                      </span>
                      {d.orden_captura_activa && (
                        <span className="px-1.5 py-0.5 rounded bg-rose-600 text-white font-black text-[9px]">
                          CAPTURA
                        </span>
                      )}
                    </div>
                    <h3 className="text-xs font-bold text-slate-800">{d.categoria?.nombre || 'Delito'}</h3>
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
            ))}
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

              {/* Datos de la Víctima / Denunciante */}
              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs space-y-1">
                <div className="font-bold text-slate-700">Denunciante:</div>
                <div className="text-slate-900 font-semibold">{casoSeleccionado.ciudadano?.nombres} {casoSeleccionado.ciudadano?.apellidos}</div>
                <div className="text-slate-500 text-[11px]">C.I.: {casoSeleccionado.ciudadano?.cedula} | Telf: {casoSeleccionado.ciudadano?.telefono || 'No registra'}</div>
              </div>

              {/* Formulario de Actuación Urgente */}
              <form onSubmit={handleActualizarEstado} className="space-y-3 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Cambio de Estado Policial</label>
                  <select
                    value={nuevoEstado}
                    onChange={(e) => setNuevoEstado(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-police-700 font-semibold"
                  >
                    <option value="En proceso">En proceso (Diligencias Periciales Activas)</option>
                    <option value="Atendida / Cerrada">Atendida / Cerrada (Procedimiento de Flagrancia Concluido)</option>
                    <option value="Audiencia / Judicializada">Derivar a Audiencia / Policía Judicial</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Acta de Aprehensión / Diligencias de Guardia
                  </label>
                  <textarea
                    rows={4}
                    required
                    value={observacion}
                    onChange={(e) => setObservacion(e.target.value)}
                    placeholder="Detalle de aprehensión de sospechosos, indicios fijados, traslado a la sala de aseguramiento transitorio..."
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-police-700"
                  ></textarea>
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 bg-rose-700 hover:bg-rose-800 text-white font-bold rounded-lg transition-colors flex items-center justify-center space-x-1.5 shadow-sm"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Registrar Diligencia Urgente</span>
                </button>
              </form>
            </div>
          ) : (
            <div className="bg-slate-50 rounded-2xl p-8 border border-dashed border-slate-300 text-center text-slate-400 text-xs">
              <FileText className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="font-semibold text-slate-600">Seleccione un caso de flagrancia</p>
              <p className="mt-1">Podrá asentar las diligencias periciales urgentes y modificar su estado.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
