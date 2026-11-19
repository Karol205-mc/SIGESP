import React, { useState, useEffect, useRef } from 'react';
import { MapPin, Navigation, Phone, Clock, Shield, Building, AlertCircle, ArrowLeft, ExternalLink } from 'lucide-react';

// Sedes policiales con coordenadas reales de Esmeraldas y cantones
const SEDES_POLICIALES = [
  {
    id: 1,
    nombre: 'UVC Central Esmeraldas (Subzona N° 8)',
    tipo: 'UVC (Unidad de Vigilancia Comunitaria)',
    canton: 'Esmeraldas',
    direccion: 'Av. Jaime Roldós Aguilera y Av. del Pacífico (Sector Las Palmas)',
    telefono: '(06) 272-0101 / ECU-911',
    horario: '24 Horas (Atención Continua)',
    servicios: ['Recepción de Denuncias', 'Unidad de Flagrancia', 'Policía Judicial (PJ)', 'DINAPEN'],
    lat: 0.9631,
    lng: -79.6542,
    destacada: true
  },
  {
    id: 2,
    nombre: 'UPC Las Palmas',
    tipo: 'UPC (Unidad de Policía Comunitaria)',
    canton: 'Esmeraldas',
    direccion: 'Av. Kennedy y Malecón de Las Palmas',
    telefono: '(06) 272-2345',
    horario: '24 Horas',
    servicios: ['Recepción de Denuncias', 'Patrullaje Preventivo', 'Auxilio Inmediato'],
    lat: 0.9850,
    lng: -79.6450
  },
  {
    id: 3,
    nombre: 'UPC Centro Histórico',
    tipo: 'UPC (Unidad de Policía Comunitaria)',
    canton: 'Esmeraldas',
    direccion: 'Calle Bolívar y Rocafuerte, frente al Parque Central',
    telefono: '(06) 272-1100',
    horario: '24 Horas',
    servicios: ['Recepción de Denuncias', 'Mediación Comunitaria', 'Patrullaje a pie'],
    lat: 0.9690,
    lng: -79.6520
  },
  {
    id: 4,
    nombre: 'UPC La Propicia',
    tipo: 'UPC (Unidad de Policía Comunitaria)',
    canton: 'Esmeraldas',
    direccion: 'Vía a Atacames, Sector La Propicia 1',
    telefono: '(06) 271-8890',
    horario: '24 Horas',
    servicios: ['Recepción de Denuncias', 'Vigilancia Comunitaria', 'Control Motorizado'],
    lat: 0.9410,
    lng: -79.6680
  },
  {
    id: 5,
    nombre: 'Complejo Judicial Penal de Esmeraldas',
    tipo: 'Sede Judicial y Fiscalía',
    canton: 'Esmeraldas',
    direccion: 'Calle Sucre y 10 de Agosto',
    telefono: '(06) 272-5500',
    horario: '08h00 a 17h00 (Audiencias 24h en turnos)',
    servicios: ['Salas de Audiencias Penales', 'Fiscalía General', 'Sorteo de Causas'],
    lat: 0.9640,
    lng: -79.6560
  },
  {
    id: 6,
    nombre: 'UVC / UPC Atacames',
    tipo: 'UPC (Unidad de Policía Comunitaria)',
    canton: 'Atacames',
    direccion: 'Malecón de Atacames y Calle Principal',
    telefono: '(06) 273-1200 / ECU-911',
    horario: '24 Horas',
    servicios: ['Recepción de Denuncias', 'Seguridad Turística', 'Flagrancia'],
    lat: 0.8680,
    lng: -79.8450
  },
  {
    id: 7,
    nombre: 'UVC Quinindé (Rosa Zárate)',
    tipo: 'UVC (Unidad de Vigilancia Comunitaria)',
    canton: 'Quinindé',
    direccion: 'Av. 3 de Julio y 24 de Mayo',
    telefono: '(06) 273-6100 / ECU-911',
    horario: '24 Horas',
    servicios: ['Recepción de Denuncias', 'Policía Judicial', 'DINAPEN'],
    lat: 0.3280,
    lng: -79.4670
  },
  {
    id: 8,
    nombre: 'UPC San Lorenzo',
    tipo: 'UPC Fronterizo',
    canton: 'San Lorenzo',
    direccion: 'Av. Padre Lino Campuzano y Tácito Ortiz',
    telefono: '(06) 278-0100',
    horario: '24 Horas',
    servicios: ['Control Fronterizo', 'Recepción de Denuncias', 'DINAPEN'],
    lat: 1.2850,
    lng: -78.8350
  }
];

