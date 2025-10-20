import api from './axios.config';

const productService = {
  // Listar productos
  getAll: async (params = {}) => {
    try {
      const response = await api.get('/products/', { params });
      return response.data;
    } catch (error) {
      throw { error: 'Error al obtener productos' };
    }
  },

  // Obtener por ID
  getById: async (id) => {
    try {
      const response = await api.get(`/products/${id}/`);
      return response.data;
    } catch (error) {
      throw { error: 'Error al obtener producto' };
    }
  },

  // Crear producto
  create: async (productData) => {
    try {
      const response = await api.post('/products/', productData);
      return response.data;
    } catch (error) {
      const errorMsg = error.response?.data?.error || 
                      'Error al crear producto';
      throw { error: errorMsg };
    }
  },

  // Actualizar producto
  update: async (id, productData) => {
    try {
      const response = await api.put(`/products/${id}/`, productData);
      return response.data;
    } catch (error) {
      throw { error: 'Error al actualizar producto' };
    }
  },

  // Eliminar producto
  delete: async (id) => {
    try {
      await api.delete(`/products/${id}/`);
      return { success: true };
    } catch (error) {
      throw { error: 'Error al eliminar producto' };
    }
  },

  // Ajustar stock
  adjustStock: async (id, adjustment, reason) => {
    try {
      const response = await api.patch(`/products/${id}/adjust-stock/`, {
        adjustment,
        reason,
      });
      return response.data;
    } catch (error) {
      throw { error: 'Error al ajustar stock' };
    }
  },

  // Búsqueda rápida
  quickSearch: async (query) => {
    try {
      const response = await api.get('/products/quick-search/', {
        params: { q: query },
      });
      return response.data;
    } catch (error) {
      throw { error: 'Error en la búsqueda' };
    }
  },

  // URLs para descargar códigos
  getQRCodeUrl: (id) => {
    const token = localStorage.getItem('access_token');
    return `${process.env.REACT_APP_API_URL}/products/${id}/qrcode/?token=${token}`;
  },

  getBarcodeUrl: (id) => {
    const token = localStorage.getItem('access_token');
    return `${process.env.REACT_APP_API_URL}/products/${id}/barcode/?token=${token}`;
  },
};

export default productService;