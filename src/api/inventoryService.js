import api from './axios.config';

const inventoryService = {
  /**
   * Obtener todos los movimientos de inventario
   * GET /api/inventory-movements/
   */
  async getAll(params = {}) {
    try {
      const response = await api.get('/inventory-movements/', { params });
      return response.data;
    } catch (error) {
      throw { error: 'Error al obtener movimientos de inventario' };
    }
  },

  /**
   * Obtener movimiento por ID
   * GET /api/inventory-movements/{id}/
   */
  async getById(id) {
    try {
      const response = await api.get(`/inventory-movements/${id}/`);
      return response.data;
    } catch (error) {
      throw { error: 'Error al obtener movimiento' };
    }
  },

  /**
   * Crear movimiento de inventario (solo admin)
   * POST /api/inventory-movements/
   */
  async create(movementData) {
    try {
      const response = await api.post('/inventory-movements/', movementData);
      return response.data;
    } catch (error) {
      const errorMsg = error.response?.data?.error || 
                      'Error al crear movimiento';
      throw { error: errorMsg };
    }
  },

  /**
   * Obtener productos con stock bajo
   * GET /api/inventory-movements/low-stock/?threshold=10
   */
  async getLowStock(threshold = 10) {
    try {
      const response = await api.get('/inventory-movements/low-stock/', {
        params: { threshold }
      });
      return response.data;
    } catch (error) {
      throw { error: 'Error al obtener productos con stock bajo' };
    }
  },

  /**
   * Obtener movimientos por producto
   */
  async getByProduct(productId, params = {}) {
    try {
      const response = await api.get('/inventory-movements/', {
        params: { product: productId, ...params }
      });
      return response.data;
    } catch (error) {
      throw { error: 'Error al obtener movimientos del producto' };
    }
  },

  /**
   * Obtener movimientos por tipo
   * type: 'entrada' o 'salida'
   */
  async getByType(type, params = {}) {
    try {
      const response = await api.get('/inventory-movements/', {
        params: { type, ...params }
      });
      return response.data;
    } catch (error) {
      throw { error: 'Error al obtener movimientos por tipo' };
    }
  },

  /**
   * Obtener movimientos por rango de fechas
   */
  async getByDateRange(startDate, endDate, params = {}) {
    try {
      const response = await api.get('/inventory-movements/', {
        params: {
          start_date: startDate,
          end_date: endDate,
          ...params
        }
      });
      return response.data;
    } catch (error) {
      throw { error: 'Error al obtener movimientos por fecha' };
    }
  }
};

export default inventoryService;