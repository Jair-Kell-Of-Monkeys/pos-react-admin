// src/context/AuthContext.jsx
import React, { createContext, useState, useEffect } from 'react';
import authService from '../api/authService';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log('🔄 AuthContext: Inicializando...');
    loadUser();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadUser = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('access_token');
      const userStr = localStorage.getItem('user');

      if (token && userStr) {
        const currentUser = JSON.parse(userStr);
        setUser(currentUser);
      } else {
        setUser(null);
      }
    } catch (error) {
      console.error('❌ Error al cargar usuario:', error);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const login = async (username, password) => {
    try {
      console.log('🔐 Intentando login...');
      const data = await authService.login(username, password);
      
      console.log('✅ Login exitoso - Usuario recibido:', data.user);
      setUser(data.user);
      
      return data;
    } catch (error) {
      console.error('❌ Error en login:', error);
      throw error;
    }
  };

  const logout = () => {
    console.log('🚪 Cerrando sesión...');
    authService.logout();
    setUser(null);
  };

  const updateUser = (userData) => {
    console.log('🔄 Actualizando usuario:', userData);
    setUser(userData);
    localStorage.setItem('user', JSON.stringify(userData));
  };

  const refreshUser = async () => {
    try {
      console.log('🔄 Refrescando datos del usuario...');
      const userData = await authService.getMe();
      setUser(userData);
      console.log('✅ Usuario refrescado:', userData);
      return userData;
    } catch (error) {
      console.error('❌ Error al refrescar usuario:', error);
      throw error;
    }
  };

  // Verificar roles de forma segura
  const isAdmin = () => {
    if (!user || !user.role) {
      console.log('🔍 isAdmin: false - no user or no role');
      return false;
    }
    
    // Manejar tanto string como objeto
    const roleName = typeof user.role === 'string' 
      ? user.role 
      : user.role.name;
    
    const result = roleName === 'admin' || roleName === 'Admin';
    console.log('🔍 isAdmin:', result, '- role:', user.role);
    return result;
  };

  const isEmpleado = () => {
    if (!user || !user.role) {
      console.log('🔍 isEmpleado: false - no user or no role');
      return false;
    }
    
    // Manejar tanto string como objeto
    const roleName = typeof user.role === 'string' 
      ? user.role 
      : user.role.name;
    
    const result = roleName === 'empleado' || roleName === 'Empleado';
    console.log('🔍 isEmpleado:', result, '- role:', user.role);
    return result;
  };

  const hasPermission = (permission) => {
    return user?.role?.permissions?.includes(permission);
  };

  const isAuthenticated = !!user && !!localStorage.getItem('access_token');

  console.log('🔍 AuthContext state:', { 
    loading, 
    isAuthenticated, 
    hasUser: !!user,
    username: user?.username,
    role: user?.role
  });

  const value = {
    user,
    loading,
    login,
    logout,
    updateUser,
    refreshUser,
    isAuthenticated,
    isAdmin,
    isEmpleado,
    hasPermission,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};