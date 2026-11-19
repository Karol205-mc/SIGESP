import React, { useState, useEffect } from 'react';
import api from './services/api';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import PortalCiudadano from './pages/PortalCiudadano';
import Login from './pages/Login';
import RegistroCiudadano from './pages/RegistroCiudadano';
import BotonPanico from './pages/BotonPanico';
import DashboardAdmin from './pages/DashboardAdmin';
import BandejaFlagrancia from './pages/BandejaFlagrancia';
import BandejaJudicial from './pages/BandejaJudicial';
import PanelAudiencias from './pages/PanelAudiencias';
import DespachoSupervisor from './pages/DespachoSupervisor';
import ReportesEstadisticos from './pages/ReportesEstadisticos';
import LibroNovedades from './pages/LibroNovedades';
import SedesPoliciales from './pages/SedesPoliciales';

export default function App() {
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState('inicio');

  useEffect(() => {
    // 1. Capturar retorno de Keycloak SSO desde hash (#access_token=...)
    if (window.location.hash && window.location.hash.includes('access_token=')) {
      const hashParams = new URLSearchParams(window.location.hash.substring(1));
      const accessToken = hashParams.get('access_token');
      if (accessToken) {
        try {
          const payloadBase64 = accessToken.split('.')[1];
          const payloadJson = decodeURIComponent(
            atob(payloadBase64.replace(/-/g, '+').replace(/_/g, '/'))
              .split('')
              .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
              .join('')
          );
          const payload = JSON.parse(payloadJson);
          const roles = payload.realm_access?.roles || [];
          let roleMapped = 'CIUDADANO';
          for (const r of roles) {
            const ru = r.toUpperCase();
            if (ru.includes('ADMIN')) { roleMapped = 'ADMIN'; break; }
            if (ru.includes('FLAGRANCIA') || ru.includes('PF')) { roleMapped = 'POLICIA_FLAGRANCIA'; break; }
            if (ru.includes('JUDICIAL') || ru.includes('PJ')) { roleMapped = 'POLICIA_JUDICIAL'; break; }
            if (ru.includes('SUPERVISOR')) { roleMapped = 'SUPERVISOR'; break; }
          }

          const sigespUser = {
            id: payload.sub,
            username: payload.preferred_username || 'admin',
            nombre_completo: payload.name || `${payload.given_name || 'Jordan'} ${payload.family_name || 'Wila Portilla'}`,
            nombres: payload.given_name || 'Jordan',
            apellidos: payload.family_name || 'Wila Portilla',
            rol: roleMapped,
            email: payload.email || 'admin@policia.gob.ec',
            cedula: '0802345678',
            placa: 'PN-00101',
            rango: 'Coronel de Policía'
          };

          localStorage.setItem('sigesp_token', accessToken);
          localStorage.setItem('sigesp_user', JSON.stringify(sigespUser));
          setUser(sigespUser);

          if (roleMapped === 'ADMIN') {
            setActiveTab('admin_personal');
          } else if (roleMapped === 'POLICIA_FLAGRANCIA') {
            setActiveTab('flagrancia');
          } else if (roleMapped === 'POLICIA_JUDICIAL') {
            setActiveTab('judicial');
          } else if (roleMapped === 'SUPERVISOR') {
            setActiveTab('despacho');
          } else {
            setActiveTab('inicio');
          }

          window.history.replaceState({}, document.title, window.location.pathname);
          return;
        } catch (e) {
          console.error('Error al decodificar token Keycloak:', e);
        }
      }
    }

    // Restaurar sesión local si existe
    const savedUser = localStorage.getItem('sigesp_user');
    const token = localStorage.getItem('sigesp_token');
    if (savedUser) {
      try {
        const parsed = JSON.parse(savedUser);
        setUser(parsed);
        // Si el rol operativo no tiene acceso a 'inicio', dirigirlo a su módulo principal
        if (parsed.rol === 'POLICIA_FLAGRANCIA') {
          setActiveTab('flagrancia');
        } else if (parsed.rol === 'POLICIA_JUDICIAL') {
          setActiveTab('judicial');
        } else if (parsed.rol === 'SUPERVISOR') {
          setActiveTab('despacho');
        } else if (parsed.rol === 'ADMIN') {
          setActiveTab('admin_personal');
        }
        // Sincronizar con backend para asegurar datos completos y actualizados (cédula, nombres, dirección)
        if (token) {
          api.get('/auth/me').then(res => {
            if (res.data && res.data.id) {
              const full = { ...parsed, ...res.data };
              setUser(full);
              localStorage.setItem('sigesp_user', JSON.stringify(full));
            }
          }).catch(() => {});
        }
      } catch (e) {
        localStorage.removeItem('sigesp_user');
      }
    }
  }, []);

  const handleLoginSuccess = (userData) => {
    setUser(userData);
    localStorage.setItem('sigesp_user', JSON.stringify(userData));
    switch (userData.rol) {
      case 'ADMIN':
        setActiveTab('admin_personal');
        break;
      case 'POLICIA_FLAGRANCIA':
        setActiveTab('flagrancia');
        break;
      case 'POLICIA_JUDICIAL':
        setActiveTab('judicial');
        break;
      case 'SUPERVISOR':
        setActiveTab('despacho');
        break;
      case 'CIUDADANO':
        setActiveTab('inicio');
        break;
      default:
        setActiveTab('inicio');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('sigesp_token');
    localStorage.removeItem('sigesp_user');
    setUser(null);
    setActiveTab('inicio');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      {/* Barra de Navegación Superior */}
      <Navbar 
        user={user} 
        onLogout={handleLogout} 
        onNavigate={(tab) => setActiveTab(tab)} 
        activeTab={activeTab}
      />

      <div className="flex-1 flex">
        {/* Barra Lateral solo para usuarios autenticados */}
        {user && activeTab !== 'login' && activeTab !== 'registro' && (
          <Sidebar 
            user={user} 
            activeTab={activeTab} 
            onNavigate={(tab) => setActiveTab(tab)} 
          />
        )}

        {/* Contenedor Principal de Vistas */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full">
          {/* Vista: Inicio / Servicios Ciudadanos */}
          {(activeTab === 'inicio' || activeTab === 'consulta_expediente') && (
            <PortalCiudadano 
              user={user} 
              onNavigateToLogin={() => setActiveTab('login')} 
              onRegistroExitoso={handleLoginSuccess}
              seccionInicial={activeTab === 'consulta_expediente' ? 'consulta' : 'menu'}
            />
          )}

          {/* Vista: Acceso al Sistema */}
          {activeTab === 'login' && (
            <Login 
              onLoginSuccess={handleLoginSuccess} 
              onCancel={() => setActiveTab('inicio')} 
              onIrARegistro={() => setActiveTab('registro')}
            />
          )}

          {/* Vista: Registro de Cuenta Ciudadana */}
          {activeTab === 'registro' && (
            <RegistroCiudadano 
              onRegistroExitoso={handleLoginSuccess} 
              onVolver={() => setActiveTab('inicio')} 
            />
          )}

          {/* Vista: Botón de Pánico Digital (Auxilio Inmediato SOS) */}
          {activeTab === 'panico' && (
            <BotonPanico 
              user={user} 
              onVolver={() => setActiveTab('inicio')} 
              onNavigateToLogin={() => setActiveTab('login')}
            />
          )}

          {/* Vista: Sedes Policiales y UPCs en OpenStreetMap */}
          {activeTab === 'sedes' && (
            <SedesPoliciales onVolver={() => setActiveTab('inicio')} />
          )}

          {/* Vista: Administración General (Jordan Wila) */}
          {(activeTab === 'admin_personal' || activeTab === 'admin_auditoria') && (
            <DashboardAdmin />
          )}

          {/* Vista: Bandeja Flagrancia (Juliana Enríquez) */}
          {activeTab === 'flagrancia' && (
            <BandejaFlagrancia user={user} />
          )}

          {/* Vista: Bandeja Judicial (Jany Perea) */}
          {activeTab === 'judicial' && (
            <BandejaJudicial 
              user={user} 
              onNavigateToAudiencias={() => setActiveTab('audiencias')} 
            />
          )}

          {/* Vista: Audiencias y Diligencias Judiciales */}
          {activeTab === 'audiencias' && (
            <PanelAudiencias />
          )}

          {/* Vista: Despacho y Asignaciones (Karol Mena) */}
          {activeTab === 'despacho' && (
            <DespachoSupervisor user={user} />
          )}

          {/* Vista: Métricas y Reportes */}
          {activeTab === 'reportes' && (
            <ReportesEstadisticos />
          )}

          {/* Vista: Libro de Guardia / Novedades */}
          {activeTab === 'novedades' && (
            <LibroNovedades user={user} />
          )}

          {/* Atajo de rastreo de expediente */}
          {activeTab === 'consulta_expediente' && (
            <PortalCiudadano 
              user={user} 
              onNavigateToLogin={() => setActiveTab('login')} 
            />
          )}
        </main>
      </div>

      {/* Pie de Página Institucional y Académico */}
      <footer className="bg-police-950 text-slate-400 border-t border-police-900 py-6 text-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <img src="/assets/logo_sigesp.svg" alt="SIGESP" className="w-6 h-6 opacity-75" />
            <div>
              <p className="font-extrabold text-slate-200">SIGESP - Sistema Integral de Gestión Policial</p>
              <p className="text-[11px] text-slate-400">Norma Técnica IEEE 830-1998 • Puerto Asignado :8083</p>
            </div>
          </div>
          <div className="text-center sm:text-right text-[11px] text-slate-400">
            <p>Ecosistema Interoperable de 5 Grupos • UTE-LVT</p>
            <p className="text-accent-gold/80 font-medium">Prototipo Académico de Gestión Pública y Seguridad Digital</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
