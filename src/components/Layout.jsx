// src/components/Layout.jsx
import React, { useContext, useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import toast from 'react-hot-toast';
import './Layout.css';

const Layout = ({ children }) => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = () => {
    if (window.confirm('¿Estás seguro de que deseas cerrar sesión?')) {
      logout();
      navigate('/login');
      toast.success('Sesión cerrada correctamente');
    }
  };

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const closeSidebar = () => {
    setSidebarOpen(false);
  };

  // Determinar si es admin
  const isAdmin = user?.role?.name === 'admin' || user?.role?.name === 'Admin';

  return (
    <div className="layout">
      {/* Overlay para móvil */}
      {sidebarOpen && <div className="sidebar-overlay" onClick={closeSidebar}></div>}

      {/* Sidebar */}
      <aside className={`sidebar ${sidebarOpen ? 'sidebar-open' : ''}`}>
        {/* Header del Sidebar */}
        <div className="sidebar-header">
          <div className="sidebar-brand">
            <i className='bx bxs-store sidebar-brand-icon'></i>
            <div className="sidebar-brand-text">
              <h2>POS System</h2>
              <span className="sidebar-version">v1.0.0</span>
            </div>
          </div>
          <button className="sidebar-close-btn" onClick={closeSidebar}>
            <i className='bx bx-x'></i>
          </button>
        </div>

        {/* Navegación */}
        <nav className="sidebar-nav">
          <div className="nav-section">
            <span className="nav-section-title">Principal</span>
            
            <NavLink
              to="/dashboard"
              className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
              onClick={closeSidebar}
            >
              <i className='bx bxs-dashboard nav-icon'></i>
              <span className="nav-text">Dashboard</span>
            </NavLink>

            <NavLink
              to="/products"
              className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
              onClick={closeSidebar}
            >
              <i className='bx bxs-package nav-icon'></i>
              <span className="nav-text">Productos</span>
            </NavLink>

            <NavLink
              to="/sales"
              className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
              onClick={closeSidebar}
            >
              <i className='bx bxs-cart nav-icon'></i>
              <span className="nav-text">Ventas</span>
            </NavLink>
          </div>

          {/* Sección Admin */}
          {isAdmin && (
            <div className="nav-section">
              <span className="nav-section-title">Administración</span>
              
              <NavLink
                to="/inventory"
                className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                onClick={closeSidebar}
              >
                <i className='bx bxs-box nav-icon'></i>
                <span className="nav-text">Inventario</span>
              </NavLink>

              <NavLink
                to="/users"
                className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                onClick={closeSidebar}
              >
                <i className='bx bxs-group nav-icon'></i>
                <span className="nav-text">Empleados</span>
              </NavLink>

              <NavLink
                to="/reports"
                className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                onClick={closeSidebar}
              >
                <i className='bx bxs-bar-chart-alt-2 nav-icon'></i>
                <span className="nav-text">Reportes</span>
              </NavLink>

              <NavLink
                to="/system"
                className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                onClick={closeSidebar}
              >
                <i className='bx bxs-cog nav-icon'></i>
                <span className="nav-text">Sistema</span>
              </NavLink>
            </div>
          )}
        </nav>

        {/* Footer del Sidebar */}
        <div className="sidebar-footer">
          <div className="user-card">
            <div className="user-avatar">
              <i className='bx bxs-user'></i>
            </div>
            <div className="user-info">
              <div className="user-name">{user?.username || 'Cargando...'}</div>
              <div className="user-role">
                <i className='bx bxs-badge-check'></i>
                {user?.role?.name || 'Sin rol'}
              </div>
            </div>
          </div>
          <button onClick={handleLogout} className="logout-button">
            <i className='bx bx-log-out'></i>
            <span>Cerrar Sesión</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="main-wrapper">
        {/* Header para móvil */}
        <header className="mobile-header">
          <button className="menu-toggle-btn" onClick={toggleSidebar}>
            <i className='bx bx-menu'></i>
          </button>
          <div className="mobile-header-brand">
            <i className='bx bxs-store'></i>
            <span>POS System</span>
          </div>
          <div className="mobile-header-user">
            <div className="user-avatar-small">
              {user?.username?.charAt(0).toUpperCase() || '?'}
            </div>
          </div>
        </header>

        {/* Contenido Principal */}
        <main className="main-content">
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;