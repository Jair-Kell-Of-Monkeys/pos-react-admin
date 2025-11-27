import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../../context/AuthContext';
import saleService from '../../api/saleService';
import productService from '../../api/productService';
import toast, { Toaster } from 'react-hot-toast';
import './Sales.css';

const Sales = () => {
  const { user } = useContext(AuthContext);
  
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState('create');
  const [selectedSale, setSelectedSale] = useState(null);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  
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
      
      let salesData = [];
      
      if (Array.isArray(response)) {
        salesData = response;
      } else if (response && typeof response === 'object') {
        if (response.results && Array.isArray(response.results)) {
          salesData = response.results;
        } else if (response.data && Array.isArray(response.data)) {
          salesData = response.data;
        }
      }
      
      setSales(salesData);
      
      if (salesData.length === 0) {
        toast.info('No hay ventas registradas');
      }
    } catch (error) {
      console.error('Error al cargar ventas:', error);
      toast.error(error.error || 'Error al cargar ventas');
      setSales([]);
    } finally {
      setLoading(false);
    }
  };

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

  const removeFromCart = (productId) => {
    setCart(cart.filter(item => item.product !== productId));
    toast.success('Producto eliminado del carrito');
  };

  const calculateTotal = () => {
    return cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  };

  const handleCreateSale = async () => {
    if (cart.length === 0) {
      toast.error('Agrega productos al carrito');
      return;
    }
    
    const saleData = {
      items: cart.map(item => ({
        product: item.product,
        quantity: item.quantity,
        price: item.price
      }))
    };
    
    try {
      const response = await saleService.create(saleData);
      toast.success('¡Venta registrada exitosamente!');
      setCart([]);
      setPaymentMethod('efectivo');
      setShowModal(false);
      loadSales();
    } catch (error) {
      console.error('Error al crear venta:', error);
      
      if (error.validationErrors) {
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
      console.error('Error al cancelar venta:', error);
      toast.error(error.error || 'Error al cancelar venta');
    }
  };

  const openDetailModal = (sale) => {
    setModalType('detail');
    setSelectedSale(sale);
    setShowModal(true);
  };

  const openCreateModal = () => {
    setModalType('create');
    setCart([]);
    setSearchProduct('');
    setSearchResults([]);
    setPaymentMethod('efectivo');
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedSale(null);
    setCart([]);
    setSearchProduct('');
    setSearchResults([]);
  };

  const filteredSales = Array.isArray(sales) ? sales.filter(sale => {
    if (sale.is_cancelled) return false;
    
    const matchSearch = 
      sale.id.toString().includes(searchTerm) ||
      sale.user?.username?.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchSearch;
  }) : [];

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
    }).format(value || 0);
  };

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
        <div className="header-content">
          <h1 className="header-title">
            <i className='bx bxs-shopping-bag'></i>
            Gestión de Ventas
          </h1>
          <p className="subtitle">Registra y consulta todas las ventas</p>
        </div>
        <button onClick={openCreateModal} className="btn-primary">
          <i className='bx bx-plus'></i>
          <span>Nueva Venta</span>
        </button>
      </div>

      {/* Filtros */}
      <div className="filters-section">
        <div className="search-box">
          <i className='bx bx-search search-icon'></i>
          <input
            type="text"
            placeholder="Buscar por ID o usuario..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>

        <div className="date-input-wrapper">
          <i className='bx bx-calendar date-icon'></i>
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
        </div>

        <div className="date-input-wrapper">
          <i className='bx bx-calendar date-icon'></i>
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
        </div>

        <button onClick={loadSales} className="sales-refresh-btn">
          <i className='bx bx-refresh'></i>
          <span>Actualizar</span>
        </button>
      </div>

      {/* Estadísticas */}
      <div className="stats-cards">
        <div className="stat-card">
          <div className="stat-icon-wrapper primary">
            <i className='bx bxs-cart'></i>
          </div>
          <div className="stat-content">
            <div className="stat-value">{filteredSales.length}</div>
            <div className="stat-label">Total Ventas</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon-wrapper success">
            <i className='bx bxs-dollar-circle'></i>
          </div>
          <div className="stat-content">
            <div className="stat-value">
              {formatCurrency(filteredSales.reduce((sum, s) => sum + parseFloat(s.total_price || 0), 0))}
            </div>
            <div className="stat-label">Total Vendido</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon-wrapper info">
            <i className='bx bxs-bar-chart-alt-2'></i>
          </div>
          <div className="stat-content">
            <div className="stat-value">
              {filteredSales.length > 0 
                ? formatCurrency(filteredSales.reduce((sum, s) => sum + parseFloat(s.total_price || 0), 0) / filteredSales.length)
                : '$0.00'}
            </div>
            <div className="stat-label">Promedio por Venta</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon-wrapper warning">
            <i className='bx bxs-package'></i>
          </div>
          <div className="stat-content">
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
            <i className='bx bx-cart empty-icon'></i>
            <p>No hay ventas registradas</p>
            <small>Crea tu primera venta para comenzar</small>
            <button onClick={openCreateModal} className="btn-primary">
              <i className='bx bx-plus'></i>
              Crear primera venta
            </button>
          </div>
        ) : (
          <div className="table-wrapper">
            <table className="sales-table">
              <thead>
                <tr>
                  <th><i className='bx bx-hash'></i> ID</th>
                  <th><i className='bx bx-calendar'></i> Fecha</th>
                  <th><i className='bx bx-user'></i> Usuario</th>
                  <th><i className='bx bx-package'></i> Productos</th>
                  <th><i className='bx bx-dollar'></i> Total</th>
                  <th><i className='bx bx-cog'></i> Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filteredSales.map(sale => {
                  const username = sale.user_name || sale.user?.username || 'N/A';
                  
                  return (
                    <tr key={sale.id}>
                      <td className="id-cell">
                        <span className="id-badge">#{sale.id}</span>
                      </td>
                      <td className="date-cell">
                        <i className='bx bx-time-five'></i>
                        {formatDate(sale.date)}
                      </td>
                      <td className="user-cell">
                        <span className="user-badge">
                          <i className='bx bx-user-circle'></i>
                          {username}
                        </span>
                      </td>
                      <td className="items-cell">
                        <span className="items-badge">
                          <i className='bx bx-package'></i>
                          {sale.items?.length || 0} items
                        </span>
                      </td>
                      <td className="total-cell">{formatCurrency(sale.total_price)}</td>
                      <td className="actions-cell">
                        <button
                          onClick={() => openDetailModal(sale)}
                          className="btn-icon primary"
                          title="Ver detalle"
                        >
                          <i className='bx bx-show'></i>
                        </button>
                        {!sale.is_cancelled && (
                          <button
                            onClick={() => handleCancelSale(sale.id)}
                            className="btn-icon danger"
                            title="Cancelar venta"
                          >
                            <i className='bx bx-x-circle'></i>
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
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
                  <h2>
                    <i className='bx bxs-cart-add'></i>
                    Nueva Venta
                  </h2>
                  <button onClick={closeModal} className="btn-close">
                    <i className='bx bx-x'></i>
                  </button>
                </div>
                
                <div className="modal-body sale-create">
                  {/* Búsqueda de productos */}
                  <div className="product-search-section">
                    <h3>
                      <i className='bx bx-search-alt'></i>
                      Buscar Productos
                    </h3>
                    <div className="search-box-modal">
                      <i className='bx bx-search search-icon-modal'></i>
                      <input
                        type="text"
                        placeholder="Buscar por nombre o código..."
                        value={searchProduct}
                        onChange={(e) => handleSearchProduct(e.target.value)}
                        className="search-input-modal"
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
                              <div className="result-left">
                                <i className='bx bxs-package result-icon'></i>
                                <div>
                                  <strong>{product.name}</strong>
                                  <span className="product-code-small">
                                    <i className='bx bx-barcode'></i>
                                    {product.code}
                                  </span>
                                </div>
                              </div>
                              <div className="result-info">
                                <span className="price">
                                  <i className='bx bx-dollar'></i>
                                  {formatCurrency(product.price)}
                                </span>
                                <span className="stock">
                                  <i className='bx bx-box'></i>
                                  Stock: {product.stock}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Carrito */}
                  <div className="cart-section">
                    <h3>
                      <i className='bx bxs-cart'></i>
                      Carrito ({cart.length} productos)
                    </h3>
                    
                    {cart.length === 0 ? (
                      <div className="cart-empty">
                        <i className='bx bx-cart empty-cart-icon'></i>
                        <p>Carrito vacío</p>
                        <small>Busca y agrega productos arriba</small>
                      </div>
                    ) : (
                      <>
                        <div className="cart-items">
                          {cart.map(item => (
                            <div key={item.product} className="cart-item">
                              <div className="item-info">
                                <strong>{item._display.name}</strong>
                                <span className="item-code">
                                  <i className='bx bx-barcode'></i>
                                  {item._display.code}
                                </span>
                                <span className="item-price">
                                  <i className='bx bx-dollar'></i>
                                  {formatCurrency(item.price)}
                                </span>
                              </div>
                              
                              <div className="item-controls">
                                <button
                                  onClick={() => updateQuantity(item.product, item.quantity - 1)}
                                  className="qty-btn minus"
                                >
                                  <i className='bx bx-minus'></i>
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
                                  className="qty-btn plus"
                                >
                                  <i className='bx bx-plus'></i>
                                </button>
                                <button
                                  onClick={() => removeFromCart(item.product)}
                                  className="remove-btn"
                                  title="Eliminar"
                                >
                                  <i className='bx bx-trash'></i>
                                </button>
                              </div>
                              
                              <div className="item-subtotal">
                                {formatCurrency(item.price * item.quantity)}
                              </div>
                            </div>
                          ))}
                        </div>

                        <div className="cart-total">
                          <div className="cart-total-content">
                            <i className='bx bxs-dollar-circle'></i>
                            <strong>TOTAL:</strong>
                          </div>
                          <span className="total-amount">{formatCurrency(calculateTotal())}</span>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                <div className="modal-footer">
                  <button onClick={closeModal} className="btn-secondary">
                    <i className='bx bx-x'></i>
                    Cancelar
                  </button>
                  <button
                    onClick={handleCreateSale}
                    className="btn-primary"
                    disabled={cart.length === 0}
                  >
                    <i className='bx bx-check-circle'></i>
                    Registrar Venta ({formatCurrency(calculateTotal())})
                  </button>
                </div>
              </>
            )}

            {/* Detalle de Venta */}
            {modalType === 'detail' && selectedSale && (
              <>
                <div className="modal-header">
                  <h2>
                    <i className='bx bxs-receipt'></i>
                    Detalle de Venta #{selectedSale.id}
                  </h2>
                  <button onClick={closeModal} className="btn-close">
                    <i className='bx bx-x'></i>
                  </button>
                </div>
                
                <div className="modal-body sale-detail">
                  <div className="detail-section">
                    <h3>
                      <i className='bx bxs-info-circle'></i>
                      Información General
                    </h3>
                    <div className="detail-grid">
                      <div className="detail-item">
                        <span className="detail-label">
                          <i className='bx bx-hash'></i>
                          ID:
                        </span>
                        <span className="detail-value">#{selectedSale.id}</span>
                      </div>
                      <div className="detail-item">
                        <span className="detail-label">
                          <i className='bx bx-calendar'></i>
                          Fecha:
                        </span>
                        <span className="detail-value">{formatDate(selectedSale.date)}</span>
                      </div>
                      <div className="detail-item">
                        <span className="detail-label">
                          <i className='bx bx-user'></i>
                          Usuario:
                        </span>
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
                    <h3>
                      <i className='bx bxs-package'></i>
                      Productos Vendidos
                    </h3>
                    <div className="items-list">
                      {selectedSale.items && selectedSale.items.length > 0 ? (
                        selectedSale.items.map((item, index) => {
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
                                    <i className='bx bxs-box'></i>
                                    {item.product_name || 
                                    item.product?.name || 
                                    item.name || 
                                    `Producto #${item.product || 'N/A'}`}
                                  </span>
                                  <span className="item-qty-badge">
                                    <i className='bx bx-x'></i>
                                    {item.quantity}
                                  </span>
                                </div>
                                
                                <div className="item-pricing">
                                  <div className="pricing-detail">
                                    <span className="pricing-label">
                                      <i className='bx bx-purchase-tag'></i>
                                      Precio unitario:
                                    </span>
                                    <span className="pricing-value">{formatCurrency(unitPrice)}</span>
                                  </div>
                                  <div className="pricing-detail subtotal">
                                    <span className="pricing-label">
                                      <i className='bx bx-dollar-circle'></i>
                                      Subtotal:
                                    </span>
                                    <span className="pricing-value-main">{formatCurrency(subtotal)}</span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })
                      ) : (
                        <div className="no-items">
                          <i className='bx bx-error-circle'></i>
                          <p>No hay productos registrados en esta venta</p>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="detail-total-section">
                    <div className="total-box">
                      <div className="total-box-content">
                        <i className='bx bxs-wallet'></i>
                        <span className="total-label">TOTAL:</span>
                      </div>
                      <span className="total-value">{formatCurrency(selectedSale.total_price)}</span>
                    </div>
                  </div>
                </div>

                <div className="modal-footer">
                  <button onClick={closeModal} className="btn-secondary">
                    <i className='bx bx-x'></i>
                    Cerrar
                  </button>
                  {!selectedSale.is_cancelled && (
                    <button
                      onClick={() => handleCancelSale(selectedSale.id)}
                      className="btn-danger"
                    >
                      <i className='bx bx-x-circle'></i>
                      Cancelar Venta
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