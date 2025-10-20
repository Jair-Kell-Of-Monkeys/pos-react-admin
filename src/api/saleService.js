import api from './axios.config';

const saleService = {
  /**
   * Listar ventas
   * GET /api/sales/
   */
  async getAll(params = {}) {
    try {
      const response = await api.get('/sales/', { params });
      return response.data;
    } catch (error) {
      throw { error: 'Error al obtener ventas' };
    }
  },

  /**
   * Obtener venta por ID
   * GET /api/sales/{id}/
   */
  async getById(id) {
    try {
      const response = await api.get(`/sales/${id}/`);
      return response.data;
    } catch (error) {
      throw { error: 'Error al obtener venta' };
    }
  },

  /**
   * Crear venta normal
   * POST /api/sales/
   */
  async create(saleData) {
    try {
      const response = await api.post('/sales/', saleData);
      return response.data;
    } catch (error) {
      const errorMsg = error.response?.data?.error || 
                      error.response?.data?.detail ||
                      'Error al crear venta';
      throw { 
        error: errorMsg,
        validationErrors: error.response?.data 
      };
    }
  },

  /**
   * Obtener mis ventas (usuario actual)
   * GET /api/sales/my-sales/
   */
  async getMySales(params = {}) {
    try {
      const response = await api.get('/sales/my-sales/', { params });
      return response.data;
    } catch (error) {
      throw { error: 'Error al obtener mis ventas' };
    }
  },

  /**
   * Obtener resumen de ventas
   * GET /api/sales/summary/
   */
  async getSummary() {
    try {
      const response = await api.get('/sales/summary/');
      return response.data;
    } catch (error) {
      throw { error: 'Error al obtener resumen' };
    }
  },

  /**
   * Ventas agrupadas por período
   * GET /api/sales/by_period/?period=day
   * Opciones: day, week, month
   */
  async getByPeriod(period = 'day') {
    try {
      const response = await api.get('/sales/by_period/', {
        params: { period }
      });
      return response.data;
    } catch (error) {
      throw { error: 'Error al obtener ventas por período' };
    }
  },

  /**
   * Ventas por usuario específico
   * GET /api/sales/by-user/{user_id}/
   */
  async getByUser(userId, params = {}) {
    try {
      const response = await api.get(`/sales/by-user/${userId}/`, { params });
      return response.data;
    } catch (error) {
      throw { error: 'Error al obtener ventas del usuario' };
    }
  },

  /**
   * Cancelar venta
   * POST /api/sales/{id}/cancel/
   */
  async cancel(id, reason = '') {
    try {
      const response = await api.post(`/sales/${id}/cancel/`, { reason });
      return response.data;
    } catch (error) {
      const errorMsg = error.response?.data?.error || 
                      'Error al cancelar venta';
      throw { error: errorMsg };
    }
  },

  /**
   * Obtener ventas por rango de fechas
   */
  async getByDateRange(startDate, endDate) {
    try {
      const response = await api.get('/sales/', {
        params: {
          start_date: startDate,
          end_date: endDate
        }
      });
      return response.data;
    } catch (error) {
      throw { error: 'Error al obtener ventas por fecha' };
    }
  }
};

export default saleService;