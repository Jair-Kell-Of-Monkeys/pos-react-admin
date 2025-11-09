import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../../context/AuthContext';
import saleService from '../../api/saleService';
import productService from '../../api/productService';
import toast, { Toaster } from 'react-hot-toast';
import './Sales.css';

const Sales = () => {
  const { user } = useContext(AuthContext);
  
  // Estados principales
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState('create');
  const [selectedSale, setSelectedSale] = useState(null);
  
  // Filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  
  // Nueva venta
  const [cart, setCart] = useState([]);
  const [searchProduct, setSearchProduct] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [paymentMethod, setPaymentMethod] = useState('efectivo');

  useEffect(() => {
    loadSales();
  }, []);

  const loadSales = async () => {
    setLoading(true);
    try {
      const params = {};
      if (startDate) params.start_date = startDate;
      if (endDate) params.end_date = endDate;
      
      const response = await saleService.getAll(params);
      
      console.log('📦 Respuesta del servidor:', response);
      
      // Normalizar respuesta según formato de DRF con paginación
      let salesData = [];
      
      if (Array.isArray(response)) {
        salesData = response;
      } else if (response && typeof response === 'object') {
        if (response.results && Array.isArray(response.results)) {
          salesData = response.results;
          console.log(`📊 Paginación detectada: ${response.count} ventas totales`);
        } else if (response.data && Array.isArray(response.data)) {
          salesData = response.data;
        }
      }
      
      console.log('✅ Ventas procesadas:', salesData.length, 'ventas');
      setSales(salesData);
      
      if (salesData.length === 0) {
        toast.info('No hay ventas registradas');
      }
    } catch (error) {
      console.error('❌ Error al cargar ventas:', error);
      toast.error(error.error || 'Error al cargar ventas');
      setSales([]);
    } finally {
      setLoading(false);
    }
  };

  // Búsqueda de productos
  const handleSearchProduct = async (query) => {
    setSearchProduct(query);
    
    if (query.length < 2) {
      setSearchResults([]);
      return;
    }
    
    try {
      const response = await productService.quickSearch(query);
      if (response.success) {
        setSearchResults(response.products || []);
      } else {
        setSearchResults([]);
      }
    } catch (error) {
      console.error('Error en búsqueda:', error);
      setSearchResults([]);
    }
  };

  // Agregar producto al carrito
  const addToCart = (product) => {
    const existingItem = cart.find(item => item.product === product.id);
    
    if (existingItem) {
      if (existingItem.quantity >= product.stock) {
        toast.error('No hay suficiente stock');
        return;
      }
      
      setCart(cart.map(item =>
        item.product === product.id
          ? { ...item, quantity: item.quantity + 1 }
          : item
      ));
    } else {
      if (product.stock <= 0) {
        toast.error('Producto sin stock');
        return;
      }
      
      setCart([...cart, {
        product: product.id,
        quantity: 1,
        price: product.price,
        // Datos adicionales solo para mostrar (no se envían al backend)
        _display: {
          name: product.name,
          code: product.code,
          stock_available: product.stock
        }
      }]);
    }
    
    setSearchProduct('');
    setSearchResults([]);
    toast.success(`${product.name} agregado`);
  };

  // Actualizar cantidad en carrito
  const updateQuantity = (productId, newQuantity) => {
    const item = cart.find(i => i.product === productId);
    
    if (newQuantity <= 0) {
      removeFromCart(productId);
      return;
    }
    
    if (newQuantity > item._display.stock_available) {
      toast.error('Cantidad excede el stock disponible');
      return;
    }
    
    setCart(cart.map(item =>
      item.product === productId
        ? { ...item, quantity: newQuantity }
        : item
    ));
  };

  // Remover del carrito
  const removeFromCart = (productId) => {
    setCart(cart.filter(item => item.product !== productId));
    toast.info('Producto eliminado del carrito');
  };

  // Calcular total
  const calculateTotal = () => {
    return cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  };

  // Crear venta - Formato correcto para Django REST Framework
  const handleCreateSale = async () => {
    if (cart.length === 0) {
      toast.error('Agrega productos al carrito');
      return;
    }
    
    // Formato que espera el serializador de Django (SIN payment_method)
    const saleData = {
      items: cart.map(item => ({
        product: item.product,  // ID del producto
        quantity: item.quantity,
        price: item.price
      }))
      // NO se envía payment_method porque el modelo Sale no lo tiene
    };
    
    console.log('🛒 Enviando venta:', saleData);
    console.log('📝 Estructura de items:', saleData.items);
    
    try {
      const response = await saleService.create(saleData);
      
      console.log('✅ Respuesta de venta:', response);
      
      toast.success('¡Venta registrada exitosamente!');
      setCart([]);
      setPaymentMethod('efectivo');
      setShowModal(false);
      loadSales();
    } catch (error) {
      console.error('❌ Error completo al crear venta:', error);
      
      // Manejar errores específicos del backend
      if (error.validationErrors) {
        console.error('❌ Errores de validación:', error.validationErrors);
        
        const errors = error.validationErrors;
        
        if (errors.items) {
          toast.error(`Error en items: ${JSON.stringify(errors.items)}`);
        } else if (errors.detail) {
          toast.error(errors.detail);
        } else if (errors.non_field_errors) {
          toast.error(errors.non_field_errors[0]);
        } else {
          toast.error(error.error || 'Error al crear venta');
        }
      } else {
        toast.error(error.error || 'Error al crear venta');
      }
    }
  };

  // Cancelar venta
  const handleCancelSale = async (saleId) => {
    if (!window.confirm('¿Estás seguro de cancelar esta venta? El stock será devuelto al inventario.')) {
      return;
    }
    
    try {
      await saleService.cancel(saleId);
      toast.success('Venta cancelada exitosamente');
      loadSales();
      closeModal();
    } catch (error) {
      console.error('❌ Error al cancelar venta:', error);
      toast.error(error.error || 'Error al cancelar venta');
    }
  };

  // Abrir modal de detalle
  const openDetailModal = (sale) => {
    setModalType('detail');
    setSelectedSale(sale);
    setShowModal(true);
  };

  // Abrir modal de crear venta
  const openCreateModal = () => {
    setModalType('create');
    setCart([]);
    setSearchProduct('');
    setSearchResults([]);
    setPaymentMethod('efectivo');
    setShowModal(true);
  };

  // Cerrar modal
  const closeModal = () => {
    setShowModal(false);
    setSelectedSale(null);
    setCart([]);
    setSearchProduct('');
    setSearchResults([]);
  };

  // Filtrar ventas
  const filteredSales = Array.isArray(sales) ? sales.filter(sale => {
    // Filtrar ventas canceladas
    if (sale.is_cancelled) return false;
    
    const matchSearch = 
      sale.id.toString().includes(searchTerm) ||
      sale.user?.username?.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchSearch;
  }) : [];

  // Formatear moneda
  const formatCurrency = (value) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
    }).format(value || 0);
  };

  // Formatear fecha
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('es-MX', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Cargando ventas...</p>
      </div>
    );
  }

  return (
    <div className="sales-container">
      <Toaster position="top-right" />

      {/* Header */}
      <div className="sales-header">
        <div>
          <h1>Gestión de Ventas</h1>
          <p className="subtitle">Registra y consulta todas las ventas</p>
        </div>
        <button onClick={openCreateModal} className="btn-primary">
          ➕ Nueva Venta
        </button>
      </div>

      {/* Filtros */}
      <div className="filters-section">
        <div className="search-box">
          <span className="search-icon">🔍</span>
          <input
            type="text"
            placeholder="Buscar por ID o usuario..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>

        <input
          type="date"
          value={startDate}
          onChange={(e) => {
            setStartDate(e.target.value);
            setTimeout(() => loadSales(), 300);
          }}
          className="date-input"
          placeholder="Fecha inicio"
        />

        <input
          type="date"
          value={endDate}
          onChange={(e) => {
            setEndDate(e.target.value);
            setTimeout(() => loadSales(), 300);
          }}
          className="date-input"
          placeholder="Fecha fin"
        />

        <button onClick={loadSales} className="btn-refresh">
          🔄 Actualizar
        </button>
      </div>

      {/* Estadísticas */}
      <div className="stats-cards">
        <div className="stat-card">
          <span className="stat-icon">🛒</span>
          <div>
            <div className="stat-value">{filteredSales.length}</div>
            <div className="stat-label">Total Ventas</div>
          </div>
        </div>
        <div className="stat-card">
          <span className="stat-icon">💰</span>
          <div>
            <div className="stat-value">
              {formatCurrency(filteredSales.reduce((sum, s) => sum + parseFloat(s.total_price || 0), 0))}
            </div>
            <div className="stat-label">Total Vendido</div>
          </div>
        </div>
        <div className="stat-card">
          <span className="stat-icon">📊</span>
          <div>
            <div className="stat-value">
              {filteredSales.length > 0 
                ? formatCurrency(filteredSales.reduce((sum, s) => sum + parseFloat(s.total_price || 0), 0) / filteredSales.length)
                : '$0.00'}
            </div>
            <div className="stat-label">Promedio por Venta</div>
          </div>
        </div>
        <div className="stat-card">
          <span className="stat-icon">📦</span>
          <div>
            <div className="stat-value">
              {filteredSales.reduce((sum, s) => sum + (s.items?.length || 0), 0)}
            </div>
            <div className="stat-label">Productos Vendidos</div>
          </div>
        </div>
      </div>

      {/* Tabla de ventas */}
      <div className="sales-table-container">
        {filteredSales.length === 0 ? (
          <div className="empty-state">
            <span className="empty-icon">🛒</span>
            <p>No hay ventas registradas</p>
            <button onClick={openCreateModal} className="btn-primary">
              Crear primera venta
            </button>
          </div>
        ) : (
          <table className="sales-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Fecha</th>
                <th>Usuario</th>
                <th>Productos</th>
                <th>Total</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filteredSales.map(sale => {
                // Extraer el username correctamente según el formato del backend
                // El backend devuelve "user_name", no "user.username"
                const username = sale.user_name || sale.user?.username || 'N/A';
                
                return (
                  <tr key={sale.id}>
                    <td className="id-cell">#{sale.id}</td>
                    <td>{formatDate(sale.date)}</td>
                    <td className="user-cell">{username}</td>
                    <td>{sale.items?.length || 0} items</td>
                    <td className="total-cell">{formatCurrency(sale.total_price)}</td>
                    <td className="actions-cell">
                      <button
                        onClick={() => openDetailModal(sale)}
                        className="btn-icon"
                        title="Ver detalle"
                      >
                        👁️
                      </button>
                      {!sale.is_cancelled && (
                        <button
                          onClick={() => handleCancelSale(sale.id)}
                          className="btn-icon danger"
                          title="Cancelar venta"
                        >
                          ❌
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content large" onClick={(e) => e.stopPropagation()}>
            {/* Crear Nueva Venta */}
            {modalType === 'create' && (
              <>
                <div className="modal-header">
                  <h2>🛒 Nueva Venta</h2>
                  <button onClick={closeModal} className="btn-close">✕</button>
                </div>
                
                <div className="modal-body sale-create">
                  {/* Búsqueda de productos */}
                  <div className="product-search-section">
                    <h3>Buscar Productos</h3>
                    <div className="search-box-modal">
                      <input
                        type="text"
                        placeholder="Buscar por nombre o código..."
                        value={searchProduct}
                        onChange={(e) => handleSearchProduct(e.target.value)}
                        className="search-input"
                        autoFocus
                      />
                      {searchResults.length > 0 && (
                        <div className="search-results">
                          {searchResults.map(product => (
                            <div
                              key={product.id}
                              className="search-result-item"
                              onClick={() => addToCart(product)}
                            >
                              <div>
                                <strong>{product.name}</strong>
                                <span className="product-code-small">{product.code}</span>
                              </div>
                              <div className="result-info">
                                <span className="price">{formatCurrency(product.price)}</span>
                                <span className="stock">Stock: {product.stock}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Carrito */}
                  <div className="cart-section">
                    <h3>Carrito ({cart.length} productos)</h3>
                    
                    {cart.length === 0 ? (
                      <div className="cart-empty">
                        <p>🛒 Carrito vacío</p>
                        <small>Busca y agrega productos arriba</small>
                      </div>
                    ) : (
                      <>
                        <div className="cart-items">
                          {cart.map(item => (
                            <div key={item.product} className="cart-item">
                              <div className="item-info">
                                <strong>{item._display.name}</strong>
                                <span className="item-code">{item._display.code}</span>
                                <span className="item-price">{formatCurrency(item.price)}</span>
                              </div>
                              
                              <div className="item-controls">
                                <button
                                  onClick={() => updateQuantity(item.product, item.quantity - 1)}
                                  className="qty-btn"
                                >
                                  −
                                </button>
                                <input
                                  type="number"
                                  value={item.quantity}
                                  onChange={(e) => updateQuantity(item.product, parseInt(e.target.value) || 0)}
                                  className="qty-input"
                                  min="1"
                                  max={item._display.stock_available}
                                />
                                <button
                                  onClick={() => updateQuantity(item.product, item.quantity + 1)}
                                  className="qty-btn"
                                >
                                  +
                                </button>
                                <button
                                  onClick={() => removeFromCart(item.product)}
                                  className="remove-btn"
                                  title="Eliminar"
                                >
                                  🗑️
                                </button>
                              </div>
                              
                              <div className="item-subtotal">
                                {formatCurrency(item.price * item.quantity)}
                              </div>
                            </div>
                          ))}
                        </div>

                        <div className="cart-total">
                          <strong>TOTAL:</strong>
                          <span className="total-amount">{formatCurrency(calculateTotal())}</span>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                <div className="modal-footer">
                  <button onClick={closeModal} className="btn-secondary">
                    Cancelar
                  </button>
                  <button
                    onClick={handleCreateSale}
                    className="btn-primary"
                    disabled={cart.length === 0}
                  >
                    💰 Registrar Venta ({formatCurrency(calculateTotal())})
                  </button>
                </div>
              </>
            )}

            {/* Detalle de Venta */}
            {modalType === 'detail' && selectedSale && (
              <>
                <div className="modal-header">
                  <h2>📄 Detalle de Venta #{selectedSale.id}</h2>
                  <button onClick={closeModal} className="btn-close">✕</button>
                </div>
                
                <div className="modal-body sale-detail">
                  <div className="detail-section">
                    <h3>Información General</h3>
                    <div className="detail-grid">
                      <div className="detail-item">
                        <span className="detail-label">ID:</span>
                        <span className="detail-value">#{selectedSale.id}</span>
                      </div>
                      <div className="detail-item">
                        <span className="detail-label">Fecha:</span>
                        <span className="detail-value">{formatDate(selectedSale.date)}</span>
                      </div>
                      <div className="detail-item">
                        <span className="detail-label">Usuario:</span>
                        <span className="detail-value">
                          {selectedSale.user_name || 
                          selectedSale.user?.username || 
                          selectedSale.username || 
                          'N/A'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="detail-section products-section">
                    <h3>Productos Vendidos</h3>
                    <div className="items-list">
                      {selectedSale.items && selectedSale.items.length > 0 ? (
                        selectedSale.items.map((item, index) => {
                          // ✅ Calcular precio unitario correcto
                          const unitPrice = parseFloat(item.price) || 
                                          (parseFloat(item.subtotal) / item.quantity) || 
                                          0;
                          const subtotal = parseFloat(item.subtotal) || 
                                          (unitPrice * item.quantity) || 
                                          0;
                          
                          return (
                            <div key={index} className="item-card">
                              <div className="item-main">
                                <div className="item-header">
                                  <span className="item-name">
                                    {item.product_name || 
                                    item.product?.name || 
                                    item.name || 
                                    `Producto #${item.product || 'N/A'}`}
                                  </span>
                                  <span className="item-qty-badge">× {item.quantity}</span>
                                </div>
                                
                                <div className="item-pricing">
                                  <div className="pricing-detail">
                                    <span className="pricing-label">Precio unitario:</span>
                                    <span className="pricing-value">{formatCurrency(unitPrice)}</span>
                                  </div>
                                  <div className="pricing-detail subtotal">
                                    <span className="pricing-label">Subtotal:</span>
                                    <span className="pricing-value-main">{formatCurrency(subtotal)}</span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })
                      ) : (
                        <div className="no-items">
                          <p>⚠️ No hay productos registrados en esta venta</p>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="detail-total-section">
                    <div className="total-box">
                      <span className="total-label">TOTAL:</span>
                      <span className="total-value">{formatCurrency(selectedSale.total_price)}</span>
                    </div>
                  </div>
                </div>

                <div className="modal-footer">
                  <button onClick={closeModal} className="btn-secondary">
                    Cerrar
                  </button>
                  {!selectedSale.is_cancelled && (
                    <button
                      onClick={() => handleCancelSale(selectedSale.id)}
                      className="btn-danger"
                    >
                      ❌ Cancelar Venta
                    </button>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Sales;