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
  const [modalType, setModalType] = useState('create'); // 'create', 'detail'
  const [selectedSale, setSelectedSale] = useState(null);
  
  // Filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [paymentFilter, setPaymentFilter] = useState('all');
  
  // Nueva venta
  const [cart, setCart] = useState([]);
  const [searchProduct, setSearchProduct] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [paymentMethod, setPaymentMethod] = useState('efectivo');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    loadSales();
  }, []);

  const loadSales = async () => {
    setLoading(true);
    try {
      const params = {};
      if (startDate) params.start_date = startDate;
      if (endDate) params.end_date = endDate;
      
      const data = await saleService.getAll(params);
      setSales(data);
    } catch (error) {
      toast.error(error.error || 'Error al cargar ventas');
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
        setSearchResults(response.products);
      }
    } catch (error) {
      console.error('Error en búsqueda:', error);
    }
  };

  // Agregar producto al carrito
  const addToCart = (product) => {
    const existingItem = cart.find(item => item.product_id === product.id);
    
    if (existingItem) {
      // Incrementar cantidad
      if (existingItem.quantity >= product.stock) {
        toast.error('No hay suficiente stock');
        return;
      }
      
      setCart(cart.map(item =>
        item.product_id === product.id
          ? { ...item, quantity: item.quantity + 1 }
          : item
      ));
    } else {
      // Agregar nuevo producto
      if (product.stock <= 0) {
        toast.error('Producto sin stock');
        return;
      }
      
      setCart([...cart, {
        product_id: product.id,
        name: product.name,
        code: product.code,
        price: product.price,
        quantity: 1,
        stock_available: product.stock
      }]);
    }
    
    // Limpiar búsqueda
    setSearchProduct('');
    setSearchResults([]);
    toast.success(`${product.name} agregado al carrito`);
  };

  // Actualizar cantidad en carrito
  const updateQuantity = (productId, newQuantity) => {
    const item = cart.find(i => i.product_id === productId);
    
    if (newQuantity <= 0) {
      removeFromCart(productId);
      return;
    }
    
    if (newQuantity > item.stock_available) {
      toast.error('Cantidad excede el stock disponible');
      return;
    }
    
    setCart(cart.map(item =>
      item.product_id === productId
        ? { ...item, quantity: newQuantity }
        : item
    ));
  };

  // Remover del carrito
  const removeFromCart = (productId) => {
    setCart(cart.filter(item => item.product_id !== productId));
  };

  // Calcular total
  const calculateTotal = () => {
    return cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  };

  // Crear venta
  const handleCreateSale = async () => {
    if (cart.length === 0) {
      toast.error('Agrega productos al carrito');
      return;
    }
    
    const saleData = {
      items: cart.map(item => ({
        product_id: item.product_id,
        quantity: item.quantity
      })),
      payment_method: paymentMethod,
      notes: notes
    };
    
    try {
      const response = await saleService.createFromScan(saleData);
      
      if (response.success) {
        toast.success('Venta registrada exitosamente');
        setCart([]);
        setPaymentMethod('efectivo');
        setNotes('');
        setShowModal(false);
        loadSales();
      }
    } catch (error) {
      toast.error(error.error || 'Error al crear venta');
      
      // Mostrar errores de validación
      if (error.errors && Array.isArray(error.errors)) {
        error.errors.forEach(err => {
          toast.error(err.error || 'Error en producto');
        });
      }
    }
  };

  // Cancelar venta
  const handleCancelSale = async (saleId) => {
    if (!window.confirm('¿Estás seguro de cancelar esta venta? El stock será devuelto.')) {
      return;
    }
    
    try {
      await saleService.cancel(saleId);
      toast.success('Venta cancelada exitosamente');
      loadSales();
    } catch (error) {
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
    setNotes('');
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
  const filteredSales = sales.filter(sale => {
    const matchSearch = 
      sale.id.toString().includes(searchTerm) ||
      sale.user?.username?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchPayment = paymentFilter === 'all' || sale.payment_method === paymentFilter;
    
    return matchSearch && matchPayment && !sale.is_cancelled;
  });

  // Formatear moneda
  const formatCurrency = (value) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
    }).format(value);
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
          onChange={(e) => setStartDate(e.target.value)}
          className="date-input"
        />

        <input
          type="date"
          value={endDate}
          onChange={(e) => setEndDate(e.target.value)}
          className="date-input"
        />

        <select
          value={paymentFilter}
          onChange={(e) => setPaymentFilter(e.target.value)}
          className="filter-select"
        >
          <option value="all">Todos los métodos</option>
          <option value="efectivo">Efectivo</option>
          <option value="tarjeta">Tarjeta</option>
          <option value="transferencia">Transferencia</option>
        </select>

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
              {formatCurrency(filteredSales.reduce((sum, s) => sum + parseFloat(s.total_price), 0))}
            </div>
            <div className="stat-label">Total Vendido</div>
          </div>
        </div>
        <div className="stat-card">
          <span className="stat-icon">📊</span>
          <div>
            <div className="stat-value">
              {filteredSales.length > 0 
                ? formatCurrency(filteredSales.reduce((sum, s) => sum + parseFloat(s.total_price), 0) / filteredSales.length)
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
                <th>Método Pago</th>
                <th>Total</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filteredSales.map(sale => (
                <tr key={sale.id}>
                  <td className="id-cell">#{sale.id}</td>
                  <td>{formatDate(sale.date)}</td>
                  <td>{sale.user?.username || 'N/A'}</td>
                  <td>{sale.items?.length || 0} items</td>
                  <td>
                    <span className={`payment-badge ${sale.payment_method}`}>
                      {sale.payment_method === 'efectivo' && '💵'}
                      {sale.payment_method === 'tarjeta' && '💳'}
                      {sale.payment_method === 'transferencia' && '🏦'}
                      {' '}
                      {sale.payment_method}
                    </span>
                  </td>
                  <td className="total-cell">{formatCurrency(sale.total_price)}</td>
                  <td className="actions-cell">
                    <button
                      onClick={() => openDetailModal(sale)}
                      className="btn-icon"
                      title="Ver detalle"
                    >
                      👁️
                    </button>
                    <button
                      onClick={() => handleCancelSale(sale.id)}
                      className="btn-icon danger"
                      title="Cancelar venta"
                    >
                      ❌
                    </button>
                  </td>
                </tr>
              ))}
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
                            <div key={item.product_id} className="cart-item">
                              <div className="item-info">
                                <strong>{item.name}</strong>
                                <span className="item-code">{item.code}</span>
                                <span className="item-price">{formatCurrency(item.price)}</span>
                              </div>
                              
                              <div className="item-controls">
                                <button
                                  onClick={() => updateQuantity(item.product_id, item.quantity - 1)}
                                  className="qty-btn"
                                >
                                  −
                                </button>
                                <input
                                  type="number"
                                  value={item.quantity}
                                  onChange={(e) => updateQuantity(item.product_id, parseInt(e.target.value) || 0)}
                                  className="qty-input"
                                  min="1"
                                  max={item.stock_available}
                                />
                                <button
                                  onClick={() => updateQuantity(item.product_id, item.quantity + 1)}
                                  className="qty-btn"
                                >
                                  +
                                </button>
                                <button
                                  onClick={() => removeFromCart(item.product_id)}
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

                        {/* Método de pago */}
                        <div className="payment-section">
                          <label>Método de Pago:</label>
                          <div className="payment-methods">
                            <button
                              className={`payment-btn ${paymentMethod === 'efectivo' ? 'active' : ''}`}
                              onClick={() => setPaymentMethod('efectivo')}
                            >
                              💵 Efectivo
                            </button>
                            <button
                              className={`payment-btn ${paymentMethod === 'tarjeta' ? 'active' : ''}`}
                              onClick={() => setPaymentMethod('tarjeta')}
                            >
                              💳 Tarjeta
                            </button>
                            <button
                              className={`payment-btn ${paymentMethod === 'transferencia' ? 'active' : ''}`}
                              onClick={() => setPaymentMethod('transferencia')}
                            >
                              🏦 Transferencia
                            </button>
                          </div>
                        </div>

                        {/* Notas */}
                        <div className="notes-section">
                          <label>Notas (opcional):</label>
                          <textarea
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            placeholder="Ej: Cliente frecuente, descuento aplicado..."
                            rows="2"
                          />
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
                    Registrar Venta
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
                    <div className="detail-row">
                      <strong>ID:</strong>
                      <span>#{selectedSale.id}</span>
                    </div>
                    <div className="detail-row">
                      <strong>Fecha:</strong>
                      <span>{formatDate(selectedSale.date)}</span>
                    </div>
                    <div className="detail-row">
                      <strong>Usuario:</strong>
                      <span>{selectedSale.user?.username}</span>
                    </div>
                    <div className="detail-row">
                      <strong>Método de Pago:</strong>
                      <span className={`payment-badge ${selectedSale.payment_method}`}>
                        {selectedSale.payment_method}
                      </span>
                    </div>
                  </div>

                  <div className="detail-section">
                    <h3>Productos Vendidos</h3>
                    <div className="items-list">
                      {selectedSale.items && selectedSale.items.length > 0 ? (
                        selectedSale.items.map((item, index) => (
                          <div key={index} className="item-detail">
                            <div>
                              <strong>{item.product?.name || 'Producto'}</strong>
                              <span className="item-quantity">x{item.quantity}</span>
                            </div>
                            <div className="item-prices">
                              <span>{formatCurrency(item.price)} c/u</span>
                              <strong>{formatCurrency(item.subtotal)}</strong>
                            </div>
                          </div>
                        ))
                      ) : (
                        <p>No hay productos</p>
                      )}
                    </div>
                  </div>

                  <div className="detail-total">
                    <strong>TOTAL:</strong>
                    <span className="total-amount">{formatCurrency(selectedSale.total_price)}</span>
                  </div>
                </div>

                <div className="modal-footer">
                  <button onClick={closeModal} className="btn-secondary">
                    Cerrar
                  </button>
                  <button
                    onClick={() => handleCancelSale(selectedSale.id)}
                    className="btn-danger"
                  >
                    Cancelar Venta
                  </button>
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