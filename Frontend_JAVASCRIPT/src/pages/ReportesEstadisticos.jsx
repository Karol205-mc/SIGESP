import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { BarChart3, TrendingUp, ShieldAlert, CheckCircle2, Clock, Users, FileDown } from 'lucide-react';

export default function ReportesEstadisticos() {
  const [stats, setStats] = useState(null);
  const [cargando, setCargando] = useState(false);

  useEffect(() => {
    cargarEstadisticas();
  }, []);

  const cargarEstadisticas = async () => {
    setCargando(true);
    try {
      const res = await api.get('/reportes/estadisticas');
      setStats(res.data);
    } catch (err) {
      console.error("Error al cargar reportes", err);
    } finally {
      setCargando(false);
    }
  };

  const exportarCSV = () => {
    if (!stats) return;
    let csv = "Categoria,Total\n";
    stats.por_delito.forEach(d => {
      csv += `"${d.delito}",${d.total}\n`;
    });
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `reporte_delitos_sigesp_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (!stats) {
    return <div className="p-8 text-center text-xs text-slate-500">Cargando métricas institucionales...</div>;
  }

  const { resumen, por_estado, por_delito, por_tipo_tramite } = stats;

  return (
    <div className="space-y-6">
      <div className="pb-4 border-b border-slate-200 flex flex-col sm:flex-row justify-between sm:items-center gap-3">
        <div>
          <span className="text-[11px] font-bold text-police-700 uppercase tracking-wider flex items-center space-x-1">
            <BarChart3 className="w-3.5 h-3.5" />
            <span>Inteligencia y Análisis Policial</span>
          </span>
          <h1 className="text-xl font-black text-slate-900">Métricas y Reportes Estadísticos</h1>
          <p className="text-xs text-slate-500">Subzona Esmeraldas N° 8</p>
        </div>

        <button
          onClick={exportarCSV}
          className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs rounded-xl shadow-sm flex items-center space-x-2 shrink-0"
        >
          <FileDown className="w-3.5 h-3.5 text-accent-gold" />
          <span>Exportar Datos (CSV)</span>
        </button>
      </div>

      {/* Tarjetas de Indicadores Principales (KPIs) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-1">
          <span className="text-[10px] font-bold uppercase text-slate-400">Total Denuncias</span>
          <div className="text-2xl font-black text-slate-900">{resumen.total_denuncias}</div>
          <p className="text-[11px] text-slate-500">Registradas en el sistema</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-1">
          <span className="text-[10px] font-bold uppercase text-blue-500">En Investigación</span>
          <div className="text-2xl font-black text-blue-700">{resumen.en_proceso}</div>
          <p className="text-[11px] text-slate-500">Diligencias activas</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-1">
          <span className="text-[10px] font-bold uppercase text-purple-500">Judicializadas</span>
          <div className="text-2xl font-black text-purple-700">{resumen.judicializadas}</div>
          <p className="text-[11px] text-slate-500">Con fiscal y audiencia</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-1">
          <span className="text-[10px] font-bold uppercase text-emerald-500">Atendidas / Cerradas</span>
          <div className="text-2xl font-black text-emerald-700">{resumen.atendidas_cerradas}</div>
          <p className="text-[11px] text-slate-500">Procedimiento culminado</p>
        </div>
      </div>

      {/* Gráficas / Barras de Distribución */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Distribución por Categoría de Delito */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider border-b pb-3">
            Incidencia por Tipificación Delictiva
          </h2>
          <div className="space-y-3">
            {por_delito.map((d, i) => {
              const porcentaje = Math.round((d.total / (resumen.total_denuncias || 1)) * 100);
              return (
                <div key={i} className="space-y-1 text-xs">
                  <div className="flex justify-between font-semibold">
                    <span className="text-slate-800">{d.delito}</span>
                    <span className="text-police-900 font-bold">{d.total} ({porcentaje}%)</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                    <div 
                      className="h-full bg-police-700 rounded-full" 
                      style={{ width: `${porcentaje}%` }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Distribución por Estado del Trámite */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider border-b pb-3">
            Flujo de Estados de Casos
          </h2>
          <div className="space-y-3">
            {por_estado.map((e, i) => {
              const porcentaje = Math.round((e.total / (resumen.total_denuncias || 1)) * 100);
              return (
                <div key={i} className="space-y-1 text-xs">
                  <div className="flex justify-between font-semibold">
                    <span className="text-slate-800">{e.estado}</span>
                    <span className="text-police-900 font-bold">{e.total} casos</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                    <div 
                      className="h-full bg-accent-gold rounded-full" 
                      style={{ width: `${porcentaje}%` }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
