import axios from 'axios';

// URL del Backend FastAPI
const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8083/api/v1';

const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000,
});

// Interceptor para inyectar token JWT automáticamente
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('sigesp_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Interceptor para capturar expiración de sesión (401)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Limpiar sesión local si el token expiró
      const isLoginEndpoint = error.config.url.includes('/auth/login');
      if (!isLoginEndpoint) {
        localStorage.removeItem('sigesp_token');
        localStorage.removeItem('sigesp_user');
      }
    }
    return Promise.reject(error);
  }
);

export default api;
