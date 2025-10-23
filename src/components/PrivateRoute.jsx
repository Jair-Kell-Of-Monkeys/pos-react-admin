// ✅ PrivateRoute.jsx (ajustado)
import React, { useContext } from 'react';
import { Navigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import './PrivateRoute.css';

const PrivateRoute = ({ children, requiredRole = null }) => {
  const { loading, user } = useContext(AuthContext);
  const token = localStorage.getItem('access_token');
  const isAuthenticated = !!token;

  console.log('🔒 PrivateRoute - Debug:', {
    loading,
    isAuthenticated,
    hasToken: !!token,
    hasUser: !!user,
    userRole: user?.role?.name,
    requiredRole
  });

  // 🔸 Esperar mientras AuthContext termina de cargar
  if (loading) {
    return (
      <div className="private-route-loading">
        <div className="spinner"></div>
        <p>Validando sesión...</p>
      </div>
    );
  }

  // 🔸 Una vez cargado, validar sesión
  if (!isAuthenticated || !user) {
    console.log('❌ No autenticado - Redirigiendo a /login');
    return <Navigate to="/login" replace />;
  }

  // 🔸 Validar rol si aplica
  if (requiredRole && user?.role?.name?.toLowerCase() !== requiredRole.toLowerCase()) {
    console.log('❌ Rol insuficiente');
    return (
      <div className="private-route-unauthorized">
        <div className="unauthorized-content">
          <span className="unauthorized-icon">🚫</span>
          <h2>Acceso Denegado</h2>
          <p>No tienes permisos para acceder a esta página</p>
          <button onClick={() => window.history.back()}>← Volver</button>
        </div>
      </div>
    );
  }

  console.log('✅ Acceso permitido a', user?.username);
  return children;
};

export default PrivateRoute;
