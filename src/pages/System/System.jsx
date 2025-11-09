// src/pages/System/System.jsx
import React, { useState, useEffect } from 'react';
import { systemService, productService, saleService, userService, inventoryService } from '../../api';
import toast, { Toaster } from 'react-hot-toast';
import './System.css';

const System = () => {
  // Estados principales
  const [activeTab, setActiveTab] = useState('overview');
  const [systemHealth, setSystemHealth] = useState(null);
  const [loading, setLoading] = useState(false);
  
  // Estados para respaldos
  const [backupHistory, setBackupHistory] = useState([]);
  const [lastBackup, setLastBackup] = useState(null);
  
  // Estados para estadísticas
  const [stats, setStats] = useState({
    totalProducts: 0,
    totalSales: 0,
    totalUsers: 0,
    lowStockProducts: 0,
    totalRevenue: 0,
    salesToday: 0
  });

  // Estados para diagnósticos
  const [diagnostics, setDiagnostics] = useState(null);

  useEffect(() => {
    loadSystemHealthSilent();
    loadStatistics();
    loadBackupHistory();
    
    // Actualizar salud cada 30 segundos
    const interval = setInterval(loadSystemHealth, 300000);
    return () => clearInterval(interval);
  }, []);

  // ========== CARGAR DATOS ==========

const loadSystemHealthSilent = async () => {
  try {
    const health = await systemService.healthCheck();
    setSystemHealth(health);
  } catch (error) {
    console.error('Error al cargar salud del sistema:', error);
  }
};

// ✅ Versión CON FEEDBACK para cuando el usuario hace clic manualmente
const loadSystemHealth = async () => {
  const loadingToast = toast.loading('Verificando estado del sistema...');
  
  try {
    const health = await systemService.healthCheck();
    setSystemHealth(health);
    
    // ✅ Mostrar resultado según el estado
    if (health.status === 'healthy') {
      toast.success('✅ Sistema operando correctamente', { id: loadingToast });
    } else if (health.status === 'degraded') {
      toast.error('⚠️ Sistema con problemas menores', { id: loadingToast });
    } else {
      toast.error('❌ Sistema con problemas críticos', { id: loadingToast });
    }
    
    // ✅ Cambiar a la pestaña de "Estado del Sistema" para ver detalles
    setActiveTab('health');
    
  } catch (error) {
    console.error('Error al cargar salud del sistema:', error);
    toast.error('❌ Error al verificar el sistema', { id: loadingToast });
  }
};



const handleVerifyHealth = async () => {
  setLoading(true);
  const loadingToast = toast.loading('Verificando estado del sistema...');
  
  try {
    const health = await systemService.healthCheck();
    setSystemHealth(health);
    
    // ✅ Contar componentes saludables
    const components = health.components || {};
    const totalComponents = Object.keys(components).length;
    const healthyComponents = Object.values(components).filter(
      status => status === 'healthy'
    ).length;
    
    // ✅ Mostrar resultado detallado
    if (health.status === 'healthy') {
      toast.success(
        `✅ Sistema operando correctamente\n${healthyComponents}/${totalComponents} componentes saludables`, 
        { id: loadingToast, duration: 4000 }
      );
    } else if (health.status === 'degraded') {
      toast.error(
        `⚠️ Sistema con problemas menores\n${healthyComponents}/${totalComponents} componentes saludables`, 
        { id: loadingToast, duration: 5000 }
      );
    } else {
      toast.error(
        `❌ Sistema con problemas críticos\n${healthyComponents}/${totalComponents} componentes saludables`, 
        { id: loadingToast, duration: 5000 }
      );
    }
    
    // ✅ Cambiar a la pestaña de "Estado del Sistema"
    setActiveTab('health');
    
  } catch (error) {
    console.error('Error al cargar salud del sistema:', error);
    toast.error('❌ Error al verificar el sistema', { id: loadingToast });
  } finally {
    setLoading(false);
  }
};

const loadStatistics = async () => {
  try {
    setLoading(true);
    
    // Obtener datos de múltiples servicios
    const results = await Promise.allSettled([
      productService.getAll(),
      saleService.getAll(),
      userService.getAll(),
      inventoryService.getLowStock(10)
    ]);

    console.log('📊 Respuestas recibidas:', {
      products: results[0],
      sales: results[1],
      users: results[2],
      lowStock: results[3]
    });

    // ✅ Extraer y normalizar datos - manejar diferentes formatos
    let products = [];
    if (results[0].status === 'fulfilled') {
      const data = results[0].value;
      products = Array.isArray(data) ? data : (data.results || data.data || []);
    }
    
    let sales = [];
    if (results[1].status === 'fulfilled') {
      const data = results[1].value;
      sales = Array.isArray(data) ? data : (data.results || data.data || []);
    }
    
    let users = [];
    if (results[2].status === 'fulfilled') {
      const data = results[2].value;
      users = Array.isArray(data) ? data : (data.results || data.data || []);
    }
    
    let lowStockData = { products: [], count: 0 };
    if (results[3].status === 'fulfilled') {
      const data = results[3].value;
      lowStockData = data || { products: [], count: 0 };
    }

    console.log('📊 Datos procesados:', {
      productsCount: products.length,
      salesCount: sales.length,
      usersCount: users.length,
      lowStock: lowStockData
    });

    // ✅ Validar que sean arrays antes de usar métodos de array
    if (!Array.isArray(products)) {
      console.error('⚠️ products no es array:', products);
      products = [];
    }
    if (!Array.isArray(sales)) {
      console.error('⚠️ sales no es array:', sales);
      sales = [];
    }
    if (!Array.isArray(users)) {
      console.error('⚠️ users no es array:', users);
      users = [];
    }

    // Calcular estadísticas
    const totalRevenue = sales.reduce((sum, sale) => {
      const price = parseFloat(sale.total_price) || 0;
      return sum + price;
    }, 0);
    
    // Ventas de hoy
    const today = new Date().toISOString().split('T')[0];
    const salesToday = sales.filter(sale => {
      if (!sale.date) return false;
      const saleDate = sale.date.split('T')[0];
      return saleDate === today;
    }).length;

    const newStats = {
      totalProducts: products.length,
      totalSales: sales.length,
      totalUsers: users.length,
      lowStockProducts: lowStockData.products?.length || lowStockData.count || 0,
      totalRevenue: totalRevenue,
      salesToday: salesToday
    };

    console.log('✅ Estadísticas calculadas:', newStats);
    setStats(newStats);

    // Mostrar advertencias si algún servicio falló
    const failedServices = [];
    if (results[0].status === 'rejected') {
      console.error('❌ Productos falló:', results[0].reason);
      failedServices.push('Productos');
    }
    if (results[1].status === 'rejected') {
      console.error('❌ Ventas falló:', results[1].reason);
      failedServices.push('Ventas');
    }
    if (results[2].status === 'rejected') {
      console.error('❌ Usuarios falló:', results[2].reason);
      failedServices.push('Usuarios');
    }
    if (results[3].status === 'rejected') {
      console.error('❌ Inventario falló:', results[3].reason);
      failedServices.push('Inventario');
    }

    if (failedServices.length > 0) {
      console.warn('⚠️ Servicios con error:', failedServices.join(', '));
    }

  } catch (error) {
    console.error('❌ Error crítico al cargar estadísticas:', error);
    toast.error('Error al cargar estadísticas del sistema');
  } finally {
    setLoading(false);
  }
};

  const loadBackupHistory = () => {
    // Cargar del localStorage (historial local)
    const history = JSON.parse(localStorage.getItem('backup_history') || '[]');
    setBackupHistory(history);
    if (history.length > 0) {
      setLastBackup(history[0]);
    }
  };

  // ========== ACCIONES ==========

 const handleCreateBackup = async () => {
  if (!window.confirm('¿Deseas crear un respaldo completo del sistema?\n\nEsto puede tardar unos momentos.')) {
    return;
  }

  setLoading(true);
  const loadingToast = toast.loading('Creando respaldo...');
  
  try {
    const result = await systemService.createBackup();
    
    console.log('📦 Resultado del respaldo:', result);
    
    toast.success('✅ Respaldo creado exitosamente', { id: loadingToast });
    
    // ✅ Extraer fecha del timestamp: "20251108_035833"
    const timestamp = result.timestamp || '';
    
    // Convertir 20251108_035833 a formato ISO
    let formattedTimestamp;
    if (timestamp && timestamp.length >= 15) {
      const year = timestamp.substring(0, 4);
      const month = timestamp.substring(4, 6);
      const day = timestamp.substring(6, 8);
      const hour = timestamp.substring(9, 11);
      const minute = timestamp.substring(11, 13);
      const second = timestamp.substring(13, 15);
      
      formattedTimestamp = `${year}-${month}-${day}T${hour}:${minute}:${second}Z`;
    } else {
      // Si no viene timestamp, usar fecha actual
      formattedTimestamp = new Date().toISOString();
    }
    
    console.log('📅 Timestamp formateado:', formattedTimestamp);
    
    // Guardar en historial local (sin tamaño)
    const newBackup = {
      id: Date.now(),
      timestamp: formattedTimestamp,
      file: result.file || 'N/A',
      status: 'success'
    };
    
    const history = [newBackup, ...backupHistory].slice(0, 10);
    localStorage.setItem('backup_history', JSON.stringify(history));
    setBackupHistory(history);
    setLastBackup(newBackup);
    
  } catch (error) {
    console.error('Error al crear respaldo:', error);
    toast.error(`❌ ${error.error || 'Error al crear respaldo'}`, { id: loadingToast });
  } finally {
    setLoading(false);
  }
};

  const handleRunDiagnostics = async () => {
    setLoading(true);
    const loadingToast = toast.loading('Ejecutando diagnósticos...');
    
    try {
      const results = await systemService.runDiagnostics();
      setDiagnostics(results);
      setActiveTab('diagnostics');
      
      if (results.overallStatus === 'healthy') {
        toast.success('✅ Todos los diagnósticos pasaron', { id: loadingToast });
      } else {
        toast.error('⚠️ Se encontraron problemas', { id: loadingToast });
      }
    } catch (error) {
      toast.error('❌ Error al ejecutar diagnósticos', { id: loadingToast });
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

const handleRefreshAll = async () => {
  setLoading(true);
  const loadingToast = toast.loading('Actualizando datos...');
  
  try {
    await Promise.all([
      loadSystemHealthSilent(), // ✅ Usar versión silenciosa
      loadStatistics(),
      loadBackupHistory()
    ]);
    
    toast.success('✅ Datos actualizados', { id: loadingToast });
  } catch (error) {
    toast.error('❌ Error al actualizar', { id: loadingToast });
  } finally {
    setLoading(false);
  }
};

  // ========== UTILIDADES ==========

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN'
    }).format(amount || 0);
  };

