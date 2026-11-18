import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { Users, ClipboardList, Shield, Plus, ToggleLeft, ToggleRight, Check, X, Search } from 'lucide-react';

export default function DashboardAdmin() {
  const [tab, setTab] = useState('usuarios'); // 'usuarios' | 'auditoria'
  const [usuarios, setUsuarios] = useState([]);
  const [auditoria, setAuditoria] = useState([]);
  const [cargando, setCargando] = useState(false);
  const [filtroBusqueda, setFiltroBusqueda] = useState('');

  // Formulario nuevo usuario
  const [showModal, setShowModal] = useState(false);
  const [roles, setRoles] = useState([]);
  const [nuevoUser, setNuevoUser] = useState({
    username: '',
    password: '',
    nombres: '',
    apellidos: '',
    rango: 'Subteniente',
    placa: '',
    email: '',
    telefono: '',
    rol_id: 2
  });

  useEffect(() => {
    cargarDatos();
  }, [tab]);

  const cargarDatos = async () => {
    setCargando(true);
    try {
      if (tab === 'usuarios') {
        const [resUsers, resRoles] = await Promise.all([
          api.get('/usuarios/'),
          api.get('/usuarios/roles')
        ]);
        setUsuarios(resUsers.data);
        setRoles(resRoles.data);
      } else {
        const resAud = await api.get('/auditoria/');
        setAuditoria(resAud.data);
      }
    } catch (err) {
      console.error("Error al cargar datos de administración", err);
    } finally {
      setCargando(false);
    }
  };

  const handleCrearUsuario = async (e) => {
    e.preventDefault();
    try {
      await api.post('/usuarios/', nuevoUser);
      setShowModal(false);
      setNuevoUser({
        username: '',
        password: '',
        nombres: '',
        apellidos: '',
        rango: 'Subteniente',
        placa: '',
        email: '',
        telefono: '',
        rol_id: 2
      });
      cargarDatos();
    } catch (err) {
      alert(err.response?.data?.detail || "Error al crear usuario");
    }
  };

  const toggleUsuarioActivo = async (user) => {
    try {
      await api.put(`/usuarios/${user.id}`, { activo: !user.activo });
      cargarDatos();
    } catch (err) {
      alert("Error al actualizar usuario");
    }
  };

  return (
    <div className="space-y-6">
      {/* Cabecera */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-200 gap-3">
        <div>
          <span className="text-[11px] font-bold text-accent-gold uppercase tracking-wider">
            Gestión Central Institucional
          </span>
          <h1 className="text-xl font-black text-slate-900">Panel de Control del Administrador General</h1>
          <p className="text-xs text-slate-500">Mando de Coronel Jordan Wila Portilla</p>
        </div>

        {/* Selector de pestañas */}
        <div className="flex bg-slate-100 p-1 rounded-lg border border-slate-200 text-xs font-semibold">
          <button
            onClick={() => setTab('usuarios')}
            className={`px-4 py-1.5 rounded-md transition-all flex items-center space-x-1.5 ${
              tab === 'usuarios' ? 'bg-white text-police-900 shadow-sm' : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Personal Policial</span>
          </button>
          <button
            onClick={() => setTab('auditoria')}
            className={`px-4 py-1.5 rounded-md transition-all flex items-center space-x-1.5 ${
              tab === 'auditoria' ? 'bg-white text-police-900 shadow-sm' : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <ClipboardList className="w-3.5 h-3.5" />
            <span>Auditoría Inmutable</span>
          </button>
        </div>
      </div>

      {/* PESTAÑA: USUARIOS POLICIALES */}
      {tab === 'usuarios' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <div className="text-xs text-slate-500 font-medium">
              Total de agentes registrados: <span className="font-bold text-slate-900">{usuarios.length}</span>
            </div>
            <button
              onClick={() => setShowModal(true)}
              className="px-3.5 py-1.5 bg-police-800 hover:bg-police-900 text-white font-bold text-xs rounded-lg flex items-center space-x-1.5 shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Nuevo Agente</span>
            </button>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px] tracking-wider">
                  <th className="py-3 px-4">Usuario</th>
                  <th className="py-3 px-4">Nombre Completo</th>
                  <th className="py-3 px-4">Rol en Sistema</th>
                  <th className="py-3 px-4">Rango / Placa</th>
                  <th className="py-3 px-4">Contacto</th>
                  <th className="py-3 px-4 text-center">Estado</th>
                  <th className="py-3 px-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {usuarios.map(u => (
                  <tr key={u.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-police-900">{u.username}</td>
                    <td className="py-3 px-4 font-bold text-slate-800">{u.nombres} {u.apellidos}</td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-police-100 text-police-800 border border-police-200">
                        {u.rol?.nombre || u.rol?.codigo || 'CIUDADANO'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-600">
                      <div>{u.rango || 'N/A'}</div>
                      <div className="text-[10px] text-slate-400">Placa: {u.placa || 'S/N'}</div>
                    </td>
                    <td className="py-3 px-4 text-slate-500 text-[11px]">
                      <div>{u.email || '-'}</div>
                      <div>{u.telefono || '-'}</div>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                        u.activo ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600'
                      }`}>
                        {u.activo ? 'ACTIVO' : 'INACTIVO'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => toggleUsuarioActivo(u)}
                        className="text-slate-400 hover:text-police-800 transition-colors"
                        title={u.activo ? "Desactivar" : "Activar"}
                      >
                        {u.activo ? <ToggleRight className="w-5 h-5 text-emerald-600" /> : <ToggleLeft className="w-5 h-5 text-slate-400" />}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* PESTAÑA: AUDITORÍA INMUTABLE */}
      {tab === 'auditoria' && (
        <div className="space-y-4">
          <div className="text-xs text-slate-500">
            Registro cronológico forense de accesos, modificaciones de casos, transiciones de estado y consultas interinstitucionales.
          </div>

          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px] tracking-wider">
                  <th className="py-3 px-4">Fecha y Hora</th>
                  <th className="py-3 px-4">Acción Realizada</th>
                  <th className="py-3 px-4">Usuario Responsable</th>
                  <th className="py-3 px-4">Tabla Afectada</th>
                  <th className="py-3 px-4">Dirección IP</th>
                  <th className="py-3 px-4">Detalles del Evento</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                {auditoria.map(a => (
                  <tr key={a.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-4 text-slate-500">
                      {new Date(a.timestamp).toLocaleString('es-EC')}
                    </td>
                    <td className="py-3 px-4 font-bold text-police-900">
                      <span className="px-2 py-0.5 rounded bg-slate-100 border border-slate-200">
                        {a.accion}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-700">
                      {a.usuario ? `${a.usuario.username} (${a.usuario.nombres})` : 'SISTEMA EXTERNO'}
                    </td>
                    <td className="py-3 px-4 text-slate-600">{a.tabla_afectada || '-'}</td>
                    <td className="py-3 px-4 text-slate-500">{a.ip_address || '127.0.0.1'}</td>
                    <td className="py-3 px-4 text-slate-600 max-w-xs truncate">
                      {JSON.stringify(a.detalles)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL PARA CREAR USUARIO POLICIAL */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <h3 className="text-base font-black text-slate-900 mb-4">Alta de Personal Policial</h3>
            <form onSubmit={handleCrearUsuario} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Nombre de Usuario (Login)</label>
                <input
                  type="text"
                  required
                  value={nuevoUser.username}
                  onChange={(e) => setNuevoUser({ ...nuevoUser, username: e.target.value })}
                  placeholder="ej. carlos.moran"
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-police-700"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Contraseña Inicial</label>
                <input
                  type="password"
                  required
                  value={nuevoUser.password}
                  onChange={(e) => setNuevoUser({ ...nuevoUser, password: e.target.value })}
                  placeholder="••••••••"
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-police-700"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Nombres</label>
                  <input
                    type="text"
                    required
                    value={nuevoUser.nombres}
                    onChange={(e) => setNuevoUser({ ...nuevoUser, nombres: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-police-700"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Apellidos</label>
                  <input
                    type="text"
                    required
                    value={nuevoUser.apellidos}
                    onChange={(e) => setNuevoUser({ ...nuevoUser, apellidos: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-police-700"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Rol Operativo</label>
                  <select
                    value={nuevoUser.rol_id}
                    onChange={(e) => setNuevoUser({ ...nuevoUser, rol_id: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-police-700"
                  >
                    {roles.map(r => (
                      <option key={r.id} value={r.id}>{r.nombre}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Número de Placa</label>
                  <input
                    type="text"
                    value={nuevoUser.placa}
                    onChange={(e) => setNuevoUser({ ...nuevoUser, placa: e.target.value })}
                    placeholder="PF-9999"
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-police-700"
                  />
                </div>
              </div>

              <div className="pt-4 flex justify-end space-x-2">
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
                  Guardar Personal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
