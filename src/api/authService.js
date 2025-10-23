// src/api/authService.js
import api from './axios.config';

// 🔧 Función helper para normalizar el usuario
const normalizeUser = (userData) => {
  if (!userData) return null;

  // Si el rol viene como string, convertirlo a objeto
  if (typeof userData.role === 'string') {
    userData = {
      ...userData,
      role: {
        id: userData.role === 'admin' ? 1 : 2,
        name: userData.role
      }
    };
  }

  // Si el rol es un objeto pero no tiene 'name', usar valor por defecto
  if (userData.role && typeof userData.role === 'object' && !userData.role.name) {
    userData = {
      ...userData,
      role: {
        id: userData.role.id || null,
        name: 'empleado'
      }
    };
  }

  // Si no tiene rol en absoluto, asignar uno por defecto
  if (!userData.role) {
    userData = {
      ...userData,
      role: {
        id: null,
        name: 'empleado'
      }
    };
  }

  return userData;
};

const authService = {
  login: async (username, password) => {
    try {
      const response = await api.post('/auth/login/', {
        username,
        password,
      });

      const { access, refresh, user } = response.data;

      // 🔧 Normalizar usuario antes de guardarlo
      const normalizedUser = normalizeUser(user);

      // Guardar en localStorage
      localStorage.setItem('access_token', access);
      localStorage.setItem('refresh_token', refresh);
      localStorage.setItem('user', JSON.stringify(normalizedUser));

      console.log('✅ Usuario normalizado guardado:', normalizedUser);

      return {
        ...response.data,
        user: normalizedUser
      };
    } catch (error) {
      const errorMsg = error.response?.data?.error || 
                      error.response?.data?.detail || 
                      'Error al iniciar sesión';
      throw { error: errorMsg };
    }
  },

  logout: () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');
  },

  getCurrentUser: () => {
    const userStr = localStorage.getItem('user');
    if (!userStr) return null;
    
    try {
      const user = JSON.parse(userStr);
      // 🔧 Normalizar usuario al recuperarlo
      return normalizeUser(user);
    } catch (error) {
      console.error('Error al parsear usuario:', error);
      return null;
    }
  },

  isAuthenticated: () => {
    return !!localStorage.getItem('access_token');
  },

  getMe: async () => {
    try {
      const response = await api.get('/users/me/');
      // 🔧 Normalizar usuario antes de guardarlo
      const normalizedUser = normalizeUser(response.data);
      localStorage.setItem('user', JSON.stringify(normalizedUser));
      return normalizedUser;
    } catch (error) {
      throw { error: 'Error al obtener usuario' };
    }
  },
};

export default authService;