const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  
  try {
    const date = new Date(dateString);
    
    // Verificar si la fecha es válida
    if (isNaN(date.getTime())) {
      console.warn('⚠️ Fecha inválida:', dateString);
      return 'Fecha no disponible';
    }
    
    return date.toLocaleString('es-MX', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  } catch (error) {
    console.error('❌ Error al formatear fecha:', dateString, error);
    return 'Error en fecha';
  }
};

  const getHealthIcon = (status) => {
    switch (status) {
      case 'healthy': return '✅';
      case 'degraded': return '⚠️';
      case 'unhealthy': return '❌';
      default: return '❓';
    }
  };

  const getHealthColor = (status) => {
    switch (status) {
      case 'healthy': return '#10b981';
      case 'degraded': return '#f59e0b';
      case 'unhealthy': return '#ef4444';
      default: return '#6b7280';
    }
  };

  // ========== RENDER ==========

  return (
    <div className="system-container">
      <Toaster position="top-right" />

      {/* Header */}
      <div className="system-header">
        <div>
          <h1>🔧 Administración del Sistema</h1>
          <p>Panel de control y mantenimiento del sistema</p>
        </div>
        <button 
          onClick={handleRefreshAll} 
          className="btn-refresh"
          disabled={loading}
        >
          {loading ? '⏳ Actualizando...' : '🔄 Actualizar Todo'}
        </button>
      </div>

      {/* Tabs de navegación */}
      <div className="system-tabs">
        <button 
          className={activeTab === 'overview' ? 'active' : ''}
          onClick={() => setActiveTab('overview')}
        >
          📊 Resumen
        </button>
        <button 
          className={activeTab === 'health' ? 'active' : ''}
          onClick={() => setActiveTab('health')}
        >
          💚 Estado del Sistema
        </button>
        <button 
          className={activeTab === 'backups' ? 'active' : ''}
          onClick={() => setActiveTab('backups')}
        >
          💾 Respaldos
        </button>
        <button 
          className={activeTab === 'statistics' ? 'active' : ''}
          onClick={() => setActiveTab('statistics')}
        >
          📈 Estadísticas
        </button>
        <button 
          className={activeTab === 'diagnostics' ? 'active' : ''}
          onClick={() => setActiveTab('diagnostics')}
        >
          🔍 Diagnósticos
        </button>
      </div>

      {/* ========== TAB: RESUMEN ========== */}
      {activeTab === 'overview' && (
        <div className="overview-content">
          {/* Estado General */}
          <div className="overview-cards">
            <div className="status-card" style={{ borderColor: getHealthColor(systemHealth?.status) }}>
              <div className="status-icon">{getHealthIcon(systemHealth?.status)}</div>
              <div className="status-info">
                <h3>Estado del Sistema</h3>
                <p className="status-value" style={{ color: getHealthColor(systemHealth?.status) }}>
                  {systemHealth?.status === 'healthy' ? 'Operativo' : 
                   systemHealth?.status === 'degraded' ? 'Degradado' : 
                   systemHealth?.status === 'unhealthy' ? 'Con problemas' : 'Desconocido'}
                </p>
                <small>Última verificación: {formatDate(systemHealth?.timestamp)}</small>
              </div>
            </div>

            <div className="status-card">
              <div className="status-icon">💾</div>
              <div className="status-info">
                <h3>Último Respaldo</h3>
                <p className="status-value">
                  {lastBackup ? formatDate(lastBackup.timestamp) : 'Sin respaldos'}
                </p>
                <small>{backupHistory.length} respaldos totales</small>
              </div>
            </div>

            <div className="status-card">
              <div className="status-icon">📦</div>
              <div className="status-info">
                <h3>Productos</h3>
                <p className="status-value">{stats.totalProducts}</p>
                <small>{stats.lowStockProducts} con stock bajo</small>
              </div>
            </div>

            <div className="status-card">
              <div className="status-icon">💰</div>
              <div className="status-info">
                <h3>Ventas Totales</h3>
                <p className="status-value">{stats.totalSales}</p>
                <small>{formatCurrency(stats.totalRevenue)} en total</small>
              </div>
            </div>
          </div>

          {/* Acciones Rápidas */}
          <div className="quick-actions">
            <h3>Acciones Rápidas</h3>
            <div className="actions-grid">
              <button 
                onClick={handleCreateBackup}
                className="action-button backup"
                disabled={loading}
              >
                <span className="action-icon">💾</span>
                <span className="action-text">Crear Respaldo</span>
                <small>Guardar copia de seguridad</small>
              </button>

              <button 
                onClick={handleRunDiagnostics}
                className="action-button diagnostics"
                disabled={loading}
              >
                <span className="action-icon">🔍</span>
                <span className="action-text">Ejecutar Diagnósticos</span>
                <small>Verificar estado del sistema</small>
              </button>
              <button 
                onClick={handleVerifyHealth}
                className="action-button health"
                disabled={loading}
              >
                <span className="action-icon">💚</span>
                <span className="action-text">Verificar Salud</span>
                <small>Estado de componentes</small>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========== TAB: ESTADO DEL SISTEMA ========== */}
      {activeTab === 'health' && (
        <div className="health-content">
          <div className="health-header">
            <h2>Estado del Sistema</h2>
            <button onClick={loadSystemHealth} disabled={loading} className="btn-refresh">
              🔄 Actualizar
            </button>
          </div>

          {systemHealth ? (
            <>
              <div className="health-status-main">
                <div className="health-icon-large">
                  {getHealthIcon(systemHealth.status)}
                </div>
                <h3 style={{ color: getHealthColor(systemHealth.status) }}>
                  {systemHealth.status === 'healthy' ? 'Sistema Operativo' :
                   systemHealth.status === 'degraded' ? 'Sistema Degradado' :
                   'Sistema con Problemas'}
                </h3>
                <p>{formatDate(systemHealth.timestamp)}</p>
              </div>

              <div className="components-grid">
                <h3>Componentes del Sistema</h3>
                {systemHealth.components && Object.entries(systemHealth.components).map(([key, value]) => (
                  <div key={key} className="component-card">
                    <div className="component-header">
                      <span className="component-icon">
                        {value === 'healthy' || value === 'pass' ? '✅' : '❌'}
                      </span>
                      <span className="component-name">
                        {key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </span>
                    </div>
                    <div className="component-status" style={{ 
                      color: value === 'healthy' || value === 'pass' ? '#10b981' : '#ef4444' 
                    }}>
                      {value}
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="loading-state">
              <div className="spinner"></div>
              <p>Verificando estado del sistema...</p>
            </div>
          )}
        </div>
      )}

    {/* ========== TAB: RESPALDOS ========== */}
    {activeTab === 'backups' && (
    <div className="backups-content">
        <div className="backups-header">
        <h2>Gestión de Respaldos</h2>
        <button 
            onClick={handleCreateBackup}
            className="btn-primary"
            disabled={loading}
        >
            {loading ? '⏳ Creando...' : '💾 Crear Nuevo Respaldo'}
        </button>
        </div>

        <div className="backup-info-card">
        <h3>ℹ️ Información sobre Respaldos</h3>
        <ul>
            <li>Los respaldos incluyen todos los datos del sistema: productos, ventas, usuarios, etc.</li>
            <li>Se recomienda crear respaldos regularmente (semanalmente)</li>
            <li>Los respaldos se almacenan en el servidor en la carpeta /backups/</li>
            <li>El historial local muestra los últimos 10 respaldos</li>
        </ul>
        </div>

        <div className="backups-history">
        <h3>📋 Historial de Respaldos</h3>
        
        {backupHistory.length === 0 ? (
            <div className="empty-state">
            <p>📭 No hay respaldos registrados</p>
            <p>Crea tu primer respaldo para proteger tus datos</p>
            <button onClick={handleCreateBackup} className="btn-primary">
                Crear Primer Respaldo
            </button>
            </div>
        ) : (
            <div className="backups-table">
            <table>
                <thead>
                <tr>
                    <th>Estado</th>
                    <th>Fecha y Hora</th>
                    <th>Archivo</th>
                    {/* ✅ Columna de tamaño eliminada */}
                </tr>
                </thead>
                <tbody>
                {backupHistory.map((backup) => (
                    <tr key={backup.id}>
                    <td>
                        <span className="backup-status success">
                        ✅ Exitoso
                        </span>
                    </td>
                    <td>{formatDate(backup.timestamp)}</td>
                    <td>
                        <code className="backup-file">
                        {backup.file?.split('/').pop() || backup.file || 'N/A'}
                        </code>
                    </td>
                    {/* ✅ Celda de tamaño eliminada */}
                    </tr>
                ))}
                </tbody>
            </table>
            </div>
        )}
        </div>
    </div>
    )}

      {/* ========== TAB: ESTADÍSTICAS ========== */}
      {activeTab === 'statistics' && (
        <div className="statistics-content">
          <div className="stats-header">
            <h2>Estadísticas del Sistema</h2>
            <button onClick={loadStatistics} disabled={loading} className="btn-refresh">
              🔄 Actualizar
            </button>
          </div>

          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-icon">📦</div>
              <div className="stat-info">
                <h3>Productos</h3>
                <p className="stat-value">{stats.totalProducts}</p>
                <div className="stat-details">
                  <span className="stat-detail warning">
                    ⚠️ {stats.lowStockProducts} con stock bajo
                  </span>
                </div>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon">💰</div>
              <div className="stat-info">
                <h3>Ventas</h3>
                <p className="stat-value">{stats.totalSales}</p>
                <div className="stat-details">
                  <span className="stat-detail">
                    Hoy: {stats.salesToday} ventas
                  </span>
                </div>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon">💵</div>
              <div className="stat-info">
                <h3>Ingresos Totales</h3>
                <p className="stat-value">{formatCurrency(stats.totalRevenue)}</p>
                <div className="stat-details">
                  <span className="stat-detail success">
                    Acumulado total
                  </span>
                </div>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon">👥</div>
              <div className="stat-info">
                <h3>Usuarios</h3>
                <p className="stat-value">{stats.totalUsers}</p>
                <div className="stat-details">
                  <span className="stat-detail">
                    Total registrados
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="stats-details-section">
            <h3>Detalles Adicionales</h3>
            <div className="detail-grid">
              <div className="detail-item">
                <strong>Promedio por venta:</strong>
                <span>{formatCurrency(stats.totalSales > 0 ? stats.totalRevenue / stats.totalSales : 0)}</span>
              </div>
              <div className="detail-item">
                <strong>Productos por usuario:</strong>
                <span>{stats.totalUsers > 0 ? (stats.totalProducts / stats.totalUsers).toFixed(1) : 0}</span>
              </div>
              <div className="detail-item">
                <strong>Ventas por usuario:</strong>
                <span>{stats.totalUsers > 0 ? (stats.totalSales / stats.totalUsers).toFixed(1) : 0}</span>
              </div>
              <div className="detail-item">
                <strong>% Stock bajo:</strong>
                <span className="warning">
                  {stats.totalProducts > 0 ? ((stats.lowStockProducts / stats.totalProducts) * 100).toFixed(1) : 0}%
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========== TAB: DIAGNÓSTICOS ========== */}
      {activeTab === 'diagnostics' && (
        <div className="diagnostics-content">
          <div className="diagnostics-header">
            <h2>Diagnósticos del Sistema</h2>
            <button 
              onClick={handleRunDiagnostics}
              disabled={loading}
              className="btn-primary"
            >
              {loading ? '⏳ Ejecutando...' : '🔍 Ejecutar Diagnósticos'}
            </button>
          </div>

          {diagnostics ? (
            <>
              <div className="diagnostics-summary">
                <div className="diagnostic-result" style={{
                  borderColor: diagnostics.overallStatus === 'healthy' ? '#10b981' : '#ef4444'
                }}>
                  <h3>Resultado General</h3>
                  <p className="diagnostic-status" style={{
                    color: diagnostics.overallStatus === 'healthy' ? '#10b981' : '#ef4444'
                  }}>
                    {diagnostics.overallStatus === 'healthy' ? '✅ Sistema Saludable' : '❌ Problemas Detectados'}
                  </p>
                  <small>Ejecutado: {formatDate(diagnostics.timestamp)}</small>
                </div>
              </div>

              <div className="diagnostics-tests">
                <h3>Pruebas Realizadas</h3>
                {diagnostics.tests && Object.entries(diagnostics.tests).map(([testName, testResult]) => (
                  <div key={testName} className="test-card">
                    <div className="test-header">
                      <span className="test-icon">
                        {testResult.status === 'pass' ? '✅' : '❌'}
                      </span>
                      <span className="test-name">
                        {testName.replace(/([A-Z])/g, ' $1').trim()}
                      </span>
                    </div>
                    <div className="test-status" style={{
                      color: testResult.status === 'pass' ? '#10b981' : '#ef4444'
                    }}>
                      {testResult.status === 'pass' ? 'Exitoso' : 'Fallido'}
                    </div>
                    {testResult.message && (
                      <p className="test-message">{testResult.message}</p>
                    )}
                    {testResult.error && (
                      <p className="test-error">Error: {testResult.error}</p>
                    )}
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="empty-state">
              <p>🔍 No se han ejecutado diagnósticos</p>
              <p>Haz clic en el botón para verificar el estado del sistema</p>
              <button onClick={handleRunDiagnostics} className="btn-primary">
                Ejecutar Ahora
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default System;