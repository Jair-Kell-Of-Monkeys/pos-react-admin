// src/components/Layout.jsx
import React, { useContext } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import toast from 'react-hot-toast';
import './Layout.css';

const Layout = ({ children }) => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleLogout = () => {
    if (window.confirm('¿Estás seguro de que deseas cerrar sesión?')) {
      logout();
      navigate('/login');
      toast.success('Sesión cerrada correctamente');
    }
  };

  // ✅ Determinar si es admin
  const isAdmin = user?.role?.name === 'admin' || user?.role?.name === 'Admin';

  return (
    <div className="layout">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-header">
          <h2>🏪 POS System</h2>
          <p className="sidebar-subtitle">v1.0.0</p>
        </div>

        <nav className="sidebar-nav">
          {/* ✅ Dashboard - Todos los usuarios */}
          <NavLink
            to="/dashboard"
            className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
          >
            <span className="nav-icon">📊</span>
            <span className="nav-text">Dashboard</span>
          </NavLink>

          {/* ✅ Productos - Todos los usuarios */}
          <NavLink
            to="/products"
            className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
          >
            <span className="nav-icon">📦</span>
            <span className="nav-text">Productos</span>
          </NavLink>

          {/* ✅ Ventas - Todos los usuarios */}
          <NavLink
            to="/sales"
            className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
          >
            <span className="nav-icon">🛒</span>
            <span className="nav-text">Ventas</span>
          </NavLink>

          {/* ✅ Inventario - Solo Admin */}
          {isAdmin && (
            <NavLink
              to="/inventory"
              className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
            >
              <span className="nav-icon">📦</span>
              <span className="nav-text">Inventario</span>
            </NavLink>
          )}

          {/* ✅ Empleados - Solo Admin */}
          {isAdmin && (
            <NavLink
              to="/users"
              className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
            >
              <span className="nav-icon">👥</span>
              <span className="nav-text">Empleados</span>
            </NavLink>
          )}

          {/* ✅ Reportes - Solo Admin */}
          {isAdmin && (
            <NavLink
              to="/reports"
              className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
            >
              <span className="nav-icon">📈</span>
              <span className="nav-text">Reportes</span>
            </NavLink>
          )}

          {/* ✅ Sistema - Solo Admin */}
          {isAdmin && (
            <NavLink
              to="/system"
              className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
            >
              <span className="nav-icon">🔧</span>
              <span className="nav-text">Sistema</span>
            </NavLink>
          )}
        </nav>

        <div className="sidebar-footer">
          <div className="user-info">
            <div className="user-avatar">
              {user?.username?.charAt(0).toUpperCase() || '?'}
            </div>
            <div className="user-details">
              <div className="user-name">{user?.username || 'Cargando...'}</div>
              <div className="user-role">{user?.role?.name || 'Sin rol'}</div>
            </div>
          </div>
          <button onClick={handleLogout} className="logout-button">
            🚪 Salir
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="main-content">
        {children}
      </main>
    </div>
  );
};

export default Layout;