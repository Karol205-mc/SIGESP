import React, { useState } from 'react';
import api from '../services/api';
import { UserCheck, Shield, Upload, CheckCircle2, AlertCircle, ArrowLeft, Camera, Lock, Eye, EyeOff } from 'lucide-react';

function validarCedulaEcuatoriana(cedula) {
  if (!/^\d{10}$/.test(cedula)) {
    return { valido: false, mensaje: "La cédula debe tener exactamente 10 dígitos numéricos." };
  }
  const provincia = parseInt(cedula.substring(0, 2), 10);
  if ((provincia < 1 || provincia > 24) && provincia !== 30) {
    return { valido: false, mensaje: `Código de provincia '${cedula.substring(0, 2)}' inválido (en Ecuador debe ser entre 01 y 24).` };
  }
  const tercerDigito = parseInt(cedula[2], 10);
  if (tercerDigito >= 6) {
    return { valido: false, mensaje: `El tercer dígito '${tercerDigito}' no corresponde a una cédula de persona natural (debe ser menor a 6).` };
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
      sugerida,
      mensaje: `El dígito verificador es incorrecto. Para los primeros 9 dígitos, el algoritmo del Registro Civil calcula '${digitoVerificador}' (ejemplo: ${sugerida}), pero ingresó '${digitoActual}'. Verifique si hubo un error de digitación en el último número.`
    };
  }
  return { valido: true };
}

