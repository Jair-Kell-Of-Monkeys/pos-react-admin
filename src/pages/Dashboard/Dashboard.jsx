import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../../context/AuthContext';
import dashboardService from '../../api/dashboardService';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import toast, { Toaster } from 'react-hot-toast';
import './Dashboard.css';

const Dashboard = () => {
  const { user } = useContext(AuthContext);

  const [dashboardData, setDashboardData] = useState(null);
  const [chartData, setChartData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [chartPeriod, setChartPeriod] = useState('week');
  const [chartType, setChartType] = useState('line');

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
      toast.success('Dashboard actualizado');
    } catch (error) {
      toast.error(error.error || 'Error al cargar dashboard');
    } finally {
      setLoading(false);
    }
  };

  const loadChartData = async () => {
    try {
      const data = await dashboardService.getSalesChart(chartPeriod);
      
      const transformedData = (data.data || []).map(item => ({
        ...item,
        period_display: formatPeriodLabel(item.period, chartPeriod),
        total_formatted: parseFloat(item.total || 0)
      }));
      
      setChartData(transformedData);
    } catch (error) {
      console.error('Error al cargar gráfica:', error);
      toast.error('Error al cargar gráfica de ventas');
    }
  };

  const formatPeriodLabel = (period, type) => {
    if (!period) return '';
    
    const date = new Date(period);
    
    if (isNaN(date.getTime())) {
      return period;
    }
    
    switch(type) {
      case 'day':
        return date.toLocaleDateString('es-MX', { 
          weekday: 'short', 
          day: 'numeric' 
        }).replace('.', '');
        
      case 'week':
        return date.toLocaleDateString('es-MX', { 
          day: 'numeric', 
          month: 'short' 
        }).replace('.', '');
        
      case 'month':
        return date.toLocaleDateString('es-MX', { 
          month: 'short' 
        }).replace('.', '');
        
      default:
        return period;
    }
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
    }).format(value);
  };

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="custom-tooltip">
          <p className="tooltip-label">{label}</p>
          <p className="tooltip-value">
            <strong>Ventas:</strong> {formatCurrency(payload[0].value)}
          </p>
        </div>
      );
    }
    return null;
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
        <div className="header-content">
          <h1 className="header-title">
            <i className='bx bxs-dashboard'></i>
            Dashboard
          </h1>
          <p className="header-subtitle">
            Bienvenido, <strong>{user?.username}</strong>
            <span className="user-role-badge">
              <i className='bx bxs-badge-check'></i>
              {user?.role?.name || 'Usuario'}
            </span>
          </p>
        </div>
        <button onClick={loadDashboard} className="refresh-btn" disabled={loading}>
          <i className='bx bx-refresh'></i>
          <span>Actualizar</span>
        </button>
      </header>

      {/* Métricas principales */}
      <div className="metrics-grid">
        <MetricCard
          title="Ventas de Hoy"
          value={formatCurrency(todaySales.total || 0)}
          subtitle={`${todaySales.count || 0} ${todaySales.count === 1 ? 'venta' : 'ventas'}`}
          icon="bx-money"
          color="#10b981"
        />
        <MetricCard
          title="Ventas de la Semana"
          value={formatCurrency(weekSales.total || 0)}
          subtitle={`${weekSales.count || 0} ${weekSales.count === 1 ? 'venta' : 'ventas'}`}
          icon="bx-calendar"
          color="#3b82f6"
        />
        <MetricCard
          title="Ventas del Mes"
          value={formatCurrency(monthSales.total || 0)}
          subtitle={`${monthSales.count || 0} ${monthSales.count === 1 ? 'venta' : 'ventas'}`}
          icon="bx-trending-up"
          color="#8b5cf6"
          trend={comparison.trend}
          trendValue={comparison.percentage_change}
        />
        <MetricCard
          title="Productos Stock Bajo"
          value={lowStock.count || 0}
          subtitle={lowStock.count === 1 ? 'producto crítico' : 'productos críticos'}
          icon="bx-error"
          color="#f59e0b"
        />
      </div>

      {/* Gráfica y Stock Bajo */}
      <div className="content-grid">
        {/* Gráfica de ventas */}
        <div className="dashboard-card chart-card">
          <div className="card-header">
            <div className="card-header-content">
              <h2 className="card-title">
                <i className='bx bx-line-chart'></i>
                Tendencia de Ventas
              </h2>
              <p className="card-subtitle">Evolución de ingresos por período</p>
            </div>
            <div className="chart-controls">
              <select
                value={chartPeriod}
                onChange={(e) => setChartPeriod(e.target.value)}
                className="period-select"
              >
                <option value="day">Últimos 7 días</option>
                <option value="week">Últimas 4 semanas</option>
                <option value="month">Últimos 12 meses</option>
              </select>
              <div className="chart-type-toggle">
                <button
                  className={chartType === 'line' ? 'active' : ''}
                  onClick={() => setChartType('line')}
                  title="Gráfica de línea"
                >
                  <i className='bx bx-line-chart'></i>
                </button>
                <button
                  className={chartType === 'bar' ? 'active' : ''}
                  onClick={() => setChartType('bar')}
                  title="Gráfica de barras"
                >
                  <i className='bx bx-bar-chart-alt-2'></i>
                </button>
              </div>
            </div>
          </div>
          
          <div className="chart-container">
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                {chartType === 'line' ? (
                  <LineChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis
                      dataKey="period_display"
                      tick={{ fontSize: 12, fill: '#6b7280' }}
                      stroke="#9ca3af"
                    />
                    <YAxis
                      tick={{ fontSize: 12, fill: '#6b7280' }}
                      stroke="#9ca3af"
                      tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Line
                      type="monotone"
                      dataKey="total_formatted"
                      stroke="#3b82f6"
                      strokeWidth={3}
                      dot={{ fill: '#3b82f6', r: 5 }}
                      activeDot={{ r: 7 }}
                      name="Ventas"
                    />
                  </LineChart>
                ) : (
                  <BarChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis
                      dataKey="period_display"
                      tick={{ fontSize: 12, fill: '#6b7280' }}
                      stroke="#9ca3af"
                    />
                    <YAxis
                      tick={{ fontSize: 12, fill: '#6b7280' }}
                      stroke="#9ca3af"
                      tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar
                      dataKey="total_formatted"
                      fill="#3b82f6"
                      radius={[8, 8, 0, 0]}
                      name="Ventas"
                    />
                  </BarChart>
                )}
              </ResponsiveContainer>
            ) : (
              <div className="empty-chart">
                <i className='bx bx-bar-chart-alt empty-chart-icon'></i>
                <p>No hay datos de ventas para mostrar</p>
                <small>Realiza algunas ventas para ver las estadísticas</small>
              </div>
            )}
          </div>

          {chartData.length > 0 && (
            <div className="chart-stats">
              <div className="stat-item">
                <i className='bx bx-dollar-circle stat-icon'></i>
                <div className="stat-content">
                  <span className="stat-label">Total del período</span>
                  <span className="stat-value">
                    {formatCurrency(chartData.reduce((sum, item) => sum + item.total_formatted, 0))}
                  </span>
                </div>
              </div>
              <div className="stat-item">
                <i className='bx bx-trending-up stat-icon'></i>
                <div className="stat-content">
                  <span className="stat-label">Promedio</span>
                  <span className="stat-value">
                    {formatCurrency(chartData.reduce((sum, item) => sum + item.total_formatted, 0) / chartData.length)}
                  </span>
                </div>
              </div>
              <div className="stat-item">
                <i className='bx bx-trophy stat-icon'></i>
                <div className="stat-content">
                  <span className="stat-label">Mejor día</span>
                  <span className="stat-value">
                    {formatCurrency(Math.max(...chartData.map(item => item.total_formatted)))}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Productos con stock bajo */}
        <div className="dashboard-card low-stock-card">
          <div className="card-header-simple">
            <h2 className="card-title">
              <i className='bx bx-error-circle'></i>
              Stock Bajo
            </h2>
            <span className="stock-count-badge">
              {lowStock.count || 0}
            </span>
          </div>
          
          <div className="low-stock-list">
            {lowStock.products && lowStock.products.length > 0 ? (
              lowStock.products.map((product) => (
                <div
                  key={product.id}
                  className={`low-stock-item ${product.status === 'critical' ? 'critical' : 'warning'}`}
                >
                  <div className="product-icon-wrapper">
                    <i className={`bx bxs-package product-icon ${product.status}`}></i>
                  </div>
                  <div className="product-details">
                    <div className="product-name">{product.name}</div>
                    <div className="product-code">
                      <i className='bx bx-barcode'></i>
                      {product.code}
                    </div>
                  </div>
                  <div className="stock-info">
                    <div className={`stock-badge ${product.status === 'critical' ? 'critical' : 'warning'}`}>
                      {product.stock} {product.stock === 1 ? 'unidad' : 'unidades'}
                    </div>
                    <span className={`status-indicator ${product.status}`}>
                      <i className={`bx ${product.status === 'critical' ? 'bxs-error-circle' : 'bxs-error'}`}></i>
                      {product.status === 'critical' ? 'Crítico' : 'Bajo'}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="empty-message">
                <i className='bx bxs-check-circle empty-icon'></i>
                <p>¡Todo bien!</p>
                <small>No hay productos con stock bajo</small>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Resumen del Negocio */}
      <div className="inventory-section">
        <h2 className="inventory-section-title">
          <i className='bx bxs-bar-chart-square'></i>
          Resumen del Negocio
        </h2>
        <div className="inventory-grid">
          <div className="inventory-card">
            <div className="inventory-icon">
              <i className='bx bxs-package'></i>
            </div>
            <div className="inventory-content">
              <div className="inventory-label">Total de Productos</div>
              <div className="inventory-value">
                {inventorySummary.total_products || 0}
              </div>
              <div className="inventory-sublabel">
                <i className='bx bx-shopping-bag'></i>
                En catálogo
              </div>
            </div>
          </div>
          <div className="inventory-card">
            <div className="inventory-icon">
              <i className='bx bxs-wallet'></i>
            </div>
            <div className="inventory-content">
              <div className="inventory-label">Valor del Inventario</div>
              <div className="inventory-value">
                {formatCurrency(inventorySummary.total_value || 0)}
              </div>
              <div className="inventory-sublabel">
                <i className='bx bx-dollar-circle'></i>
                Inversión total
              </div>
            </div>
          </div>
          <div className="inventory-card">
            <div className="inventory-icon">
              <i className='bx bxs-receipt'></i>
            </div>
            <div className="inventory-content">
              <div className="inventory-label">Promedio por Venta</div>
              <div className="inventory-value">
                {monthSales.count > 0 
                  ? formatCurrency((monthSales.total || 0) / monthSales.count)
                  : '$0.00'
                }
              </div>
              <div className="inventory-sublabel">
                <i className='bx bx-trending-up'></i>
                Ticket promedio
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Componente de tarjeta de métrica
const MetricCard = ({ title, value, subtitle, icon, color, trend, trendValue }) => (
  <div className="metric-card">
    <div className="metric-icon" style={{ backgroundColor: `${color}20` }}>
      <i className={`bx ${icon}`} style={{ color }}></i>
    </div>
    <div className="metric-content">
      <div className="metric-title">{title}</div>
      <div className="metric-value" style={{ color }}>{value}</div>
      <div className="metric-subtitle">
        {subtitle}
        {trend && trendValue !== undefined && (
          <span className={`trend-indicator ${trend}`}>
            <i className={`bx ${trend === 'up' ? 'bx-trending-up' : 'bx-trending-down'}`}></i>
            {Math.abs(trendValue).toFixed(1)}%
          </span>
        )}
      </div>
    </div>
  </div>
);

export default Dashboard;