// Cálculo de distancia en km (Fórmula de Haversine)
function calcularDistancia(lat1, lon1, lat2, lon2) {
  const R = 6371; // Radio de la Tierra en km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return (R * c).toFixed(1);
}

export default function SedesPoliciales({ onVolver }) {
  const [cantonSeleccionado, setCantonSeleccionado] = useState('TODOS');
  const [ubicacionUsuario, setUbicacionUsuario] = useState(null);
  const [detectandoGps, setDetectandoGps] = useState(false);
  const [sedeActiva, setSedeActiva] = useState(SEDES_POLICIALES[0]);
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersRef = useRef({});

  // Filtrado
  const sedesFiltradas = cantonSeleccionado === 'TODOS' 
    ? SEDES_POLICIALES 
    : SEDES_POLICIALES.filter(s => s.canton === cantonSeleccionado);

  // Inicializar Leaflet OpenStreetMap
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    if (window.L) {
      const L = window.L;
      const initialLat = 0.9682;
      const initialLng = -79.6517;

      const map = L.map(mapContainerRef.current).setView([initialLat, initialLng], 13);
      mapInstanceRef.current = map;

      // Capa de tiles OpenStreetMap institucional
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors | SIGESP',
        maxZoom: 19
      }).addTo(map);

      // Icono institucional de sede policial
      const policeIcon = L.divIcon({
        className: 'custom-div-icon',
        html: `
          <div style="background-color: #0a2239; border: 2px solid #c59b27; border-radius: 50%; width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 6px rgba(0,0,0,0.3);">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
            </svg>
          </div>
        `,
        iconSize: [32, 32],
        iconAnchor: [16, 32]
      });

      // Agregar marcadores de todas las sedes
      SEDES_POLICIALES.forEach(sede => {
        const marker = L.marker([sede.lat, sede.lng], { icon: policeIcon }).addTo(map);
        marker.bindPopup(`
          <div style="font-size: 12px; line-height: 1.4;">
            <strong style="color: #0a2239; font-size: 13px; display: block; margin-bottom: 3px;">${sede.nombre}</strong>
            <span style="color: #c59b27; font-weight: bold; font-size: 11px;">${sede.tipo}</span>
            <p style="margin: 4px 0; color: #475569;">📍 ${sede.direccion}</p>
            <p style="margin: 2px 0; color: #16a34a; font-weight: 600;">🕒 ${sede.horario}</p>
            <p style="margin: 2px 0; color: #0284c7; font-weight: 600;">📞 ${sede.telefono}</p>
          </div>
        `);
        marker.on('click', () => {
          setSedeActiva(sede);
        });
        markersRef.current[sede.id] = marker;
      });

      // Forzar ajuste de tamaño para evitar áreas grises por renderizado asíncrono
      setTimeout(() => {
        if (mapInstanceRef.current) {
          mapInstanceRef.current.invalidateSize();
        }
      }, 200);

      setTimeout(() => {
        if (mapInstanceRef.current) {
          mapInstanceRef.current.invalidateSize();
        }
      }, 600);
    }

    // Observador de cambios de tamaño en el contenedor para recalcular tiles instantáneamente
    let resizeObserver = null;
    if (mapContainerRef.current) {
      resizeObserver = new ResizeObserver(() => {
        if (mapInstanceRef.current) {
          mapInstanceRef.current.invalidateSize();
        }
      });
      resizeObserver.observe(mapContainerRef.current);
    }

    const handleWindowResize = () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.invalidateSize();
      }
    };
    window.addEventListener('resize', handleWindowResize);

    return () => {
      window.removeEventListener('resize', handleWindowResize);
      if (resizeObserver) {
        resizeObserver.disconnect();
      }
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Forzar redibujado de tiles al cambiar cantón o sede
  useEffect(() => {
    if (mapInstanceRef.current) {
      setTimeout(() => {
        mapInstanceRef.current.invalidateSize();
      }, 100);
    }
  }, [cantonSeleccionado, sedeActiva]);

  // Función para detectar ubicación del usuario
  const detectarUbicacion = () => {
    if (!navigator.geolocation) {
      alert("Su navegador no soporta geolocalización.");
      return;
    }

    setDetectandoGps(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const userLat = pos.coords.latitude;
        const userLng = pos.coords.longitude;
        setUbicacionUsuario({ lat: userLat, lng: userLng });
        setDetectandoGps(false);

        if (mapInstanceRef.current && window.L) {
          const L = window.L;
          const map = mapInstanceRef.current;

          // Marcador del usuario
          const userIcon = L.divIcon({
            className: 'user-icon',
            html: `
              <div style="background-color: #2563eb; border: 3px solid #ffffff; border-radius: 50%; width: 20px; height: 20px; box-shadow: 0 0 0 6px rgba(37, 99, 235, 0.3);">
              </div>
            `,
            iconSize: [20, 20],
            iconAnchor: [10, 10]
          });

          L.marker([userLat, userLng], { icon: userIcon })
            .addTo(map)
            .bindPopup("<strong>Tu ubicación actual</strong>")
            .openPopup();

          map.setView([userLat, userLng], 14);

          // Buscar la sede más cercana
          let sedeMasCercana = SEDES_POLICIALES[0];
          let menorDist = 999999;
          SEDES_POLICIALES.forEach(s => {
            const dist = parseFloat(calcularDistancia(userLat, userLng, s.lat, s.lng));
            if (dist < menorDist) {
              menorDist = dist;
              sedeMasCercana = s;
            }
          });
          setSedeActiva(sedeMasCercana);
        }
      },
      (err) => {
        setDetectandoGps(false);
        alert("No se pudo obtener su ubicación. Mostrando sedes principales de Esmeraldas.");
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  const seleccionarSede = (sede) => {
    setSedeActiva(sede);
    if (mapInstanceRef.current) {
      mapInstanceRef.current.setView([sede.lat, sede.lng], 16);
      const marker = markersRef.current[sede.id];
      if (marker) marker.openPopup();
    }
  };

  return (
    <div className="space-y-6">
      {/* Botón Volver y Cabecera */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-4 border-b border-slate-200">
        <div>
          <button
            onClick={onVolver}
            className="text-xs font-bold text-slate-500 hover:text-slate-800 flex items-center space-x-1 mb-2"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Volver al menú de servicios</span>
          </button>
          <h1 className="text-xl font-black text-slate-900">
            Salas de Atención y Sedes Físicas (UPC / UVC)
          </h1>
          <p className="text-xs text-slate-500">
            Red de Unidades de Policía Comunitaria y Vigilancia Comunitaria en Esmeraldas y Cantones
          </p>
        </div>

        {/* Botón GPS */}
        <button
          onClick={detectarUbicacion}
          disabled={detectandoGps}
          className="px-4 py-2 bg-police-800 hover:bg-police-900 text-white font-bold text-xs rounded-xl shadow-sm flex items-center space-x-2 shrink-0 transition-all"
        >
          <Navigation className={`w-3.5 h-3.5 text-accent-gold ${detectandoGps ? 'animate-spin' : ''}`} />
          <span>{detectandoGps ? 'Detectando GPS...' : 'Buscar UPC Más Cercana'}</span>
        </button>
      </div>

      {/* Selector de Cantón */}
      <div className="flex items-center space-x-2 overflow-x-auto pb-1 text-xs">
        <span className="font-bold text-slate-700 shrink-0">Cantón:</span>
        {['TODOS', 'Esmeraldas', 'Atacames', 'Quinindé', 'San Lorenzo'].map(c => (
          <button
            key={c}
            onClick={() => setCantonSeleccionado(c)}
            className={`px-3 py-1 rounded-lg font-bold border transition-colors shrink-0 ${
              cantonSeleccionado === c 
                ? 'bg-police-900 text-white border-police-900' 
                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
            }`}
          >
            {c}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* MAPA OPENSTREETMAP INTERACTIVO */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-2 border border-slate-200 shadow-sm overflow-hidden flex flex-col h-[520px]">
          <div 
            ref={mapContainerRef} 
            className="w-full h-full rounded-xl z-0"
            style={{ minHeight: '480px', width: '100%', height: '100%' }}
          ></div>
        </div>

        {/* LISTADO DE SEDES Y FICHA DETALLADA */}
        <div className="space-y-4">
          {/* Ficha de Sede Seleccionada */}
          {sedeActiva && (
            <div className="bg-white rounded-2xl p-5 border border-police-700/40 shadow-md space-y-3 relative overflow-hidden">
              <div className="flex items-start justify-between">
                <div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-police-100 text-police-900 border border-police-200">
                    {sedeActiva.tipo}
                  </span>
                  <h3 className="text-sm font-black text-slate-900 mt-1.5">{sedeActiva.nombre}</h3>
                </div>
                <Building className="w-5 h-5 text-accent-gold shrink-0 mt-1" />
              </div>

              <div className="space-y-2 text-xs text-slate-600">
                <p className="flex items-start space-x-2">
                  <MapPin className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                  <span>{sedeActiva.direccion}</span>
                </p>
                <p className="flex items-center space-x-2">
                  <Clock className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span className="font-semibold text-emerald-800">{sedeActiva.horario}</span>
                </p>
                <p className="flex items-center space-x-2">
                  <Phone className="w-4 h-4 text-police-700 shrink-0" />
                  <span className="font-bold text-police-900">{sedeActiva.telefono}</span>
                </p>
              </div>

              {/* Servicios disponibles */}
              <div className="pt-2 border-t border-slate-100">
                <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                  Servicios que presta esta sede:
                </span>
                <div className="flex flex-wrap gap-1">
                  {sedeActiva.servicios.map((srv, idx) => (
                    <span key={idx} className="text-[10px] font-medium bg-slate-100 text-slate-700 px-2 py-0.5 rounded">
                      • {srv}
                    </span>
                  ))}
                </div>
              </div>

              {/* Botón Navegación Externa */}
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${sedeActiva.lat},${sedeActiva.lng}`}
                target="_blank"
                rel="noreferrer"
                className="w-full py-2 bg-police-900 hover:bg-police-950 text-white font-bold text-xs rounded-lg flex items-center justify-center space-x-1.5 transition-colors"
              >
                <ExternalLink className="w-3.5 h-3.5 text-accent-gold" />
                <span>Cómo Llegar (Google Maps / Waze)</span>
              </a>
            </div>
          )}

          {/* Lista de Sedes del Cantón */}
          <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
            <span className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
              Directorio de Sedes ({sedesFiltradas.length})
            </span>
            {sedesFiltradas.map(s => (
              <div
                key={s.id}
                onClick={() => seleccionarSede(s)}
                className={`p-3 rounded-xl border text-xs cursor-pointer transition-all ${
                  sedeActiva?.id === s.id
                    ? 'bg-police-50 border-police-600 font-semibold'
                    : 'bg-white hover:bg-slate-50 border-slate-200'
                }`}
              >
                <div className="flex justify-between items-center">
                  <span className="font-bold text-slate-900">{s.nombre}</span>
                  <span className="text-[10px] text-slate-400">{s.canton}</span>
                </div>
                <p className="text-[11px] text-slate-500 truncate mt-0.5">{s.direccion}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
