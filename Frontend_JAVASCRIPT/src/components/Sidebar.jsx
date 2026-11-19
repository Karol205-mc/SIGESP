import React from 'react';
import { 
  Home, 
  FileText, 
  Users, 
  ShieldAlert, 
  Scale, 
  BarChart3, 
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

  // Estructura de secciones jerárquicas y separadores por rol
  const getNavigationSections = (rol) => {
    if (rol === 'CIUDADANO') {
      return [
        {
          id: 'sec_ciudadano',
          title: 'Módulos de Atención Ciudadana',
          items: [
            { id: 'panico', label: 'Botón de Pánico (SOS 911)', icon: Radio, isPanico: true },
            { id: 'inicio', label: 'Servicios del Sistema', icon: Home },
            { id: 'sedes', label: 'Salas y UPC en Mapa', icon: MapPin },
            { id: 'consulta_expediente', label: 'Rastrear Trámite', icon: Search },
          ]
        }
      ];
    }

    if (rol === 'POLICIA_FLAGRANCIA') {
      return [
        {
          id: 'sec_pf_mando',
          title: 'Mando Operativo Flagrancia',
          items: [
            { id: 'flagrancia', label: 'Bandeja de Flagrancia (PF)', icon: ShieldAlert },
            { id: 'novedades', label: 'Libro de Guardia (Novedades)', icon: BookOpen },
          ]
        },
        {
          id: 'sec_pf_servicios',
          title: 'Servicios Varios y Consultas',
          items: [
            { id: 'sedes', label: 'Salas y UPC en Mapa', icon: MapPin },
            { id: 'consulta_expediente', label: 'Rastrear Trámite', icon: Search },
          ]
        }
      ];
    }

    if (rol === 'POLICIA_JUDICIAL') {
      return [
        {
          id: 'sec_pj_investigacion',
          title: 'Investigación Penal (PJ)',
          items: [
            { id: 'judicial', label: 'Investigación Judicial (PJ)', icon: FileText },
            { id: 'audiencias', label: 'Audiencias y Juzgados', icon: Scale },
            { id: 'novedades', label: 'Libro de Guardia (Novedades)', icon: BookOpen },
          ]
        },
        {
          id: 'sec_pj_servicios',
          title: 'Servicios Varios y Consultas',
          items: [
            { id: 'sedes', label: 'Salas y UPC en Mapa', icon: MapPin },
            { id: 'consulta_expediente', label: 'Rastrear Trámite', icon: Search },
          ]
        }
      ];
    }

    if (rol === 'SUPERVISOR') {
      return [
        {
          id: 'sec_sup_mando',
          title: 'Gestión y Mando Principal',
          items: [
            { id: 'despacho', label: 'Despacho y Asignaciones', icon: ShieldCheck },
            { id: 'reportes', label: 'Reportes y Métricas', icon: BarChart3 },
          ]
        },
        {
          id: 'sec_sup_bandejas',
          title: 'Control y Bandejas Penales',
          items: [
            { id: 'flagrancia', label: 'Bandeja de Flagrancia (PF)', icon: ShieldAlert },
            { id: 'judicial', label: 'Investigación Judicial (PJ)', icon: FileText },
            { id: 'audiencias', label: 'Audiencias y Juzgados', icon: Scale },
            { id: 'novedades', label: 'Libro de Guardia (Novedades)', icon: BookOpen },
          ]
        },
        {
          id: 'sec_sup_servicios',
          title: 'Servicios Varios y Consultas',
          items: [
            { id: 'inicio', label: 'Servicios del Sistema', icon: Home },
            { id: 'sedes', label: 'Salas y UPC en Mapa', icon: MapPin },
            { id: 'consulta_expediente', label: 'Rastrear Trámite', icon: Search },
          ]
        }
      ];
    }

    if (rol === 'ADMIN') {
      return [
        {
          id: 'sec_adm_control',
          title: 'Administración y Control Global',
          items: [
            { id: 'admin_personal', label: 'Personal y Usuarios', icon: Users },
            { id: 'admin_auditoria', label: 'Bitácora de Auditoría', icon: ClipboardList },
            { id: 'reportes', label: 'Reportes y Métricas', icon: BarChart3 },
          ]
        },
        {
          id: 'sec_adm_operaciones',
          title: 'Supervisión y Operaciones Penales',
          items: [
            { id: 'despacho', label: 'Despacho y Asignaciones', icon: ShieldCheck },
            { id: 'flagrancia', label: 'Bandeja de Flagrancia (PF)', icon: ShieldAlert },
            { id: 'judicial', label: 'Investigación Judicial (PJ)', icon: FileText },
            { id: 'audiencias', label: 'Audiencias y Juzgados', icon: Scale },
            { id: 'novedades', label: 'Libro de Guardia (Novedades)', icon: BookOpen },
          ]
        },
        {
          id: 'sec_adm_servicios',
          title: 'Servicios Varios y Consultas',
          items: [
            { id: 'inicio', label: 'Servicios del Sistema', icon: Home },
            { id: 'sedes', label: 'Salas y UPC en Mapa', icon: MapPin },
            { id: 'consulta_expediente', label: 'Rastrear Trámite', icon: Search },
          ]
        }
      ];
    }

    return [];
  };

  const sections = getNavigationSections(rol);

  return (
    <aside className="w-64 bg-slate-900 border-r border-slate-800 min-h-[calc(100vh-4rem)] flex flex-col justify-between p-4 shadow-sm">
      <div className="space-y-4">
        {/* Encabezado del Perfil */}
        <div className="bg-slate-800/80 rounded-xl p-3 border border-slate-700/60">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-lg bg-police-800 border border-police-700 flex items-center justify-center text-accent-gold font-bold text-sm shrink-0">
              {user.nombre_completo.charAt(0)}
            </div>
            <div className="overflow-hidden">
              <p className="text-xs font-bold text-white truncate">{user.nombre_completo}</p>
              <p className="text-[11px] text-accent-gold font-medium truncate">{user.rango || user.rol}</p>
              {user.cedula && (
                <p className="text-[10px] text-slate-400 font-mono">C.I.: {user.cedula}</p>
              )}
            </div>
          </div>
        </div>

        {/* Lista de Navegación con Separadores y Secciones por Rol */}
        <nav className="space-y-3">
          {sections.map((section, idx) => (
            <div key={section.id} className="space-y-1">
              {/* Separador visual entre secciones */}
              {idx > 0 && (
                <div className="pt-2 pb-1">
                  <div className="h-px bg-slate-800 border-t border-slate-700/70"></div>
                </div>
              )}

              {/* Título de la Sección */}
              {section.title && rol !== 'CIUDADANO' && (
                <div className="px-2.5 py-1 flex items-center space-x-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-accent-gold shrink-0"></span>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider truncate">
                    {section.title}
                  </p>
                </div>
              )}

              {section.title && rol === 'CIUDADANO' && (
                <p className="px-2.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                  {section.title}
                </p>
              )}

              {/* Botones de Navegación de la Sección */}
              <div className="space-y-1">
                {section.items.map(item => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;
                  const isPanico = item.isPanico;
                  return (
                    <button
                      key={item.id}
                      onClick={() => onNavigate(item.id)}
                      className={`w-full flex items-center space-x-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                        isPanico
                          ? 'bg-rose-900/60 hover:bg-rose-800/90 text-rose-100 font-bold border border-rose-700/60 animate-pulse mb-2'
                          : isActive
                          ? 'bg-police-700 text-white shadow-sm font-semibold border-l-4 border-accent-gold'
                          : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                      }`}
                    >
                      <Icon className={`w-4 h-4 shrink-0 ${isPanico ? 'text-rose-300' : isActive ? 'text-accent-gold' : 'text-slate-400'}`} />
                      <span className="truncate text-left">{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>
      </div>

      {/* Pie del Menú con datos de Interoperabilidad */}
      <div className="pt-3 border-t border-slate-800 text-[11px] text-slate-400">
        <div className="flex items-center space-x-1.5 text-slate-300 font-semibold mb-1">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
          <span>Red Interinstitucional</span>
        </div>
        <p className="text-[10px] text-slate-400">Migración • Registro Civil • IESS • Banco</p>
      </div>
    </aside>
  );
}
