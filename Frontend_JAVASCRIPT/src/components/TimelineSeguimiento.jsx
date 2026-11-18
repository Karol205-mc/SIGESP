import React from 'react';
import { CheckCircle2, Clock, AlertCircle, FileText, Scale, PauseCircle } from 'lucide-react';

// Flujo de estados específicos solicitados
const ESTADOS_PROCEDIMENTALES = [
  { nombre: 'Esperando documentos', desc: 'Recepción y acopio de requisitos', color: 'amber' },
  { nombre: 'Tramitando', desc: 'Actuaciones e investigación pericial', color: 'blue' },
  { nombre: 'Procesado', desc: 'Expediente analizado por fiscalía', color: 'indigo' },
  { nombre: 'En juicio', desc: 'Audiencia penal y juzgamiento', color: 'purple' },
  { nombre: 'Aplazado', desc: 'Suspendido temporalmente por juez', color: 'orange' },
  { nombre: 'Finalizado', desc: 'Sentencia judicial o archivo', color: 'emerald' }
];

export default function TimelineSeguimiento({ estadoActual, historial = [] }) {
  // Mapear compatibilidad de estados estándar con los estados específicos
  let estadoNormalizado = estadoActual;
  if (estadoActual === 'Registrada' || estadoActual === 'En revisión') {
    estadoNormalizado = 'Esperando documentos';
  } else if (estadoActual === 'Asignada' || estadoActual === 'En proceso') {
    estadoNormalizado = 'Tramitando';
  } else if (estadoActual === 'Audiencia / Judicializada') {
    estadoNormalizado = 'En juicio';
  } else if (estadoActual === 'Atendida / Cerrada' || estadoActual === 'Archivada') {
    estadoNormalizado = 'Finalizado';
  }

  const currentIndex = ESTADOS_PROCEDIMENTALES.findIndex(e => e.nombre.toLowerCase() === estadoNormalizado?.toLowerCase());

  return (
    <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm space-y-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-slate-100 pb-3">
        <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center space-x-2">
          <Clock className="w-4 h-4 text-police-700" />
          <span>Fases Procedimentales del Trámite</span>
        </h3>
        <span className="px-3 py-1 rounded-full text-xs font-black bg-police-900 text-white flex items-center space-x-1.5 shadow-sm">
          <span className="w-2 h-2 rounded-full bg-accent-gold animate-ping"></span>
          <span>Estado Actual: {estadoActual}</span>
        </span>
      </div>

      {/* Barra de progreso de los 6 estados específicos */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
        {ESTADOS_PROCEDIMENTALES.map((item, idx) => {
          const isCompleted = idx < currentIndex;
          const isCurrent = idx === currentIndex || item.nombre.toLowerCase() === estadoActual?.toLowerCase();

          return (
            <div 
              key={item.nombre}
              className={`p-2.5 rounded-xl border text-center transition-all ${
                isCurrent 
                  ? 'bg-police-950 text-white border-police-950 ring-2 ring-accent-gold/60 shadow-md' 
                  : isCompleted
                  ? 'bg-emerald-50 text-emerald-900 border-emerald-300'
                  : 'bg-slate-50 text-slate-400 border-slate-200'
              }`}
            >
              <div className="text-[9px] font-bold uppercase tracking-wider mb-0.5 opacity-80">
                Paso {idx + 1}
              </div>
              <div className="text-xs font-extrabold leading-tight flex items-center justify-center space-x-1">
                {isCompleted && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />}
                {isCurrent && <span className="w-2 h-2 rounded-full bg-accent-gold shrink-0"></span>}
                <span className="truncate">{item.nombre}</span>
              </div>
              <p className="text-[10px] mt-1 line-clamp-2 opacity-75">
                {item.desc}
              </p>
            </div>
          );
        })}
      </div>

      {/* Historial detallado de eventos */}
      {historial.length > 0 && (
        <div className="space-y-3 pt-3 border-t border-slate-100">
          <p className="text-xs font-bold text-slate-700 uppercase tracking-wider">Historial de Actualizaciones Oficiales</p>
          <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
            {historial.map((item, i) => (
              <div key={i} className="flex items-start space-x-3 text-xs p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                <div className="w-2 h-2 rounded-full bg-police-700 mt-1.5 shrink-0"></div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-police-900">
                      {item.estado_anterior ? `${item.estado_anterior} → ` : ''}{item.estado_nuevo}
                    </span>
                    <span className="text-[11px] text-slate-400">
                      {new Date(item.fecha_cambio).toLocaleString('es-EC')}
                    </span>
                  </div>
                  <p className="text-slate-600 mt-0.5">{item.observaciones || 'Actualización registrada en el expediente'}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
