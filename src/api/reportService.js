import api from './axios.config';

const reportService = {
  /**
   * Obtener todos los reportes
   * GET /api/reports/
   */
  async getAll(params = {}) {
    try {
      const response = await api.get('/reports/', { params });
      return response.data;
    } catch (error) {
      throw { error: 'Error al obtener reportes' };
    }
  },

  /**
   * Obtener reporte por ID
   * GET /api/reports/{id}/
   */
  async getById(id) {
    try {
      const response = await api.get(`/reports/${id}/`);
      return response.data;
    } catch (error) {
      throw { error: 'Error al obtener reporte' };
    }
  },

  /**
   * Generar reporte de ventas
   * POST /api/reports/generate_sales_report/
   */
  async generateSalesReport(startDate, endDate) {
    try {
      const response = await api.post('/reports/generate_sales_report/', {
        start_date: startDate,
        end_date: endDate
      });
      return response.data;
    } catch (error) {
      const errorMsg = error.response?.data?.error || 
                      'Error al generar reporte de ventas';
      throw { error: errorMsg };
    }
  },

  /**
   * Generar reporte de inventario
   * POST /api/reports/generate_inventory_report/
   */
  async generateInventoryReport() {
    try {
      const response = await api.post('/reports/generate_inventory_report/');
      return response.data;
    } catch (error) {
      throw { error: 'Error al generar reporte de inventario' };
    }
  },

  /**
   * Reporte de ventas diarias
   * GET /api/reports/sales/daily/
   */
  async getDailySalesReport() {
    try {
      const response = await api.get('/reports/sales/daily/');
      return response.data;
    } catch (error) {
      throw { error: 'Error al obtener reporte diario' };
    }
  },

  /**
   * Reporte de ventas semanales
   * GET /api/reports/sales/weekly/
   */
  async getWeeklySalesReport() {
    try {
      const response = await api.get('/reports/sales/weekly/');
      return response.data;
    } catch (error) {
      throw { error: 'Error al obtener reporte semanal' };
    }
  },

  /**
   * Reporte de ventas mensuales
   * GET /api/reports/sales/monthly/
   */
  async getMonthlySalesReport() {
    try {
      const response = await api.get('/reports/sales/monthly/');
      return response.data;
    } catch (error) {
      throw { error: 'Error al obtener reporte mensual' };
    }
  },

  /**
   * Productos más vendidos
   * GET /api/reports/sales/top-products/?days=30
   */
  async getTopProductsReport(days = 30) {
    try {
      const response = await api.get('/reports/sales/top-products/', {
        params: { days }
      });
      return response.data;
    } catch (error) {
      throw { error: 'Error al obtener productos más vendidos' };
    }
  },

  /**
   * Eliminar reporte
   * DELETE /api/reports/{id}/
   */
  async delete(id) {
    try {
      await api.delete(`/reports/${id}/`);
      return { success: true };
    } catch (error) {
      throw { error: 'Error al eliminar reporte' };
    }
  }
};

export default reportService;