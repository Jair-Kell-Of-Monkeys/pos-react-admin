// src/pages/Login/Login.jsx
import React, { useState, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import toast, { Toaster } from 'react-hot-toast';
import './Login.css';

const Login = () => {
  const [formData, setFormData] = useState({
    username: '',
    password: '',
  });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // ✅ NUEVO: Validar campos vacíos
    if (!formData.username.trim() || !formData.password.trim()) {
      toast.error('Por favor completa todos los campos');
      return;
    }

    setLoading(true);
    console.log('🔐 Intentando login con usuario:', formData.username);

    try {
      const result = await login(formData.username, formData.password);
      
      console.log('✅ Login exitoso:', result.user);
      toast.success(`¡Bienvenido ${result.user.username}!`);
      
      // ✅ CORRECCIÓN: Esperar 300ms antes de navegar
      // Esto da tiempo a que AuthContext actualice el estado completamente
      setTimeout(() => {
        console.log('🚀 Navegando a dashboard...');
        navigate('/dashboard', { replace: true });
      }, 300);

    } catch (err) {
      console.error('❌ Error en login:', err);
      toast.error(err.error || 'Error al iniciar sesión');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <Toaster position="top-right" />
      
      <div className="login-card">
        {/* Logo */}
        <div className="login-logo-container">
          <div className="login-logo">
            <span className="login-logo-icon">🏪</span>
          </div>
        </div>

        {/* Título */}
        <h1 className="login-title">POS System Admin</h1>
        <p className="login-subtitle">Iniciar Sesión</p>

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="login-form">
          {/* Usuario */}
          <div className="login-input-group">
            <label className="login-label">Usuario</label>
            <div className="login-input-wrapper">
              <span className="login-input-icon">👤</span>
              <input
                type="text"
                name="username"
                value={formData.username}
                onChange={handleChange}
                placeholder="Ingresa tu usuario"
                className="login-input"
                disabled={loading}
                required
                autoFocus
              />
            </div>
          </div>

          {/* Contraseña */}
          <div className="login-input-group">
            <label className="login-label">Contraseña</label>
            <div className="login-input-wrapper">
              <span className="login-input-icon">🔒</span>
              <input
                type={showPassword ? 'text' : 'password'}
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Ingresa tu contraseña"
                className="login-input"
                disabled={loading}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="login-show-password-btn"
                disabled={loading}
                tabIndex="-1"
              >
                {showPassword ? '👁️' : '👁️‍🗨️'}
              </button>
            </div>
          </div>

          {/* Botón de login */}
          <button
            type="submit"
            disabled={loading}
            className="login-button"
          >
            {loading ? (
              <span className="login-button-loading">
                <span className="login-spinner"></span>
                Iniciando sesión...
              </span>
            ) : (
              'Iniciar Sesión'
            )}
          </button>
        </form>

        {/* Footer */}
        <div className="login-footer">
          <p className="login-footer-text">POS System v1.0.0</p>
        </div>
      </div>
    </div>
  );
};

export default Login;