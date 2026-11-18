import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { Scale, FileText, CheckCircle2, AlertTriangle, ShieldCheck, UserCheck, Calendar } from 'lucide-react';

export default function BandejaJudicial({ user, onNavigateToAudiencias }) {
  const [casos, setCasos] = useState([]);
  const [cargando, setCargando] = useState(false);
  const [casoSeleccionado, setCasoSeleccionado] = useState(null);
  const [informePericial, setInformePericial] = useState('');
  const [nuevoEstado, setNuevoEstado] = useState('En proceso');

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
      const payload = {};
      payload[campo] = !valorActual;
      await api.put(`/denuncias/${casoSeleccionado.id}/medidas?${campo}=${!valorActual}`);
      cargarCasos();
      setCasoSeleccionado(prev => ({ ...prev, [campo]: !valorActual }));
    } catch (err) {
      alert("Error al modificar medidas cautelares.");
    }
  };

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
          className="px-4 py-2 bg-police-800 hover:bg-police-900 text-white font-bold text-xs rounded-xl shadow-sm flex items-center space-x-2 shrink-0"
        >
          <Calendar className="w-3.5 h-3.5 text-accent-gold" />
          <span>Agendar Audiencia / Diligencia</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Lista de Casos Complejos */}
        <div className="lg:col-span-2 space-y-3">
          <h2 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
            Casos Asignados e Investigaciones Previas ({casos.length})
          </h2>

          <div className="space-y-2.5">
            {casos.map(c => (
              <div
                key={c.id}
                onClick={() => setCasoSeleccionado(c)}
                className={`p-4 rounded-xl border transition-all cursor-pointer ${
                  casoSeleccionado?.id === c.id
                    ? 'bg-blue-50/50 border-blue-400 ring-2 ring-blue-200'
                    : 'bg-white hover:bg-slate-50 border-slate-200'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center space-x-2 mb-1">
                      <span className="font-mono font-bold text-xs text-police-900">{c.codigo_unico}</span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-800 border">
                        {c.estado}
                      </span>
                      {c.orden_captura_activa && (
                        <span className="px-2 py-0.5 rounded bg-rose-600 text-white text-[9px] font-black">
                          ORDEN DE CAPTURA
                        </span>
                      )}
                      {c.medida_proteccion && (
                        <span className="px-2 py-0.5 rounded bg-indigo-600 text-white text-[9px] font-black">
                          MEDIDA PROTECCIÓN
                        </span>
                      )}
                    </div>
                    <h3 className="text-xs font-bold text-slate-900">{c.categoria?.nombre}</h3>
                    <p className="text-xs text-slate-600 mt-1 line-clamp-2">{c.descripcion_hechos}</p>
                  </div>
                </div>
              </div>
            ))}
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

              {/* Botones de Medidas Cautelares (Afectan la Interoperabilidad con Migración) */}
              <div className="space-y-2 pt-1">
                <span className="text-[10px] font-bold uppercase text-slate-400 block">
                  Alertas Interinstitucionales (Migración / SGIM)
                </span>
                <div className="flex flex-col gap-2">
                  <button
                    type="button"
                    onClick={() => toggleMedida('orden_captura', casoSeleccionado.orden_captura_activa)}
                    className={`px-3 py-2 rounded-lg text-xs font-bold border transition-colors flex items-center justify-between ${
                      casoSeleccionado.orden_captura_activa
                        ? 'bg-rose-100 text-rose-800 border-rose-300'
                        : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <span>Orden de Captura Activa</span>
                    <span className="text-[10px]">{casoSeleccionado.orden_captura_activa ? 'SÍ (ACTIVA)' : 'NO'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => toggleMedida('medida_proteccion', casoSeleccionado.medida_proteccion)}
                    className={`px-3 py-2 rounded-lg text-xs font-bold border transition-colors flex items-center justify-between ${
                      casoSeleccionado.medida_proteccion
                        ? 'bg-indigo-100 text-indigo-800 border-indigo-300'
                        : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <span>Medida Cautelar / Protección</span>
                    <span className="text-[10px]">{casoSeleccionado.medida_proteccion ? 'SÍ (ACTIVA)' : 'NO'}</span>
                  </button>
                </div>
              </div>

              {/* Registro de Informe Pericial */}
              <form onSubmit={handleActualizarInforme} className="space-y-3 text-xs pt-2 border-t border-slate-100">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Estado de la Causa</label>
                  <select
                    value={nuevoEstado}
                    onChange={(e) => setNuevoEstado(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-police-700 font-semibold"
                  >
                    <option value="En proceso">En proceso (Levantamiento de Indicios)</option>
                    <option value="Audiencia / Judicializada">Audiencia / Judicializada (Coordinación Fiscalía)</option>
                    <option value="Atendida / Cerrada">Atendida / Cerrada (Informe Final Emitido)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Informe Pericial Técnico / Balístico / Criminalística
                  </label>
                  <textarea
                    rows={4}
                    required
                    value={informePericial}
                    onChange={(e) => setInformePericial(e.target.value)}
                    placeholder="Detalle pericial de cotejamiento balístico, peritaje informático o reconstrucción de los hechos..."
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-police-700"
                  ></textarea>
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 bg-police-800 hover:bg-police-900 text-white font-bold rounded-lg transition-colors flex items-center justify-center space-x-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Asentar Informe Pericial</span>
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
