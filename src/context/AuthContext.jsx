import React, { createContext, useState, useEffect } from 'react';
import authService from '../api/authService';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Cargar usuario al iniciar
    const loadUser = () => {
      const currentUser = authService.getCurrentUser();
      setUser(currentUser);
      setLoading(false);
    };

    loadUser();
  }, []);

  const login = async (username, password) => {
    try {
      const data = await authService.login(username, password);
      setUser(data.user);
      return data;
    } catch (error) {
      throw error;
    }
  };

  const logout = () => {
    authService.logout();
    setUser(null);
  };

  const updateUser = (userData) => {
    setUser(userData);
    localStorage.setItem('user', JSON.stringify(userData));
  };

  const refreshUser = async () => {
    try {
      const userData = await authService.getMe();
      setUser(userData);
      return userData;
    } catch (error) {
      console.error('Error al refrescar usuario:', error);
      throw error;
    }
  };

  // Verificar roles
  const isAdmin = () => {
    return user?.role?.id === 1 || user?.role?.name === 'Admin';
  };

  const isEmpleado = () => {
    return user?.role?.id === 2 || user?.role?.name === 'Empleado';
  };

  const hasPermission = (permission) => {
    // Aquí puedes agregar lógica de permisos más compleja
    return user?.role?.permissions?.includes(permission);
  };

  const value = {
    user,
    loading,
    login,
    logout,
    updateUser,
    refreshUser,
    isAuthenticated: authService.isAuthenticated,
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