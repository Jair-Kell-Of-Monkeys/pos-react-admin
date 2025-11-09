import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../../context/AuthContext';
import productService from '../../api/productService';
import toast, { Toaster } from 'react-hot-toast';
import './Products.css';

const Products = () => {
  const { user } = useContext(AuthContext);
  
  // Estados
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
  
  // Form data
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    price: '',
    stock: ''
  });
  
  // Stock adjustment
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
    // Buscar el token en múltiples lugares
    const tokenFromLocalStorage = localStorage.getItem('token');
    const tokenFromSessionStorage = sessionStorage.getItem('token');
    const accessToken = localStorage.getItem('access_token') || localStorage.getItem('accessToken');
    
    // Si el contexto tiene el token
    if (user?.token) {
      return user.token;
    }
    
    // Buscar en diferentes keys
    return tokenFromLocalStorage || tokenFromSessionStorage || accessToken;
  };

  const loadProductCodes = async (productId) => {
    setLoadingCodes(true);
    setQrCodeUrl(null);
    setBarcodeUrl(null);
    
    const token = getAuthToken();
    const baseUrl = process.env.REACT_APP_API_URL;
    
    console.log('🔍 Cargando códigos para producto:', productId);
    console.log('🔗 Base URL:', baseUrl);
    console.log('🔑 Token disponible:', token ? '✅ Sí' : '❌ No');
    
    if (!token) {
      toast.error('No hay sesión activa. Por favor, inicia sesión nuevamente.');
      setLoadingCodes(false);
      return;
    }
    
    // Cargar QR Code con conversión a Base64
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
      
      console.log('📊 QR Response status:', qrResponse.status);
      console.log('📊 QR Content-Type:', qrResponse.headers.get('content-type'));
      
      if (qrResponse.ok) {
        const qrBlob = await qrResponse.blob();
        console.log('✅ QR Blob recibido:', qrBlob.type, qrBlob.size, 'bytes');
        
        // Convertir blob a data URL (Base64)
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64data = reader.result;
          console.log('✅ QR Base64 generado, longitud:', base64data.length);
          setQrCodeUrl(base64data);
          toast.success('Código QR cargado');
        };
        reader.onerror = (error) => {
          console.error('❌ Error al convertir QR a base64:', error);
          toast.error('Error al procesar el código QR');
        };
        reader.readAsDataURL(qrBlob);
      } else {
        const errorText = await qrResponse.text();
        console.error('❌ Error al cargar QR:', qrResponse.status, errorText);
        
        if (qrResponse.status === 401) {
          toast.error('Sesión expirada. Por favor, inicia sesión nuevamente.');
        } else if (qrResponse.status === 404) {
          toast.error('El código QR no existe para este producto');
        } else {
          toast.error('No se pudo cargar el código QR');
        }
      }
    } catch (error) {
      console.error('❌ Error cargando QR:', error);
      toast.error('Error de conexión al cargar el código QR');
    }
    
    // Cargar Barcode con conversión a Base64
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
      
      console.log('📊 Barcode Response status:', barcodeResponse.status);
      console.log('📊 Barcode Content-Type:', barcodeResponse.headers.get('content-type'));
      
      if (barcodeResponse.ok) {
        const barcodeBlob = await barcodeResponse.blob();
        console.log('✅ Barcode Blob recibido:', barcodeBlob.type, barcodeBlob.size, 'bytes');
        
        // Convertir blob a data URL (Base64)
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64data = reader.result;
          console.log('✅ Barcode Base64 generado, longitud:', base64data.length);
          setBarcodeUrl(base64data);
          toast.success('Código de barras cargado');
        };
        reader.onerror = (error) => {
          console.error('❌ Error al convertir barcode a base64:', error);
          toast.error('Error al procesar el código de barras');
        };
        reader.readAsDataURL(barcodeBlob);
      } else {
        const errorText = await barcodeResponse.text();
        console.error('❌ Error al cargar código de barras:', barcodeResponse.status, errorText);
        
        if (barcodeResponse.status === 401) {
          toast.error('Sesión expirada. Por favor, inicia sesión nuevamente.');
        } else if (barcodeResponse.status === 404) {
          toast.error('El código de barras no existe para este producto');
        } else {
          toast.error('No se pudo cargar el código de barras');
        }
      }
    } catch (error) {
      console.error('❌ Error cargando código de barras:', error);
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
      // Usar data URL directamente
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
    if (stock === 0) return { label: 'Agotado', class: 'out' };
    if (stock <= 10) return { label: 'Bajo', class: 'low' };
    return { label: 'Disponible', class: 'ok' };
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

      <div className="products-header">
        <div>
          <h1>Gestión de Productos</h1>
          <p className="subtitle">Administra tu inventario de productos</p>
        </div>
        <button onClick={openCreateModal} className="btn-primary">
          ➕ Nuevo Producto
        </button>
      </div>

      <div className="filters-section">
        <div className="search-box">
          <span className="search-icon">🔍</span>
          <input
            type="text"
            placeholder="Buscar por nombre o código..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>
        <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} className="filter-select">
          <option value="all">Todas las categorías</option>
          {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
        </select>
        <select value={stockFilter} onChange={(e) => setStockFilter(e.target.value)} className="filter-select">
          <option value="all">Todo el stock</option>
          <option value="low">Stock bajo</option>
          <option value="out">Agotados</option>
        </select>
        <button onClick={loadProducts} className="btn-refresh">🔄 Actualizar</button>
      </div>

      <div className="stats-cards">
        <div className="stat-card">
          <span className="stat-icon">📦</span>
          <div>
            <div className="stat-value">{products.length}</div>
            <div className="stat-label">Total Productos</div>
          </div>
        </div>
        <div className="stat-card">
          <span className="stat-icon">⚠️</span>
          <div>
            <div className="stat-value">{Array.isArray(products) ? products.filter(p => p.stock <= 10).length : 0}</div>
            <div className="stat-label">Stock Bajo</div>
          </div>
        </div>
        <div className="stat-card">
          <span className="stat-icon">🚫</span>
          <div>
            <div className="stat-value">{Array.isArray(products) ? products.filter(p => p.stock === 0).length : 0}</div>
            <div className="stat-label">Agotados</div>
          </div>
        </div>
        <div className="stat-card">
          <span className="stat-icon">💰</span>
          <div>
            <div className="stat-value">
              {formatCurrency(Array.isArray(products) ? products.reduce((sum, p) => sum + ((p.price || 0) * (p.stock || 0)), 0) : 0)}
            </div>
            <div className="stat-label">Valor Inventario</div>
          </div>
        </div>
      </div>

      <div className="products-table-container">
        {filteredProducts.length === 0 ? (
          <div className="empty-state">
            <span className="empty-icon">📭</span>
            <p>No se encontraron productos</p>
            <button onClick={openCreateModal} className="btn-primary">Crear primer producto</button>
          </div>
        ) : (
          <table className="products-table">
            <thead>
              <tr>
                <th>Código</th>
                <th>Nombre</th>
                <th>Categoría</th>
                <th>Precio</th>
                <th>Stock</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.map(product => {
                const status = getStockStatus(product.stock || 0);
                return (
                  <tr key={product.id}>
                    <td className="code-cell">{product.code || 'N/A'}</td>
                    <td className="name-cell">
                      <div className="product-name">{product.name}</div>
                      {product.description && <div className="product-desc">{product.description}</div>}
                    </td>
                    <td>{product.category || 'Sin categoría'}</td>
                    <td className="price-cell">{formatCurrency(product.price)}</td>
                    <td className="stock-cell">{product.stock || 0}</td>
                    <td><span className={`status-badge ${status.class}`}>{status.label}</span></td>
                    <td className="actions-cell">
                      <button onClick={() => openDetailModal(product)} className="btn-icon" title="Ver detalle">👁️</button>
                      <button onClick={() => openEditModal(product)} className="btn-icon" title="Editar">✏️</button>
                      <button onClick={() => openAdjustStockModal(product)} className="btn-icon" title="Ajustar stock">📊</button>
                      <button onClick={() => handleDelete(product.id)} className="btn-icon danger" title="Eliminar">🗑️</button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            {(modalType === 'create' || modalType === 'edit') && (
              <>
                <div className="modal-header">
                  <h2>{modalType === 'create' ? '➕ Nuevo Producto' : '✏️ Editar Producto'}</h2>
                  <button onClick={closeModal} className="btn-close">✕</button>
                </div>
                <form onSubmit={handleSubmit} className="modal-body">
                  <div className="form-group">
                    <label>Nombre *</label>
                    <input 
                      type="text" 
                      value={formData.name} 
                      onChange={(e) => setFormData({...formData, name: e.target.value})} 
                      required 
                      placeholder="Nombre del producto" 
                    />
                  </div>
                  
                  <div className="form-group">
                    <label>Categoría</label>
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
                    <label>Precio *</label>
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

                  {/* ✅ Solo mostrar campo de stock al CREAR producto */}
                  {modalType === 'create' && (
                    <div className="form-group">
                      <label>Stock Inicial *</label>
                      <input 
                        type="number" 
                        min="0" 
                        value={formData.stock} 
                        onChange={(e) => setFormData({...formData, stock: e.target.value})} 
                        required 
                        placeholder="0" 
                      />
                      <small className="form-hint">
                        El stock inicial del producto. Puedes ajustarlo después desde "Ajustar Stock"
                      </small>
                    </div>
                  )}

                  {/* ✅ Información del stock actual al EDITAR (solo lectura) */}
                  {modalType === 'edit' && selectedProduct && (
                    <div className="form-info-box">
                      <div className="info-row">
                        <span className="info-label">📦 Stock Actual:</span>
                        <span className="info-value">{selectedProduct.stock || 0} unidades</span>
                      </div>
                      <small className="form-hint">
                        Para modificar el stock, usa el botón "Ajustar Stock" 📊
                      </small>
                    </div>
                  )}

                  <div className="modal-footer">
                    <button type="button" onClick={closeModal} className="btn-secondary">
                      Cancelar
                    </button>
                    <button type="submit" className="btn-primary">
                      {modalType === 'create' ? 'Crear Producto' : 'Guardar Cambios'}
                    </button>
                  </div>
                </form>
              </>
            )}
            {modalType === 'detail' && selectedProduct && (
              <>
                <div className="modal-header">
                  <h2>📦 Detalle del Producto</h2>
                  <button onClick={closeModal} className="btn-close">✕</button>
                </div>
                <div className="modal-body product-detail">
                  <div className="detail-row"><strong>Código:</strong><span>{selectedProduct.code || 'N/A'}</span></div>
                  <div className="detail-row"><strong>Nombre:</strong><span>{selectedProduct.name}</span></div>
                  <div className="detail-row"><strong>Descripción:</strong><span>{selectedProduct.description || 'Sin descripción'}</span></div>
                  <div className="detail-row"><strong>Categoría:</strong><span>{selectedProduct.category || 'Sin categoría'}</span></div>
                  <div className="detail-row"><strong>Precio:</strong><span className="price-highlight">{formatCurrency(selectedProduct.price)}</span></div>
                  <div className="detail-row"><strong>Stock Actual:</strong><span className="stock-highlight">{selectedProduct.stock || 0} unidades</span></div>
                  <div className="detail-row"><strong>Stock Mínimo:</strong><span>{selectedProduct.min_stock || 10} unidades</span></div>
                  <div className="detail-row"><strong>Valor en Inventario:</strong><span>{formatCurrency((selectedProduct.price || 0) * (selectedProduct.stock || 0))}</span></div>

                  <div className="codes-section">
                    <h3 style={{ marginTop: '20px', marginBottom: '15px', fontSize: '16px' }}>📱 Códigos del Producto</h3>
                    {loadingCodes ? (
                      <div style={{ textAlign: 'center', padding: '20px' }}>
                        <div className="spinner"></div>
                        <p>Cargando códigos...</p>
                      </div>
                    ) : (
                      <div className="codes-container">
                        <div className="code-box">
                          <strong>Código QR:</strong>
                          <div className="code-image-wrapper">
                            {qrCodeUrl ? (
                              <img src={qrCodeUrl} alt="Código QR" className="code-image" />
                            ) : (
                              <div className="code-error">⚠️ No disponible</div>
                            )}
                          </div>
                          <button type="button" onClick={() => downloadCode(selectedProduct.id, 'qr')} className="btn-download" disabled={!qrCodeUrl}>
                            ⬇️ Descargar QR
                          </button>
                        </div>
                        <div className="code-box">
                          <strong>Código de Barras:</strong>
                          <div className="code-image-wrapper">
                            {barcodeUrl ? (
                              <img src={barcodeUrl} alt="Código de Barras" className="code-image" />
                            ) : (
                              <div className="code-error">⚠️ No disponible</div>
                            )}
                          </div>
                          <button type="button" onClick={() => downloadCode(selectedProduct.id, 'barcode')} className="btn-download" disabled={!barcodeUrl}>
                            ⬇️ Descargar Código
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                <div className="modal-footer">
                  <button onClick={() => openEditModal(selectedProduct)} className="btn-primary">Editar</button>
                  <button onClick={closeModal} className="btn-secondary">Cerrar</button>
                </div>
              </>
            )}

            {modalType === 'adjust-stock' && selectedProduct && (
              <>
                <div className="modal-header">
                  <h2>📊 Ajustar Stock</h2>
                  <button onClick={closeModal} className="btn-close">✕</button>
                </div>
                <form onSubmit={handleAdjustStock} className="modal-body">
                  <div className="stock-current">
                    <strong>Producto:</strong> {selectedProduct.name}<br />
                    <strong>Stock Actual:</strong> {selectedProduct.stock || 0} unidades
                  </div>
                  <div className="form-group">
                    <label>Ajuste de Stock *</label>
                    <input type="number" value={stockAdjustment.adjustment} onChange={(e) => setStockAdjustment({ ...stockAdjustment, adjustment: parseInt(e.target.value) || 0 })} placeholder="Positivo para sumar, negativo para restar" required />
                    <small>Nuevo stock: {(selectedProduct.stock || 0) + stockAdjustment.adjustment}</small>
                  </div>
                  <div className="form-group">
                    <label>Motivo del Ajuste *</label>
                    <textarea value={stockAdjustment.reason} onChange={(e) => setStockAdjustment({ ...stockAdjustment, reason: e.target.value })} placeholder="Ej: Devolución de proveedor, inventario físico, corrección de error..." rows="3" required />
                  </div>
                  <div className="modal-footer">
                    <button type="button" onClick={closeModal} className="btn-secondary">Cancelar</button>
                    <button type="submit" className="btn-primary">Confirmar Ajuste</button>
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