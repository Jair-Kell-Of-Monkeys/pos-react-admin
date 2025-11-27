// src/pages/System/System.jsx
import React, { useState, useEffect } from 'react';
import { systemService, productService, saleService, userService, inventoryService } from '../../api';
import toast, { Toaster } from 'react-hot-toast';
import './System.css';

const System = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [systemHealth, setSystemHealth] = useState(null);
  const [loading, setLoading] = useState(false);
  
  const [backupHistory, setBackupHistory] = useState([]);
  const [lastBackup, setLastBackup] = useState(null);
  
  const [stats, setStats] = useState({
    totalProducts: 0,
    totalSales: 0,
    totalUsers: 0,
    lowStockProducts: 0,
    totalRevenue: 0,
    salesToday: 0
  });

  const [diagnostics, setDiagnostics] = useState(null);

  useEffect(() => {
    loadSystemHealthSilent();
    loadStatistics();
    loadBackupHistory();
    
    const interval = setInterval(loadSystemHealth, 300000);
    return () => clearInterval(interval);
  }, []);

  const loadSystemHealthSilent = async () => {
    try {
      const health = await systemService.healthCheck();
      setSystemHealth(health);
    } catch (error) {
      console.error('Error al cargar salud del sistema:', error);
    }
  };

  const loadSystemHealth = async () => {
    const loadingToast = toast.loading('Verificando estado del sistema...');
    
    try {
      const health = await systemService.healthCheck();
      setSystemHealth(health);
      
      if (health.status === 'healthy') {
        toast.success('✅ Sistema operando correctamente', { id: loadingToast });
      } else if (health.status === 'degraded') {
        toast.error('⚠️ Sistema con problemas menores', { id: loadingToast });
      } else {
        toast.error('❌ Sistema con problemas críticos', { id: loadingToast });
      }
      
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
      
      const components = health.components || {};
      const totalComponents = Object.keys(components).length;
      const healthyComponents = Object.values(components).filter(
        status => status === 'healthy'
      ).length;
      
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

      const totalRevenue = sales.reduce((sum, sale) => {
        const price = parseFloat(sale.total_price) || 0;
        return sum + price;
      }, 0);
      
      // ✅ CORRECCIÓN: Comparación de fechas mejorada
      const salesToday = sales.filter(sale => {
        if (!sale.date) return false;
        
        try {
          // Crear fecha local del día de hoy (sin hora)
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          
          // Crear fecha de la venta
          const saleDate = new Date(sale.date);
          saleDate.setHours(0, 0, 0, 0);
          
          // Comparar timestamps
          const isToday = saleDate.getTime() === today.getTime();
          
          if (isToday) {
            console.log('✅ Venta de hoy encontrada:', {
              id: sale.id,
              date: sale.date,
              saleDate: saleDate.toISOString(),
              today: today.toISOString()
            });
          }
          
          return isToday;
        } catch (error) {
          console.error('❌ Error al procesar fecha de venta:', sale.date, error);
          return false;
        }
      }).length;

      console.log('📅 Ventas de hoy calculadas:', salesToday);

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
    const history = JSON.parse(localStorage.getItem('backup_history') || '[]');
    setBackupHistory(history);
    if (history.length > 0) {
      setLastBackup(history[0]);
    }
  };

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
      
      const timestamp = result.timestamp || '';
      
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
        formattedTimestamp = new Date().toISOString();
      }
      
      console.log('📅 Timestamp formateado:', formattedTimestamp);
      
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
        loadSystemHealthSilent(),
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
      case 'healthy': return 'bxs-check-circle';
      case 'degraded': return 'bxs-error';
      case 'unhealthy': return 'bxs-x-circle';
      default: return 'bx-help-circle';
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

  return (
    <div className="system-container">
      <Toaster position="top-right" />

      {/* Header */}
      <div className="system-header">
        <div className="header-content">
          <h1 className="header-title">
            <i className='bx bxs-cog'></i>
            Administración del Sistema
          </h1>
          <p className="subtitle">Panel de control y mantenimiento del sistema</p>
        </div>
        <button 
          onClick={handleRefreshAll} 
          className="system-refresh-btn"
          disabled={loading}
        >
          <i className='bx bx-refresh'></i>
          <span>{loading ? 'Actualizando...' : 'Actualizar Todo'}</span>
        </button>
      </div>

      {/* Tabs de navegación */}
      <div className="system-tabs">
        <button 
          className={`tab-btn ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          <i className='bx bx-home-alt'></i>
          Resumen
        </button>
        <button 
          className={`tab-btn ${activeTab === 'health' ? 'active' : ''}`}
          onClick={() => setActiveTab('health')}
        >
          <i className='bx bx-heart'></i>
          Estado del Sistema
        </button>
        <button 
          className={`tab-btn ${activeTab === 'backups' ? 'active' : ''}`}
          onClick={() => setActiveTab('backups')}
        >
          <i className='bx bx-data'></i>
          Respaldos
        </button>
        <button 
          className={`tab-btn ${activeTab === 'statistics' ? 'active' : ''}`}
          onClick={() => setActiveTab('statistics')}
        >
          <i className='bx bx-line-chart'></i>
          Estadísticas
        </button>
        <button 
          className={`tab-btn ${activeTab === 'diagnostics' ? 'active' : ''}`}
          onClick={() => setActiveTab('diagnostics')}
        >
          <i className='bx bx-search-alt'></i>
          Diagnósticos
        </button>
      </div>

      {/* TAB: RESUMEN */}
      {activeTab === 'overview' && (
        <div className="overview-content">
          <div className="overview-cards">
            <div className="status-card" style={{ borderColor: getHealthColor(systemHealth?.status) }}>
              <div className="status-icon-wrapper" style={{ background: getHealthColor(systemHealth?.status) }}>
                <i className={`bx ${getHealthIcon(systemHealth?.status)}`}></i>
              </div>
              <div className="status-info">
                <h3>Estado del Sistema</h3>
                <p className="status-value" style={{ color: getHealthColor(systemHealth?.status) }}>
                  {systemHealth?.status === 'healthy' ? 'Operativo' : 
                   systemHealth?.status === 'degraded' ? 'Degradado' : 
                   systemHealth?.status === 'unhealthy' ? 'Con problemas' : 'Desconocido'}
                </p>
                <small>
                  <i className='bx bx-time-five'></i>
                  {formatDate(systemHealth?.timestamp)}
                </small>
              </div>
            </div>

            <div className="status-card">
              <div className="status-icon-wrapper primary">
                <i className='bx bxs-save'></i>
              </div>
              <div className="status-info">
                <h3>Último Respaldo</h3>
                <p className="status-value">
                  {lastBackup ? formatDate(lastBackup.timestamp) : 'Sin respaldos'}
                </p>
                <small>
                  <i className='bx bx-folder'></i>
                  {backupHistory.length} respaldos totales
                </small>
              </div>
            </div>

            <div className="status-card">
              <div className="status-icon-wrapper info">
                <i className='bx bxs-package'></i>
              </div>
              <div className="status-info">
                <h3>Productos</h3>
                <p className="status-value">{stats.totalProducts}</p>
                <small>
                  <i className='bx bx-error-circle'></i>
                  {stats.lowStockProducts} con stock bajo
                </small>
              </div>
            </div>

            <div className="status-card">
              <div className="status-icon-wrapper success">
                <i className='bx bxs-dollar-circle'></i>
              </div>
              <div className="status-info">
                <h3>Ventas Totales</h3>
                <p className="status-value">{stats.totalSales}</p>
                <small>
                  <i className='bx bx-trending-up'></i>
                  {formatCurrency(stats.totalRevenue)} en total
                </small>
              </div>
            </div>
          </div>

          {/* Acciones Rápidas */}
          <div className="quick-actions">
            <h3>
              <i className='bx bxs-zap'></i>
              Acciones Rápidas
            </h3>
            <div className="actions-grid">
              <button 
                onClick={handleCreateBackup}
                className="action-button backup"
                disabled={loading}
              >
                <span className="action-icon">
                  <i className='bx bxs-data'></i>
                </span>
                <span className="action-text">Crear Respaldo</span>
                <small>Guardar copia de seguridad</small>
              </button>

              <button 
                onClick={handleRunDiagnostics}
                className="action-button diagnostics"
                disabled={loading}
              >
                <span className="action-icon">
                  <i className='bx bxs-analyse'></i>
                </span>
                <span className="action-text">Ejecutar Diagnósticos</span>
                <small>Verificar estado del sistema</small>
              </button>

              <button 
                onClick={handleVerifyHealth}
                className="action-button health"
                disabled={loading}
              >
                <span className="action-icon">
                  <i className='bx bxs-heart'></i>
                </span>
                <span className="action-text">Verificar Salud</span>
                <small>Estado de componentes</small>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB: ESTADO DEL SISTEMA */}
      {activeTab === 'health' && (
        <div className="health-content">
          <div className="health-header">
            <h2>
              <i className='bx bxs-heart'></i>
              Estado del Sistema
            </h2>
            <button onClick={loadSystemHealth} disabled={loading} className="btn-refresh">
              <i className='bx bx-refresh'></i>
              Actualizar
            </button>
          </div>

          {systemHealth ? (
            <>
              <div className="health-status-main">
                <div className="health-icon-large" style={{ color: getHealthColor(systemHealth.status) }}>
                  <i className={`bx ${getHealthIcon(systemHealth.status)}`}></i>
                </div>
                <h3 style={{ color: getHealthColor(systemHealth.status) }}>
                  {systemHealth.status === 'healthy' ? 'Sistema Operativo' :
                   systemHealth.status === 'degraded' ? 'Sistema Degradado' :
                   'Sistema con Problemas'}
                </h3>
                <p>
                  <i className='bx bx-time-five'></i>
                  {formatDate(systemHealth.timestamp)}
                </p>
              </div>

              <div className="components-section">
                <h3>
                  <i className='bx bxs-component'></i>
                  Componentes del Sistema
                </h3>
                <div className="components-grid">
                  {systemHealth.components && Object.entries(systemHealth.components).map(([key, value]) => (
                    <div key={key} className="component-card">
                      <div className="component-header">
                        <span className="component-icon">
                          <i className={`bx ${value === 'healthy' || value === 'pass' ? 'bxs-check-circle' : 'bxs-x-circle'}`}></i>
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

      {/* TAB: RESPALDOS */}
      {activeTab === 'backups' && (
        <div className="backups-content">
          <div className="backups-header">
            <h2>
              <i className='bx bxs-data'></i>
              Gestión de Respaldos
            </h2>
            <button 
              onClick={handleCreateBackup}
              className="btn-primary"
              disabled={loading}
            >
              <i className='bx bx-plus-circle'></i>
              {loading ? 'Creando...' : 'Crear Nuevo Respaldo'}
            </button>
          </div>

          <div className="backup-info-card">
            <h3>
              <i className='bx bxs-info-circle'></i>
              Información sobre Respaldos
            </h3>
            <ul>
              <li>
                <i className='bx bx-check'></i>
                Los respaldos incluyen todos los datos del sistema: productos, ventas, usuarios, etc.
              </li>
              <li>
                <i className='bx bx-check'></i>
                Se recomienda crear respaldos regularmente (semanalmente)
              </li>
              <li>
                <i className='bx bx-check'></i>
                Los respaldos se almacenan en el servidor en la carpeta /backups/
              </li>
              <li>
                <i className='bx bx-check'></i>
                El historial local muestra los últimos 10 respaldos
              </li>
            </ul>
          </div>

          <div className="backups-history">
            <h3>
              <i className='bx bx-history'></i>
              Historial de Respaldos
            </h3>
            
            {backupHistory.length === 0 ? (
              <div className="empty-state">
                <i className='bx bx-folder-open empty-icon'></i>
                <h4>No hay respaldos registrados</h4>
                <p>Crea tu primer respaldo para proteger tus datos</p>
                <button onClick={handleCreateBackup} className="btn-primary">
                  <i className='bx bx-plus-circle'></i>
                  Crear Primer Respaldo
                </button>
              </div>
            ) : (
              <div className="table-wrapper">
                <table className="backups-table">
                  <thead>
                    <tr>
                      <th><i className='bx bx-check-circle'></i> Estado</th>
                      <th><i className='bx bx-calendar'></i> Fecha y Hora</th>
                      <th><i className='bx bx-file'></i> Archivo</th>
                    </tr>
                  </thead>
                  <tbody>
                    {backupHistory.map((backup) => (
                      <tr key={backup.id}>
                        <td>
                          <span className="backup-status success">
                            <i className='bx bxs-check-circle'></i>
                            Exitoso
                          </span>
                        </td>
                        <td className="date-cell">
                          <i className='bx bx-time-five'></i>
                          {formatDate(backup.timestamp)}
                        </td>
                        <td>
                          <code className="backup-file">
                            <i className='bx bx-file-blank'></i>
                            {backup.file?.split('/').pop() || backup.file || 'N/A'}
                          </code>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB: ESTADÍSTICAS */}
      {activeTab === 'statistics' && (
        <div className="statistics-content">
          <div className="stats-header">
            <h2>
              <i className='bx bxs-bar-chart-alt-2'></i>
              Estadísticas del Sistema
            </h2>
            <button onClick={loadStatistics} disabled={loading} className="btn-refresh">
              <i className='bx bx-refresh'></i>
              Actualizar
            </button>
          </div>

          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-icon-wrapper info">
                <i className='bx bxs-package'></i>
              </div>
              <div className="stat-info">
                <h3>Productos</h3>
                <p className="stat-value">{stats.totalProducts}</p>
                <div className="stat-details">
                  <span className="stat-detail warning">
                    <i className='bx bx-error-circle'></i>
                    {stats.lowStockProducts} con stock bajo
                  </span>
                </div>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon-wrapper success">
                <i className='bx bxs-shopping-bags'></i>
              </div>
              <div className="stat-info">
                <h3>Ventas</h3>
                <p className="stat-value">{stats.totalSales}</p>
                <div className="stat-details">
                  <span className="stat-detail">
                    <i className='bx bx-calendar-check'></i>
                    Hoy: {stats.salesToday} ventas
                  </span>
                </div>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon-wrapper primary">
                <i className='bx bxs-dollar-circle'></i>
              </div>
              <div className="stat-info">
                <h3>Ingresos Totales</h3>
                <p className="stat-value">{formatCurrency(stats.totalRevenue)}</p>
                <div className="stat-details">
                  <span className="stat-detail success">
                    <i className='bx bx-trending-up'></i>
                    Acumulado total
                  </span>
                </div>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon-wrapper warning">
                <i className='bx bxs-group'></i>
              </div>
              <div className="stat-info">
                <h3>Usuarios</h3>
                <p className="stat-value">{stats.totalUsers}</p>
                <div className="stat-details">
                  <span className="stat-detail">
                    <i className='bx bx-user-check'></i>
                    Total registrados
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="stats-details-section">
            <h3>
              <i className='bx bx-detail'></i>
              Detalles Adicionales
            </h3>
            <div className="detail-grid">
              <div className="detail-item">
                <span className="detail-label">
                  <i className='bx bx-calculator'></i>
                  Promedio por venta
                </span>
                <span className="detail-value">
                  {formatCurrency(stats.totalSales > 0 ? stats.totalRevenue / stats.totalSales : 0)}
                </span>
              </div>
              <div className="detail-item">
                <span className="detail-label">
                  <i className='bx bx-box'></i>
                  Productos por usuario
                </span>
                <span className="detail-value">
                  {stats.totalUsers > 0 ? (stats.totalProducts / stats.totalUsers).toFixed(1) : 0}
                </span>
              </div>
              <div className="detail-item">
                <span className="detail-label">
                  <i className='bx bx-cart'></i>
                  Ventas por usuario
                </span>
                <span className="detail-value">
                  {stats.totalUsers > 0 ? (stats.totalSales / stats.totalUsers).toFixed(1) : 0}
                </span>
              </div>
              <div className="detail-item">
                <span className="detail-label">
                  <i className='bx bx-error'></i>
                  % Stock bajo
                </span>
                <span className="detail-value warning">
                  {stats.totalProducts > 0 ? ((stats.lowStockProducts / stats.totalProducts) * 100).toFixed(1) : 0}%
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB: DIAGNÓSTICOS */}
      {activeTab === 'diagnostics' && (
        <div className="diagnostics-content">
          <div className="diagnostics-header">
            <h2>
              <i className='bx bxs-analyse'></i>
              Diagnósticos del Sistema
            </h2>
            <button 
              onClick={handleRunDiagnostics}
              disabled={loading}
              className="btn-primary"
            >
              <i className='bx bx-play-circle'></i>
              {loading ? 'Ejecutando...' : 'Ejecutar Diagnósticos'}
            </button>
          </div>

          {diagnostics ? (
            <>
              <div className="diagnostics-summary">
                <div className="diagnostic-result" style={{
                  borderColor: diagnostics.overallStatus === 'healthy' ? '#10b981' : '#ef4444'
                }}>
                  <div className="result-icon" style={{
                    color: diagnostics.overallStatus === 'healthy' ? '#10b981' : '#ef4444'
                  }}>
                    <i className={`bx ${diagnostics.overallStatus === 'healthy' ? 'bxs-check-shield' : 'bxs-error-alt'}`}></i>
                  </div>
                  <h3>Resultado General</h3>
                  <p className="diagnostic-status" style={{
                    color: diagnostics.overallStatus === 'healthy' ? '#10b981' : '#ef4444'
                  }}>
                    {diagnostics.overallStatus === 'healthy' ? 'Sistema Saludable' : 'Problemas Detectados'}
                  </p>
                  <small>
                    <i className='bx bx-time-five'></i>
                    Ejecutado: {formatDate(diagnostics.timestamp)}
                  </small>
                </div>
              </div>

              <div className="diagnostics-tests">
                <h3>
                  <i className='bx bx-list-check'></i>
                  Pruebas Realizadas
                </h3>
                <div className="tests-grid">
                  {diagnostics.tests && Object.entries(diagnostics.tests).map(([testName, testResult]) => (
                    <div key={testName} className="test-card">
                      <div className="test-header">
                        <span className="test-icon" style={{
                          color: testResult.status === 'pass' ? '#10b981' : '#ef4444'
                        }}>
                          <i className={`bx ${testResult.status === 'pass' ? 'bxs-check-circle' : 'bxs-x-circle'}`}></i>
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
                        <p className="test-message">
                          <i className='bx bx-info-circle'></i>
                          {testResult.message}
                        </p>
                      )}
                      {testResult.error && (
                        <p className="test-error">
                          <i className='bx bx-error'></i>
                          Error: {testResult.error}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <div className="empty-state">
              <i className='bx bx-search-alt-2 empty-icon'></i>
              <h4>No se han ejecutado diagnósticos</h4>
              <p>Haz clic en el botón para verificar el estado del sistema</p>
              <button onClick={handleRunDiagnostics} className="btn-primary">
                <i className='bx bx-play-circle'></i>
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