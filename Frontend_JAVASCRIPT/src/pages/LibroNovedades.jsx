import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { BookOpen, Plus, MapPin, Clock, User, Shield, CheckCircle2 } from 'lucide-react';

export default function LibroNovedades({ user }) {
  const [novedades, setNovedades] = useState([]);
  const [cargando, setCargando] = useState(false);
  const [showModal, setShowModal] = useState(false);

  const [formData, setFormData] = useState({
    sector: 'Circuito Centro - Las Palmas',
    tipo_novedad: 'PATRULLAJE',
    descripcion: ''
  });

  useEffect(() => {
    cargarNovedades();
  }, []);

  const cargarNovedades = async () => {
    setCargando(true);
    try {
      const res = await api.get('/novedades/');
      setNovedades(res.data);
    } catch (err) {
      console.error("Error al cargar libro de guardia", err);
    } finally {
      setCargando(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.descripcion.trim()) return;

    try {
      await api.post('/novedades/', formData);
      setShowModal(false);
      setFormData({
        sector: 'Circuito Centro - Las Palmas',
        tipo_novedad: 'PATRULLAJE',
        descripcion: ''
      });
      cargarNovedades();
      alert("Novedad asentada en el libro de guardia exitosamente.");
    } catch (err) {
      alert("Error al registrar la novedad.");
    }
  };

  return (
    <div className="space-y-6">
      <div className="pb-4 border-b border-slate-200 flex flex-col sm:flex-row justify-between sm:items-center gap-3">
        <div>
          <span className="text-[11px] font-bold text-police-700 uppercase tracking-wider flex items-center space-x-1">
            <BookOpen className="w-3.5 h-3.5" />
            <span>Libro de Guardia y Bitácora Operativa</span>
          </span>
          <h1 className="text-xl font-black text-slate-900">Registro Diario de Novedades</h1>
          <p className="text-xs text-slate-500">Distrito Esmeraldas • Subzona N° 8</p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="px-4 py-2 bg-police-800 hover:bg-police-900 text-white font-bold text-xs rounded-xl shadow-sm flex items-center space-x-2 shrink-0"
        >
          <Plus className="w-3.5 h-3.5 text-accent-gold" />
          <span>Asentar Novedad</span>
        </button>
      </div>

      {/* Lista de Novedades */}
      <div className="space-y-3">
        {novedades.map(n => (
          <div key={n.id} className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm space-y-2">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-slate-100 pb-2">
              <div className="flex items-center space-x-2">
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-police-100 text-police-800 border border-police-200">
                  {n.tipo_novedad}
                </span>
                <span className="text-xs font-bold text-slate-800 flex items-center space-x-1">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" />
                  <span>{n.sector}</span>
                </span>
              </div>
              <span className="text-[11px] text-slate-400 flex items-center space-x-1">
                <Clock className="w-3 h-3" />
                <span>{new Date(n.fecha_reporte).toLocaleString('es-EC')}</span>
              </span>
            </div>

            <p className="text-xs text-slate-700 leading-relaxed">{n.descripcion}</p>

            <div className="pt-2 text-[11px] text-slate-500 flex items-center space-x-1">
              <User className="w-3 h-3 text-slate-400" />
              <span>Reportado por: <strong className="text-slate-700">{n.usuario ? `${n.usuario.nombres} ${n.usuario.apellidos} (${n.usuario.rango || 'Agente'})` : 'Oficial de Guardia'}</strong></span>
            </div>
          </div>
        ))}
      </div>

      {/* Modal para asentar novedad */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <h3 className="text-base font-black text-slate-900 mb-4">Asentar Registro en Libro de Guardia</h3>
            <form onSubmit={handleSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Sector / Circuito *</label>
                <input
                  type="text"
                  required
                  value={formData.sector}
                  onChange={(e) => setFormData({ ...formData, sector: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-police-700"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Naturaleza de la Novedad *</label>
                <select
                  value={formData.tipo_novedad}
                  onChange={(e) => setFormData({ ...formData, tipo_novedad: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-police-700 font-semibold"
                >
                  <option value="PATRULLAJE">Patrullaje Preventivo Móvil / A pie</option>
                  <option value="OPERATIVO">Operativo de Control y Registro</option>
                  <option value="DETENCION">Aprehensión / Detención de Ciudadano</option>
                  <option value="INCIDENTE">Incidente o Alteración de Orden</option>
                  <option value="RELEVO">Relevo de Turno y Entrega de Puesto</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Descripción Circunstanciada *</label>
                <textarea
                  rows={4}
                  required
                  value={formData.descripcion}
                  onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                  placeholder="Detalle sin tachaduras las actividades cumplidas, personal a cargo, novedades de armamento o vehículos..."
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-police-700"
                ></textarea>
              </div>

              <div className="pt-3 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border rounded-lg font-bold text-slate-600 hover:bg-slate-100"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-police-800 hover:bg-police-900 text-white rounded-lg font-bold"
                >
                  Guardar Novedad
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
