// src/pages/Reports/Reports.jsx
import React, { useState, useEffect, useCallback } from 'react';
import reportService from '../../api/reportService';
import toast, { Toaster } from 'react-hot-toast';
import './Reports.css';

const Reports = () => {
  const [reportes, setReportes] = useState([]);
  const [loading, setLoading] = useState(false);
  
  const [dailyReport, setDailyReport] = useState(null);
  const [weeklyReport, setWeeklyReport] = useState(null);
  const [monthlyReport, setMonthlyReport] = useState(null);
  const [topProducts, setTopProducts] = useState(null);
  
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reportType, setReportType] = useState('all');
  
  const [activeView, setActiveView] = useState('quick');
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedReport, setSelectedReport] = useState(null);

  const loadReports = useCallback(async () => {
    try {
      setLoading(true);
      
      let data;
      if (reportType === 'all') {
        data = await reportService.getAll();
      } else {
        data = await reportService.getByType(reportType);
      }
      
      const reportArray = Array.isArray(data) ? data : [];
      console.log('📊 Reportes cargados:', reportArray.length, 'reportes');
      setReportes(reportArray);
    } catch (err) {
      const errorMessage = err.error || 'Error al cargar reportes';
      toast.error(errorMessage);
      console.error('Error cargando reportes:', err);
      setReportes([]);
    } finally {
      setLoading(false);
    }
  }, [reportType]);

  useEffect(() => {
    if (activeView === 'history') {
      loadReports();
    }
  }, [activeView, loadReports]);

  const handleDailyReport = async () => {
    try {
      setLoading(true);
      const data = await reportService.getDailySalesReport();
      setDailyReport(data);
      toast.success('Reporte diario cargado');
      console.log('📅 Reporte diario:', data);
    } catch (err) {
      toast.error(err.error || 'Error al obtener reporte diario');
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleWeeklyReport = async () => {
    try {
      setLoading(true);
      const data = await reportService.getWeeklySalesReport();
      setWeeklyReport(data);
      toast.success('Reporte semanal cargado');
      console.log('📆 Reporte semanal:', data);
    } catch (err) {
      toast.error(err.error || 'Error al obtener reporte semanal');
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleMonthlyReport = async () => {
    try {
      setLoading(true);
      const data = await reportService.getMonthlySalesReport();
      setMonthlyReport(data);
      toast.success('Reporte mensual cargado');
      console.log('📊 Reporte mensual:', data);
    } catch (err) {
      toast.error(err.error || 'Error al obtener reporte mensual');
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleTopProducts = async (days = 30) => {
    try {
      setLoading(true);
      const data = await reportService.getTopProductsReport(days);
      setTopProducts(data);
      toast.success('Productos más vendidos cargados');
      console.log('🏆 Productos más vendidos:', data);
    } catch (err) {
      toast.error(err.error || 'Error al obtener productos más vendidos');
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateSalesReport = async () => {
    if (!startDate || !endDate) {
      toast.error('Por favor selecciona ambas fechas');
      return;
    }

    const loadingToast = toast.loading('Generando reporte de ventas...');
    try {
      setLoading(true);
      const data = await reportService.generateSalesReport(startDate, endDate);
      console.log('💰 Reporte de ventas generado:', data);
      toast.success('✅ Reporte de ventas generado exitosamente', { id: loadingToast });
      
      await loadReports();
      setStartDate('');
      setEndDate('');
      setActiveView('history');
    } catch (err) {
      toast.error(err.error || 'Error al generar reporte de ventas', { id: loadingToast });
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateInventoryReport = async () => {
    const loadingToast = toast.loading('Generando reporte de inventario...');
    try {
      setLoading(true);
      const data = await reportService.generateInventoryReport();
      console.log('📦 Reporte de inventario generado:', data);
      toast.success('✅ Reporte de inventario generado exitosamente', { id: loadingToast });
      
      await loadReports();
      setActiveView('history');
    } catch (err) {
      toast.error(err.error || 'Error al generar reporte de inventario', { id: loadingToast });
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteReport = async (id) => {
    if (!window.confirm('¿Estás seguro de eliminar este reporte?')) {
      return;
    }

    const loadingToast = toast.loading('Eliminando reporte...');
    try {
      setLoading(true);
      await reportService.delete(id);
      toast.success('✅ Reporte eliminado exitosamente', { id: loadingToast });
      await loadReports();
    } catch (err) {
      toast.error(err.error || 'Error al eliminar reporte', { id: loadingToast });
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleViewReport = async (id) => {
    try {
      setLoading(true);
      const data = await reportService.getById(id);
      console.log('👁️ Detalle del reporte:', data);
      
      setSelectedReport(data);
      setShowDetailModal(true);
    } catch (err) {
      toast.error(err.error || 'Error al obtener reporte');
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const closeDetailModal = () => {
    setShowDetailModal(false);
    setSelectedReport(null);
  };

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

  return (
    <div className="reports-container">
      <Toaster position="top-right" />

      {/* Header */}
      <div className="reports-header">
        <div className="header-content">
          <h1 className="header-title">
            <i className='bx bxs-report'></i>
            Reportes
          </h1>
          <p className="subtitle">Genera y consulta reportes de ventas e inventario</p>
        </div>
      </div>

      {/* Navegación de vistas */}
      <div className="view-tabs">
        <button 
          className={`tab-btn ${activeView === 'quick' ? 'active' : ''}`}
          onClick={() => setActiveView('quick')}
        >
          <i className='bx bx-bar-chart-alt-2'></i>
          Reportes Rápidos
        </button>
        <button 
          className={`tab-btn ${activeView === 'custom' ? 'active' : ''}`}
          onClick={() => setActiveView('custom')}
        >
          <i className='bx bx-cog'></i>
          Reportes Personalizados
        </button>
        <button 
          className={`tab-btn ${activeView === 'history' ? 'active' : ''}`}
          onClick={() => setActiveView('history')}
        >
          <i className='bx bx-history'></i>
          Historial
        </button>
      </div>

      {/* VISTA: REPORTES RÁPIDOS */}
      {activeView === 'quick' && (
        <div className="quick-reports">
          <div className="quick-reports-grid">
            {/* Reporte Diario */}
            <div className="report-card">
              <div className="card-icon primary">
                <i className='bx bxs-calendar-check'></i>
              </div>
              <h3>Ventas del Día</h3>
              <p>Consulta las ventas de hoy</p>
              <button 
                onClick={handleDailyReport}
                disabled={loading}
                className="btn-report"
              >
                <i className='bx bx-show'></i>
                {loading ? 'Cargando...' : 'Ver Reporte'}
              </button>
              
              {dailyReport && (
                <div className="report-result">
                  <div className="result-item">
                    <i className='bx bx-calendar'></i>
                    <div>
                      <span className="label">Fecha</span>
                      <span className="value">{formatDate(dailyReport.date)}</span>
                    </div>
                  </div>
                  <div className="result-item highlight">
                    <i className='bx bx-dollar-circle'></i>
                    <div>
                      <span className="label">Total</span>
                      <span className="value">{formatCurrency(dailyReport.total_sales)}</span>
                    </div>
                  </div>
                  <div className="result-item">
                    <i className='bx bx-cart'></i>
                    <div>
                      <span className="label">Ventas</span>
                      <span className="value">{dailyReport.count_sales}</span>
                    </div>
                  </div>
                  <div className="result-item">
                    <i className='bx bx-trending-up'></i>
                    <div>
                      <span className="label">Promedio</span>
                      <span className="value">{formatCurrency(dailyReport.average_sale)}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Reporte Semanal */}
            <div className="report-card">
              <div className="card-icon success">
                <i className='bx bxs-calendar-week'></i>
              </div>
              <h3>Ventas de la Semana</h3>
              <p>Consulta las ventas de esta semana</p>
              <button 
                onClick={handleWeeklyReport}
                disabled={loading}
                className="btn-report"
              >
                <i className='bx bx-show'></i>
                {loading ? 'Cargando...' : 'Ver Reporte'}
              </button>
              
              {weeklyReport && (
                <div className="report-result">
                  <div className="result-item">
                    <i className='bx bx-calendar-event'></i>
                    <div>
                      <span className="label">Semana</span>
                      <span className="value small">{formatDate(weeklyReport.week_start)} - {formatDate(weeklyReport.week_end)}</span>
                    </div>
                  </div>
                  <div className="result-item highlight">
                    <i className='bx bx-dollar-circle'></i>
                    <div>
                      <span className="label">Total</span>
                      <span className="value">{formatCurrency(weeklyReport.total_sales)}</span>
                    </div>
                  </div>
                  <div className="result-item">
                    <i className='bx bx-cart'></i>
                    <div>
                      <span className="label">Ventas</span>
                      <span className="value">{weeklyReport.count_sales}</span>
                    </div>
                  </div>
                  <div className="result-item">
                    <i className='bx bx-trending-up'></i>
                    <div>
                      <span className="label">Promedio</span>
                      <span className="value">{formatCurrency(weeklyReport.average_sale)}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Reporte Mensual */}
            <div className="report-card">
              <div className="card-icon info">
                <i className='bx bxs-calendar'></i>
              </div>
              <h3>Ventas del Mes</h3>
              <p>Consulta las ventas de este mes</p>
              <button 
                onClick={handleMonthlyReport}
                disabled={loading}
                className="btn-report"
              >
                <i className='bx bx-show'></i>
                {loading ? 'Cargando...' : 'Ver Reporte'}
              </button>
              
              {monthlyReport && (
                <div className="report-result">
                  <div className="result-item">
                    <i className='bx bx-calendar-alt'></i>
                    <div>
                      <span className="label">Mes</span>
                      <span className="value">{monthlyReport.month}</span>
                    </div>
                  </div>
                  <div className="result-item highlight">
                    <i className='bx bx-dollar-circle'></i>
                    <div>
                      <span className="label">Total</span>
                      <span className="value">{formatCurrency(monthlyReport.total_sales)}</span>
                    </div>
                  </div>
                  <div className="result-item">
                    <i className='bx bx-cart'></i>
                    <div>
                      <span className="label">Ventas</span>
                      <span className="value">{monthlyReport.count_sales}</span>
                    </div>
                  </div>
                  <div className="result-item">
                    <i className='bx bx-trending-up'></i>
                    <div>
                      <span className="label">Promedio</span>
                      <span className="value">{formatCurrency(monthlyReport.average_sale)}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Top Productos */}
            <div className="report-card">
              <div className="card-icon warning">
                <i className='bx bxs-trophy'></i>
              </div>
              <h3>Productos Más Vendidos</h3>
              <p>Últimos 30 días</p>
              <button 
                onClick={() => handleTopProducts(30)}
                disabled={loading}
                className="btn-report"
              >
                <i className='bx bx-show'></i>
                {loading ? 'Cargando...' : 'Ver Reporte'}
              </button>
              
              {topProducts && topProducts.products && (
                <div className="report-result">
                  <div className="result-item">
                    <i className='bx bx-time-five'></i>
                    <div>
                      <span className="label">Período</span>
                      <span className="value">{topProducts.period_days} días</span>
                    </div>
                  </div>
                  <div className="top-products-list">
                    {topProducts.products.slice(0, 5).map((product, index) => (
                      <div key={index} className="top-product-item">
                        <span className="rank">
                          {index === 0 && <i className='bx bxs-medal'></i>}
                          {index !== 0 && `#${index + 1}`}
                        </span>
                        <div className="product-info">
                          <strong>
                            <i className='bx bx-package'></i>
                            {product.product_name}
                          </strong>
                          <small>
                            <i className='bx bx-category'></i>
                            {product.category}
                          </small>
                        </div>
                        <div className="product-stats">
                          <span>
                            <i className='bx bx-box'></i>
                            {product.total_quantity}
                          </span>
                          <span className="amount">
                            {formatCurrency(product.total_amount)}
                          </span>
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

      {/* VISTA: REPORTES PERSONALIZADOS */}
      {activeView === 'custom' && (
        <div className="custom-reports">
          <div className="custom-reports-grid">
            {/* Generar Reporte de Ventas */}
            <div className="report-generator">
              <div className="generator-header">
                <div className="generator-icon primary">
                  <i className='bx bxs-receipt'></i>
                </div>
                <div>
                  <h3>Reporte de Ventas Personalizado</h3>
                  <p>Genera un reporte de ventas para un período específico</p>
                </div>
              </div>
              
              <div className="form-group">
                <label>
                  <i className='bx bx-calendar'></i>
                  Fecha Inicio
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>
              
              <div className="form-group">
                <label>
                  <i className='bx bx-calendar-check'></i>
                  Fecha Fin
                </label>
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
                <i className='bx bx-plus-circle'></i>
                {loading ? 'Generando...' : 'Generar Reporte de Ventas'}
              </button>
            </div>

            {/* Generar Reporte de Inventario */}
            <div className="report-generator">
              <div className="generator-header">
                <div className="generator-icon success">
                  <i className='bx bxs-box'></i>
                </div>
                <div>
                  <h3>Reporte de Inventario</h3>
                  <p>Genera un reporte completo del inventario actual</p>
                </div>
              </div>
              
              <button 
                onClick={handleGenerateInventoryReport}
                disabled={loading}
                className="btn-primary"
              >
                <i className='bx bx-plus-circle'></i>
                {loading ? 'Generando...' : 'Generar Reporte de Inventario'}
              </button>
              
              <div className="report-info">
                <p>
                  <i className='bx bx-info-circle'></i>
                  Este reporte incluye:
                </p>
                <ul>
                  <li>
                    <i className='bx bx-check'></i>
                    Total de productos
                  </li>
                  <li>
                    <i className='bx bx-check'></i>
                    Valor total del inventario
                  </li>
                  <li>
                    <i className='bx bx-check'></i>
                    Productos con bajo stock
                  </li>
                  <li>
                    <i className='bx bx-check'></i>
                    Detalle por producto
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* VISTA: HISTORIAL */}
      {activeView === 'history' && (
        <div className="reports-history">
          <div className="history-controls">
            <h3>
              <i className='bx bx-folder-open'></i>
              Historial de Reportes
            </h3>
            
            <div className="filter-group">
              <label>
                <i className='bx bx-filter-alt'></i>
                Filtrar por tipo:
              </label>
              <select 
                value={reportType} 
                onChange={(e) => setReportType(e.target.value)}
              >
                <option value="all">Todos</option>
                <option value="ventas">Ventas</option>
                <option value="inventario">Inventario</option>
              </select>
              
              <button onClick={loadReports} disabled={loading} className="btn-refresh">
                <i className='bx bx-refresh'></i>
                Actualizar
              </button>
            </div>
          </div>

          {loading ? (
            <div className="loading-state">
              <div className="spinner"></div>
              <p>Cargando reportes...</p>
            </div>
          ) : reportes.length === 0 ? (
            <div className="empty-state">
              <i className='bx bx-file empty-icon'></i>
              <h3>No hay reportes generados</h3>
              <p>Genera tu primer reporte en las pestañas anteriores</p>
            </div>
          ) : (
            <div className="table-wrapper">
              <table className="reports-table">
                <thead>
                  <tr>
                    <th><i className='bx bx-hash'></i> ID</th>
                    <th><i className='bx bx-category'></i> Tipo</th>
                    <th><i className='bx bx-user'></i> Generado por</th>
                    <th><i className='bx bx-calendar'></i> Fecha</th>
                    <th><i className='bx bx-cog'></i> Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {reportes.map((reporte) => (
                    <tr key={reporte.id}>
                      <td>
                        <span className="id-badge">#{reporte.id}</span>
                      </td>
                      <td>
                        <span className={`badge badge-${reporte.type}`}>
                          <i className={`bx ${reporte.type === 'ventas' ? 'bxs-shopping-bag' : 'bxs-package'}`}></i>
                          {reporte.type}
                        </span>
                      </td>
                      <td className="user-cell">
                        <i className='bx bx-user-circle'></i>
                        {reporte.user_username || reporte.user_name || 'N/A'}
                      </td>
                      <td className="date-cell">
                        <i className='bx bx-time-five'></i>
                        {formatDate(reporte.generated_at)}
                      </td>
                      <td>
                        <div className="action-buttons">
                          <button 
                            onClick={() => handleViewReport(reporte.id)}
                            className="btn-icon primary"
                            title="Ver reporte"
                          >
                            <i className='bx bx-show'></i>
                          </button>
                          <button 
                            onClick={() => handleDeleteReport(reporte.id)}
                            className="btn-icon danger"
                            title="Eliminar reporte"
                          >
                            <i className='bx bx-trash'></i>
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

      {/* MODAL: DETALLE DE REPORTE */}
      {showDetailModal && selectedReport && (
        <div className="modal-overlay" onClick={closeDetailModal}>
          <div className="modal-content report-detail-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>
                <i className={`bx ${selectedReport.type === 'ventas' ? 'bxs-shopping-bag' : 'bxs-package'}`}></i>
                Reporte de {selectedReport.type}
              </h2>
              <button onClick={closeDetailModal} className="btn-close">
                <i className='bx bx-x'></i>
              </button>
            </div>

            <div className="modal-body">
              {/* Información General */}
              <div className="report-info-section">
                <div className="info-grid">
                  <div className="info-item">
                    <span className="info-label">
                      <i className='bx bx-hash'></i>
                      ID
                    </span>
                    <span className="info-value">#{selectedReport.id}</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">
                      <i className='bx bx-category'></i>
                      Tipo
                    </span>
                    <span className={`badge badge-${selectedReport.type}`}>
                      {selectedReport.type}
                    </span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">
                      <i className='bx bx-user'></i>
                      Generado por
                    </span>
                    <span className="info-value">
                      {selectedReport.user_username || selectedReport.user_name || 'N/A'}
                    </span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">
                      <i className='bx bx-calendar'></i>
                      Fecha
                    </span>
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
                <h3>
                  <i className='bx bxs-bar-chart-alt-2'></i>
                  Datos del Reporte
                </h3>
                
                {selectedReport.data && (
                  <>
                    {/* Período */}
                    {selectedReport.data.period && (
                      <div className="data-card">
                        <h4>
                          <i className='bx bx-calendar-event'></i>
                          Período
                        </h4>
                        <div className="data-content">
                          <p>
                            <i className='bx bx-calendar-check'></i>
                            <strong>Inicio:</strong>{' '}
                            {new Date(selectedReport.data.period.start).toLocaleDateString('es-MX')}
                          </p>
                          <p>
                            <i className='bx bx-calendar-x'></i>
                            <strong>Fin:</strong>{' '}
                            {new Date(selectedReport.data.period.end).toLocaleDateString('es-MX')}
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Resumen */}
                    {selectedReport.data.summary && (
                      <div className="data-card highlight">
                        <h4>
                          <i className='bx bx-line-chart'></i>
                          Resumen
                        </h4>
                        <div className="summary-grid">
                          {selectedReport.data.summary.total_sales !== undefined && (
                            <div className="summary-item">
                              <i className='bx bxs-dollar-circle'></i>
                              <div>
                                <span className="summary-label">Total Ventas</span>
                                <span className="summary-value">
                                  {formatCurrency(selectedReport.data.summary.total_sales)}
                                </span>
                              </div>
                            </div>
                          )}
                          {selectedReport.data.summary.count_sales !== undefined && (
                            <div className="summary-item">
                              <i className='bx bxs-cart'></i>
                              <div>
                                <span className="summary-label">Cantidad</span>
                                <span className="summary-value">
                                  {selectedReport.data.summary.count_sales} ventas
                                </span>
                              </div>
                            </div>
                          )}
                          {selectedReport.data.summary.average_sale !== undefined && (
                            <div className="summary-item">
                              <i className='bx bxs-trending-up'></i>
                              <div>
                                <span className="summary-label">Promedio</span>
                                <span className="summary-value">
                                  {formatCurrency(selectedReport.data.summary.average_sale)}
                                </span>
                              </div>
                            </div>
                          )}
                          {selectedReport.data.summary.total_products !== undefined && (
                            <div className="summary-item">
                              <i className='bx bxs-package'></i>
                              <div>
                                <span className="summary-label">Total Productos</span>
                                <span className="summary-value">
                                  {selectedReport.data.summary.total_products}
                                </span>
                              </div>
                            </div>
                          )}
                          {selectedReport.data.summary.total_value !== undefined && (
                            <div className="summary-item">
                              <i className='bx bxs-wallet'></i>
                              <div>
                                <span className="summary-label">Valor Total</span>
                                <span className="summary-value">
                                  {formatCurrency(selectedReport.data.summary.total_value)}
                                </span>
                              </div>
                            </div>
                          )}
                          {selectedReport.data.summary.low_stock_count !== undefined && (
                            <div className="summary-item warning">
                              <i className='bx bxs-error-circle'></i>
                              <div>
                                <span className="summary-label">Stock Bajo</span>
                                <span className="summary-value">
                                  {selectedReport.data.summary.low_stock_count} productos
                                </span>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Ventas Detalladas */}
                    {selectedReport.data.sales && selectedReport.data.sales.length > 0 && (
                      <div className="data-card">
                        <h4>
                          <i className='bx bxs-shopping-bags'></i>
                          Ventas del Período
                        </h4>
                        <div className="sales-list">
                          {selectedReport.data.sales.slice(0, 10).map((sale, index) => (
                            <div key={index} className="sale-item">
                              <span className="sale-id">
                                <i className='bx bx-receipt'></i>
                                #{sale.id}
                              </span>
                              <span className="sale-date">
                                <i className='bx bx-calendar'></i>
                                {new Date(sale.date).toLocaleDateString('es-MX')}
                              </span>
                              <span className="sale-total">
                                <i className='bx bx-dollar'></i>
                                {formatCurrency(sale.total_price)}
                              </span>
                            </div>
                          ))}
                          {selectedReport.data.sales.length > 10 && (
                            <p className="more-info">
                              <i className='bx bx-dots-horizontal-rounded'></i>
                              y {selectedReport.data.sales.length - 10} ventas más
                            </p>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Productos */}
                    {selectedReport.data.products && selectedReport.data.products.length > 0 && (
                      <div className="data-card">
                        <h4>
                          <i className='bx bxs-package'></i>
                          Productos en Inventario
                        </h4>
                        <div className="products-table-wrapper">
                          <table className="products-table">
                            <thead>
                              <tr>
                                <th><i className='bx bx-box'></i> Producto</th>
                                <th><i className='bx bx-category'></i> Categoría</th>
                                <th><i className='bx bx-package'></i> Stock</th>
                                <th><i className='bx bx-dollar'></i> Precio</th>
                                <th><i className='bx bx-calculator'></i> Valor Total</th>
                              </tr>
                            </thead>
                            <tbody>
                              {selectedReport.data.products.slice(0, 10).map((product, index) => (
                                <tr key={index}>
                                  <td>{product.name}</td>
                                  <td>{product.category || 'N/A'}</td>
                                  <td>
                                    <span className={product.stock <= 10 ? 'stock-low' : 'stock-ok'}>
                                      <i className={`bx ${product.stock <= 10 ? 'bx-error-circle' : 'bx-check-circle'}`}></i>
                                      {product.stock}
                                    </span>
                                  </td>
                                  <td>{formatCurrency(product.price)}</td>
                                  <td className="total-value">{formatCurrency(product.stock * product.price)}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                          {selectedReport.data.products.length > 10 && (
                            <p className="more-info">
                              <i className='bx bx-dots-horizontal-rounded'></i>
                              y {selectedReport.data.products.length - 10} productos más
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
                <i className='bx bx-x'></i>
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
                <i className='bx bx-download'></i>
                Descargar JSON
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Reports;