import React, { useState } from 'react';
import api from '../services/api';
import { Lock, User, KeyRound, Shield, LogIn, ExternalLink, AlertCircle, UserPlus } from 'lucide-react';

export default function Login({ onLoginSuccess, onCancel, onIrARegistro }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Perfiles preconfigurados del equipo para pruebas rápidas
  const perfilesEquipo = [
    { name: 'Jordan Wila Portilla', user: 'jordan.wila', pass: 'jordan123', rol: 'ADMIN (Administrador)', color: 'border-amber-400 bg-amber-50 text-amber-900' },
    { name: 'Juliana Enríquez', user: 'juliana.enriquez', pass: 'juliana123', rol: 'POLICIA_FLAGRANCIA (PF)', color: 'border-rose-400 bg-rose-50 text-rose-900' },
    { name: 'Jany Perea', user: 'jany.perea', pass: 'jany123', rol: 'POLICIA_JUDICIAL (PJ)', color: 'border-blue-400 bg-blue-50 text-blue-900' },
    { name: 'Karol Mena', user: 'karol.mena', pass: 'karol123', rol: 'SUPERVISOR (Despacho)', color: 'border-purple-400 bg-purple-50 text-purple-900' },
    { name: 'Angelo Cabezas', user: 'angelo.cabezas', pass: 'angelo123', rol: 'CIUDADANO', color: 'border-emerald-400 bg-emerald-50 text-emerald-900' }
  ];

  const handleLogin = async (e) => {
    e?.preventDefault();
    if (!username || !password) return;

    setLoading(true);
    setError('');

    try {
      const res = await api.post('/auth/login', { username, password });
      const data = res.data;
      
      localStorage.setItem('sigesp_token', data.access_token);
      localStorage.setItem('sigesp_user', JSON.stringify(data));
      
      onLoginSuccess(data);
    } catch (err) {
      setError(err.response?.data?.detail || 'Credenciales inválidas o error de conexión.');
    } finally {
      setLoading(false);
    }
  };

  const seleccionarPerfil = (u, p) => {
    setUsername(u);
    setPassword(p);
    setError('');
  };

  const handleKeycloakSSO = () => {
    const keycloakAuthUrl = 'http://localhost:8080/realms/Policia/protocol/openid-connect/auth' +
      '?client_id=sigesp-policia' +
      '&response_type=token' +
      '&redirect_uri=' + encodeURIComponent(window.location.origin) +
      '&scope=openid';
    
    window.location.href = keycloakAuthUrl;
  };

  return (
    <div className="max-w-md mx-auto px-4 py-8">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xl overflow-hidden">
        {/* Cabecera */}
        <div className="bg-police-950 p-6 text-white text-center border-b border-police-800">
          <div className="w-14 h-14 mx-auto rounded-xl bg-police-800 border border-police-700 flex items-center justify-center p-2 mb-3 shadow-inner">
            <img src="/assets/logo_sigesp.svg" alt="SIGESP" className="w-10 h-10" />
          </div>
          <h2 className="text-xl font-black tracking-tight">Acceso al Sistema</h2>
          <p className="text-xs text-slate-300 mt-1">Identificación de Personal y Usuarios Autorizados</p>
        </div>

        <div className="p-6 space-y-5">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Usuario / Cédula / Placa</label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="ej. jordan.wila, angelo.cabezas o C.I."
                  className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-police-700 font-medium"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Contraseña</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-police-700 font-medium"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-police-800 hover:bg-police-900 text-white font-bold text-xs rounded-lg transition-colors flex items-center justify-center space-x-2 shadow-sm disabled:opacity-50"
            >
              <LogIn className="w-4 h-4" />
              <span>{loading ? 'Validando credenciales...' : 'Ingresar'}</span>
            </button>
          </form>

          {/* Botón de Registro Ciudadano */}
          <div className="pt-2 text-center">
            <button
              type="button"
              onClick={onIrARegistro}
              className="w-full py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 font-bold text-xs rounded-lg transition-colors flex items-center justify-center space-x-1.5"
            >
              <UserPlus className="w-4 h-4 text-emerald-600" />
              <span>¿Eres Ciudadano? Crea tu Cuenta Aquí</span>
            </button>
          </div>

          {/* Botón Keycloak SSO */}
          <div className="pt-3 border-t border-slate-200">
            <button
              type="button"
              onClick={handleKeycloakSSO}
              className="w-full py-2 bg-slate-900 hover:bg-black text-slate-100 font-semibold text-xs rounded-lg border border-slate-700 transition-colors flex items-center justify-center space-x-2 shadow-sm"
            >
              <ExternalLink className="w-3.5 h-3.5 text-accent-gold" />
              <span>Iniciar con Keycloak SSO (:8080)</span>
            </button>
            <p className="text-[10px] text-center text-slate-400 mt-1">
              Realm: <span className="font-semibold text-slate-600">Policia</span>
            </p>
          </div>

          {/* Accesos Rápidos del Equipo Oficial */}
          <div className="pt-3 border-t border-slate-200">
            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">
              Selección Rápida de Integrantes:
            </p>
            <div className="grid grid-cols-1 gap-1.5">
              {perfilesEquipo.map((p, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => seleccionarPerfil(p.user, p.pass)}
                  className={`text-left p-2 rounded-lg border text-xs transition-all flex items-center justify-between ${p.color} hover:opacity-90`}
                >
                  <div>
                    <span className="font-bold block leading-tight">{p.name}</span>
                    <span className="text-[10px] opacity-80">{p.rol}</span>
                  </div>
                  <span className="text-[10px] font-mono opacity-70 bg-white/50 px-1.5 py-0.5 rounded">
                    {p.user}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div className="text-center pt-2">
            <button
              type="button"
              onClick={onCancel}
              className="text-xs text-slate-500 hover:text-slate-800 font-semibold"
            >
              Volver a Servicios Ciudadanos
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
