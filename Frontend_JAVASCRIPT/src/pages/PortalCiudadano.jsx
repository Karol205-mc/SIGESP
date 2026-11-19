import React, { useState, useEffect } from 'react';
import api from '../services/api';
import TimelineSeguimiento from '../components/TimelineSeguimiento';
import SedesPoliciales from './SedesPoliciales';
import BotonPanico from './BotonPanico';
import RegistroCiudadano from './RegistroCiudadano';
import {
  FileText,
  Search,
  ShieldAlert,
  UserCheck,
  Clock,
  MapPin,
  AlertCircle,
  CheckCircle2,
  Scale,
  Building,
  ArrowRight,
  Send,
  Printer,
  AlertTriangle,
  Lock,
  UserPlus,
  Radio,
  ShieldCheck
} from 'lucide-react';

function validarCedulaEcuatoriana(cedula) {
  if (!/^\d{10}$/.test(cedula)) {
    return { valido: false, mensaje: "La cédula debe contener exactamente 10 dígitos numéricos." };
  }
  const provincia = parseInt(cedula.substring(0, 2), 10);
  if ((provincia < 1 || provincia > 24) && provincia !== 30) {
    return { valido: false, mensaje: `Código de provincia '${cedula.substring(0, 2)}' inválido (en Ecuador debe ser entre 01 y 24).` };
  }
  const tercerDigito = parseInt(cedula[2], 10);
  if (tercerDigito >= 6) {
    return { valido: false, mensaje: `El tercer dígito '${tercerDigito}' no corresponde a una persona natural (debe ser menor a 6).` };
  }

  const coeficientes = [2, 1, 2, 1, 2, 1, 2, 1, 2];
  let suma = 0;
  for (let i = 0; i < 9; i++) {
    let valor = parseInt(cedula[i], 10) * coeficientes[i];
    if (valor >= 10) valor -= 9;
    suma += valor;
  }
  const digitoVerificador = (10 - (suma % 10)) % 10;
  const digitoActual = parseInt(cedula[9], 10);
  if (digitoVerificador !== digitoActual) {
    const sugerida = cedula.substring(0, 9) + digitoVerificador;
    return {
      valido: false,
      mensaje: `Dígito verificador incorrecto. El algoritmo del Registro Civil calcula '${digitoVerificador}' (ejemplo: ${sugerida}), pero ingresó '${digitoActual}'. Verifique el último número.`
    };
  }
  return { valido: true };
}