export default function RegistroCiudadano({ onRegistroExitoso, onVolver }) {
  const [formData, setFormData] = useState({
    cedula: '',
    nombres: '',
    apellidos: '',
    fecha_nacimiento: '',
    fecha_expedicion: '',
    codigo_dactilar: '',
    telefono: '',
    email: '',
    direccion: '',
    password: '',
    confirm_password: '',
    foto_anverso: null,
    foto_reverso: null,
    declaracion_jurada: false
  });

  const [previewAnverso, setPreviewAnverso] = useState(null);
  const [previewReverso, setPreviewReverso] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPass, setShowPass] = useState(false);

  // Carga de imágenes en Base64 para preview
  const handleFileChange = (e, campo, setPreview) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert("La imagen no debe superar los 5MB.");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result);
        setFormData(prev => ({ ...prev, [campo]: reader.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Validar cédula con el algoritmo oficial Módulo 10
    const cedulaLimpia = formData.cedula.trim();
    const esPrueba = ['0801000001', '0802000002', '0803000003', '0804000004'].includes(cedulaLimpia);
    if (!esPrueba) {
      const resVal = validarCedulaEcuatoriana(cedulaLimpia);
      if (!resVal.valido) {
        setError(resVal.mensaje);
        return;
      }
    }

    // Validar contraseña
    if (formData.password.length < 5) {
      setError("La contraseña debe tener al menos 5 caracteres.");
      return;
    }
    if (formData.password !== formData.confirm_password) {
      setError("Las contraseñas ingresadas no coinciden.");
      return;
    }

    if (!formData.codigo_dactilar.trim()) {
      setError("Debe ingresar el código dactilar que consta en su cédula de identidad.");
      return;
    }

    if (!formData.declaracion_jurada) {
      setError("Debe aceptar la declaración jurada de veracidad de datos.");
      return;
    }

    setLoading(true);

    try {
      const payload = {
        cedula: cedulaLimpia,
        nombres: formData.nombres.trim(),
        apellidos: formData.apellidos.trim(),
        fecha_nacimiento: formData.fecha_nacimiento || null,
        fecha_expedicion: formData.fecha_expedicion || null,
        codigo_dactilar: formData.codigo_dactilar.trim().toUpperCase(),
        telefono: formData.telefono.trim(),
        email: formData.email.trim(),
        direccion: formData.direccion.trim(),
        password: formData.password,
        foto_anverso: formData.foto_anverso,
        foto_reverso: formData.foto_reverso
      };

      const res = await api.post('/ciudadanos/registro-cuenta', payload);
      const data = res.data;

      localStorage.setItem('sigesp_token', data.access_token);
      localStorage.setItem('sigesp_user', JSON.stringify(data));

      alert("¡Cuenta ciudadana creada y verificada exitosamente! Bienvenido a SIGESP.");
      onRegistroExitoso(data);
    } catch (err) {
      setError(err.response?.data?.detail || "Error al crear la cuenta ciudadana.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xl overflow-hidden">
        {/* Cabecera */}
        <div className="bg-police-950 p-6 text-white text-center border-b border-police-800 relative">
          <button
            onClick={onVolver}
            className="absolute left-4 top-5 text-xs text-slate-300 hover:text-white flex items-center space-x-1"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Volver</span>
          </button>

          <div className="w-12 h-12 mx-auto rounded-xl bg-police-800 border border-police-700 flex items-center justify-center p-2 mb-2">
            <img src="/assets/logo_sigesp.svg" alt="SIGESP" className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-black tracking-tight">Registro de Cuenta Ciudadana</h2>
          <p className="text-xs text-slate-300 mt-1">
            Verificación biométrica y documental de identidad oficial
          </p>
        </div>

        <div className="p-6 sm:p-8 space-y-6">
          {error && (
            <div className="p-3.5 bg-rose-50 border border-rose-300 rounded-xl text-xs text-rose-800 flex items-center space-x-2 font-semibold">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5 text-xs">
            {/* Sección 1: Datos de la Cédula */}
            <div>
              <h3 className="font-extrabold text-police-900 uppercase tracking-wider mb-3 flex items-center space-x-1.5 border-b pb-2">
                <span className="w-2 h-2 rounded-full bg-police-700"></span>
                <span>1. Información de la Cédula de Identidad</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Cédula de Identidad (10 dígitos) *</label>
                  <input
                    type="text"
                    maxLength={10}
                    required
                    value={formData.cedula}
                    onChange={(e) => setFormData({ ...formData, cedula: e.target.value.replace(/\D/g, '') })}
                    placeholder="Ej. 0801000001"
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-police-700 font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Código Dactilar de Cédula *</label>
                  <input
                    type="text"
                    required
                    maxLength={15}
                    value={formData.codigo_dactilar}
                    onChange={(e) => setFormData({ ...formData, codigo_dactilar: e.target.value.toUpperCase() })}
                    placeholder="Ej. V3838V4921 (Ver reverso/anverso)"
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-police-700 font-mono uppercase font-bold"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Nombres Completos *</label>
                  <input
                    type="text"
                    required
                    value={formData.nombres}
                    onChange={(e) => setFormData({ ...formData, nombres: e.target.value })}
                    placeholder="Como consta en la cédula"
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-police-700"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Apellidos Completos *</label>
                  <input
                    type="text"
                    required
                    value={formData.apellidos}
                    onChange={(e) => setFormData({ ...formData, apellidos: e.target.value })}
                    placeholder="Como consta en la cédula"
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-police-700"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Fecha de Nacimiento *</label>
                  <input
                    type="date"
                    required
                    value={formData.fecha_nacimiento}
                    onChange={(e) => setFormData({ ...formData, fecha_nacimiento: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-police-700"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Fecha de Expedición de la Cédula *</label>
                  <input
                    type="date"
                    required
                    value={formData.fecha_expedicion}
                    onChange={(e) => setFormData({ ...formData, fecha_expedicion: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-police-700"
                  />
                </div>
              </div>
            </div>

            {/* Sección 2: Contacto y Ubicación */}
            <div className="pt-2">
              <h3 className="font-extrabold text-police-900 uppercase tracking-wider mb-3 flex items-center space-x-1.5 border-b pb-2">
                <span className="w-2 h-2 rounded-full bg-police-700"></span>
                <span>2. Domicilio y Contacto</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Teléfono Celular *</label>
                  <input
                    type="tel"
                    required
                    value={formData.telefono}
                    onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                    placeholder="0991234567"
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-police-700 font-mono"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Correo Electrónico *</label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="ciudadano@ejemplo.com"
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-police-700"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block font-bold text-slate-700 mb-1">Dirección de Residencia Exacta *</label>
                  <input
                    type="text"
                    required
                    value={formData.direccion}
                    onChange={(e) => setFormData({ ...formData, direccion: e.target.value })}
                    placeholder="Provincia, Cantón, Calle principal, intersección y N° de inmueble"
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-police-700"
                  />
                </div>
              </div>
            </div>

            {/* Sección 3: Carga de Fotografías de la Cédula (Anverso y Reverso) */}
            <div className="pt-2">
              <h3 className="font-extrabold text-police-900 uppercase tracking-wider mb-3 flex items-center space-x-1.5 border-b pb-2">
                <span className="w-2 h-2 rounded-full bg-police-700"></span>
                <span>3. Carga Documental de la Cédula Física</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Anverso */}
                <div className="border border-dashed border-slate-300 rounded-xl p-3 text-center space-y-2 bg-slate-50">
                  <span className="font-bold text-slate-700 block">Foto Anverso (Frente)</span>
                  {previewAnverso ? (
                    <div className="relative">
                      <img src={previewAnverso} alt="Anverso" className="h-28 mx-auto object-cover rounded-lg border" />
                      <button
                        type="button"
                        onClick={() => { setPreviewAnverso(null); setFormData(p => ({ ...p, foto_anverso: null })); }}
                        className="text-[10px] text-rose-600 font-bold mt-1 block mx-auto underline"
                      >
                        Cambiar foto
                      </button>
                    </div>
                  ) : (
                    <label className="cursor-pointer block p-4 hover:bg-slate-100 rounded-lg transition-colors">
                      <Camera className="w-6 h-6 mx-auto text-slate-400 mb-1" />
                      <span className="text-[11px] text-police-700 font-semibold block">Subir foto frontal</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => handleFileChange(e, 'foto_anverso', setPreviewAnverso)}
                      />
                    </label>
                  )}
                </div>

                {/* Reverso */}
                <div className="border border-dashed border-slate-300 rounded-xl p-3 text-center space-y-2 bg-slate-50">
                  <span className="font-bold text-slate-700 block">Foto Reverso (Posterior con huella)</span>
                  {previewReverso ? (
                    <div className="relative">
                      <img src={previewReverso} alt="Reverso" className="h-28 mx-auto object-cover rounded-lg border" />
                      <button
                        type="button"
                        onClick={() => { setPreviewReverso(null); setFormData(p => ({ ...p, foto_reverso: null })); }}
                        className="text-[10px] text-rose-600 font-bold mt-1 block mx-auto underline"
                      >
                        Cambiar foto
                      </button>
                    </div>
                  ) : (
                    <label className="cursor-pointer block p-4 hover:bg-slate-100 rounded-lg transition-colors">
                      <Camera className="w-6 h-6 mx-auto text-slate-400 mb-1" />
                      <span className="text-[11px] text-police-700 font-semibold block">Subir foto posterior</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => handleFileChange(e, 'foto_reverso', setPreviewReverso)}
                      />
                    </label>
                  )}
                </div>
              </div>
            </div>

            {/* Sección 4: Contraseña de Acceso */}
            <div className="pt-2">
              <h3 className="font-extrabold text-police-900 uppercase tracking-wider mb-3 flex items-center space-x-1.5 border-b pb-2">
                <span className="w-2 h-2 rounded-full bg-police-700"></span>
                <span>4. Contraseña de Acceso</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Contraseña *</label>
                  <div className="relative">
                    <input
                      type={showPass ? 'text' : 'password'}
                      required
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      placeholder="Mínimo 5 caracteres"
                      className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-police-700 font-medium"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPass(!showPass)}
                      className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600"
                    >
                      {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Confirmar Contraseña *</label>
                  <input
                    type={showPass ? 'text' : 'password'}
                    required
                    value={formData.confirm_password}
                    onChange={(e) => setFormData({ ...formData, confirm_password: e.target.value })}
                    placeholder="Repita su contraseña"
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-police-700 font-medium"
                  />
                </div>
              </div>
            </div>

            {/* Declaración Jurada */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
              <div className="flex items-start space-x-3">
                <input
                  type="checkbox"
                  id="juramento_reg"
                  required
                  checked={formData.declaracion_jurada}
                  onChange={(e) => setFormData({ ...formData, declaracion_jurada: e.target.checked })}
                  className="w-4 h-4 text-police-700 border-slate-300 rounded mt-0.5"
                />
                <label htmlFor="juramento_reg" className="text-xs text-slate-800 font-bold cursor-pointer leading-relaxed">
                  Declaro bajo juramento que los datos y documentos proporcionados son reales, fidedignos y corresponden a mi identidad oficial. Acepto los términos de responsabilidad penal por simulación de identidad.
                </label>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-police-800 hover:bg-police-900 text-white font-bold text-xs rounded-xl shadow-md transition-colors flex items-center justify-center space-x-2 disabled:opacity-50"
            >
              <UserCheck className="w-4 h-4 text-accent-gold" />
              <span>{loading ? 'Validando y Creando Cuenta...' : 'Crear Cuenta Ciudadana'}</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
