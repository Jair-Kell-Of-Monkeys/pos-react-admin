// src/pages/Reports/Reports.jsx
import React, { useState, useEffect, useCallback } from 'react';
import reportService from '../../api/reportService';
import './Reports.css';

const Reports = () => {
  // Estados para los diferentes reportes
  const [reportes, setReportes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Estados para reportes rápidos
  const [dailyReport, setDailyReport] = useState(null);
  const [weeklyReport, setWeeklyReport] = useState(null);
  const [monthlyReport, setMonthlyReport] = useState(null);
  const [topProducts, setTopProducts] = useState(null);
  
  // Estados para generar reportes personalizados
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reportType, setReportType] = useState('all');
  
  // Estado para vista activa
  const [activeView, setActiveView] = useState('quick');

  // Estados para modal de detalle
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedReport, setSelectedReport] = useState(null);

  // ✅ Función memoizada con useCallback
  const loadReports = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      let data;
      if (reportType === 'all') {
        data = await reportService.getAll();
      } else {
        data = await reportService.getByType(reportType);
      }
      
      // ✅ Asegurar que siempre sea un array
      const reportArray = Array.isArray(data) ? data : [];
      console.log('📊 Reportes cargados:', reportArray.length, 'reportes');
      setReportes(reportArray);
    } catch (err) {
      const errorMessage = err.error || 'Error al cargar reportes';
      setError(errorMessage);
      console.error('Error cargando reportes:', err);
      setReportes([]);
    } finally {
      setLoading(false);
    }
  }, [reportType]);

  // Cargar reportes guardados al montar el componente
  useEffect(() => {
    if (activeView === 'history') {
      loadReports();
    }
  }, [activeView, loadReports]);

  // ========== REPORTES RÁPIDOS ==========
  
  const handleDailyReport = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await reportService.getDailySalesReport();
      setDailyReport(data);
      console.log('📅 Reporte diario:', data);
    } catch (err) {
      setError(err.error || 'Error al obtener reporte diario');
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleWeeklyReport = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await reportService.getWeeklySalesReport();
      setWeeklyReport(data);
      console.log('📆 Reporte semanal:', data);
    } catch (err) {
      setError(err.error || 'Error al obtener reporte semanal');
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleMonthlyReport = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await reportService.getMonthlySalesReport();
      setMonthlyReport(data);
      console.log('📊 Reporte mensual:', data);
    } catch (err) {
      setError(err.error || 'Error al obtener reporte mensual');
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleTopProducts = async (days = 30) => {
    try {
      setLoading(true);
      setError(null);
      const data = await reportService.getTopProductsReport(days);
      setTopProducts(data);
      console.log('🏆 Productos más vendidos:', data);
    } catch (err) {
      setError(err.error || 'Error al obtener productos más vendidos');
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  // ========== GENERAR REPORTES PERSONALIZADOS ==========
  
  const handleGenerateSalesReport = async () => {
    if (!startDate || !endDate) {
      setError('Por favor selecciona ambas fechas');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const data = await reportService.generateSalesReport(startDate, endDate);
      console.log('💰 Reporte de ventas generado:', data);
      alert('✅ Reporte de ventas generado exitosamente');
      
      await loadReports();
      setStartDate('');
      setEndDate('');
      setActiveView('history');
    } catch (err) {
      setError(err.error || 'Error al generar reporte de ventas');
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateInventoryReport = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await reportService.generateInventoryReport();
      console.log('📦 Reporte de inventario generado:', data);
      alert('✅ Reporte de inventario generado exitosamente');
      
      await loadReports();
      setActiveView('history');
    } catch (err) {
      setError(err.error || 'Error al generar reporte de inventario');
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  // ========== ACCIONES SOBRE REPORTES ==========
  
  const handleDeleteReport = async (id) => {
    if (!window.confirm('¿Estás seguro de eliminar este reporte?')) {
      return;
    }

    try {
      setLoading(true);
      setError(null);
      await reportService.delete(id);
      alert('✅ Reporte eliminado exitosamente');
      await loadReports();
    } catch (err) {
      setError(err.error || 'Error al eliminar reporte');
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleViewReport = async (id) => {
    try {
      setLoading(true);
      setError(null);
      const data = await reportService.getById(id);
      console.log('👁️ Detalle del reporte:', data);
      
      setSelectedReport(data);
      setShowDetailModal(true);
    } catch (err) {
      setError(err.error || 'Error al obtener reporte');
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const closeDetailModal = () => {
    setShowDetailModal(false);
    setSelectedReport(null);
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
    return new Date(dateString).toLocaleDateString('es-MX', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // ========== RENDER ==========
  
  return (
    <div className="reports-container">
      <div className="reports-header">
        <h1>📊 Reportes</h1>
        <p>Genera y consulta reportes de ventas e inventario</p>
      </div>

      {/* Mensajes de error */}
      {error && (
        <div className="error-message">
          <span>⚠️ {error}</span>
          <button onClick={() => setError(null)}>✕</button>
        </div>
      )}

      {/* Navegación de vistas */}
      <div className="view-tabs">
        <button 
          className={activeView === 'quick' ? 'active' : ''}
          onClick={() => setActiveView('quick')}
        >
          ⚡ Reportes Rápidos
        </button>
        <button 
          className={activeView === 'custom' ? 'active' : ''}
          onClick={() => setActiveView('custom')}
        >
          🔧 Reportes Personalizados
        </button>
        <button 
          className={activeView === 'history' ? 'active' : ''}
          onClick={() => setActiveView('history')}
        >
          📋 Historial
        </button>
      </div>

      {/* ========== VISTA: REPORTES RÁPIDOS ========== */}
      {activeView === 'quick' && (
        <div className="quick-reports">
          <div className="quick-reports-grid">
            {/* Reporte Diario */}
            <div className="report-card">
              <h3>📅 Ventas del Día</h3>
              <p>Consulta las ventas de hoy</p>
              <button 
                onClick={handleDailyReport}
                disabled={loading}
              >
                {loading ? 'Cargando...' : 'Ver Reporte'}
              </button>
              
              {dailyReport && (
                <div className="report-result">
                  <p><strong>Fecha:</strong> {formatDate(dailyReport.date)}</p>
                  <p><strong>Total:</strong> {formatCurrency(dailyReport.total_sales)}</p>
                  <p><strong>Ventas:</strong> {dailyReport.count_sales}</p>
                  <p><strong>Promedio:</strong> {formatCurrency(dailyReport.average_sale)}</p>
                </div>
              )}
            </div>

            {/* Reporte Semanal */}
            <div className="report-card">
              <h3>📆 Ventas de la Semana</h3>
              <p>Consulta las ventas de esta semana</p>
              <button 
                onClick={handleWeeklyReport}
                disabled={loading}
              >
                {loading ? 'Cargando...' : 'Ver Reporte'}
              </button>
              
              {weeklyReport && (
                <div className="report-result">
                  <p><strong>Semana:</strong> {formatDate(weeklyReport.week_start)} - {formatDate(weeklyReport.week_end)}</p>
                  <p><strong>Total:</strong> {formatCurrency(weeklyReport.total_sales)}</p>
                  <p><strong>Ventas:</strong> {weeklyReport.count_sales}</p>
                  <p><strong>Promedio:</strong> {formatCurrency(weeklyReport.average_sale)}</p>
                </div>
              )}
            </div>

            {/* Reporte Mensual */}
            <div className="report-card">
              <h3>📊 Ventas del Mes</h3>
              <p>Consulta las ventas de este mes</p>
              <button 
                onClick={handleMonthlyReport}
                disabled={loading}
              >
                {loading ? 'Cargando...' : 'Ver Reporte'}
              </button>
              
              {monthlyReport && (
                <div className="report-result">
                  <p><strong>Mes:</strong> {monthlyReport.month}</p>
                  <p><strong>Total:</strong> {formatCurrency(monthlyReport.total_sales)}</p>
                  <p><strong>Ventas:</strong> {monthlyReport.count_sales}</p>
                  <p><strong>Promedio:</strong> {formatCurrency(monthlyReport.average_sale)}</p>
                </div>
              )}
            </div>

            {/* Top Productos */}
            <div className="report-card">
              <h3>🏆 Productos Más Vendidos</h3>
              <p>Últimos 30 días</p>
              <button 
                onClick={() => handleTopProducts(30)}
                disabled={loading}
              >
                {loading ? 'Cargando...' : 'Ver Reporte'}
              </button>
              
              {topProducts && topProducts.products && (
                <div className="report-result">
                  <p><strong>Período:</strong> {topProducts.period_days} días</p>
                  <div className="top-products-list">
                    {topProducts.products.slice(0, 5).map((product, index) => (
                      <div key={index} className="top-product-item">
                        <span className="rank">{index + 1}</span>
                        <div className="product-info">
                          <strong>{product.product_name}</strong>
                          <small>{product.category}</small>
                        </div>
                        <div className="product-stats">
                          <span>Cant: {product.total_quantity}</span>
                          <span>{formatCurrency(product.total_amount)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========== VISTA: REPORTES PERSONALIZADOS ========== */}
      {activeView === 'custom' && (
        <div className="custom-reports">
          <div className="custom-reports-grid">
            {/* Generar Reporte de Ventas */}
            <div className="report-generator">
              <h3>💰 Reporte de Ventas Personalizado</h3>
              <p>Genera un reporte de ventas para un período específico</p>
              
              <div className="form-group">
                <label>Fecha Inicio:</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>
              
              <div className="form-group">
                <label>Fecha Fin:</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>
              
              <button 
                onClick={handleGenerateSalesReport}
                disabled={loading || !startDate || !endDate}
                className="btn-primary"
              >
                {loading ? 'Generando...' : 'Generar Reporte de Ventas'}
              </button>
            </div>

            {/* Generar Reporte de Inventario */}
            <div className="report-generator">
              <h3>📦 Reporte de Inventario</h3>
              <p>Genera un reporte completo del inventario actual</p>
              
              <button 
                onClick={handleGenerateInventoryReport}
                disabled={loading}
                className="btn-primary"
              >
                {loading ? 'Generando...' : 'Generar Reporte de Inventario'}
              </button>
              
              <div className="report-info">
                <p>Este reporte incluye:</p>
                <ul>
                  <li>Total de productos</li>
                  <li>Valor total del inventario</li>
                  <li>Productos con bajo stock</li>
                  <li>Detalle por producto</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========== VISTA: HISTORIAL ========== */}
      {activeView === 'history' && (
        <div className="reports-history">
          <div className="history-controls">
            <h3>📋 Historial de Reportes</h3>
            
            <div className="filter-group">
              <label>Filtrar por tipo:</label>
              <select 
                value={reportType} 
                onChange={(e) => setReportType(e.target.value)}
              >
                <option value="all">Todos</option>
                <option value="ventas">Ventas</option>
                <option value="inventario">Inventario</option>
              </select>
              
              <button onClick={loadReports} disabled={loading}>
                🔄 Actualizar
              </button>
            </div>
          </div>

          {loading ? (
            <div className="loading">Cargando reportes...</div>
          ) : reportes.length === 0 ? (
            <div className="empty-state">
              <p>📭 No hay reportes generados</p>
              <p>Genera tu primer reporte en las pestañas anteriores</p>
            </div>
          ) : (
            <div className="reports-table">
              <table>
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Tipo</th>
                    <th>Generado por</th>
                    <th>Fecha</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {reportes.map((reporte) => (
                    <tr key={reporte.id}>
                      <td>#{reporte.id}</td>
                      <td>
                        <span className={`badge badge-${reporte.type}`}>
                          {reporte.type === 'ventas' ? '💰' : '📦'} {reporte.type}
                        </span>
                      </td>
                      <td>{reporte.user_username || reporte.user_name || 'N/A'}</td>
                      <td>{formatDate(reporte.generated_at)}</td>
                      <td>
                        <div className="action-buttons">
                          <button 
                            onClick={() => handleViewReport(reporte.id)}
                            className="btn-view"
                            title="Ver reporte"
                          >
                            👁️
                          </button>
                          <button 
                            onClick={() => handleDeleteReport(reporte.id)}
                            className="btn-delete"
                            title="Eliminar reporte"
                          >
                            🗑️
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ========== MODAL: DETALLE DE REPORTE ========== */}
      {showDetailModal && selectedReport && (
        <div className="modal-overlay" onClick={closeDetailModal}>
          <div className="modal-content report-detail-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>
                {selectedReport.type === 'ventas' ? '💰' : '📦'} 
                {' '}Reporte de {selectedReport.type}
              </h2>
              <button onClick={closeDetailModal} className="btn-close">✕</button>
            </div>

            <div className="modal-body">
              {/* Información General */}
              <div className="report-info-section">
                <div className="info-grid">
                  <div className="info-item">
                    <span className="info-label">ID:</span>
                    <span className="info-value">#{selectedReport.id}</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Tipo:</span>
                    <span className={`badge badge-${selectedReport.type}`}>
                      {selectedReport.type}
                    </span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Generado por:</span>
                    <span className="info-value">
                      {selectedReport.user_username || selectedReport.user_name || 'N/A'}
                    </span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Fecha:</span>
                    <span className="info-value">
                      {new Date(selectedReport.generated_at).toLocaleString('es-MX', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                  </div>
                </div>
              </div>

              {/* Datos del Reporte */}
              <div className="report-data-section">
                <h3>📊 Datos del Reporte</h3>
                
                {selectedReport.data && (
                  <>
                    {/* Período (si existe) */}
                    {selectedReport.data.period && (
                      <div className="data-card">
                        <h4>📅 Período</h4>
                        <div className="data-content">
                          <p>
                            <strong>Inicio:</strong>{' '}
                            {new Date(selectedReport.data.period.start).toLocaleDateString('es-MX')}
                          </p>
                          <p>
                            <strong>Fin:</strong>{' '}
                            {new Date(selectedReport.data.period.end).toLocaleDateString('es-MX')}
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Resumen (si existe) */}
                    {selectedReport.data.summary && (
                      <div className="data-card highlight">
                        <h4>📈 Resumen</h4>
                        <div className="summary-grid">
                          {selectedReport.data.summary.total_sales !== undefined && (
                            <div className="summary-item">
                              <span className="summary-label">Total Ventas:</span>
                              <span className="summary-value">
                                {formatCurrency(selectedReport.data.summary.total_sales)}
                              </span>
                            </div>
                          )}
                          {selectedReport.data.summary.count_sales !== undefined && (
                            <div className="summary-item">
                              <span className="summary-label">Cantidad:</span>
                              <span className="summary-value">
                                {selectedReport.data.summary.count_sales} ventas
                              </span>
                            </div>
                          )}
                          {selectedReport.data.summary.average_sale !== undefined && (
                            <div className="summary-item">
                              <span className="summary-label">Promedio:</span>
                              <span className="summary-value">
                                {formatCurrency(selectedReport.data.summary.average_sale)}
                              </span>
                            </div>
                          )}
                          {selectedReport.data.summary.total_products !== undefined && (
                            <div className="summary-item">
                              <span className="summary-label">Total Productos:</span>
                              <span className="summary-value">
                                {selectedReport.data.summary.total_products}
                              </span>
                            </div>
                          )}
                          {selectedReport.data.summary.total_value !== undefined && (
                            <div className="summary-item">
                              <span className="summary-label">Valor Total:</span>
                              <span className="summary-value">
                                {formatCurrency(selectedReport.data.summary.total_value)}
                              </span>
                            </div>
                          )}
                          {selectedReport.data.summary.low_stock_count !== undefined && (
                            <div className="summary-item warning">
                              <span className="summary-label">Stock Bajo:</span>
                              <span className="summary-value">
                                {selectedReport.data.summary.low_stock_count} productos
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Ventas Detalladas (si existen) */}
                    {selectedReport.data.sales && selectedReport.data.sales.length > 0 && (
                      <div className="data-card">
                        <h4>🛒 Ventas del Período</h4>
                        <div className="sales-list">
                          {selectedReport.data.sales.slice(0, 10).map((sale, index) => (
                            <div key={index} className="sale-item">
                              <span className="sale-id">#{sale.id}</span>
                              <span className="sale-date">
                                {new Date(sale.date).toLocaleDateString('es-MX')}
                              </span>
                              <span className="sale-total">
                                {formatCurrency(sale.total_price)}
                              </span>
                            </div>
                          ))}
                          {selectedReport.data.sales.length > 10 && (
                            <p className="more-info">
                              ... y {selectedReport.data.sales.length - 10} ventas más
                            </p>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Productos (si existen) */}
                    {selectedReport.data.products && selectedReport.data.products.length > 0 && (
                      <div className="data-card">
                        <h4>📦 Productos en Inventario</h4>
                        <div className="products-table">
                          <table>
                            <thead>
                              <tr>
                                <th>Producto</th>
                                <th>Categoría</th>
                                <th>Stock</th>
                                <th>Precio</th>
                                <th>Valor Total</th>
                              </tr>
                            </thead>
                            <tbody>
                              {selectedReport.data.products.slice(0, 10).map((product, index) => (
                                <tr key={index}>
                                  <td>{product.name}</td>
                                  <td>{product.category || 'N/A'}</td>
                                  <td>
                                    <span className={product.stock <= 10 ? 'stock-low' : ''}>
                                      {product.stock}
                                    </span>
                                  </td>
                                  <td>{formatCurrency(product.price)}</td>
                                  <td>{formatCurrency(product.stock * product.price)}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                          {selectedReport.data.products.length > 10 && (
                            <p className="more-info">
                              ... y {selectedReport.data.products.length - 10} productos más
                            </p>
                          )}
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>

            <div className="modal-footer">
              <button onClick={closeDetailModal} className="btn-secondary">
                Cerrar
              </button>
              <button 
                onClick={() => {
                  const dataStr = JSON.stringify(selectedReport.data, null, 2);
                  const blob = new Blob([dataStr], { type: 'application/json' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `reporte-${selectedReport.id}-${selectedReport.type}.json`;
                  a.click();
                  URL.revokeObjectURL(url);
                }}
                className="btn-primary"
              >
                📥 Descargar JSON
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Reports;