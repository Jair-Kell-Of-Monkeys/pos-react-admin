// src/components/PrivateRoute.jsx
import React, { useContext } from 'react';
import { Navigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import './PrivateRoute.css';

const PrivateRoute = ({ children, requiredRole = null }) => {
  const { loading, user } = useContext(AuthContext);
  const isAuthenticated = localStorage.getItem('access_token');

  // Mostrar loading mientras carga
  if (loading) {
    return (
      <div className="private-route-loading">
        <div className="spinner"></div>
        <p>Cargando...</p>
      </div>
    );
  }

  // Redirigir a login si no está autenticado
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Verificar rol si es requerido
  if (requiredRole && user?.role?.name !== requiredRole) {
    return (
      <div className="private-route-unauthorized">
        <div className="unauthorized-content">
          <span className="unauthorized-icon">🚫</span>
          <h2>Acceso Denegado</h2>
          <p>No tienes permisos para acceder a esta página</p>
          <button onClick={() => window.history.back()}>
            Volver
          </button>
        </div>
      </div>
    );
  }

  return children;
};

export default PrivateRoute;