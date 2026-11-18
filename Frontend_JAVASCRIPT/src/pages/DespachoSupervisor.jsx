import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { ShieldCheck, UserCheck, AlertCircle, CheckCircle2, ArrowRight } from 'lucide-react';

export default function DespachoSupervisor({ user }) {
  const [denuncias, setDenuncias] = useState([]);
  const [agentes, setAgentes] = useState([]);
  const [cargando, setCargando] = useState(false);

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

  return (
    <div className="space-y-6">
      <div className="pb-4 border-b border-slate-200">
        <span className="text-[11px] font-bold text-police-700 uppercase tracking-wider flex items-center space-x-1">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Supervisión y Control de Operaciones</span>
        </span>
        <h1 className="text-xl font-black text-slate-900">Despacho y Asignación de Casos</h1>
        <p className="text-xs text-slate-500">Mando Operativo: Mayor Karol Mena (Jefe de Operaciones)</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Bandeja de Casos por Despachar */}
        <div className="lg:col-span-2 space-y-3">
          <h2 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
            Casos en Bandeja General ({denuncias.length})
          </h2>

          <div className="space-y-2.5">
            {denuncias.map(d => (
              <div
                key={d.id}
                onClick={() => setDenunciaSeleccionada(d)}
                className={`p-4 rounded-xl border transition-all cursor-pointer ${
                  denunciaSeleccionada?.id === d.id
                    ? 'bg-purple-50/60 border-purple-300 ring-2 ring-purple-200'
                    : 'bg-white hover:bg-slate-50 border-slate-200'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center space-x-2 mb-1">
                      <span className="font-mono font-bold text-xs text-police-900">{d.codigo_unico}</span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-800 border">
                        {d.estado}
                      </span>
                      <span className="text-[10px] text-slate-500 font-semibold">{d.tipo_tramite}</span>
                    </div>
                    <h3 className="text-xs font-bold text-slate-900">{d.categoria?.nombre}</h3>
                    <p className="text-xs text-slate-600 mt-1 line-clamp-2">{d.descripcion_hechos}</p>
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-400 shrink-0 mt-1" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Panel de Asignación a Agentes */}
        <div>
          {denunciaSeleccionada ? (
            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-4 sticky top-20">
              <div className="border-b border-slate-200 pb-3">
                <span className="text-[10px] font-bold uppercase text-slate-400">Asignar Expediente</span>
                <h3 className="text-base font-extrabold text-police-900">{denunciaSeleccionada.codigo_unico}</h3>
                <p className="text-xs text-slate-600 font-medium">{denunciaSeleccionada.categoria?.nombre}</p>
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
