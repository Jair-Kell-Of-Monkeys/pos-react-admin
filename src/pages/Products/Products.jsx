import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../../context/AuthContext';
import productService from '../../api/productService';
import toast, { Toaster } from 'react-hot-toast';
import './Products.css';

const Products = () => {
  const { user } = useContext(AuthContext);
  
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState('create');
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [stockFilter, setStockFilter] = useState('all');
  const [qrCodeUrl, setQrCodeUrl] = useState(null);
  const [barcodeUrl, setBarcodeUrl] = useState(null);
  const [loadingCodes, setLoadingCodes] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    price: '',
    stock: ''
  });
  
  const [stockAdjustment, setStockAdjustment] = useState({
    adjustment: 0,
    reason: ''
  });

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      setLoading(true);
      const response = await productService.getAll();
      const data = Array.isArray(response) ? response : (response.data || response.results || []);
      console.log('Productos cargados:', data);
      setProducts(data);
    } catch (error) {
      console.error('Error al cargar productos:', error);
      toast.error('Error al cargar productos');
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  const getAuthToken = () => {
    const tokenFromLocalStorage = localStorage.getItem('token');
    const tokenFromSessionStorage = sessionStorage.getItem('token');
    const accessToken = localStorage.getItem('access_token') || localStorage.getItem('accessToken');
    
    if (user?.token) {
      return user.token;
    }
    
    return tokenFromLocalStorage || tokenFromSessionStorage || accessToken;
  };

  const loadProductCodes = async (productId) => {
    setLoadingCodes(true);
    setQrCodeUrl(null);
    setBarcodeUrl(null);
    
    const token = getAuthToken();
    const baseUrl = process.env.REACT_APP_API_URL;
    
    console.log('🔍 Cargando códigos para producto:', productId);
    
    if (!token) {
      toast.error('No hay sesión activa. Por favor, inicia sesión nuevamente.');
      setLoadingCodes(false);
      return;
    }
    
    // Cargar QR Code
    try {
      const qrResponse = await fetch(
        `${baseUrl}/products/${productId}/qrcode/`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'ngrok-skip-browser-warning': '69420'
          }
        }
      );
      
      if (qrResponse.ok) {
        const qrBlob = await qrResponse.blob();
        const reader = new FileReader();
        reader.onloadend = () => {
          setQrCodeUrl(reader.result);
          toast.success('Código QR cargado');
        };
        reader.onerror = () => {
          toast.error('Error al procesar el código QR');
        };
        reader.readAsDataURL(qrBlob);
      } else {
        if (qrResponse.status === 401) {
          toast.error('Sesión expirada');
        } else {
          toast.error('No se pudo cargar el código QR');
        }
      }
    } catch (error) {
      console.error('Error cargando QR:', error);
      toast.error('Error de conexión al cargar el código QR');
    }
    
    // Cargar Barcode
    try {
      const barcodeResponse = await fetch(
        `${baseUrl}/products/${productId}/barcode/`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'ngrok-skip-browser-warning': '69420'
          }
        }
      );
      
      if (barcodeResponse.ok) {
        const barcodeBlob = await barcodeResponse.blob();
        const reader = new FileReader();
        reader.onloadend = () => {
          setBarcodeUrl(reader.result);
          toast.success('Código de barras cargado');
        };
        reader.onerror = () => {
          toast.error('Error al procesar el código de barras');
        };
        reader.readAsDataURL(barcodeBlob);
      } else {
        if (barcodeResponse.status === 401) {
          toast.error('Sesión expirada');
        } else {
          toast.error('No se pudo cargar el código de barras');
        }
      }
    } catch (error) {
      console.error('Error cargando código de barras:', error);
      toast.error('Error de conexión al cargar el código de barras');
    }
    
    setLoadingCodes(false);
  };

  const filteredProducts = Array.isArray(products) ? products.filter(product => {
    const matchSearch = product.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                       product.code?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchCategory = categoryFilter === 'all' || product.category === categoryFilter;
    const matchStock = stockFilter === 'all' || 
                      (stockFilter === 'low' && product.stock <= 10) ||
                      (stockFilter === 'out' && product.stock === 0);
    return matchSearch && matchCategory && matchStock;
  }) : [];

  const categories = Array.isArray(products) 
    ? [...new Set(products.map(p => p.category).filter(Boolean))]
    : [];

  const openCreateModal = () => {
    setModalType('create');
    setFormData({ name: '', category: '', price: '', stock: '' });
    setShowModal(true);
  };

  const openEditModal = (product) => {
    setModalType('edit');
    setSelectedProduct(product);
    setFormData({
      name: product.name || '',
      category: product.category || '',
      price: product.price || '',
      stock: product.stock || ''
    });
    setShowModal(true);
  };

  const openDetailModal = (product) => {
    setModalType('detail');
    setSelectedProduct(product);
    setShowModal(true);
    loadProductCodes(product.id);
  };

  const openAdjustStockModal = (product) => {
    setModalType('adjust-stock');
    setSelectedProduct(product);
    setStockAdjustment({ adjustment: 0, reason: '' });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedProduct(null);
    setFormData({ name: '', category: '', price: '', stock: '' });
    setQrCodeUrl(null);
    setBarcodeUrl(null);
  };

  const downloadCode = async (productId, type) => {
    const imageUrl = type === 'qr' ? qrCodeUrl : barcodeUrl;
    const filename = type === 'qr' ? `producto-${productId}-qr.png` : `producto-${productId}-barcode.png`;
    
    if (imageUrl && imageUrl.startsWith('data:')) {
      const a = document.createElement('a');
      a.href = imageUrl;
      a.download = filename;
      a.style.display = 'none';
      document.body.appendChild(a);
      a.click();
      setTimeout(() => document.body.removeChild(a), 100);
      toast.success('Código descargado exitosamente');
    } else {
      toast.error('No hay código disponible para descargar');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (modalType === 'create') {
        await productService.create(formData);
        toast.success('Producto creado exitosamente');
      } else if (modalType === 'edit') {
        await productService.update(selectedProduct.id, formData);
        toast.success('Producto actualizado exitosamente');
      }
      closeModal();
      loadProducts();
    } catch (error) {
      console.error('Error al guardar:', error);
      toast.error(error.error || error.message || 'Error al guardar producto');
    }
  };

  const handleDelete = async (productId) => {
    if (!window.confirm('¿Estás seguro de eliminar este producto?')) return;
    try {
      await productService.delete(productId);
      toast.success('Producto eliminado exitosamente');
      loadProducts();
    } catch (error) {
      console.error('Error al eliminar:', error);
      toast.error(error.error || error.message || 'Error al eliminar producto');
    }
  };

  const handleAdjustStock = async (e) => {
    e.preventDefault();
    if (!stockAdjustment.reason.trim()) {
      toast.error('Debes indicar el motivo del ajuste');
      return;
    }
    if (stockAdjustment.adjustment === 0) {
      toast.error('El ajuste no puede ser 0');
      return;
    }
    try {
      await productService.adjustStock(selectedProduct.id, stockAdjustment);
      toast.success('Stock ajustado exitosamente');
      closeModal();
      loadProducts();
    } catch (error) {
      console.error('Error al ajustar stock:', error);
      toast.error(error.error || error.message || 'Error al ajustar stock');
    }
  };

  const getStockStatus = (stock) => {
    if (stock === 0) return { label: 'Agotado', class: 'out', icon: 'bx-x-circle' };
    if (stock <= 10) return { label: 'Bajo', class: 'low', icon: 'bx-error' };
    return { label: 'Disponible', class: 'ok', icon: 'bx-check-circle' };
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
    }).format(value || 0);
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Cargando productos...</p>
      </div>
    );
  }

  return (
    <div className="products-container">
      <Toaster position="top-right" />

      {/* Header */}
      <div className="products-header">
        <div className="header-content">
          <h1 className="header-title">
            <i className='bx bxs-package'></i>
            Gestión de Productos
          </h1>
          <p className="subtitle">Administra tu inventario de productos</p>
        </div>
        <button onClick={openCreateModal} className="btn-primary">
          <i className='bx bx-plus'></i>
          <span>Nuevo Producto</span>
        </button>
      </div>

      {/* Filtros */}
      <div className="filters-section">
        <div className="search-box">
          <i className='bx bx-search search-icon'></i>
          <input
            type="text"
            placeholder="Buscar por nombre o código..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>
        <select 
          value={categoryFilter} 
          onChange={(e) => setCategoryFilter(e.target.value)} 
          className="filter-select"
        >
          <option value="all">
            <i className='bx bx-category'></i> Todas las categorías
          </option>
          {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
        </select>
        <select 
          value={stockFilter} 
          onChange={(e) => setStockFilter(e.target.value)} 
          className="filter-select"
        >
          <option value="all">Todo el stock</option>
          <option value="low">Stock bajo</option>
          <option value="out">Agotados</option>
        </select>
        <button onClick={loadProducts} className="products-refresh-btn">
          <i className='bx bx-refresh'></i>
          <span>Actualizar</span>
        </button>
      </div>

      {/* Stats Cards */}
      <div className="stats-cards">
        <div className="stat-card">
          <div className="stat-icon-wrapper primary">
            <i className='bx bxs-package'></i>
          </div>
          <div className="stat-content">
            <div className="stat-value">{products.length}</div>
            <div className="stat-label">Total Productos</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon-wrapper warning">
            <i className='bx bxs-error'></i>
          </div>
          <div className="stat-content">
            <div className="stat-value">
              {Array.isArray(products) ? products.filter(p => p.stock <= 10).length : 0}
            </div>
            <div className="stat-label">Stock Bajo</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon-wrapper danger">
            <i className='bx bxs-x-circle'></i>
          </div>
          <div className="stat-content">
            <div className="stat-value">
              {Array.isArray(products) ? products.filter(p => p.stock === 0).length : 0}
            </div>
            <div className="stat-label">Agotados</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon-wrapper success">
            <i className='bx bxs-wallet'></i>
          </div>
          <div className="stat-content">
            <div className="stat-value">
              {formatCurrency(Array.isArray(products) ? products.reduce((sum, p) => sum + ((p.price || 0) * (p.stock || 0)), 0) : 0)}
            </div>
            <div className="stat-label">Valor Inventario</div>
          </div>
        </div>
      </div>

      {/* Tabla */}
      <div className="products-table-container">
        {filteredProducts.length === 0 ? (
          <div className="empty-state">
            <i className='bx bx-package empty-icon'></i>
            <p>No se encontraron productos</p>
            <small>Intenta ajustar los filtros o crea un nuevo producto</small>
            <button onClick={openCreateModal} className="btn-primary">
              <i className='bx bx-plus'></i>
              Crear primer producto
            </button>
          </div>
        ) : (
          <div className="table-wrapper">
            <table className="products-table">
              <thead>
                <tr>
                  <th><i className='bx bx-barcode'></i> Código</th>
                  <th><i className='bx bx-package'></i> Nombre</th>
                  <th><i className='bx bx-category'></i> Categoría</th>
                  <th><i className='bx bx-dollar'></i> Precio</th>
                  <th><i className='bx bx-box'></i> Stock</th>
                  <th><i className='bx bx-info-circle'></i> Estado</th>
                  <th><i className='bx bx-cog'></i> Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.map(product => {
                  const status = getStockStatus(product.stock || 0);
                  return (
                    <tr key={product.id}>
                      <td className="code-cell">
                        <span className="code-badge">{product.code || 'N/A'}</span>
                      </td>
                      <td className="name-cell">
                        <div className="product-name">{product.name}</div>
                        {product.description && (
                          <div className="product-desc">{product.description}</div>
                        )}
                      </td>
                      <td>
                        <span className="category-badge">
                          <i className='bx bx-purchase-tag'></i>
                          {product.category || 'Sin categoría'}
                        </span>
                      </td>
                      <td className="price-cell">{formatCurrency(product.price)}</td>
                      <td className="stock-cell">
                        <span className="stock-number">{product.stock || 0}</span>
                      </td>
                      <td>
                        <span className={`status-badge ${status.class}`}>
                          <i className={`bx ${status.icon}`}></i>
                          {status.label}
                        </span>
                      </td>
                      <td className="actions-cell">
                        <button 
                          onClick={() => openDetailModal(product)} 
                          className="btn-icon primary" 
                          title="Ver detalle"
                        >
                          <i className='bx bx-show'></i>
                        </button>
                        <button 
                          onClick={() => openEditModal(product)} 
                          className="btn-icon warning" 
                          title="Editar"
                        >
                          <i className='bx bx-edit'></i>
                        </button>
                        <button 
                          onClick={() => openAdjustStockModal(product)} 
                          className="btn-icon info" 
                          title="Ajustar stock"
                        >
                          <i className='bx bx-slider-alt'></i>
                        </button>
                        <button 
                          onClick={() => handleDelete(product.id)} 
                          className="btn-icon danger" 
                          title="Eliminar"
                        >
                          <i className='bx bx-trash'></i>
                        </button>
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
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            {(modalType === 'create' || modalType === 'edit') && (
              <>
                <div className="modal-header">
                  <h2>
                    <i className={`bx ${modalType === 'create' ? 'bx-plus-circle' : 'bx-edit'}`}></i>
                    {modalType === 'create' ? 'Nuevo Producto' : 'Editar Producto'}
                  </h2>
                  <button onClick={closeModal} className="btn-close">
                    <i className='bx bx-x'></i>
                  </button>
                </div>
                <form onSubmit={handleSubmit} className="modal-body">
                  <div className="form-group">
                    <label>
                      <i className='bx bx-package'></i>
                      Nombre *
                    </label>
                    <input 
                      type="text" 
                      value={formData.name} 
                      onChange={(e) => setFormData({...formData, name: e.target.value})} 
                      required 
                      placeholder="Nombre del producto" 
                    />
                  </div>
                  
                  <div className="form-group">
                    <label>
                      <i className='bx bx-category'></i>
                      Categoría
                    </label>
                    <input 
                      type="text" 
                      value={formData.category} 
                      onChange={(e) => setFormData({...formData, category: e.target.value})} 
                      placeholder="Ej: Ferretería" 
                      list="categories" 
                    />
                    <datalist id="categories">
                      {categories.map(cat => <option key={cat} value={cat} />)}
                    </datalist>
                  </div>

                  <div className="form-group">
                    <label>
                      <i className='bx bx-dollar-circle'></i>
                      Precio *
                    </label>
                    <input 
                      type="number" 
                      step="0.01" 
                      min="0" 
                      value={formData.price} 
                      onChange={(e) => setFormData({...formData, price: e.target.value})} 
                      required 
                      placeholder="0.00" 
                    />
                  </div>

                  {modalType === 'create' && (
                    <div className="form-group">
                      <label>
                        <i className='bx bx-box'></i>
                        Stock Inicial *
                      </label>
                      <input 
                        type="number" 
                        min="0" 
                        value={formData.stock} 
                        onChange={(e) => setFormData({...formData, stock: e.target.value})} 
                        required 
                        placeholder="0" 
                      />
                      <small className="form-hint">
                        <i className='bx bx-info-circle'></i>
                        El stock inicial del producto. Puedes ajustarlo después desde "Ajustar Stock"
                      </small>
                    </div>
                  )}

                  {modalType === 'edit' && selectedProduct && (
                    <div className="form-info-box">
                      <div className="info-row">
                        <span className="info-label">
                          <i className='bx bxs-box'></i>
                          Stock Actual:
                        </span>
                        <span className="info-value">{selectedProduct.stock || 0} unidades</span>
                      </div>
                      <small className="form-hint">
                        <i className='bx bx-info-circle'></i>
                        Para modificar el stock, usa el botón "Ajustar Stock"
                      </small>
                    </div>
                  )}

                  <div className="modal-footer">
                    <button type="button" onClick={closeModal} className="btn-secondary">
                      <i className='bx bx-x'></i>
                      Cancelar
                    </button>
                    <button type="submit" className="btn-primary">
                      <i className={`bx ${modalType === 'create' ? 'bx-plus' : 'bx-save'}`}></i>
                      {modalType === 'create' ? 'Crear Producto' : 'Guardar Cambios'}
                    </button>
                  </div>
                </form>
              </>
            )}

            {modalType === 'detail' && selectedProduct && (
              <>
                <div className="modal-header">
                  <h2>
                    <i className='bx bxs-info-circle'></i>
                    Detalle del Producto
                  </h2>
                  <button onClick={closeModal} className="btn-close">
                    <i className='bx bx-x'></i>
                  </button>
                </div>
                <div className="modal-body product-detail">
                  <div className="detail-row">
                    <strong><i className='bx bx-barcode'></i> Código:</strong>
                    <span className="code-badge">{selectedProduct.code || 'N/A'}</span>
                  </div>
                  <div className="detail-row">
                    <strong><i className='bx bx-package'></i> Nombre:</strong>
                    <span>{selectedProduct.name}</span>
                  </div>
                  <div className="detail-row">
                    <strong><i className='bx bx-detail'></i> Descripción:</strong>
                    <span>{selectedProduct.description || 'Sin descripción'}</span>
                  </div>
                  <div className="detail-row">
                    <strong><i className='bx bx-category'></i> Categoría:</strong>
                    <span>{selectedProduct.category || 'Sin categoría'}</span>
                  </div>
                  <div className="detail-row">
                    <strong><i className='bx bx-dollar-circle'></i> Precio:</strong>
                    <span className="price-highlight">{formatCurrency(selectedProduct.price)}</span>
                  </div>
                  <div className="detail-row">
                    <strong><i className='bx bx-box'></i> Stock Actual:</strong>
                    <span className="stock-highlight">{selectedProduct.stock || 0} unidades</span>
                  </div>
                  <div className="detail-row">
                    <strong><i className='bx bx-error'></i> Stock Mínimo:</strong>
                    <span>{selectedProduct.min_stock || 10} unidades</span>
                  </div>
                  <div className="detail-row">
                    <strong><i className='bx bx-wallet'></i> Valor en Inventario:</strong>
                    <span>{formatCurrency((selectedProduct.price || 0) * (selectedProduct.stock || 0))}</span>
                  </div>

                  <div className="codes-section">
                    <h3>
                      <i className='bx bx-qr'></i>
                      Códigos del Producto
                    </h3>
                    {loadingCodes ? (
                      <div className="loading-codes">
                        <div className="spinner"></div>
                        <p>Cargando códigos...</p>
                      </div>
                    ) : (
                      <div className="codes-container">
                        <div className="code-box">
                          <strong>
                            <i className='bx bx-qr-scan'></i>
                            Código QR
                          </strong>
                          <div className="code-image-wrapper">
                            {qrCodeUrl ? (
                              <img src={qrCodeUrl} alt="Código QR" className="code-image" />
                            ) : (
                              <div className="code-error">
                                <i className='bx bx-error-circle'></i>
                                No disponible
                              </div>
                            )}
                          </div>
                          <button 
                            type="button" 
                            onClick={() => downloadCode(selectedProduct.id, 'qr')} 
                            className="btn-download" 
                            disabled={!qrCodeUrl}
                          >
                            <i className='bx bx-download'></i>
                            Descargar QR
                          </button>
                        </div>
                        <div className="code-box">
                          <strong>
                            <i className='bx bx-barcode'></i>
                            Código de Barras
                          </strong>
                          <div className="code-image-wrapper">
                            {barcodeUrl ? (
                              <img src={barcodeUrl} alt="Código de Barras" className="code-image" />
                            ) : (
                              <div className="code-error">
                                <i className='bx bx-error-circle'></i>
                                No disponible
                              </div>
                            )}
                          </div>
                          <button 
                            type="button" 
                            onClick={() => downloadCode(selectedProduct.id, 'barcode')} 
                            className="btn-download" 
                            disabled={!barcodeUrl}
                          >
                            <i className='bx bx-download'></i>
                            Descargar Código
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                <div className="modal-footer">
                  <button onClick={() => openEditModal(selectedProduct)} className="btn-primary">
                    <i className='bx bx-edit'></i>
                    Editar
                  </button>
                  <button onClick={closeModal} className="btn-secondary">
                    <i className='bx bx-x'></i>
                    Cerrar
                  </button>
                </div>
              </>
            )}

            {modalType === 'adjust-stock' && selectedProduct && (
              <>
                <div className="modal-header">
                  <h2>
                    <i className='bx bx-slider-alt'></i>
                    Ajustar Stock
                  </h2>
                  <button onClick={closeModal} className="btn-close">
                    <i className='bx bx-x'></i>
                  </button>
                </div>
                <form onSubmit={handleAdjustStock} className="modal-body">
                  <div className="stock-current">
                    <div className="stock-current-header">
                      <i className='bx bxs-package'></i>
                      <strong>Producto:</strong> {selectedProduct.name}
                    </div>
                    <div className="stock-current-value">
                      <i className='bx bxs-box'></i>
                      <strong>Stock Actual:</strong> {selectedProduct.stock || 0} unidades
                    </div>
                  </div>
                  <div className="form-group">
                    <label>
                      <i className='bx bx-plus-minus'></i>
                      Ajuste de Stock *
                    </label>
                    <input 
                      type="number" 
                      value={stockAdjustment.adjustment} 
                      onChange={(e) => setStockAdjustment({ 
                        ...stockAdjustment, 
                        adjustment: parseInt(e.target.value) || 0 
                      })} 
                      placeholder="Positivo para sumar, negativo para restar" 
                      required 
                    />
                    <small className="stock-preview">
                      <i className='bx bx-info-circle'></i>
                      Nuevo stock: <strong>{(selectedProduct.stock || 0) + stockAdjustment.adjustment}</strong>
                    </small>
                  </div>
                  <div className="form-group">
                    <label>
                      <i className='bx bx-note'></i>
                      Motivo del Ajuste *
                    </label>
                    <textarea 
                      value={stockAdjustment.reason} 
                      onChange={(e) => setStockAdjustment({ 
                        ...stockAdjustment, 
                        reason: e.target.value 
                      })} 
                      placeholder="Ej: Devolución de proveedor, inventario físico, corrección de error..." 
                      rows="3" 
                      required 
                    />
                  </div>
                  <div className="modal-footer">
                    <button type="button" onClick={closeModal} className="btn-secondary">
                      <i className='bx bx-x'></i>
                      Cancelar
                    </button>
                    <button type="submit" className="btn-primary">
                      <i className='bx bx-check'></i>
                      Confirmar Ajuste
                    </button>
                  </div>
                </form>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Products;