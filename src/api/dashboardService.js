import api from './axios.config';

const dashboardService = {
  // Resumen completo del dashboard
  getSummary: async () => {
    try {
      const response = await api.get('/dashboard/summary/');
      return response.data;
    } catch (error) {
      const errorMsg = error.response?.data?.error || 
                      'Error al obtener resumen del dashboard';
      throw { error: errorMsg };
    }
  },

  // Estadísticas rápidas
  getQuickStats: async () => {
    try {
      const response = await api.get('/dashboard/quick-stats/');
      return response.data;
    } catch (error) {
      throw { error: 'Error al obtener estadísticas rápidas' };
    }
  },

  // Datos para gráficas
  getSalesChart: async (period = 'week') => {
    try {
      const response = await api.get('/dashboard/sales-chart/', {
        params: { period },
      });
      return response.data;
    } catch (error) {
      throw { error: 'Error al obtener datos de gráficas' };
    }
  },
};

export default dashboardService;