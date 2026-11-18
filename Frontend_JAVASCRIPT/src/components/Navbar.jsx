import React from 'react';
import { Shield, LogIn, LogOut, User, Bell, Activity } from 'lucide-react';

export default function Navbar({ user, onLogout, onNavigate, activeTab }) {
  return (
    <header className="bg-police-900 border-b border-police-800 text-white sticky top-0 z-50 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Logo y Nombre del Sistema */}
        <div 
          onClick={() => onNavigate('inicio')}
          className="flex items-center space-x-3 cursor-pointer group select-none"
        >
          <div className="w-10 h-10 rounded-lg p-1 bg-police-800 border border-police-700 flex items-center justify-center group-hover:border-accent-gold transition-colors">
            <img src="/assets/logo_sigesp.svg" alt="SIGESP Emblema" className="w-8 h-8" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-extrabold text-lg tracking-wider text-white">SIGESP</span>
              <span className="text-[10px] uppercase font-bold tracking-widest px-2 py-0.5 rounded bg-police-800 text-accent-gold border border-police-700">
                PROTOTIPO ACADÉMICO
              </span>
            </div>
            <p className="text-xs text-slate-300 font-medium">Sistema Integral de Gestión Policial</p>
          </div>
        </div>

        {/* Acciones del Sistema */}
        <div className="flex items-center space-x-4">
          {/* Navegación rápida */}
          <button
            onClick={() => onNavigate('inicio')}
            className={`text-xs sm:text-sm font-semibold px-3 py-1.5 rounded-md transition-colors ${
              activeTab === 'inicio' ? 'bg-police-800 text-accent-gold' : 'text-slate-300 hover:text-white hover:bg-police-800/60'
            }`}
          >
            Servicios del Sistema
          </button>

          {user ? (
            <div className="flex items-center space-x-3 pl-3 border-l border-police-700">
              {/* Información del Personal Logueado */}
              <div className="text-right hidden sm:block">
                <p className="text-xs font-bold text-white flex items-center justify-end space-x-1">
                  <span>{user.nombre_completo}</span>
                </p>
                <div className="flex items-center justify-end space-x-1.5 text-[11px] text-slate-300">
                  <span className="text-accent-gold font-semibold">{user.rol}</span>
                  {user.placa && user.placa !== 'N/A' && (
                    <>
                      <span>•</span>
                      <span>Placa: {user.placa}</span>
                    </>
                  )}
                </div>
              </div>

              {/* Botón Salir */}
              <button
                onClick={onLogout}
                title="Cerrar Sesión"
                className="flex items-center space-x-1 bg-rose-900/40 hover:bg-rose-800/80 text-rose-200 border border-rose-700/50 px-3 py-1.5 rounded-md text-xs font-semibold transition-all shadow-sm"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden md:inline">Salir</span>
              </button>
            </div>
          ) : (
            <button
              onClick={() => onNavigate('login')}
              className="flex items-center space-x-2 bg-accent-gold hover:bg-accent-goldDark text-police-950 font-bold px-4 py-2 rounded-md text-xs sm:text-sm transition-all shadow-sm shadow-accent-gold/20"
            >
              <LogIn className="w-4 h-4" />
              <span>Acceso al Sistema</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