export default function PortalCiudadano({ user, onNavigateToLogin, onRegistroExitoso, seccionInicial = 'menu' }) {
  const [seccionActiva, setSeccionActiva] = useState(seccionInicial);
  const [codigoBusqueda, setCodigoBusqueda] = useState('');
  const [resultadoConsulta, setResultadoConsulta] = useState(null);
  const [errorConsulta, setErrorConsulta] = useState('');
  const [cargandoConsulta, setCargandoConsulta] = useState(false);

  useEffect(() => {
    if (seccionInicial) setSeccionActiva(seccionInicial);
  }, [seccionInicial]);

  // Categorías de delitos
  const [categorias, setCategorias] = useState([]);

  // Formulario de denuncia
  const [formData, setFormData] = useState({
    cedula: user?.cedula || '',
    nombres: user?.nombres || (user?.nombre_completo ? user.nombre_completo.split(' ')[0] : ''),
    apellidos: user?.apellidos || (user?.nombre_completo ? user.nombre_completo.split(' ').slice(1).join(' ') : ''),
    telefono: user?.telefono || '',
    email: user?.email || '',
    direccion_ciudadano: user?.direccion || '',
    categoria_id: '',
    tipo_tramite: 'FLAGRANCIA',
    descripcion_hechos: '',
    direccion_hechos: '',
    sector: 'Distrito Esmeraldas',
    es_menor_victima: false,
    declaracion_jurada: false
  });
  const [mensajeExito, setMensajeExito] = useState(null);
  const [enviando, setEnviando] = useState(false);
  const [errorValidacion, setErrorValidacion] = useState('');

  // Consulta de antecedentes
  const [cedulaAntecedente, setCedulaAntecedente] = useState('');
  const [resAntecedente, setResAntecedente] = useState(null);
  const [cargandoAntecedente, setCargandoAntecedente] = useState(false);

  useEffect(() => {
    cargarCategorias();
  }, []);

  // Si el usuario está autenticado, autocompletar y bloquear sus datos en la denuncia
  useEffect(() => {
    if (user) {
      setFormData(prev => ({
        ...prev,
        cedula: user.cedula || prev.cedula || '',
        nombres: user.nombres || (user.nombre_completo ? user.nombre_completo.split(' ')[0] : prev.nombres) || '',
        apellidos: user.apellidos || (user.nombre_completo ? user.nombre_completo.split(' ').slice(1).join(' ') : prev.apellidos) || '',
        telefono: user.telefono || prev.telefono || '',
        email: user.email || prev.email || '',
        direccion_ciudadano: user.direccion || prev.direccion_ciudadano || ''
      }));
    }
  }, [user]);

  const cargarCategorias = async () => {
    try {
      const res = await api.get('/denuncias/categorias');
      setCategorias(res.data);
      if (res.data.length > 0) {
        setFormData(prev => ({ ...prev, categoria_id: res.data[0].id }));
      }
    } catch (e) {
      console.error("Error al cargar categorías", e);
    }
  };

  const handleConsultarTramite = async (e) => {
    e?.preventDefault();
    if (!codigoBusqueda.trim()) return;

    setCargandoConsulta(true);
    setErrorConsulta('');
    setResultadoConsulta(null);

    try {
      const res = await api.get(`/seguimiento/consulta/${codigoBusqueda.trim()}`);
      setResultadoConsulta(res.data);
    } catch (err) {
      setErrorConsulta(err.response?.data?.detail || 'No se encontró ningún trámite con ese código.');
    } finally {
      setCargandoConsulta(false);
    }
  };

  const handleSubmitDenuncia = async (e) => {
    e.preventDefault();
    setErrorValidacion('');

    if (!formData.declaracion_jurada) {
      setErrorValidacion("Debe aceptar la declaración jurada y advertencia legal contra denuncias falsas.");
      return;
    }

    const cedulaLimpia = formData.cedula.trim();
    const esCedulaPrueba = ['0801000001', '0802000002', '0803000003', '0804000004'].includes(cedulaLimpia);
    if (!esCedulaPrueba) {
      const resVal = validarCedulaEcuatoriana(cedulaLimpia);
      if (!resVal.valido) {
        setErrorValidacion(resVal.mensaje);
        return;
      }
    }

    if (formData.descripcion_hechos.trim().length < 25) {
      setErrorValidacion("Por favor proporcione una narración detallada de los hechos (mínimo 25 caracteres para evitar registros falsos).");
      return;
    }

    setEnviando(true);
    setMensajeExito(null);

    try {
      const payload = {
        cedula: cedulaLimpia,
        nombres: formData.nombres,
        apellidos: formData.apellidos,
        telefono: formData.telefono,
        email: formData.email,
        direccion_ciudadano: formData.direccion_ciudadano,
        categoria_id: parseInt(formData.categoria_id),
        tipo_tramite: formData.tipo_tramite,
        descripcion_hechos: formData.descripcion_hechos,
        direccion_hechos: formData.direccion_hechos,
        sector: formData.sector,
        es_menor_victima: formData.es_menor_victima
      };

      const res = await api.post('/denuncias/', payload);
      setMensajeExito(res.data);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      setErrorValidacion(err.response?.data?.detail || 'Error al procesar la denuncia.');
    } finally {
      setEnviando(false);
    }
  };

  const handleConsultarAntecedentes = async (e) => {
    e?.preventDefault();
    if (!cedulaAntecedente.trim()) return;

    setCargandoAntecedente(true);
    setResAntecedente(null);

    try {
      const res = await api.get(`/policia/antecedentes/${cedulaAntecedente.trim()}`, {
        headers: { 'X-Api-Key': 'RC-POLICIA-KEY-2026' }
      });
      setResAntecedente(res.data);
    } catch (err) {
      alert("Error en la consulta interinstitucional de antecedentes.");
    } finally {
      setCargandoAntecedente(false);
    }
  };

  const esUsuarioBloqueado = Boolean(user);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* VISTA 1: SALAS DE ATENCIÓN CON OPENSTREETMAP */}
      {seccionActiva === 'sedes' && (
        <SedesPoliciales onVolver={() => setSeccionActiva('menu')} />
      )}

      {/* VISTA 2: BOTÓN DE PÁNICO Y AUXILIO DIGITAL */}
      {seccionActiva === 'panico' && (
        <BotonPanico
          user={user}
          onVolver={() => setSeccionActiva('menu')}
          onNavigateToLogin={onNavigateToLogin}
        />
      )}

      {/* VISTA 3: REGISTRO DE CUENTA CIUDADANA */}
      {seccionActiva === 'registro' && (
        <RegistroCiudadano
          onRegistroExitoso={(newUser) => {
            if (onRegistroExitoso) onRegistroExitoso(newUser);
            setSeccionActiva('menu');
          }}
          onVolver={() => setSeccionActiva('menu')}
        />
      )}

      {/* BANNER PRINCIPAL DEL SISTEMA (Menú y consultas) */}
      {['menu', 'denuncia', 'consulta', 'antecedentes'].includes(seccionActiva) && (
        <div className="bg-gradient-to-r from-police-950 via-police-900 to-police-800 text-white rounded-2xl p-6 sm:p-10 shadow-xl border border-police-700/50 mb-8 relative overflow-hidden">
          <div className="absolute right-0 top-0 bottom-0 w-[43%] hidden sm:flex items-end justify-end pointer-events-none overflow-hidden">
            <img
              src="/assets/poli-mujer-01.webp"
              alt="Policía Nacional"
              className="h-full w-full object-contain object-right-bottom"
            />
          </div>
          <div className="max-w-2xl relative z-10">
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <span className="px-3 py-1 rounded-full bg-accent-gold/20 text-accent-gold text-xs font-extrabold tracking-wider uppercase border border-accent-gold/30">
                Atención Ciudadana Oficial
              </span>
              {!user && (
                <button
                  onClick={() => setSeccionActiva('registro')}
                  className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30 text-xs font-extrabold border border-emerald-400/40 flex items-center space-x-1 transition-all"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>¿No tienes cuenta? Regístrate Aquí</span>
                </button>
              )}
            </div>

            <h1 className="text-2xl sm:text-4xl font-black tracking-tight leading-tight mb-3">
              Sistema Integral de Gestión y Trámites
            </h1>
            <p className="text-slate-300 text-sm sm:text-base leading-relaxed mb-6">
              Inscripción de denuncias formales, auxilio georreferenciado, seguimiento en tiempo real y verificación institucional.
            </p>

            {/* Buscador Rápido de Código en el Banner */}
            <form onSubmit={handleConsultarTramite} className="flex flex-col sm:flex-row gap-2">
              <div className="relative flex-1">
                <Search className="w-5 h-5 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="text"
                  value={codigoBusqueda}
                  onChange={(e) => setCodigoBusqueda(e.target.value.toUpperCase())}
                  placeholder="Ejemplo: POL-2026-0001"
                  className="w-full pl-11 pr-4 py-2.5 rounded-xl bg-police-800/90 text-white placeholder-slate-400 border border-police-600 focus:outline-none focus:ring-2 focus:ring-accent-gold text-sm font-semibold uppercase"
                />
              </div>
              <button
                type="submit"
                onClick={() => setSeccionActiva('consulta')}
                className="px-6 py-2.5 rounded-xl bg-accent-gold hover:bg-accent-goldDark text-police-950 font-black text-sm transition-all flex items-center justify-center space-x-2 shrink-0 shadow-lg shadow-accent-gold/20"
              >
                <span>Rastrear Trámite</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MENÚ DE TARJETAS DE SERVICIOS */}
      {seccionActiva === 'menu' && (
        <div className="space-y-6">
          {/* COMUNICADO INSTITUCIONAL DE SERVICIOS AVANZADOS Y CUENTA CIUDADANA */}
          {!user ? (
            <div className="bg-gradient-to-r from-police-950 via-police-900 to-police-800 border border-police-700 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-center justify-between gap-4 text-white shadow-lg">
              <div className="flex items-center space-x-3.5">
                <div className="w-11 h-11 rounded-xl bg-accent-gold/20 border border-accent-gold/40 flex items-center justify-center text-accent-gold shrink-0">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-sm font-extrabold text-white">¿Desea acceder a servicios prioritarios y auxilio inmediato?</h4>
                  <p className="text-xs text-slate-300 mt-0.5">
                    Cree su <strong>cuenta ciudadana verificada</strong> para contar con bloqueo de identidad en trámites, historial de causas y auxilio SOS georreferenciado (Botón de Pánico 911).
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSeccionActiva('registro')}
                className="px-4 py-2.5 rounded-xl bg-accent-gold hover:bg-accent-goldDark text-police-950 font-black text-xs transition-all shrink-0 flex items-center space-x-1.5 shadow-md shadow-accent-gold/20"
              >
                <UserPlus className="w-4 h-4" />
                <span>Crear Cuenta Ciudadana</span>
              </button>
            </div>
          ) : user.rol === 'CIUDADANO' ? (
            <div className="bg-emerald-950/70 border border-emerald-500/40 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-emerald-200 text-xs shadow-md">
              <div className="flex items-center space-x-3">
                <div className="w-9 h-9 rounded-lg bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center text-emerald-300 shrink-0">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <span className="font-extrabold text-white block">
                    Sesión Verificada: {user.nombre_completo} (C.I. {user.cedula})
                  </span>
                  <span className="text-emerald-300/90 text-[11px]">
                    Sus trámites cuentan con protección de identidad. Si requiere asistencia inmediata o patrullero móvil, utilice el <strong>Botón de Pánico (SOS 911)</strong> en el <strong>menú lateral izquierdo</strong>.
                  </span>
                </div>
              </div>
            </div>
          ) : null}

          <div className="flex items-center justify-between border-b border-slate-200 pb-3">
            <div>
              <h2 className="text-xl font-extrabold text-slate-900">Módulos de Atención Disponibles</h2>
              <p className="text-xs text-slate-500">Seleccione el servicio que desea utilizar</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {/* Tarjeta 1: Denuncia Virtual */}
            <div
              onClick={() => {
                setFormData(prev => ({
                  ...prev,
                  tipo_tramite: 'FLAGRANCIA',
                  es_menor_victima: false,
                  ...(user ? {
                    cedula: user.cedula || '',
                    nombres: user.nombres || (user.nombre_completo ? user.nombre_completo.split(' ')[0] : ''),
                    apellidos: user.apellidos || (user.nombre_completo ? user.nombre_completo.split(' ').slice(1).join(' ') : ''),
                    telefono: user.telefono || '',
                    email: user.email || '',
                    direccion_ciudadano: user.direccion || ''
                  } : {})
                }));
                setMensajeExito(null);
                setSeccionActiva('denuncia');
              }}
              className="bg-white hover:bg-slate-50 border border-slate-200 hover:border-police-600 rounded-2xl p-6 transition-all duration-200 cursor-pointer shadow-sm hover:shadow-md group flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="w-12 h-12 rounded-xl bg-police-100 border border-police-200 flex items-center justify-center text-police-800 group-hover:scale-105 transition-transform">
                  <FileText className="w-6 h-6" />
                </div>
                <h3 className="text-base font-extrabold text-slate-900 group-hover:text-police-700 transition-colors">
                  Denuncia Virtual (¡ADenunciar!)
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Instauración formal y segura de denuncias por robos, hurtos, extorsión, delitos intrafamiliares o contingencias urgentes.
                </p>
              </div>
              <div className="mt-5 pt-3 border-t border-slate-100 flex items-center text-xs font-bold text-police-700">
                <span>{user ? `Ingresar como ${user.nombre_completo}` : 'Ingresar trámite'}</span>
                <ArrowRight className="w-4 h-4 ml-1.5 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>

            {/* Tarjeta 2: Consulta de Trámite */}
            <div
              onClick={() => setSeccionActiva('consulta')}
              className="bg-white hover:bg-slate-50 border border-slate-200 hover:border-police-600 rounded-2xl p-6 transition-all duration-200 cursor-pointer shadow-sm hover:shadow-md group flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="w-12 h-12 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-800 group-hover:scale-105 transition-transform">
                  <Clock className="w-6 h-6" />
                </div>
                <h3 className="text-base font-extrabold text-slate-900 group-hover:text-police-700 transition-colors">
                  Consulta de Estado de Trámites
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Verifique la fase del caso: esperando documentos, tramitando, procesado, en juicio, aplazado o finalizado.
                </p>
              </div>
              <div className="mt-5 pt-3 border-t border-slate-100 flex items-center text-xs font-bold text-police-700">
                <span>Rastrear con código</span>
                <ArrowRight className="w-4 h-4 ml-1.5 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>

            {/* Tarjeta 3: Antecedentes e Interoperabilidad (Presunción de Inocencia) */}
            <div
              onClick={() => setSeccionActiva('antecedentes')}
              className="bg-white hover:bg-slate-50 border border-slate-200 hover:border-police-600 rounded-2xl p-6 transition-all duration-200 cursor-pointer shadow-sm hover:shadow-md group flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="w-12 h-12 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-800 group-hover:scale-105 transition-transform">
                  <UserCheck className="w-6 h-6" />
                </div>
                <h3 className="text-base font-extrabold text-slate-900 group-hover:text-police-700 transition-colors">
                  Consulta de Antecedentes y Récord
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Verificación de sentencias condenatorias y órdenes de captura. Protege el principio de presunción de inocencia.
                </p>
              </div>
              <div className="mt-5 pt-3 border-t border-slate-100 flex items-center text-xs font-bold text-police-700">
                <span>Verificar récord legal</span>
                <ArrowRight className="w-4 h-4 ml-1.5 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>

            {/* Tarjeta 4: Medidas de Protección a Menores (DINAPEN) */}
            <div
              onClick={() => {
                setFormData(prev => ({
                  ...prev,
                  tipo_tramite: 'DINAPEN_MENOR',
                  es_menor_victima: true,
                  ...(user ? {
                    cedula: user.cedula || '',
                    nombres: user.nombres || (user.nombre_completo ? user.nombre_completo.split(' ')[0] : ''),
                    apellidos: user.apellidos || (user.nombre_completo ? user.nombre_completo.split(' ').slice(1).join(' ') : ''),
                    telefono: user.telefono || '',
                    email: user.email || '',
                    direccion_ciudadano: user.direccion || ''
                  } : {})
                }));
                setMensajeExito(null);
                setSeccionActiva('denuncia');
              }}
              className="bg-white hover:bg-slate-50 border border-slate-200 hover:border-police-600 rounded-2xl p-6 transition-all duration-200 cursor-pointer shadow-sm hover:shadow-md group flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="w-12 h-12 rounded-xl bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-800 group-hover:scale-105 transition-transform">
                  <ShieldAlert className="w-6 h-6" />
                </div>
                <h3 className="text-base font-extrabold text-slate-900 group-hover:text-police-700 transition-colors">
                  Atención a Menores (DINAPEN)
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Reporte de desapariciones (Alerta Emilia), vulneración de derechos de niños, niñas y adolescentes y medidas de amparo.
                </p>
              </div>
              <div className="mt-5 pt-3 border-t border-slate-100 flex items-center text-xs font-bold text-police-700">
                <span>Activar protocolo DINAPEN</span>
                <ArrowRight className="w-4 h-4 ml-1.5 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>

            {/* Tarjeta 5: Salas de Atención con OpenStreetMap */}
            <div
              onClick={() => setSeccionActiva('sedes')}
              className="bg-white hover:bg-slate-50 border border-slate-200 hover:border-police-600 rounded-2xl p-6 transition-all duration-200 cursor-pointer shadow-sm hover:shadow-md group flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="w-12 h-12 rounded-xl bg-cyan-50 border border-cyan-200 flex items-center justify-center text-cyan-800 group-hover:scale-105 transition-transform">
                  <Building className="w-6 h-6" />
                </div>
                <h3 className="text-base font-extrabold text-slate-900 group-hover:text-police-700 transition-colors">
                  Salas de Atención y Sedes Físicas (Mapa)
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Localización geográfica interactiva en OpenStreetMap de las Unidades de Policía Comunitaria (UPC) y Vigilancia (UVC).
                </p>
              </div>
              <div className="mt-5 pt-3 border-t border-slate-100 flex items-center text-xs font-bold text-police-700">
                <span>Abrir mapa interactivo</span>
                <ArrowRight className="w-4 h-4 ml-1.5 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SECCIÓN 1: FORMULARIO DE DENUNCIA VIRTUAL CON BLOQUEO DE IDENTIDAD */}
      {seccionActiva === 'denuncia' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <button
              onClick={() => { setSeccionActiva('menu'); setMensajeExito(null); }}
              className="text-xs font-bold text-slate-500 hover:text-slate-800 flex items-center space-x-1"
            >
              <span>← Volver al menú de servicios</span>
            </button>
          </div>

          {/* COMPROBANTE DE REGISTRO EXITOSO CON AVISO DE ACERCARSE AL UPC/UVC */}
          {mensajeExito ? (
            <div className="bg-white rounded-2xl p-6 sm:p-10 border-2 border-emerald-500 shadow-xl space-y-6">
              <div className="text-center space-y-3 border-b border-slate-200 pb-6">
                <div className="w-16 h-16 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center mx-auto shadow-inner">
                  <CheckCircle2 className="w-10 h-10" />
                </div>
                <span className="text-xs uppercase font-extrabold tracking-widest text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
                  Denuncia Pre-Registrada Exitosamente
                </span>
                <h2 className="text-2xl font-black text-slate-900">
                  Comprobante de Trámite Policial
                </h2>
                <p className="text-xs text-slate-500 max-w-lg mx-auto">
                  Conserve este código único para concluir con la fase física de su trámite formal.
                </p>

                {/* Código destacado */}
                <div className="py-4">
                  <div className="inline-block bg-police-950 text-white px-8 py-4 rounded-2xl border-2 border-accent-gold shadow-lg">
                    <span className="block text-[10px] font-bold tracking-widest uppercase text-accent-gold">
                      Código Único de Trámite
                    </span>
                    <span className="text-2xl sm:text-3xl font-black tracking-wider font-mono">
                      {mensajeExito.codigo_unico}
                    </span>
                  </div>
                </div>
              </div>

              {/* INSTRUCCIÓN OBLIGATORIA: ACERCARSE AL UPC / UVC */}
              <div className="bg-amber-50 border-2 border-amber-300 rounded-xl p-5 space-y-3">
                <div className="flex items-start space-x-3">
                  <AlertTriangle className="w-6 h-6 text-amber-700 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <h3 className="text-sm font-black text-amber-950 uppercase tracking-wide">
                      PASO OBLIGATORIO PARA CONCLUIR SU DENUNCIA:
                    </h3>
                    <p className="text-xs text-amber-900 leading-relaxed font-medium">
                      Debe acercarse con este código <strong className="font-bold underline">{mensajeExito.codigo_unico}</strong> y su cédula física original a la <strong>Unidad de Policía Comunitaria (UPC)</strong> o <strong>Unidad de Vigilancia Comunitaria (UVC)</strong> más cercana a su domicilio en un plazo máximo de <strong>72 horas</strong>.
                    </p>
                    <p className="text-[11px] text-amber-800">
                      Allí el agente asignado tomará su versión formal y usted suscribirá físicamente el acta para dar inicio inmediato a las diligencias judiciales o periciales.
                    </p>
                  </div>
                </div>

                <div className="pt-2 flex flex-col sm:flex-row gap-2">
                  <button
                    onClick={() => setSeccionActiva('sedes')}
                    className="px-4 py-2 bg-police-900 hover:bg-black text-white font-bold text-xs rounded-lg flex items-center justify-center space-x-2 transition-all"
                  >
                    <MapPin className="w-3.5 h-3.5 text-accent-gold" />
                    <span>Ver UPC / UVC Más Cercana en el Mapa</span>
                  </button>
                  <button
                    onClick={() => window.print()}
                    className="px-4 py-2 bg-white hover:bg-slate-100 text-slate-800 font-bold text-xs rounded-lg border border-slate-300 flex items-center justify-center space-x-2 transition-all"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>Imprimir Comprobante</span>
                  </button>
                </div>
              </div>

              <div className="text-center pt-2">
                <button
                  onClick={() => { setSeccionActiva('menu'); setMensajeExito(null); }}
                  className="px-6 py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold text-xs rounded-xl"
                >
                  Volver al Menú Principal
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
              <div className="border-b border-slate-200 pb-4">
                <h2 className="text-xl font-black text-slate-900">
                  {formData.tipo_tramite === 'DINAPEN_MENOR'
                    ? 'Atención a Menores y Medidas de Protección (DINAPEN)'
                    : 'Sistema de Denuncia Virtual ¡ADenunciar!'}
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  Por favor complete los datos obligatorios con total veracidad. Su caso generará un código para comparecer a la UPC.
                </p>
              </div>

              {/* BANNER DE BLOQUEO DE IDENTIDAD PARA USUARIO AUTENTICADO */}
              {esUsuarioBloqueado && (
                <div className="p-3.5 bg-police-900 text-white rounded-xl flex items-center space-x-3 shadow-sm border border-police-800">
                  <Lock className="w-5 h-5 text-accent-gold shrink-0" />
                  <div className="text-xs">
                    <span className="font-extrabold text-accent-gold block">
                      Identidad Verificada: {user.nombre_completo}
                    </span>
                    <span className="text-slate-300 text-[11px]">
                      Por seguridad procesal y certeza jurídica, sus datos de denunciante han sido cargados automáticamente y se encuentran bloqueados.
                    </span>
                  </div>
                </div>
              )}

              {/* AVISO LEGAL CONTRA DENUNCIAS FALSAS */}
              <div className="p-4 bg-rose-50 border-2 border-rose-300 rounded-xl space-y-2">
                <div className="flex items-start space-x-3">
                  <ShieldAlert className="w-5 h-5 text-rose-700 shrink-0 mt-0.5" />
                  <div>
                    <h3 className="text-xs font-black text-rose-950 uppercase tracking-wide">
                      ADVERTENCIA LEGAL OBLIGATORIA (COIP Art. 271 y Art. 272)
                    </h3>
                    <p className="text-[11px] text-rose-900 leading-relaxed mt-0.5">
                      El registro de denuncias simuladas, falsas o con fines de broma constituye una <strong>infracción penal penada con pena privativa de libertad de hasta 1 año</strong>.
                      Toda información, dirección IP, fecha y hora de envío quedan registradas pericialmente en la bitácora inmutable de auditoría forense del sistema.
                    </p>
                  </div>
                </div>
              </div>

              {errorValidacion && (
                <div className="p-3 bg-amber-50 border border-amber-300 rounded-xl text-xs text-amber-900 flex items-center space-x-2 font-semibold">
                  <AlertCircle className="w-4 h-4 text-amber-700 shrink-0" />
                  <span>{errorValidacion}</span>
                </div>
              )}

              <form onSubmit={handleSubmitDenuncia} className="space-y-6">
                {/* Bloque 1: Identificación del Denunciante / Representante */}
                <div>
                  <h3 className="text-xs font-bold text-police-900 uppercase tracking-wider mb-3 flex items-center space-x-1.5">
                    <span className="w-2 h-2 rounded-full bg-police-700"></span>
                    <span>1. Datos del Denunciante {esUsuarioBloqueado ? '(Verificados y Bloqueados)' : 'o Tutor Legal'}</span>
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Cédula de Identidad Ecuatoriana *
                      </label>
                      <input
                        type="text"
                        maxLength={10}
                        required
                        disabled={esUsuarioBloqueado}
                        value={formData.cedula}
                        onChange={(e) => setFormData({ ...formData, cedula: e.target.value.replace(/\D/g, '') })}
                        placeholder="Ej: 0801000001"
                        className={`w-full px-3.5 py-2 text-xs rounded-lg border font-mono font-bold ${esUsuarioBloqueado ? 'bg-slate-100 text-slate-600 border-slate-300 cursor-not-allowed' : 'border-slate-300 focus:outline-none focus:ring-2 focus:ring-police-700'
                          }`}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Nombres Completos *</label>
                      <input
                        type="text"
                        required
                        disabled={esUsuarioBloqueado}
                        value={formData.nombres}
                        onChange={(e) => setFormData({ ...formData, nombres: e.target.value })}
                        placeholder="Juan Carlos"
                        className={`w-full px-3.5 py-2 text-xs rounded-lg border ${esUsuarioBloqueado ? 'bg-slate-100 text-slate-600 border-slate-300 cursor-not-allowed font-semibold' : 'border-slate-300 focus:outline-none focus:ring-2 focus:ring-police-700'
                          }`}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Apellidos Completos *</label>
                      <input
                        type="text"
                        required
                        disabled={esUsuarioBloqueado}
                        value={formData.apellidos}
                        onChange={(e) => setFormData({ ...formData, apellidos: e.target.value })}
                        placeholder="Pérez Mendoza"
                        className={`w-full px-3.5 py-2 text-xs rounded-lg border ${esUsuarioBloqueado ? 'bg-slate-100 text-slate-600 border-slate-300 cursor-not-allowed font-semibold' : 'border-slate-300 focus:outline-none focus:ring-2 focus:ring-police-700'
                          }`}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Teléfono de Contacto *</label>
                      <input
                        type="tel"
                        required
                        disabled={esUsuarioBloqueado}
                        value={formData.telefono}
                        onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                        placeholder="0991234567"
                        className={`w-full px-3.5 py-2 text-xs rounded-lg border font-mono ${esUsuarioBloqueado ? 'bg-slate-100 text-slate-600 border-slate-300 cursor-not-allowed font-semibold' : 'border-slate-300 focus:outline-none focus:ring-2 focus:ring-police-700'
                          }`}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Correo Electrónico</label>
                      <input
                        type="email"
                        disabled={esUsuarioBloqueado}
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        placeholder="correo@ejemplo.com"
                        className={`w-full px-3.5 py-2 text-xs rounded-lg border ${esUsuarioBloqueado ? 'bg-slate-100 text-slate-600 border-slate-300 cursor-not-allowed' : 'border-slate-300 focus:outline-none focus:ring-2 focus:ring-police-700'
                          }`}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Dirección Domiciliaria *</label>
                      <input
                        type="text"
                        required
                        disabled={esUsuarioBloqueado}
                        value={formData.direccion_ciudadano}
                        onChange={(e) => setFormData({ ...formData, direccion_ciudadano: e.target.value })}
                        placeholder="Sector, calle y número de casa"
                        className={`w-full px-3.5 py-2 text-xs rounded-lg border ${esUsuarioBloqueado ? 'bg-slate-100 text-slate-600 border-slate-300 cursor-not-allowed' : 'border-slate-300 focus:outline-none focus:ring-2 focus:ring-police-700'
                          }`}
                      />
                    </div>
                  </div>
                </div>

                {/* Bloque 2: Tipificación del Delito */}
                <div className="pt-4 border-t border-slate-100">
                  <h3 className="text-xs font-bold text-police-900 uppercase tracking-wider mb-3 flex items-center space-x-1.5">
                    <span className="w-2 h-2 rounded-full bg-police-700"></span>
                    <span>2. Tipificación de los Hechos</span>
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Categoría del Delito *</label>
                      <select
                        value={formData.categoria_id}
                        onChange={(e) => setFormData({ ...formData, categoria_id: e.target.value })}
                        className="w-full px-3.5 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-police-700 font-semibold"
                      >
                        {categorias.map(cat => (
                          <option key={cat.id} value={cat.id}>
                            {cat.nombre} ({cat.gravedad})
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Naturaleza del Procedimiento *</label>
                      <select
                        value={formData.tipo_tramite}
                        onChange={(e) => setFormData({ ...formData, tipo_tramite: e.target.value })}
                        className="w-full px-3.5 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-police-700 font-semibold"
                      >
                        <option value="FLAGRANCIA">Delito Flagrante (Ocurrido en las últimas 24 horas)</option>
                        <option value="INVESTIGACION_PREVIA">Investigación Previa (Policía Judicial)</option>
                        <option value="DINAPEN_MENOR">Medidas de Protección de Menores (DINAPEN)</option>
                        <option value="AUXILIO">Solicitud de Auxilio Preventivo</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Bloque 3: Circunstancias y Narración */}
                <div className="pt-4 border-t border-slate-100">
                  <h3 className="text-xs font-bold text-police-900 uppercase tracking-wider mb-3 flex items-center space-x-1.5">
                    <span className="w-2 h-2 rounded-full bg-police-700"></span>
                    <span>3. Circunstancias y Lugar del Suceso</span>
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Cantón / Sector de los Hechos *</label>
                      <input
                        type="text"
                        required
                        value={formData.sector}
                        onChange={(e) => setFormData({ ...formData, sector: e.target.value })}
                        placeholder="Ej. Cantón Esmeraldas - Sector Las Palmas"
                        className="w-full px-3.5 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-police-700 font-medium"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Dirección Exacta del Suceso *</label>
                      <input
                        type="text"
                        required
                        value={formData.direccion_hechos}
                        onChange={(e) => setFormData({ ...formData, direccion_hechos: e.target.value })}
                        placeholder="Av. Olmedo y Rocafuerte, parada de bus"
                        className="w-full px-3.5 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-police-700 font-medium"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Narración Circunstanciada de los Hechos (Mínimo 25 caracteres) *
                    </label>
                    <textarea
                      rows={4}
                      required
                      value={formData.descripcion_hechos}
                      onChange={(e) => setFormData({ ...formData, descripcion_hechos: e.target.value })}
                      placeholder="Describa con precisión: ¿Qué ocurrió? ¿Quiénes participaron? ¿Objetos o bienes sustraídos? ¿Vehículos, placas o vestimenta de sospechosos?..."
                      className="w-full px-3.5 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-police-700"
                    ></textarea>
                  </div>
                </div>

                {/* Bloque 4: Declaración Jurada Obligatoria */}
                <div className="pt-4 border-t border-slate-100 bg-slate-50 p-4 rounded-xl border border-slate-200">
                  <div className="flex items-start space-x-3">
                    <input
                      type="checkbox"
                      id="juramento"
                      required
                      checked={formData.declaracion_jurada}
                      onChange={(e) => setFormData({ ...formData, declaracion_jurada: e.target.checked })}
                      className="w-4 h-4 text-police-700 border-slate-300 rounded mt-0.5"
                    />
                    <label htmlFor="juramento" className="text-xs text-slate-800 font-bold cursor-pointer leading-relaxed">
                      DECLARACIÓN BAJO JURAMENTO: Declaro que la información ingresada es real, verídica y no maliciosa. Acepto que para formalizar el trámite debo acercarme a un UPC/UVC con el código emitido, y conozco las sanciones penales de simular denuncias falsas (COIP Art. 271 / 272).
                    </label>
                  </div>
                </div>

                {/* Botones de Envío */}
                <div className="pt-4 border-t border-slate-200 flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => setSeccionActiva('menu')}
                    className="px-5 py-2.5 rounded-lg border border-slate-300 text-xs font-bold text-slate-600 hover:bg-slate-100"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={enviando}
                    className="px-7 py-2.5 rounded-lg bg-police-800 hover:bg-police-900 text-white font-bold text-xs flex items-center space-x-2 shadow-md disabled:opacity-50"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>{enviando ? 'Validando y Registrando...' : 'Inscribir Denuncia Formal'}</span>
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      )}

      {/* SECCIÓN 2: CONSULTA DE TRÁMITES Y LÍNEA DE TIEMPO ESPECÍFICA */}
      {seccionActiva === 'consulta' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <button
              onClick={() => setSeccionActiva('menu')}
              className="text-xs font-bold text-slate-500 hover:text-slate-800 flex items-center space-x-1"
            >
              <span>← Volver al menú de servicios</span>
            </button>
          </div>

          <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-sm">
            <div className="border-b border-slate-200 pb-4 mb-6">
              <h2 className="text-xl font-black text-slate-900">
                Consulta y Trazabilidad de Trámites
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Conozca el estado exacto del caso: Esperando documentos, Tramitando, Procesado, En juicio, Aplazado o Finalizado.
              </p>
            </div>

            <form onSubmit={handleConsultarTramite} className="flex gap-2 max-w-md mb-6">
              <input
                type="text"
                value={codigoBusqueda}
                onChange={(e) => setCodigoBusqueda(e.target.value.toUpperCase())}
                placeholder="Ej: POL-2026-0001"
                className="flex-1 px-4 py-2 text-xs rounded-lg border border-slate-300 uppercase font-bold focus:outline-none focus:ring-2 focus:ring-police-700 font-mono"
              />
              <button
                type="submit"
                disabled={cargandoConsulta}
                className="px-5 py-2 bg-police-800 hover:bg-police-900 text-white font-bold text-xs rounded-lg transition-colors"
              >
                {cargandoConsulta ? 'Buscando...' : 'Buscar'}
              </button>
            </form>

            {errorConsulta && (
              <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorConsulta}</span>
              </div>
            )}

            {resultadoConsulta && (
              <div className="space-y-6 pt-2">
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Código Único</span>
                    <span className="font-extrabold text-police-900 text-sm font-mono">{resultadoConsulta.codigo_unico}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Delito Tipificado</span>
                    <span className="font-bold text-slate-800">{resultadoConsulta.categoria_delito}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Tipo de Trámite</span>
                    <span className="font-bold text-slate-800">{resultadoConsulta.tipo_tramite}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Sector</span>
                    <span className="font-bold text-slate-800">{resultadoConsulta.sector || 'Esmeraldas'}</span>
                  </div>
                </div>

                <TimelineSeguimiento
                  estadoActual={resultadoConsulta.estado_actual}
                  historial={resultadoConsulta.historial_seguimiento}
                />
              </div>
            )}
          </div>
        </div>
      )}

      {/* SECCIÓN 3: CONSULTA DE ANTECEDENTES CON PROTECCIÓN CONSTITUCIONAL */}
      {seccionActiva === 'antecedentes' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <button
              onClick={() => setSeccionActiva('menu')}
              className="text-xs font-bold text-slate-500 hover:text-slate-800 flex items-center space-x-1"
            >
              <span>← Volver al menú de servicios</span>
            </button>
          </div>

          <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-sm">
            <div className="border-b border-slate-200 pb-4 mb-4">
              <h2 className="text-xl font-black text-slate-900">
                Consulta Oficial de Antecedentes y Récord Penal
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Servicio conectado a la Red Interinstitucional (Migración / SGIM, Registro Civil, Banco e IESS).
              </p>
            </div>

            <div className="p-3.5 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-900 mb-6 flex items-start space-x-2.5">
              <Lock className="w-4 h-4 text-blue-700 shrink-0 mt-0.5" />
              <p className="text-[11px] leading-relaxed">
                <strong>Garantía Constitucional (Art. 76 num. 2 CRE y Art. 584 COIP):</strong> Las denuncias en investigación previa son reservadas. Únicamente se reflejan antecedentes si existe sentencia condenatoria firme o auto de llamamiento a juicio formal dictado por un juez penal.
              </p>
            </div>

            <form onSubmit={handleConsultarAntecedentes} className="flex gap-2 max-w-md mb-6">
              <input
                type="text"
                maxLength={10}
                value={cedulaAntecedente}
                onChange={(e) => setCedulaAntecedente(e.target.value.replace(/\D/g, ''))}
                placeholder="Cédula a consultar (Ej: 0801000001, 0804000004)"
                className="flex-1 px-4 py-2 text-xs rounded-lg border border-slate-300 font-bold font-mono focus:outline-none focus:ring-2 focus:ring-police-700"
              />
              <button
                type="submit"
                disabled={cargandoAntecedente}
                className="px-5 py-2 bg-police-800 hover:bg-police-900 text-white font-bold text-xs rounded-lg transition-colors"
              >
                {cargandoAntecedente ? 'Consultando...' : 'Verificar'}
              </button>
            </form>

            {resAntecedente && (
              <div className="p-5 rounded-xl border border-slate-200 bg-slate-50 space-y-4">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-slate-200 pb-3 gap-2">
                  <div>
                    <p className="text-xs text-slate-400 font-bold">Ciudadano Evaluado</p>
                    <h3 className="text-base font-extrabold text-slate-900">{resAntecedente.nombres_completos}</h3>
                    <p className="text-xs text-slate-500 font-mono">C.I.: {resAntecedente.cedula}</p>
                  </div>
                  <div>
                    {resAntecedente.posee_antecedentes ? (
                      <span className="px-3 py-1 rounded-full bg-rose-100 text-rose-800 font-black text-xs border border-rose-300 flex items-center space-x-1">
                        <AlertCircle className="w-3.5 h-3.5" />
                        <span>REGISTRA ANTECEDENTES PENALES</span>
                      </span>
                    ) : (
                      <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 font-black text-xs border border-emerald-300 flex items-center space-x-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>SIN ANTECEDENTES CONDENATORIOS</span>
                      </span>
                    )}
                  </div>
                </div>

                <div className="p-3 bg-white rounded-lg border border-slate-200 text-xs text-slate-700">
                  <strong>Dictamen Oficial:</strong> {resAntecedente.observaciones}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div className="p-3 bg-white rounded-lg border border-slate-200">
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Órdenes de Captura</span>
                    <span className={`font-bold ${resAntecedente.orden_captura_activa ? 'text-rose-600' : 'text-slate-700'}`}>
                      {resAntecedente.orden_captura_activa ? 'VIGENTE' : 'Ninguna'}
                    </span>
                  </div>
                  <div className="p-3 bg-white rounded-lg border border-slate-200">
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Medidas Cautelares</span>
                    <span className={`font-bold ${resAntecedente.medidas_cautelares_activas ? 'text-amber-600' : 'text-slate-700'}`}>
                      {resAntecedente.medidas_cautelares_activas ? 'VIGENTE' : 'Ninguna'}
                    </span>
                  </div>
                  <div className="p-3 bg-white rounded-lg border border-slate-200">
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Causas en Juicio / Condena</span>
                    <span className="font-bold text-slate-800">{resAntecedente.total_condenas_o_juicios}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
