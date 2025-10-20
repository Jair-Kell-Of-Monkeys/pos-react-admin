import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import dashboardService from '../../api/dashboardService';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import toast, { Toaster } from 'react-hot-toast';
import './Dashboard.css';

const Dashboard = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const [dashboardData, setDashboardData] = useState(null);
  const [chartData, setChartData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [chartPeriod, setChartPeriod] = useState('week');

  useEffect(() => {
    loadDashboard();
  }, []);

  useEffect(() => {
    loadChartData();
  }, [chartPeriod]);

  const loadDashboard = async () => {
    setLoading(true);
    try {
      const data = await dashboardService.getSummary();
      setDashboardData(data);
    } catch (error) {
      toast.error(error.error || 'Error al cargar dashboard');
    } finally {
      setLoading(false);
    }
  };

  const loadChartData = async () => {
    try {
      const data = await dashboardService.getSalesChart(chartPeriod);
      setChartData(data.data || []);
    } catch (error) {
      console.error('Error al cargar gráfica:', error);
    }
  };

  const handleLogout = () => {
    if (window.confirm('¿Estás seguro de que deseas cerrar sesión?')) {
      logout();
      navigate('/login');
      toast.success('Sesión cerrada correctamente');
    }
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
    }).format(value);
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Cargando dashboard...</p>
      </div>
    );
  }

  const todaySales = dashboardData?.today_sales || {};
  const weekSales = dashboardData?.week_sales || {};
  const monthSales = dashboardData?.month_sales || {};
  const lowStock = dashboardData?.low_stock || {};
  const inventorySummary = dashboardData?.inventory_summary || {};
  const comparison = dashboardData?.comparison || {};

  return (
    <div className="dashboard-container">
      <Toaster position="top-right" />

      {/* Header */}
      <header className="dashboard-header">
        <div>
          <h1 className="header-title">Dashboard</h1>
          <p className="header-subtitle">
            Bienvenido, <strong>{user?.username}</strong> ({user?.role?.name})
          </p>
        </div>
        <div className="header-actions">
          <button onClick={loadDashboard} className="refresh-btn">
            🔄 Actualizar
          </button>
          <button onClick={handleLogout} className="logout-btn">
            🚪 Cerrar Sesión
          </button>
        </div>
      </header>

      {/* Métricas principales */}
      <div className="metrics-grid">
        <MetricCard
          title="Ventas de Hoy"
          value={formatCurrency(todaySales.total || 0)}
          subtitle={`${todaySales.count || 0} ventas`}
          icon="💰"
          color="#10b981"
        />
        <MetricCard
          title="Ventas de la Semana"
          value={formatCurrency(weekSales.total || 0)}
          subtitle={`${weekSales.count || 0} ventas`}
          icon="📅"
          color="#3b82f6"
        />
        <MetricCard
          title="Ventas del Mes"
          value={formatCurrency(monthSales.total || 0)}
          subtitle={`${monthSales.count || 0} ventas`}
          icon="📈"
          color="#8b5cf6"
          trend={comparison.trend}
          trendValue={comparison.percentage_change}
        />
        <MetricCard
          title="Stock Bajo"
          value={lowStock.count || 0}
          subtitle="productos críticos"
          icon="⚠️"
          color="#f59e0b"
        />
      </div>

      {/* Gráfica y Stock Bajo */}
      <div className="content-grid">
        {/* Gráfica de ventas */}
        <div className="dashboard-card">
          <div className="card-header">
            <h2 className="card-title">Ventas en el Tiempo</h2>
            <select
              value={chartPeriod}
              onChange={(e) => setChartPeriod(e.target.value)}
              className="period-select"
            >
              <option value="day">Últimos 7 días</option>
              <option value="week">Últimas 4 semanas</option>
              <option value="month">Últimos 12 meses</option>
            </select>
          </div>
          <div className="chart-container">
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="period"
                  tick={{ fontSize: 12 }}
                  tickFormatter={(value) => value.slice(5)}
                />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip
                  formatter={(value) => formatCurrency(value)}
                  labelStyle={{ color: '#000' }}
                />
                <Line
                  type="monotone"
                  dataKey="total"
                  stroke="#3b82f6"
                  strokeWidth={3}
                  dot={{ fill: '#3b82f6', r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Productos con stock bajo */}
        <div className="dashboard-card">
          <h2 className="card-title">Productos con Stock Bajo</h2>
          <div className="low-stock-list">
            {lowStock.products && lowStock.products.length > 0 ? (
              lowStock.products.map((product) => (
                <div
                  key={product.id}
                  className={`low-stock-item ${product.status === 'critical' ? 'critical' : 'warning'}`}
                >
                  <div>
                    <div className="product-name">{product.name}</div>
                    <div className="product-code">{product.code}</div>
                  </div>
                  <div className={`stock-badge ${product.status === 'critical' ? 'critical' : 'warning'}`}>
                    {product.stock} unidades
                  </div>
                </div>
              ))
            ) : (
              <p className="empty-message">
                ✅ No hay productos con stock bajo
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Botones de acción */}
      <div className="action-buttons">
        <button
          onClick={() => navigate('/products')}
          className="action-btn primary"
        >
          📦 Gestionar Productos
        </button>
        <button
          onClick={() => navigate('/sales')}
          className="action-btn secondary"
        >
          🛒 Ver Ventas
        </button>
        <button
          onClick={() => navigate('/users')}
          className="action-btn secondary"
        >
          👥 Gestionar Empleados
        </button>
        <button
          onClick={() => navigate('/reports')}
          className="action-btn secondary"
        >
          📊 Reportes
        </button>
      </div>

      {/* Información del inventario */}
      <div className="inventory-info">
        <div className="inventory-card">
          <span className="inventory-label">Total de Productos:</span>
          <span className="inventory-value">
            {inventorySummary.total_products || 0}
          </span>
        </div>
        <div className="inventory-card">
          <span className="inventory-label">Valor del Inventario:</span>
          <span className="inventory-value">
            {formatCurrency(inventorySummary.total_value || 0)}
          </span>
        </div>
      </div>
    </div>
  );
};

// Componente de tarjeta de métrica
const MetricCard = ({ title, value, subtitle, icon, color, trend, trendValue }) => (
  <div className="metric-card">
    <div className="metric-icon" style={{ backgroundColor: `${color}20` }}>
      <span>{icon}</span>
    </div>
    <div className="metric-content">
      <div className="metric-title">{title}</div>
      <div className="metric-value" style={{ color }}>{value}</div>
      <div className="metric-subtitle">
        {subtitle}
        {trend && (
          <span className={`trend-indicator ${trend}`}>
            {trend === 'up' ? '↗' : '↘'} {Math.abs(trendValue).toFixed(1)}%
          </span>
        )}
      </div>
    </div>
  </div>
);

export default Dashboard;