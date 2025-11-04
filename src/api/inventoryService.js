import api from './axios.config';

const inventoryService = {
  /**
   * Obtener todos los movimientos de inventario
   * GET /api/inventory-movements/
   */
  async getAll(params = {}) {
    try {
      const response = await api.get('/inventory-movements/', { params });
      // ✅ Manejar respuesta paginada o directa
      return Array.isArray(response.data) 
        ? response.data 
        : (response.data.results || []);
    } catch (error) {
      console.error('Error al obtener movimientos de inventario:', error);
      throw { 
        error: error.response?.data?.error || 
               error.response?.data?.detail || 
               'Error al obtener movimientos de inventario' 
      };
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
      console.error('Error al obtener movimiento:', error);
      throw { 
        error: error.response?.data?.error || 
               error.response?.data?.detail || 
               'Error al obtener movimiento' 
      };
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
      console.error('Error al crear movimiento:', error);
      
      const errorData = error.response?.data || {};
      let errorMsg = 'Error al crear movimiento';
      
      // Extraer mensajes de error específicos por campo
      if (errorData.product) {
        errorMsg = Array.isArray(errorData.product)
          ? `Producto: ${errorData.product[0]}`
          : `Producto: ${errorData.product}`;
      } else if (errorData.quantity) {
        errorMsg = Array.isArray(errorData.quantity)
          ? `Cantidad: ${errorData.quantity[0]}`
          : `Cantidad: ${errorData.quantity}`;
      } else if (errorData.movement_type) {
        errorMsg = Array.isArray(errorData.movement_type)
          ? `Tipo: ${errorData.movement_type[0]}`
          : `Tipo: ${errorData.movement_type}`;
      } else if (errorData.error) {
        errorMsg = errorData.error;
      } else if (errorData.detail) {
        errorMsg = errorData.detail;
      }
      
      throw { 
        error: errorMsg,
        validationErrors: errorData 
      };
    }
  },

  /**
   * Actualizar movimiento de inventario (solo admin)
   * PATCH /api/inventory-movements/{id}/
   */
  async update(id, movementData) {
    try {
      const response = await api.patch(`/inventory-movements/${id}/`, movementData);
      return response.data;
    } catch (error) {
      console.error('Error al actualizar movimiento:', error);
      throw { 
        error: error.response?.data?.error || 
               error.response?.data?.detail || 
               'Error al actualizar movimiento' 
      };
    }
  },

  /**
   * Eliminar movimiento de inventario (solo admin)
   * DELETE /api/inventory-movements/{id}/
   */
  async delete(id) {
    try {
      await api.delete(`/inventory-movements/${id}/`);
      return { success: true, message: 'Movimiento eliminado correctamente' };
    } catch (error) {
      console.error('Error al eliminar movimiento:', error);
      throw { 
        error: error.response?.data?.error || 
               error.response?.data?.detail || 
               'Error al eliminar movimiento' 
      };
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
      console.error('Error al obtener productos con stock bajo:', error);
      throw { 
        error: error.response?.data?.error || 
               'Error al obtener productos con stock bajo' 
      };
    }
  },

  /**
   * Obtener movimientos por producto
   * GET /api/inventory-movements/?product={id}
   */
  async getByProduct(productId, params = {}) {
    try {
      const response = await api.get('/inventory-movements/', {
        params: { product: productId, ...params }
      });
      // ✅ Manejar respuesta paginada o directa
      return Array.isArray(response.data) 
        ? response.data 
        : (response.data.results || []);
    } catch (error) {
      console.error('Error al obtener movimientos del producto:', error);
      throw { 
        error: error.response?.data?.error || 
               'Error al obtener movimientos del producto' 
      };
    }
  },

  /**
   * Obtener movimientos por tipo
   * GET /api/inventory-movements/?type=entrada
   * type: 'entrada' o 'salida'
   */
  async getByType(type, params = {}) {
    try {
      const response = await api.get('/inventory-movements/', {
        params: { type, ...params }
      });
      // ✅ Manejar respuesta paginada o directa
      return Array.isArray(response.data) 
        ? response.data 
        : (response.data.results || []);
    } catch (error) {
      console.error('Error al obtener movimientos por tipo:', error);
      throw { 
        error: error.response?.data?.error || 
               'Error al obtener movimientos por tipo' 
      };
    }
  },

  /**
   * Obtener movimientos por rango de fechas
   * GET /api/inventory-movements/?start_date=YYYY-MM-DD&end_date=YYYY-MM-DD
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
      // ✅ Manejar respuesta paginada o directa
      return Array.isArray(response.data) 
        ? response.data 
        : (response.data.results || []);
    } catch (error) {
      console.error('Error al obtener movimientos por fecha:', error);
      throw { 
        error: error.response?.data?.error || 
               'Error al obtener movimientos por fecha' 
      };
    }
  },

  /**
   * Obtener resumen de movimientos de inventario
   * Útil para dashboard o estadísticas
   */
  async getSummary(params = {}) {
    try {
      const response = await api.get('/inventory-movements/', { params });
      const movements = Array.isArray(response.data) 
        ? response.data 
        : (response.data.results || []);
      
      // Calcular estadísticas
      const entradas = movements.filter(m => m.movement_type === 'entrada');
      const salidas = movements.filter(m => m.movement_type === 'salida');
      
      return {
        total: movements.length,
        entradas: entradas.length,
        salidas: salidas.length,
        totalEntradas: entradas.reduce((sum, m) => sum + (m.quantity || 0), 0),
        totalSalidas: salidas.reduce((sum, m) => sum + (m.quantity || 0), 0),
        movements: movements
      };
    } catch (error) {
      console.error('Error al obtener resumen:', error);
      throw { 
        error: error.response?.data?.error || 
               'Error al obtener resumen de movimientos' 
      };
    }
  },

  /**
   * Obtener historial de movimientos de un producto específico
   * Útil para ver el detalle de cambios de stock de un producto
   */
  async getProductHistory(productId) {
    try {
      const response = await api.get('/inventory-movements/', {
        params: { product: productId },
        ordering: '-date' // Más recientes primero
      });
      
      const movements = Array.isArray(response.data) 
        ? response.data 
        : (response.data.results || []);
      
      return movements;
    } catch (error) {
      console.error('Error al obtener historial del producto:', error);
      throw { 
        error: error.response?.data?.error || 
               'Error al obtener historial del producto' 
      };
    }
  },

  /**
   * Obtener estadísticas de movimientos por período
   */
  async getStatsByPeriod(startDate, endDate) {
    try {
      const movements = await this.getByDateRange(startDate, endDate);
      
      const stats = {
        period: {
          start: startDate,
          end: endDate
        },
        entradas: {
          count: 0,
          totalQuantity: 0
        },
        salidas: {
          count: 0,
          totalQuantity: 0
        },
        netChange: 0
      };
      
      movements.forEach(movement => {
        if (movement.movement_type === 'entrada') {
          stats.entradas.count++;
          stats.entradas.totalQuantity += movement.quantity || 0;
          stats.netChange += movement.quantity || 0;
        } else if (movement.movement_type === 'salida') {
          stats.salidas.count++;
          stats.salidas.totalQuantity += movement.quantity || 0;
          stats.netChange -= movement.quantity || 0;
        }
      });
      
      return stats;
    } catch (error) {
      console.error('Error al obtener estadísticas:', error);
      throw { 
        error: error.response?.data?.error || 
               'Error al obtener estadísticas de movimientos' 
      };
    }
  }
};

export default inventoryService;