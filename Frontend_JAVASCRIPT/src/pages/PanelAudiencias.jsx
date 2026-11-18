import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { Calendar, Scale, Clock, User, CheckCircle2, Building, FileText, Lock, RefreshCw, AlertCircle } from 'lucide-react';

export default function PanelAudiencias() {
  const [denuncias, setDenuncias] = useState([]);
  const [diligencias, setDiligencias] = useState([]);
  const [cargando, setCargando] = useState(false);
  const [enviando, setEnviando] = useState(false);

  // Catálogos judiciales cargados de la base de datos
  const [catalogo, setCatalogo] = useState({
    jueces: [],
    fiscales: [],
    salas: []
  });
  const [siguienteCausa, setSiguienteCausa] = useState('');

  // Formulario de Audiencia
  const [formData, setFormData] = useState({
    denuncia_id: '',
    juez_nombre: '',
    fiscal_nombre: '',
    fecha_audiencia: '',
    sala_audiencia: '',
    numero_causa_judicial: '',
    observaciones: 'Audiencia preparatoria de juicio y sustentación de dictamen.'
  });

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    setCargando(true);
    try {
      const [resDenuncias, resDiligencias, resCatalogo] = await Promise.all([
        api.get('/denuncias/'),
        api.get('/diligencias/'),
        api.get('/diligencias/catalogo-judicial')
      ]);

      setDenuncias(resDenuncias.data);
      setDiligencias(resDiligencias.data);
      
      const cat = resCatalogo.data;
      setCatalogo({
        jueces: cat.jueces || [],
        fiscales: cat.fiscales || [],
        salas: cat.salas || []
      });
      setSiguienteCausa(cat.siguiente_causa);

      // Precargar valores iniciales
      setFormData(prev => ({
        ...prev,
        denuncia_id: prev.denuncia_id || (resDenuncias.data.length > 0 ? resDenuncias.data[0].id : ''),
        numero_causa_judicial: cat.siguiente_causa,
        juez_nombre: prev.juez_nombre || (cat.jueces.length > 0 ? cat.jueces[0].nombre : ''),
        fiscal_nombre: prev.fiscal_nombre || (cat.fiscales.length > 0 ? cat.fiscales[0].nombre : ''),
        sala_audiencia: prev.sala_audiencia || (cat.salas.length > 0 ? cat.salas[0].nombre : '')
      }));

    } catch (err) {
      console.error("Error al cargar datos judiciales", err);
    } finally {
      setCargando(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.denuncia_id || !formData.fecha_audiencia) {
      alert("Por favor seleccione un caso e ingrese fecha y hora de la audiencia.");
      return;
    }

    setEnviando(true);
    try {
      const res = await api.post('/diligencias/', {
        ...formData,
        denuncia_id: parseInt(formData.denuncia_id),
        fecha_audiencia: new Date(formData.fecha_audiencia).toISOString()
      });
      alert(`Audiencia programada con éxito.\nCausa Judicial SATJE N°: ${res.data.numero_causa_judicial}`);
      
      // Recargar datos y actualizar automáticamente al siguiente correlativo no repetible
      await cargarDatos();
      setFormData(prev => ({
        ...prev,
        fecha_audiencia: '',
        observaciones: 'Audiencia preparatoria de juicio y sustentación de dictamen.'
      }));
    } catch (err) {
      alert(err.response?.data?.detail || "Error al programar audiencia.");
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="pb-4 border-b border-slate-200">
        <span className="text-[11px] font-bold text-police-700 uppercase tracking-wider flex items-center space-x-1">
          <Scale className="w-3.5 h-3.5" />
          <span>Coordinación con Función Judicial y Fiscalía General del Estado</span>
        </span>
        <h1 className="text-xl font-black text-slate-900">Panel de Diligencias y Audiencias Penales</h1>
        <p className="text-xs text-slate-500">Asignación Oficial de Jueces, Fiscales, Fechas y Salas con Correlativo SATJE Automatizado</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Formulario de Sorteo y Asignación Judicial */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b pb-3">
            <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center space-x-1.5">
              <Calendar className="w-4 h-4 text-police-700" />
              <span>Sorteo y Asignación Judicial</span>
            </h2>
            <button 
              type="button" 
              onClick={cargarDatos}
              disabled={cargando}
              title="Refrescar catálogo y causas"
              className="p-1 text-slate-400 hover:text-police-700"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${cargando ? 'animate-spin' : ''}`} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
            {/* Expediente a Judicializar */}
            <div>
              <label className="block font-bold text-slate-700 mb-1">Expediente a Judicializar *</label>
              <select
                required
                value={formData.denuncia_id}
                onChange={(e) => setFormData({ ...formData, denuncia_id: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-police-700 font-bold bg-white"
              >
                {denuncias.map(d => (
                  <option key={d.id} value={d.id}>
                    {d.codigo_unico} - {d.categoria?.nombre} ({d.estado})
                  </option>
                ))}
              </select>
            </div>

            {/* Número de Causa Judicial (SATJE) - AUTOMÁTICO, INMUTABLE Y NO EDITABLE */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="font-bold text-slate-700 flex items-center space-x-1">
                  <span>Número de Causa Judicial (SATJE) *</span>
                </label>
                <span className="text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 font-bold flex items-center space-x-1">
                  <Lock className="w-2.5 h-2.5" />
                  <span>Autoconsulta correlativa</span>
                </span>
              </div>
              <div className="relative">
                <input
                  type="text"
                  required
                  readOnly
                  disabled
                  value={formData.numero_causa_judicial || siguienteCausa}
                  className="w-full pl-3 pr-8 py-2 border border-slate-300 rounded-lg bg-slate-100 text-police-950 font-mono font-black text-sm tracking-wide cursor-not-allowed select-none shadow-inner"
                />
                <Lock className="w-4 h-4 text-slate-400 absolute right-2.5 top-2.5" />
              </div>
              <p className="text-[10px] text-slate-500 mt-1">
                Generado de forma unívoca por el sistema penal. No editable para impedir duplicidades de causas.
              </p>
            </div>

            {/* Juez de la Causa (Select de los 5 Jueces de la BD) */}
            <div>
              <label className="block font-bold text-slate-700 mb-1">Juez de la Causa (Sorteo Función Judicial) *</label>
              <select
                required
                value={formData.juez_nombre}
                onChange={(e) => setFormData({ ...formData, juez_nombre: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-police-700 font-medium bg-white"
              >
                {catalogo.jueces.map(j => (
                  <option key={j.id} value={j.nombre}>
                    {j.nombre} — {j.unidad_judicial}
                  </option>
                ))}
              </select>
            </div>

            {/* Fiscal Asignado (Select de los 5 Fiscales de la BD) */}
            <div>
              <label className="block font-bold text-slate-700 mb-1">Fiscal Titular de la Investigación *</label>
              <select
                required
                value={formData.fiscal_nombre}
                onChange={(e) => setFormData({ ...formData, fiscal_nombre: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-police-700 font-medium bg-white"
              >
                {catalogo.fiscales.map(f => (
                  <option key={f.id} value={f.nombre}>
                    {f.nombre} — {f.fiscalia_unidad}
                  </option>
                ))}
              </select>
            </div>

            {/* Fecha y Hora de la Audiencia */}
            <div>
              <label className="block font-bold text-slate-700 mb-1">Fecha y Hora de la Audiencia *</label>
              <input
                type="datetime-local"
                required
                value={formData.fecha_audiencia}
                onChange={(e) => setFormData({ ...formData, fecha_audiencia: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-police-700 font-bold bg-white"
              />
            </div>

            {/* Sala de Audiencias / Tribunal (Select de las 5 Salas de la BD) */}
            <div>
              <label className="block font-bold text-slate-700 mb-1">Sala de Audiencias / Tribunal *</label>
              <select
                required
                value={formData.sala_audiencia}
                onChange={(e) => setFormData({ ...formData, sala_audiencia: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-police-700 font-medium bg-white"
              >
                {catalogo.salas.map(s => (
                  <option key={s.id} value={s.nombre}>
                    {s.nombre} ({s.edificio} - {s.piso})
                  </option>
                ))}
              </select>
            </div>

            {/* Observaciones / Objeto */}
            <div>
              <label className="block font-bold text-slate-700 mb-1">Objeto de la Diligencia / Observaciones</label>
              <textarea
                rows={2}
                value={formData.observaciones}
                onChange={(e) => setFormData({ ...formData, observaciones: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-police-700 bg-white"
              ></textarea>
            </div>

            <button
              type="submit"
              disabled={enviando}
              className="w-full py-2.5 bg-police-800 hover:bg-police-900 text-white font-bold rounded-lg transition-colors flex items-center justify-center space-x-2 shadow-sm"
            >
              <CheckCircle2 className="w-4 h-4 text-accent-gold" />
              <span>{enviando ? 'Judicializando...' : 'Programar y Judicializar Caso'}</span>
            </button>
          </form>
        </div>

        {/* Listado de Audiencias Agendadas */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between border-b pb-2">
            <h2 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Audiencias Programadas en Esmeraldas ({diligencias.length})
            </h2>
            <span className="text-[11px] font-mono text-slate-400">
              Próxima Causa SATJE: <strong className="text-police-900">{siguienteCausa}</strong>
            </span>
          </div>

          <div className="space-y-3">
            {diligencias.map(d => (
              <div key={d.id} className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm space-y-3 hover:border-police-600 transition-colors">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-slate-100 pb-3">
                  <div>
                    <span className="text-[10px] uppercase font-mono font-bold text-police-900 bg-slate-100 px-2 py-0.5 rounded border border-slate-300">
                      Causa N° {d.numero_causa_judicial || 'S/N'}
                    </span>
                    <h3 className="text-sm font-extrabold text-slate-900 mt-1">
                      {d.denuncia?.codigo_unico || `Denuncia ID: ${d.denuncia_id}`}
                    </h3>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-bold text-police-900 bg-accent-gold/20 text-accent-goldDark px-2.5 py-1 rounded-md border border-accent-gold/30">
                      {new Date(d.fecha_audiencia).toLocaleString('es-EC')}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Juez de la Causa</span>
                    <span className="font-bold text-slate-800">{d.juez_nombre || 'No asignado'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Fiscal Titular</span>
                    <span className="font-bold text-slate-800">{d.fiscal_nombre || 'No asignado'}</span>
                  </div>
                  <div className="sm:col-span-2">
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Sala / Tribunal</span>
                    <span className="font-medium text-slate-700">{d.sala_audiencia}</span>
                  </div>
                </div>

                {d.observaciones && (
                  <p className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                    {d.observaciones}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
