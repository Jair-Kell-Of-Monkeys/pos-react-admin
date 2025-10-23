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
  const [modalType, setModalType] = useState('create'); // 'create', 'edit', 'detail', 'adjust-stock'
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [stockFilter, setStockFilter] = useState('all');
  
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
    setLoading(true);
    try {
      const data = await productService.getAll();
      console.log('📦 Productos recibidos:', data); // Para debugging
      
      // 🔧 CORRECCIÓN: Asegurarse de que data sea un array
      if (Array.isArray(data)) {
        setProducts(data);
      } else if (data && Array.isArray(data.results)) {
        // Si el backend devuelve { results: [...] }
        setProducts(data.results);
      } else {
        console.error('❌ Formato inesperado:', data);
        setProducts([]);
        toast.error('Formato de datos inesperado');
      }
    } catch (error) {
      console.error('❌ Error al cargar productos:', error);
      toast.error(error.error || 'Error al cargar productos');
      setProducts([]); // 🔧 Asegurar que sea array vacío en caso de error
    } finally {
      setLoading(false);
    }
  };

  // Filtrar productos
  const filteredProducts = products.filter(product => {
    const matchSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                       product.code?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchCategory = categoryFilter === 'all' || product.category === categoryFilter;
    
    const matchStock = stockFilter === 'all' || 
                      (stockFilter === 'low' && product.stock <= 10) ||
                      (stockFilter === 'out' && product.stock === 0);
    
    return matchSearch && matchCategory && matchStock;
  });

  // Obtener categorías únicas
  const categories = [...new Set(products.map(p => p.category).filter(Boolean))];

  // Handlers de Modal
  const openCreateModal = () => {
    setModalType('create');
    setFormData({
      name: '',
      category: '',
      price: '',
      stock: ''
    });
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
    setFormData({
      name: '',
      category: '',
      price: '',
      stock: ''
    });
  };

  // CRUD Operations
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
      toast.error(error.error || 'Error al guardar producto');
    }
  };

  const handleDelete = async (productId) => {
    if (!window.confirm('¿Estás seguro de eliminar este producto?')) return;
    
    try {
      await productService.delete(productId);
      toast.success('Producto eliminado exitosamente');
      loadProducts();
    } catch (error) {
      toast.error(error.error || 'Error al eliminar producto');
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
      toast.error(error.error || 'Error al ajustar stock');
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
    }).format(value);
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
        <div>
          <h1>Gestión de Productos</h1>
          <p className="subtitle">Administra tu inventario de productos</p>
        </div>
        <button onClick={openCreateModal} className="btn-primary">
          ➕ Nuevo Producto
        </button>
      </div>

      {/* Filtros */}
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

        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="filter-select"
        >
          <option value="all">Todas las categorías</option>
          {categories.map(cat => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
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

        <button onClick={loadProducts} className="btn-refresh">
          🔄 Actualizar
        </button>
      </div>

      {/* Estadísticas rápidas */}
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
            <div className="stat-value">{products.filter(p => p.stock <= 10).length}</div>
            <div className="stat-label">Stock Bajo</div>
          </div>
        </div>
        <div className="stat-card">
          <span className="stat-icon">🚫</span>
          <div>
            <div className="stat-value">{products.filter(p => p.stock === 0).length}</div>
            <div className="stat-label">Agotados</div>
          </div>
        </div>
        <div className="stat-card">
          <span className="stat-icon">💰</span>
          <div>
            <div className="stat-value">
              {formatCurrency(products.reduce((sum, p) => sum + (p.price * p.stock), 0))}
            </div>
            <div className="stat-label">Valor Inventario</div>
          </div>
        </div>
      </div>

      {/* Tabla de productos */}
      <div className="products-table-container">
        {filteredProducts.length === 0 ? (
          <div className="empty-state">
            <span className="empty-icon">📭</span>
            <p>No se encontraron productos</p>
            <button onClick={openCreateModal} className="btn-primary">
              Crear primer producto
            </button>
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
                const status = getStockStatus(product.stock);
                return (
                  <tr key={product.id}>
                    <td className="code-cell">{product.code || 'N/A'}</td>
                    <td className="name-cell">
                      <div className="product-name">{product.name}</div>
                      {product.description && (
                        <div className="product-desc">{product.description}</div>
                      )}
                    </td>
                    <td>{product.category || 'Sin categoría'}</td>
                    <td className="price-cell">{formatCurrency(product.price)}</td>
                    <td className="stock-cell">{product.stock}</td>
                    <td>
                      <span className={`status-badge ${status.class}`}>
                        {status.label}
                      </span>
                    </td>
                    <td className="actions-cell">
                      <button
                        onClick={() => openDetailModal(product)}
                        className="btn-icon"
                        title="Ver detalle"
                      >
                        👁️
                      </button>
                      <button
                        onClick={() => openEditModal(product)}
                        className="btn-icon"
                        title="Editar"
                      >
                        ✏️
                      </button>
                      <button
                        onClick={() => openAdjustStockModal(product)}
                        className="btn-icon"
                        title="Ajustar stock"
                      >
                        📊
                      </button>
                      <button
                        onClick={() => handleDelete(product.id)}
                        className="btn-icon danger"
                        title="Eliminar"
                      >
                        🗑️
                      </button>
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
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            {/* Formulario Crear/Editar */}
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
                      {categories.map(cat => (
                        <option key={cat} value={cat} />
                      ))}
                    </datalist>
                  </div>

                  <div className="form-row">
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
                    <div className="form-group">
                      <label>Stock *</label>
                      <input
                        type="number"
                        min="0"
                        value={formData.stock}
                        onChange={(e) => setFormData({...formData, stock: e.target.value})}
                        required
                        placeholder="0"
                      />
                    </div>
                  </div>

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

            {/* Detalle del Producto */}
            {modalType === 'detail' && selectedProduct && (
              <>
                <div className="modal-header">
                  <h2>📦 Detalle del Producto</h2>
                  <button onClick={closeModal} className="btn-close">✕</button>
                </div>
                <div className="modal-body product-detail">
                  <div className="detail-row">
                    <strong>Código:</strong>
                    <span>{selectedProduct.code || 'N/A'}</span>
                  </div>
                  <div className="detail-row">
                    <strong>Nombre:</strong>
                    <span>{selectedProduct.name}</span>
                  </div>
                  <div className="detail-row">
                    <strong>Descripción:</strong>
                    <span>{selectedProduct.description || 'Sin descripción'}</span>
                  </div>
                  <div className="detail-row">
                    <strong>Categoría:</strong>
                    <span>{selectedProduct.category || 'Sin categoría'}</span>
                  </div>
                  <div className="detail-row">
                    <strong>Precio:</strong>
                    <span className="price-highlight">{formatCurrency(selectedProduct.price)}</span>
                  </div>
                  <div className="detail-row">
                    <strong>Stock Actual:</strong>
                    <span className="stock-highlight">{selectedProduct.stock} unidades</span>
                  </div>
                  <div className="detail-row">
                    <strong>Stock Mínimo:</strong>
                    <span>{selectedProduct.min_stock || 10} unidades</span>
                  </div>
                  <div className="detail-row">
                    <strong>Valor en Inventario:</strong>
                    <span>{formatCurrency(selectedProduct.price * selectedProduct.stock)}</span>
                  </div>

                  {/* 🆕 SECCIÓN DE CÓDIGOS QR Y BARRAS */}
                  <div className="codes-section">
                    <h3 style={{ marginTop: '20px', marginBottom: '15px', fontSize: '16px' }}>
                      📱 Códigos del Producto
                    </h3>
                    
                    <div className="codes-container">
                      {/* Código QR */}
                      <div className="code-box">
                        <strong>Código QR:</strong>
                        <div className="code-image-wrapper">
                          <img 
                            src={`${process.env.REACT_APP_API_URL}/products/${selectedProduct.id}/qrcode/`}
                            alt="Código QR"
                            className="code-image"
                            onError={(e) => {
                              e.target.style.display = 'none';
                              e.target.nextSibling.style.display = 'flex';
                            }}
                          />
                          <div className="code-error" style={{ display: 'none' }}>
                            ⚠️ No disponible
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            const url = `${process.env.REACT_APP_API_URL}/products/${selectedProduct.id}/qrcode/`;
                            window.open(url, '_blank');
                          }}
                          className="btn-download"
                        >
                          🔍 Ver/Descargar QR
                        </button>
                      </div>

                      {/* Código de Barras */}
                      <div className="code-box">
                        <strong>Código de Barras:</strong>
                        <div className="code-image-wrapper">
                          <img 
                            src={`${process.env.REACT_APP_API_URL}/products/${selectedProduct.id}/barcode/`}
                            alt="Código de Barras"
                            className="code-image"
                            onError={(e) => {
                              e.target.style.display = 'none';
                              e.target.nextSibling.style.display = 'flex';
                            }}
                          />
                          <div className="code-error" style={{ display: 'none' }}>
                            ⚠️ No disponible
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            const url = `${process.env.REACT_APP_API_URL}/products/${selectedProduct.id}/barcode/`;
                            window.open(url, '_blank');
                          }}
                          className="btn-download"
                        >
                          🔍 Ver/Descargar Código
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="modal-footer">
                  <button onClick={() => openEditModal(selectedProduct)} className="btn-primary">
                    Editar
                  </button>
                  <button onClick={closeModal} className="btn-secondary">
                    Cerrar
                  </button>
                </div>
              </>
            )}

            {/* Ajustar Stock */}
            {modalType === 'adjust-stock' && selectedProduct && (
              <>
                <div className="modal-header">
                  <h2>📊 Ajustar Stock</h2>
                  <button onClick={closeModal} className="btn-close">✕</button>
                </div>
                <form onSubmit={handleAdjustStock} className="modal-body">
                  <div className="stock-current">
                    <strong>Producto:</strong> {selectedProduct.name}
                    <br />
                    <strong>Stock Actual:</strong> {selectedProduct.stock} unidades
                  </div>

                  <div className="form-group">
                    <label>Ajuste de Stock *</label>
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
                    <small>Nuevo stock: {selectedProduct.stock + stockAdjustment.adjustment}</small>
                  </div>

                  <div className="form-group">
                    <label>Motivo del Ajuste *</label>
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
                      Cancelar
                    </button>
                    <button type="submit" className="btn-primary">
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