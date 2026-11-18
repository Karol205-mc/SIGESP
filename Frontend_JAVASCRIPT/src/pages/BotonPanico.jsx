import React, { useState } from 'react';
import api from '../services/api';
import { AlertOctagon, ShieldAlert, PhoneCall, Radio, CheckCircle2, Clock, MapPin, Navigation, ArrowLeft } from 'lucide-react';

export default function BotonPanico({ user, onVolver, onNavigateToLogin }) {
  const [alertaEnviada, setAlertaEnviada] = useState(null);
  const [enviando, setEnviando] = useState(false);
  const [tipoEmergencia, setTipoEmergencia] = useState('ROBO_EN_CURSO');
  const [referenciaLugar, setReferenciaLugar] = useState('');

  if (!user) {
    return (
      <div className="max-w-md mx-auto p-6 bg-white rounded-2xl border border-slate-200 text-center space-y-4 shadow-xl">
        <div className="w-14 h-14 bg-rose-100 text-rose-700 rounded-2xl flex items-center justify-center mx-auto">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <h2 className="text-lg font-black text-slate-900">Módulo de Auxilio Inmediato (SOS)</h2>
        <p className="text-xs text-slate-600 leading-relaxed">
          Para evitar falsas alarmas y movilización innecesaria de patrullas, el Botón de Pánico Digital requiere una <strong>cuenta ciudadana verificada</strong> con cédula de identidad.
        </p>
        <div className="pt-2 flex flex-col gap-2">
          <button
            onClick={onNavigateToLogin}
            className="w-full py-2.5 bg-police-800 hover:bg-police-900 text-white font-bold text-xs rounded-xl shadow-sm"
          >
            Iniciar Sesión / Identificarse
          </button>
          <button
            onClick={onVolver}
            className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl"
          >
            Volver
          </button>
        </div>
      </div>
    );
  }

  const activarAlerta = () => {
    setEnviando(true);

    // Obtener geolocalización del dispositivo
    const procesarEnvio = (lat, lng) => {
      api.post('/ciudadanos/panico', {
        latitud: lat,
        longitud: lng,
        direccion_referencial: referenciaLugar || 'Ubicación en vivo capturada por dispositivo móvil',
        tipo_emergencia: tipoEmergencia
      }).then(res => {
        setAlertaEnviada(res.data);
        setEnviando(false);
      }).catch(err => {
        alert("Error al transmitir la alerta de auxilio.");
        setEnviando(false);
      });
    };

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => procesarEnvio(pos.coords.latitude, pos.coords.longitude),
        () => procesarEnvio(0.9682, -79.6517), // Fallback Esmeraldas Centro
        { timeout: 7000, enableHighAccuracy: true }
      );
    } else {
      procesarEnvio(0.9682, -79.6517);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center justify-between pb-3 border-b border-slate-200">
        <button
          onClick={onVolver}
          className="text-xs font-bold text-slate-500 hover:text-slate-800 flex items-center space-x-1"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Volver al menú de servicios</span>
        </button>
        <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200 flex items-center space-x-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span>Ciudadano Conectado: {user.nombre_completo}</span>
        </span>
      </div>

      {alertaEnviada ? (
        /* PANTALLA DE ALERTA ACTIVA Y PATRULLA DESPACHADA */
        <div className="bg-white rounded-2xl p-6 sm:p-10 border-2 border-rose-500 shadow-2xl text-center space-y-6 relative overflow-hidden animate-pulse-border">
          <div className="w-20 h-20 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mx-auto shadow-inner animate-bounce">
            <Radio className="w-10 h-10" />
          </div>

          <div className="space-y-1">
            <span className="px-3 py-1 rounded-full bg-rose-600 text-white text-[11px] font-black uppercase tracking-widest inline-block mb-2">
              SEÑAL DE AUXILIO TRANSMITIDA AL ECU-911 Y CENTRAL DE RADIO
            </span>
            <h2 className="text-2xl font-black text-slate-900">
              ¡Unidad Policial Despachada!
            </h2>
            <p className="text-xs text-slate-500">
              Mantenga la calma, permanezca en un lugar seguro y mantenga su teléfono encendido.
            </p>
          </div>

          <div className="bg-slate-900 text-white p-5 rounded-2xl border border-slate-800 max-w-lg mx-auto grid grid-cols-2 gap-4 text-xs">
            <div className="text-left">
              <span className="text-slate-400 block text-[10px] uppercase font-bold">Código de Despacho</span>
              <span className="font-mono font-bold text-base text-accent-gold">{alertaEnviada.codigo_alerta}</span>
            </div>
            <div className="text-left">
              <span className="text-slate-400 block text-[10px] uppercase font-bold">Tiempo Estimado</span>
              <span className="font-bold text-base text-emerald-400">{alertaEnviada.tiempo_estimado_llegada}</span>
            </div>
            <div className="text-left col-span-2 pt-2 border-t border-slate-800">
              <span className="text-slate-400 block text-[10px] uppercase font-bold">Patrullero Asignado</span>
              <span className="font-bold text-slate-200">{alertaEnviada.patrulla_asignada}</span>
            </div>
          </div>

          <div className="text-xs text-slate-600 bg-rose-50 p-4 rounded-xl border border-rose-200 max-w-lg mx-auto text-left space-y-1.5">
            <div className="font-bold text-rose-950 flex items-center space-x-1.5">
              <PhoneCall className="w-4 h-4 text-rose-700" />
              <span>Instrucciones de Seguridad en Curso:</span>
            </div>
            <p>1. La central policial ha geolocalizado su posición ({alertaEnviada.latitud.toFixed(4)}, {alertaEnviada.longitud.toFixed(4)}).</p>
            <p>2. Si es seguro, no confronte a los sospechosos y resguárdese en un inmueble o local cercano.</p>
            <p>3. La patrulla se encuentra en trayecto prioritario con sirenas y baliza.</p>
          </div>

          <button
            onClick={() => setAlertaEnviada(null)}
            className="px-6 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold text-xs rounded-xl"
          >
            Finalizar Pantalla de Alerta
          </button>
        </div>
      ) : (
        /* PANTALLA PRINCIPAL DEL BOTÓN DE PÁNICO */
        <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-xl space-y-6">
          <div className="text-center space-y-2 border-b border-slate-100 pb-4">
            <h1 className="text-xl font-black text-slate-900">
              Botón de Pánico Digital y Auxilio Inmediato
            </h1>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              Presione el botón únicamente ante una situación de riesgo inminente a su vida o integridad.
            </p>
          </div>

          {/* Opciones de la emergencia */}
          <div className="max-w-md mx-auto space-y-3 text-xs">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Naturaleza de la Emergencia</label>
              <select
                value={tipoEmergencia}
                onChange={(e) => setTipoEmergencia(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-600 font-bold"
              >
                <option value="ROBO_EN_CURSO">Robo / Asalto en Curso</option>
                <option value="VIOLENCIA_INTRAFAMILIAR">Violencia Intrafamiliar o Agresión</option>
                <option value="SOSPECHOSOS_ARMADOS">Presencia de Sospechosos Armados</option>
                <option value="EMERGENCIA_MEDICA_ACCIDENTE">Siniestro Vial o Auxilio Médico</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Referencia del Lugar (Opcional)</label>
              <input
                type="text"
                value={referenciaLugar}
                onChange={(e) => setReferenciaLugar(e.target.value)}
                placeholder="Ej: Frente a la botica / En la parada de bus"
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-600"
              />
            </div>
          </div>

          {/* BOTÓN ROJO PULSANTE DE PÁNICO */}
          <div className="text-center py-6">
            <button
              onClick={activarAlerta}
              disabled={enviando}
              className="w-48 h-48 sm:w-56 sm:h-56 mx-auto rounded-full bg-gradient-to-tr from-rose-800 via-rose-600 to-red-500 hover:from-rose-900 hover:to-rose-600 text-white font-black text-lg sm:text-xl shadow-2xl shadow-rose-600/50 flex flex-col items-center justify-center space-y-2 transform active:scale-95 transition-all border-4 border-white/60 ring-8 ring-rose-200 cursor-pointer disabled:opacity-50"
            >
              <AlertOctagon className="w-14 h-14 sm:w-16 sm:h-16 animate-pulse" />
              <span className="tracking-wider">ACTIVAR SOS</span>
              <span className="text-[10px] font-semibold opacity-90">DESPACHO INMEDIATO</span>
            </button>
          </div>

          <p className="text-[11px] text-center text-slate-400">
            Al activar, se transmitirá su nombre ({user.nombre_completo}), teléfono ({user.telefono || 'Registrado'}) y posición GPS.
          </p>
        </div>
      )}
    </div>
  );
}
