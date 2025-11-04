import api from './axios.config';

const reportService = {
  /**
   * Obtener todos los reportes
   * GET /api/reports/
   */
  async getAll(params = {}) {
    try {
      const response = await api.get('/reports/', { params });
      // ✅ Manejar tanto respuesta directa como paginada
      return Array.isArray(response.data) ? response.data : (response.data.results || []);
    } catch (error) {
      console.error('Error al obtener reportes:', error);
      throw { error: error.response?.data?.error || 'Error al obtener reportes' };
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
      console.error('Error al obtener reporte:', error);
      throw { error: error.response?.data?.error || 'Error al obtener reporte' };
    }
  },

  /**
   * Generar reporte de ventas
   * POST /api/reports/generate_sales_report/
   */
  async generateSalesReport(startDate, endDate) {
    try {
      // Asegurarse de que las fechas estén en formato ISO correcto
      const formattedStartDate = startDate.includes('T') 
        ? startDate 
        : `${startDate}T00:00:00`;
      
      const formattedEndDate = endDate.includes('T') 
        ? endDate 
        : `${endDate}T23:59:59`;

      const response = await api.post('/reports/generate_sales_report/', {
        start_date: formattedStartDate,
        end_date: formattedEndDate
      });
      return response.data;
    } catch (error) {
      console.error('Error al generar reporte de ventas:', error);
      const errorMsg = error.response?.data?.error || 
                      error.response?.data?.detail ||
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
      console.error('Error al generar reporte de inventario:', error);
      throw { error: error.response?.data?.error || 'Error al generar reporte de inventario' };
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
      console.error('Error al obtener reporte diario:', error);
      throw { error: error.response?.data?.error || 'Error al obtener reporte diario' };
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
      console.error('Error al obtener reporte semanal:', error);
      throw { error: error.response?.data?.error || 'Error al obtener reporte semanal' };
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
      console.error('Error al obtener reporte mensual:', error);
      throw { error: error.response?.data?.error || 'Error al obtener reporte mensual' };
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
      console.error('Error al obtener productos más vendidos:', error);
      throw { error: error.response?.data?.error || 'Error al obtener productos más vendidos' };
    }
  },

  /**
   * Eliminar reporte
   * DELETE /api/reports/{id}/
   */
  async delete(id) {
    try {
      await api.delete(`/reports/${id}/`);
      return { success: true, message: 'Reporte eliminado correctamente' };
    } catch (error) {
      console.error('Error al eliminar reporte:', error);
      throw { error: error.response?.data?.error || 'Error al eliminar reporte' };
    }
  },

  /**
   * Filtrar reportes por tipo
   * GET /api/reports/?type=ventas
   */
  async getByType(type) {
    try {
      const response = await api.get('/reports/', {
        params: { type }
      });
      // ✅ Manejar tanto respuesta directa como paginada
      return Array.isArray(response.data) ? response.data : (response.data.results || []);
    } catch (error) {
      console.error('Error al filtrar reportes:', error);
      throw { error: error.response?.data?.error || 'Error al filtrar reportes' };
    }
  }
};

export default reportService;