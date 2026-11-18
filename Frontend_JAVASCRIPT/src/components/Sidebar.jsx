import React from 'react';
import { 
  Home, 
  FileText, 
  Users, 
  ShieldAlert, 
  Scale, 
  Calendar, 
  BarChart3, 
  Clock, 
  ClipboardList, 
  ShieldCheck, 
  Search,
  BookOpen,
  Radio,
  MapPin
} from 'lucide-react';

export default function Sidebar({ user, activeTab, onNavigate }) {
  if (!user) return null;

  const rol = user.rol;

  // Definición de ítems del menú según RBAC
  const menuItems = [
    { id: 'inicio', label: 'Servicios del Sistema', icon: Home, roles: ['ADMIN', 'POLICIA_FLAGRANCIA', 'POLICIA_JUDICIAL', 'SUPERVISOR', 'CIUDADANO'] },
    
    // Módulo especial exclusivo del Ciudadano (Angelo Cabezas)
    { id: 'panico', label: 'Botón de Pánico (SOS 911)', icon: Radio, roles: ['CIUDADANO'] },
    
    // Módulos Flagrancia (Juliana Enríquez)
    { id: 'flagrancia', label: 'Bandeja de Flagrancia (PF)', icon: ShieldAlert, roles: ['POLICIA_FLAGRANCIA', 'ADMIN', 'SUPERVISOR'] },
    
    // Módulos Policía Judicial (Jany Perea)
    { id: 'judicial', label: 'Investigación Judicial (PJ)', icon: FileText, roles: ['POLICIA_JUDICIAL', 'ADMIN', 'SUPERVISOR'] },
    { id: 'audiencias', label: 'Audiencias y Juzgados', icon: Scale, roles: ['POLICIA_JUDICIAL', 'ADMIN', 'SUPERVISOR'] },

    // Módulos Supervisor (Karol Mena)
    { id: 'despacho', label: 'Despacho y Asignaciones', icon: ShieldCheck, roles: ['SUPERVISOR', 'ADMIN'] },
    { id: 'reportes', label: 'Reportes y Métricas', icon: BarChart3, roles: ['SUPERVISOR', 'ADMIN'] },

    // Módulo Administrativo (Jordan Wila)
    { id: 'admin_personal', label: 'Personal y Usuarios', icon: Users, roles: ['ADMIN'] },
    { id: 'admin_auditoria', label: 'Bitácora de Auditoría', icon: ClipboardList, roles: ['ADMIN'] },

    // Módulos Compartidos
    { id: 'novedades', label: 'Libro de Guardia (Novedades)', icon: BookOpen, roles: ['POLICIA_FLAGRANCIA', 'POLICIA_JUDICIAL', 'SUPERVISOR', 'ADMIN'] },
    { id: 'sedes', label: 'Salas y UPC en Mapa', icon: MapPin, roles: ['ADMIN', 'POLICIA_FLAGRANCIA', 'POLICIA_JUDICIAL', 'SUPERVISOR', 'CIUDADANO'] },
    { id: 'consulta_expediente', label: 'Rastrear Trámite', icon: Search, roles: ['ADMIN', 'POLICIA_FLAGRANCIA', 'POLICIA_JUDICIAL', 'SUPERVISOR', 'CIUDADANO'] },
  ];

  const visibleItems = menuItems.filter(item => item.roles.includes(rol));

  return (
    <aside className="w-64 bg-slate-900 border-r border-slate-800 min-h-[calc(100vh-4rem)] flex flex-col justify-between p-4 shadow-sm">
      <div className="space-y-6">
        {/* Encabezado del Perfil */}
        <div className="bg-slate-800/80 rounded-xl p-3.5 border border-slate-700/60">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-lg bg-police-800 border border-police-700 flex items-center justify-center text-accent-gold font-bold text-sm">
              {user.nombre_completo.charAt(0)}
            </div>
            <div className="overflow-hidden">
              <p className="text-xs font-bold text-white truncate">{user.nombre_completo}</p>
              <p className="text-[11px] text-accent-gold font-medium">{user.rango || user.rol}</p>
              {user.cedula && (
                <p className="text-[10px] text-slate-400 font-mono">C.I.: {user.cedula}</p>
              )}
            </div>
          </div>
        </div>

        {/* Lista de Navegación */}
        <nav className="space-y-1">
          <p className="px-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
            Módulos del Sistema
          </p>
          {visibleItems.map(item => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            const isPanico = item.id === 'panico';
            return (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg text-xs font-medium transition-all ${
                  isPanico
                    ? 'bg-rose-900/60 hover:bg-rose-800/90 text-rose-100 font-bold border border-rose-700/60 animate-pulse'
                    : isActive
                    ? 'bg-police-700 text-white shadow-sm font-semibold border-l-4 border-accent-gold'
                    : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                }`}
              >
                <Icon className={`w-4 h-4 ${isPanico ? 'text-rose-300' : isActive ? 'text-accent-gold' : 'text-slate-400'}`} />
                <span className="truncate">{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Pie del Menú con datos de Interoperabilidad */}
      <div className="pt-4 border-t border-slate-800 text-[11px] text-slate-400">
        <div className="flex items-center space-x-1.5 text-slate-300 font-semibold mb-1">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
          <span>Red Interinstitucional</span>
        </div>
        <p className="text-[10px] text-slate-400">Migración • Registro Civil • IESS • Banco</p>
      </div>
    </aside>
  );
}
