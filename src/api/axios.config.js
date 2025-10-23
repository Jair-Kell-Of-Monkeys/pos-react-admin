// src/api/axios.config.js
import axios from 'axios';

// Configuración base
const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:8000/api',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
    'ngrok-skip-browser-warning': 'true',
  },
});

// Interceptor de request - agregar token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    config.headers['ngrok-skip-browser-warning'] = 'true';
    
    console.log('📤 Request:', {
      url: config.url,
      method: config.method,
      hasToken: !!token
    });
    
    return config;
  },
  (error) => Promise.reject(error)
);

// Interceptor de response - manejar 401 y refrescar token
api.interceptors.response.use(
  (response) => {
    console.log('📥 Response:', {
      url: response.config.url,
      status: response.status
    });
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    console.log('❌ Error de request:', {
      url: originalRequest?.url,
      status: error.response?.status,
      retry: originalRequest?._retry
    });

    // Si es 401 y no hemos intentado refrescar
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem('refresh_token');
        
        if (!refreshToken) {
          console.log('⚠️ No hay refresh token, redirigiendo a login');
          localStorage.clear();
          window.location.href = '/login';
          return Promise.reject(error);
        }

        console.log('🔄 Intentando refrescar token...');

        // Intentar refrescar el token
        const response = await axios.post(
          `${process.env.REACT_APP_API_URL || 'http://localhost:8000/api'}/auth/refresh/`,
          { refresh: refreshToken },
          {
            headers: {
              'Content-Type': 'application/json',
              'ngrok-skip-browser-warning': 'true',
            },
          }
        );

        const { access } = response.data;
        localStorage.setItem('access_token', access);

        console.log('✅ Token refrescado exitosamente');

        // 🔧 CORRECCIÓN: Refrescar datos del usuario también
        try {
          const userResponse = await axios.get(
            `${process.env.REACT_APP_API_URL || 'http://localhost:8000/api'}/users/me/`,
            {
              headers: {
                'Authorization': `Bearer ${access}`,
                'Content-Type': 'application/json',
                'ngrok-skip-browser-warning': 'true',
              },
            }
          );
          
          localStorage.setItem('user', JSON.stringify(userResponse.data));
          console.log('✅ Usuario actualizado en localStorage');
        } catch (userError) {
          console.warn('⚠️ No se pudo actualizar usuario, pero el token es válido');
        }

        // Reintentar la petición original
        originalRequest.headers.Authorization = `Bearer ${access}`;
        originalRequest.headers['ngrok-skip-browser-warning'] = 'true';
        return api(originalRequest);
        
      } catch (refreshError) {
        console.error('❌ Error al refrescar token:', refreshError);
        // Error al refrescar, limpiar y redirigir
        localStorage.clear();
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default api;