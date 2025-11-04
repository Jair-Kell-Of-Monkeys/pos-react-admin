import api from './axios.config';

const userService = {
  /**
   * Listar todos los usuarios
   * GET /api/users/
   */
  async getAll(params = {}) {
    try {
      const response = await api.get('/users/', { params });
      // ✅ Manejar respuesta paginada o directa
      return Array.isArray(response.data) 
        ? response.data 
        : (response.data.results || []);
    } catch (error) {
      console.error('Error al obtener usuarios:', error);
      throw { 
        error: error.response?.data?.error || 
               error.response?.data?.detail || 
               'Error al obtener usuarios' 
      };
    }
  },

  /**
   * Obtener usuario por ID
   * GET /api/users/{id}/
   */
  async getById(id) {
    try {
      const response = await api.get(`/users/${id}/`);
      return response.data;
    } catch (error) {
      console.error('Error al obtener usuario:', error);
      throw { 
        error: error.response?.data?.error || 
               error.response?.data?.detail || 
               'Error al obtener usuario' 
      };
    }
  },

  /**
   * Obtener usuario actual (perfil propio)
   * GET /api/users/me/
   */
  async getMe() {
    try {
      const response = await api.get('/users/me/');
      return response.data;
    } catch (error) {
      console.error('Error al obtener perfil:', error);
      throw { 
        error: error.response?.data?.error || 
               error.response?.data?.detail || 
               'Error al obtener perfil' 
      };
    }
  },

  /**
   * Crear nuevo usuario (admin crea empleado)
   * POST /api/users/
   */
  async create(userData) {
    try {
      // Enviar los datos tal como vienen, el backend validará
      const response = await api.post('/users/', userData);
      return response.data;
    } catch (error) {
      console.error('Error al crear usuario:', error);
      console.error('Error response:', error.response?.data);
      
      // Manejar errores de validación específicos
      const errorData = error.response?.data || {};
      let errorMsg = 'Error al crear usuario';
      
      // Extraer mensajes de error específicos por campo
      if (errorData.username) {
        errorMsg = Array.isArray(errorData.username) 
          ? `Usuario: ${errorData.username[0]}` 
          : `Usuario: ${errorData.username}`;
      } else if (errorData.email) {
        errorMsg = Array.isArray(errorData.email)
          ? `Email: ${errorData.email[0]}`
          : `Email: ${errorData.email}`;
      } else if (errorData.password) {
        errorMsg = Array.isArray(errorData.password)
          ? `Contraseña: ${errorData.password[0]}`
          : `Contraseña: ${errorData.password}`;
      } else if (errorData.role) {
        errorMsg = Array.isArray(errorData.role)
          ? `Rol: ${errorData.role[0]}`
          : `Rol: ${errorData.role}`;
      } else if (errorData.error) {
        errorMsg = errorData.error;
      } else if (errorData.detail) {
        errorMsg = errorData.detail;
      } else if (errorData.non_field_errors) {
        errorMsg = Array.isArray(errorData.non_field_errors)
          ? errorData.non_field_errors[0]
          : errorData.non_field_errors;
      }
      
      throw { 
        error: errorMsg,
        validationErrors: errorData 
      };
    }
  },

  /**
   * Actualizar usuario completo
   * PUT /api/users/{id}/
   */
  async update(id, userData) {
    try {
      const response = await api.put(`/users/${id}/`, userData);
      return response.data;
    } catch (error) {
      console.error('Error al actualizar usuario:', error);
      
      const errorData = error.response?.data || {};
      let errorMsg = 'Error al actualizar usuario';
      
      if (errorData.error) {
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
   * Actualización parcial de usuario
   * PATCH /api/users/{id}/
   */
  async partialUpdate(id, userData) {
    try {
      const response = await api.patch(`/users/${id}/`, userData);
      return response.data;
    } catch (error) {
      console.error('Error al actualizar usuario:', error);
      
      const errorData = error.response?.data || {};
      let errorMsg = 'Error al actualizar usuario';
      
      if (errorData.error) {
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
   * Eliminar usuario
   * DELETE /api/users/{id}/
   */
  async delete(id) {
    try {
      await api.delete(`/users/${id}/`);
      return { success: true, message: 'Usuario eliminado correctamente' };
    } catch (error) {
      console.error('Error al eliminar usuario:', error);
      throw { 
        error: error.response?.data?.error || 
               error.response?.data?.detail || 
               'Error al eliminar usuario' 
      };
    }
  },

  /**
   * Obtener actividad del usuario
   * GET /api/users/{id}/activity/
   */
  async getActivity(id, params = {}) {
    try {
      const response = await api.get(`/users/${id}/activity/`, { params });
      return response.data;
    } catch (error) {
      console.error('Error al obtener actividad:', error);
      throw { 
        error: error.response?.data?.error || 
               error.response?.data?.detail || 
               'Error al obtener actividad del usuario' 
      };
    }
  },

  /**
   * Obtener roles disponibles
   * GET /api/roles/
   */
  async getRoles() {
    try {
      const response = await api.get('/roles/');
      // ✅ Manejar respuesta paginada o directa
      return Array.isArray(response.data) 
        ? response.data 
        : (response.data.results || response.data || []);
    } catch (error) {
      console.error('Error al obtener roles:', error);
      throw { 
        error: error.response?.data?.error || 
               'Error al obtener roles' 
      };
    }
  },

  /**
   * Buscar usuarios por nombre o email
   * GET /api/users/?search=query
   */
  async search(query) {
    try {
      const response = await api.get('/users/', {
        params: { search: query }
      });
      // ✅ Manejar respuesta paginada o directa
      return Array.isArray(response.data) 
        ? response.data 
        : (response.data.results || []);
    } catch (error) {
      console.error('Error en la búsqueda:', error);
      throw { 
        error: error.response?.data?.error || 
               'Error al buscar usuarios' 
      };
    }
  },

  /**
   * Obtener solo empleados (filtrado por rol)
   * GET /api/users/?role=2
   */
  async getEmployees() {
    try {
      const response = await api.get('/users/', {
        params: { role: 2 } // 2 = empleado
      });
      // ✅ Manejar respuesta paginada o directa
      return Array.isArray(response.data) 
        ? response.data 
        : (response.data.results || []);
    } catch (error) {
      console.error('Error al obtener empleados:', error);
      throw { 
        error: error.response?.data?.error || 
               'Error al obtener empleados' 
      };
    }
  },

  /**
   * Cambiar contraseña de un usuario
   * PATCH /api/users/{id}/
   */
  async changePassword(id, newPassword) {
    try {
      const response = await api.patch(`/users/${id}/`, {
        password: newPassword
      });
      return response.data;
    } catch (error) {
      console.error('Error al cambiar contraseña:', error);
      throw { 
        error: error.response?.data?.password?.[0] || 
               error.response?.data?.error || 
               'Error al cambiar contraseña' 
      };
    }
  },

  /**
   * Cambiar rol de un usuario (solo admin)
   * PATCH /api/users/{id}/
   */
  async changeRole(id, roleId) {
    try {
      const response = await api.patch(`/users/${id}/`, {
        role: roleId
      });
      return response.data;
    } catch (error) {
      console.error('Error al cambiar rol:', error);
      throw { 
        error: error.response?.data?.error || 
               'Error al cambiar rol del usuario' 
      };
    }
  },

  /**
   * Obtener estadísticas de un usuario
   * GET /api/users/{id}/activity/
   */
  async getStatistics(id) {
    try {
      const response = await api.get(`/users/${id}/activity/`);
      return {
        salesCount: response.data.sales_count || 0,
        totalSales: response.data.total_sales_amount || 0,
        productsCreated: response.data.products_created || 0,
        recentSales: response.data.recent_sales || [],
        recentActivity: response.data.recent_activity || []
      };
    } catch (error) {
      console.error('Error al obtener estadísticas:', error);
      throw { 
        error: error.response?.data?.error || 
               'Error al obtener estadísticas del usuario' 
      };
    }
  }
};

export default userService;