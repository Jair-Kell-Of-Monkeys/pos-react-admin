// src/api/productService.js
import api from './axios.config';

const productService = {
  // Obtener todos los productos
  getAll: async () => {
    try {
      const response = await api.get('/products/');
      return response.data;
    } catch (error) {
      throw {
        error: error.response?.data?.error || 'Error al obtener productos'
      };
    }
  },

  // Obtener un producto por ID
  getById: async (id) => {
    try {
      const response = await api.get(`/products/${id}/`);
      return response.data;
    } catch (error) {
      throw {
        error: error.response?.data?.error || 'Error al obtener producto'
      };
    }
  },

  // Crear producto
  create: async (productData) => {
    try {
      const response = await api.post('/products/', productData);
      return response.data;
    } catch (error) {
      throw {
        error: error.response?.data?.error || 'Error al crear producto'
      };
    }
  },

  // Actualizar producto
  update: async (id, productData) => {
    try {
      const response = await api.patch(`/products/${id}/`, productData);
      return response.data;
    } catch (error) {
      throw {
        error: error.response?.data?.error || 'Error al actualizar producto'
      };
    }
  },

  // Eliminar producto
  delete: async (id) => {
    try {
      await api.delete(`/products/${id}/`);
    } catch (error) {
      throw {
        error: error.response?.data?.error || 'Error al eliminar producto'
      };
    }
  },

  // Ajustar stock
  adjustStock: async (id, adjustmentData) => {
    try {
      const response = await api.patch(`/products/${id}/adjust-stock/`, adjustmentData);
      return response.data;
    } catch (error) {
      throw {
        error: error.response?.data?.error || 'Error al ajustar stock'
      };
    }
  },

  // Búsqueda rápida
  quickSearch: async (query) => {
    try {
      const response = await api.get(`/products/quick-search/?q=${query}`);
      return response.data;
    } catch (error) {
      throw {
        error: error.response?.data?.error || 'Error en la búsqueda'
      };
    }
  },

  // Obtener historial de stock
  getStockHistory: async (id) => {
    try {
      const response = await api.get(`/products/${id}/stock-history/`);
      return response.data;
    } catch (error) {
      throw {
        error: error.response?.data?.error || 'Error al obtener historial'
      };
    }
  }
};

export default productService;