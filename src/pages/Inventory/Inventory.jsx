// src/pages/Inventory/Inventory.jsx
import React, { useState, useEffect } from 'react';
import { inventoryService, productService } from '../../api';
import toast, { Toaster } from 'react-hot-toast';
import './Inventory.css';

const Inventory = () => {
  const [activeTab, setActiveTab] = useState('movements');
  const [movements, setMovements] = useState([]);
  const [lowStockProducts, setLowStockProducts] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);

  const [filters, setFilters] = useState({
    product: '',
    type: '',
    startDate: '',
    endDate: ''
  });

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [formData, setFormData] = useState({
    product: '',
    movement_type: 'entrada',
    quantity: '',
    note: ''
  });

  const [stats, setStats] = useState({
    totalMovements: 0,
    totalEntradas: 0,
    totalSalidas: 0,
    netChange: 0
  });

  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    const userData = JSON.parse(localStorage.getItem('user') || '{}');
    setCurrentUser(userData);
    
    loadMovements();
    loadLowStockProducts();
    loadProducts();
  }, []);

  const loadMovements = async () => {
    setLoading(true);
    try {
      const data = await inventoryService.getAll(filters);
      console.log('📦 Movimientos cargados:', data);
      setMovements(Array.isArray(data) ? data : []);
      calculateStats(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error al cargar movimientos:', error);
      toast.error(error.error || 'Error al cargar movimientos');
      setMovements([]);
    } finally {
      setLoading(false);
    }
  };

  const loadLowStockProducts = async () => {
    try {
      const data = await inventoryService.getLowStock(10);
      console.log('⚠️ Productos con stock bajo:', data);
      setLowStockProducts(data.products || []);
    } catch (error) {
      console.error('Error al cargar productos con stock bajo:', error);
      setLowStockProducts([]);
    }
  };

  const loadProducts = async () => {
    try {
      const data = await productService.getAll();
      const productList = Array.isArray(data) ? data : (data.results || data.data || []);
      setProducts(productList);
    } catch (error) {
      console.error('Error al cargar productos:', error);
      setProducts([]);
    }
  };

  const calculateStats = (movementsList) => {
    const entradas = movementsList.filter(m => m.movement_type === 'entrada');
    const salidas = movementsList.filter(m => m.movement_type === 'salida');
    
    const totalEntradasQty = entradas.reduce((sum, m) => sum + (m.quantity || 0), 0);
    const totalSalidasQty = salidas.reduce((sum, m) => sum + (m.quantity || 0), 0);

    setStats({
      totalMovements: movementsList.length,
      totalEntradas: totalEntradasQty,
      totalSalidas: totalSalidasQty,
      netChange: totalEntradasQty - totalSalidasQty
    });
  };

  const handleCreateMovement = async (e) => {
    e.preventDefault();

    if (!formData.product || !formData.quantity) {
      toast.error('Por favor completa todos los campos obligatorios');
      return;
    }

    if (parseInt(formData.quantity) <= 0) {
      toast.error('La cantidad debe ser mayor a 0');
      return;
    }

    setLoading(true);
    const loadingToast = toast.loading('Creando movimiento...');

    try {
      await inventoryService.create({
        product: parseInt(formData.product),
        movement_type: formData.movement_type,
        quantity: parseInt(formData.quantity),
        note: formData.note
      });

      toast.success('✅ Movimiento creado exitosamente', { id: loadingToast });
      
      setShowCreateModal(false);
      setFormData({
        product: '',
        movement_type: 'entrada',
        quantity: '',
        note: ''
      });

      await loadMovements();
      await loadLowStockProducts();
      
    } catch (error) {
      console.error('Error al crear movimiento:', error);
      toast.error(error.error || 'Error al crear movimiento', { id: loadingToast });
    } finally {
      setLoading(false);
    }
  };

  const handleApplyFilters = () => {
    loadMovements();
  };

  const handleClearFilters = () => {
    setFilters({
      product: '',
      type: '',
      startDate: '',
      endDate: ''
    });
    setTimeout(() => loadMovements(), 100);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('es-MX', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getProductName = (productId) => {
    const product = products.find(p => p.id === productId);
    return product ? product.name : `Producto #${productId}`;
  };

  const getStockStatusColor = (stock) => {
    if (stock <= 5) return '#ef4444';
    if (stock <= 10) return '#f59e0b';
    return '#10b981';
  };

  const isAdmin = currentUser?.role?.name === 'Admin' || currentUser?.role?.name === 'admin';

  return (
    <div className="inventory-container">
      <Toaster position="top-right" />

      {/* Header */}
      <div className="inventory-header">
        <div className="header-content">
          <h1 className="header-title">
            <i className='bx bxs-box'></i>
            Gestión de Inventario
          </h1>
          <p className="subtitle">Administra el stock y movimientos de productos</p>
        </div>
        
        {isAdmin && (
          <button 
            onClick={() => setShowCreateModal(true)}
            className="btn-primary"
          >
            <i className='bx bx-plus'></i>
            <span>Nuevo Movimiento</span>
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="inventory-tabs">
        <button
          className={`tab-btn ${activeTab === 'movements' ? 'active' : ''}`}
          onClick={() => setActiveTab('movements')}
        >
          <i className='bx bx-list-ul'></i>
          Movimientos
        </button>
        <button
          className={`tab-btn ${activeTab === 'low-stock' ? 'active' : ''}`}
          onClick={() => setActiveTab('low-stock')}
        >
          <i className='bx bx-error'></i>
          Stock Bajo
          {lowStockProducts.length > 0 && (
            <span className="tab-badge">{lowStockProducts.length}</span>
          )}
        </button>
        <button
          className={`tab-btn ${activeTab === 'statistics' ? 'active' : ''}`}
          onClick={() => setActiveTab('statistics')}
        >
          <i className='bx bx-bar-chart-alt-2'></i>
          Estadísticas
        </button>
      </div>

      {/* TAB: MOVIMIENTOS */}
      {activeTab === 'movements' && (
        <div className="movements-content">
          {/* Filtros */}
          <div className="filters-card">
            <h3>
              <i className='bx bx-filter-alt'></i>
              Filtros
            </h3>
            <div className="filters-grid">
              <div className="filter-group">
                <label>
                  <i className='bx bx-package'></i>
                  Producto
                </label>
                <select
                  value={filters.product}
                  onChange={(e) => setFilters({...filters, product: e.target.value})}
                >
                  <option value="">Todos los productos</option>
                  {products.map(product => (
                    <option key={product.id} value={product.id}>
                      {product.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="filter-group">
                <label>
                  <i className='bx bx-transfer'></i>
                  Tipo de Movimiento
                </label>
                <select
                  value={filters.type}
                  onChange={(e) => setFilters({...filters, type: e.target.value})}
                >
                  <option value="">Todos</option>
                  <option value="entrada">Entradas</option>
                  <option value="salida">Salidas</option>
                </select>
              </div>

              <div className="filter-group">
                <label>
                  <i className='bx bx-calendar'></i>
                  Fecha Inicio
                </label>
                <input
                  type="date"
                  value={filters.startDate}
                  onChange={(e) => setFilters({...filters, startDate: e.target.value})}
                />
              </div>

              <div className="filter-group">
                <label>
                  <i className='bx bx-calendar'></i>
                  Fecha Fin
                </label>
                <input
                  type="date"
                  value={filters.endDate}
                  onChange={(e) => setFilters({...filters, endDate: e.target.value})}
                />
              </div>
            </div>

            <div className="filters-actions">
              <button onClick={handleApplyFilters} className="btn-apply">
                <i className='bx bx-check'></i>
                Aplicar Filtros
              </button>
              <button onClick={handleClearFilters} className="btn-clear">
                <i className='bx bx-x'></i>
                Limpiar
              </button>
            </div>
          </div>

          {/* Lista de movimientos */}
          <div className="movements-list">
            {loading ? (
              <div className="loading-state">
                <div className="spinner"></div>
                <p>Cargando movimientos...</p>
              </div>
            ) : movements.length === 0 ? (
              <div className="empty-state">
                <i className='bx bx-box empty-icon'></i>
                <h3>No hay movimientos registrados</h3>
                <p>Los movimientos de inventario aparecerán aquí</p>
              </div>
            ) : (
              <div className="table-wrapper">
                <table className="movements-table">
                  <thead>
                    <tr>
                      <th><i className='bx bx-transfer'></i> Tipo</th>
                      <th><i className='bx bx-package'></i> Producto</th>
                      <th><i className='bx bx-hash'></i> Cantidad</th>
                      <th><i className='bx bx-calendar'></i> Fecha</th>
                      <th><i className='bx bx-note'></i> Nota</th>
                    </tr>
                  </thead>
                  <tbody>
                    {movements.map((movement) => (
                      <tr key={movement.id}>
                        <td>
                          <span 
                            className={`movement-type ${movement.movement_type}`}
                          >
                            <i className={`bx ${movement.movement_type === 'entrada' ? 'bx-import' : 'bx-export'}`}></i>
                            {movement.movement_type === 'entrada' ? 'Entrada' : 'Salida'}
                          </span>
                        </td>
                        <td className="product-name">
                          <i className='bx bxs-box'></i>
                          {movement.product?.name || getProductName(movement.product)}
                        </td>
                        <td className="quantity">
                          <strong>{movement.quantity}</strong> unidades
                        </td>
                        <td className="date-cell">
                          <i className='bx bx-time-five'></i>
                          {formatDate(movement.date)}
                        </td>
                        <td className="note">{movement.note || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB: STOCK BAJO */}
      {activeTab === 'low-stock' && (
        <div className="low-stock-content">
          {lowStockProducts.length > 0 && (
            <div className="alert-card">
              <div className="alert-icon">
                <i className='bx bxs-error-circle'></i>
              </div>
              <div className="alert-text">
                <h3>Productos con Stock Bajo</h3>
                <p>Estos productos necesitan ser reabastecidos pronto</p>
              </div>
            </div>
          )}
          
          {lowStockProducts.length === 0 ? (
            <div className="empty-state">
              <i className='bx bxs-check-circle empty-icon success'></i>
              <h3>¡Todo en orden!</h3>
              <p>No hay productos con stock bajo en este momento</p>
            </div>
          ) : (
            <div className="low-stock-grid">
              {lowStockProducts.map((product) => (
                <div key={product.id} className="inventory-low-stock-card">
                  <div className="stock-status" style={{
                    backgroundColor: getStockStatusColor(product.current_stock)
                  }}>
                    <i className={`bx ${product.status === 'critical' ? 'bxs-error-circle' : 'bxs-error'}`}></i>
                  </div>
                  
                  <div className="product-details">
                    <h4>{product.name}</h4>
                    <p className="product-code">
                      <i className='bx bx-barcode'></i>
                      {product.code}
                    </p>
                    <p className="product-category">
                      <i className='bx bx-category'></i>
                      {product.category}
                    </p>
                  </div>

                  <div className="stock-info">
                    <div className="stock-badge" style={{
                      backgroundColor: getStockStatusColor(product.current_stock),
                      color: 'white'
                    }}>
                      <i className='bx bx-box'></i>
                      {product.current_stock} unidades
                    </div>
                    <span className={`stock-label ${product.status}`}>
                      <i className={`bx ${product.status === 'critical' ? 'bxs-radiation' : 'bxs-bell-ring'}`}></i>
                      {product.status === 'critical' ? 'Stock Crítico' : 'Stock Bajo'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB: ESTADÍSTICAS */}
      {activeTab === 'statistics' && (
        <div className="statistics-content">
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-icon-wrapper primary">
                <i className='bx bxs-spreadsheet'></i>
              </div>
              <div className="stat-content">
                <p className="stat-label">Total Movimientos</p>
                <p className="stat-value">{stats.totalMovements}</p>
              </div>
            </div>

            <div className="stat-card entrada">
              <div className="stat-icon-wrapper success">
                <i className='bx bxs-download'></i>
              </div>
              <div className="stat-content">
                <p className="stat-label">Total Entradas</p>
                <p className="stat-value">{stats.totalEntradas}</p>
                <small>unidades ingresadas</small>
              </div>
            </div>

            <div className="stat-card salida">
              <div className="stat-icon-wrapper danger">
                <i className='bx bxs-upload'></i>
              </div>
              <div className="stat-content">
                <p className="stat-label">Total Salidas</p>
                <p className="stat-value">{stats.totalSalidas}</p>
                <small>unidades vendidas</small>
              </div>
            </div>

            <div className="stat-card net">
              <div className="stat-icon-wrapper info">
                <i className='bx bxs-bar-chart-square'></i>
              </div>
              <div className="stat-content">
                <p className="stat-label">Cambio Neto</p>
                <p className="stat-value" style={{
                  color: stats.netChange >= 0 ? '#10b981' : '#ef4444'
                }}>
                  {stats.netChange > 0 ? '+' : ''}{stats.netChange}
                </p>
                <small>diferencia total</small>
              </div>
            </div>
          </div>

          <div className="stats-info-card">
            <h3>
              <i className='bx bxs-analyse'></i>
              Análisis de Inventario
            </h3>
            <div className="stats-details">
              <div className="stat-detail">
                <span className="detail-label">
                  <i className='bx bx-bar-chart'></i>
                  Ratio Entrada/Salida:
                </span>
                <span className="detail-value">
                  {stats.totalSalidas > 0 
                    ? (stats.totalEntradas / stats.totalSalidas).toFixed(2)
                    : 'N/A'}
                </span>
              </div>
              <div className="stat-detail">
                <span className="detail-label">
                  <i className='bx bx-stats'></i>
                  Promedio por movimiento:
                </span>
                <span className="detail-value">
                  {stats.totalMovements > 0
                    ? ((stats.totalEntradas + stats.totalSalidas) / stats.totalMovements).toFixed(0)
                    : 0}
                  {' '}unidades
                </span>
              </div>
              <div className="stat-detail">
                <span className="detail-label">
                  <i className='bx bx-error-circle'></i>
                  Productos con stock bajo:
                </span>
                <span className="detail-value warning">
                  {lowStockProducts.length}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: CREAR MOVIMIENTO */}
      {showCreateModal && (
        <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>
                <i className='bx bxs-add-to-queue'></i>
                Nuevo Movimiento de Inventario
              </h3>
              <button onClick={() => setShowCreateModal(false)} className="btn-close">
                <i className='bx bx-x'></i>
              </button>
            </div>

            <form onSubmit={handleCreateMovement}>
              <div className="modal-body">
                <div className="form-group">
                  <label>
                    <i className='bx bx-package'></i>
                    Producto *
                  </label>
                  <select
                    value={formData.product}
                    onChange={(e) => setFormData({...formData, product: e.target.value})}
                    required
                  >
                    <option value="">Selecciona un producto</option>
                    {products.map(product => (
                      <option key={product.id} value={product.id}>
                        {product.name} (Stock: {product.stock})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>
                    <i className='bx bx-transfer-alt'></i>
                    Tipo de Movimiento *
                  </label>
                  <select
                    value={formData.movement_type}
                    onChange={(e) => setFormData({...formData, movement_type: e.target.value})}
                    required
                  >
                    <option value="entrada">
                      <i className='bx bx-import'></i> Entrada (Agregar stock)
                    </option>
                    <option value="salida">
                      <i className='bx bx-export'></i> Salida (Restar stock)
                    </option>
                  </select>
                </div>

                <div className="form-group">
                  <label>
                    <i className='bx bx-hash'></i>
                    Cantidad *
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={formData.quantity}
                    onChange={(e) => setFormData({...formData, quantity: e.target.value})}
                    placeholder="Ingresa la cantidad"
                    required
                  />
                </div>

                <div className="form-group">
                  <label>
                    <i className='bx bx-note'></i>
                    Nota
                  </label>
                  <textarea
                    value={formData.note}
                    onChange={(e) => setFormData({...formData, note: e.target.value})}
                    placeholder="Agrega una nota opcional (ej: Ajuste manual, devolución, etc.)"
                    rows={3}
                  />
                </div>
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="btn-secondary"
                  disabled={loading}
                >
                  <i className='bx bx-x'></i>
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                  disabled={loading}
                >
                  <i className='bx bx-check'></i>
                  {loading ? 'Creando...' : 'Crear Movimiento'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Inventory;