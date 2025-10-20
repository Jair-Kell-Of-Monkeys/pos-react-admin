import api from './axios.config';

const userService = {
  /**
   * Listar usuarios
   * GET /api/users/
   */
  async getAll(params = {}) {
    try {
      const response = await api.get('/users/', { params });
      return response.data;
    } catch (error) {
      throw { error: 'Error al obtener usuarios' };
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
      throw { error: 'Error al obtener usuario' };
    }
  },

  /**
   * Obtener usuario actual (yo)
   * GET /api/users/me/
   */
  async getMe() {
    try {
      const response = await api.get('/users/me/');
      return response.data;
    } catch (error) {
      throw { error: 'Error al obtener perfil' };
    }
  },

  /**
   * Crear usuario
   * POST /api/users/
   */
  async create(userData) {
    try {
      const response = await api.post('/users/', userData);
      return response.data;
    } catch (error) {
      const errorMsg = error.response?.data?.error || 
                      error.response?.data?.detail ||
                      'Error al crear usuario';
      throw { 
        error: errorMsg,
        validationErrors: error.response?.data 
      };
    }
  },

  /**
   * Actualizar usuario (completo)
   * PUT /api/users/{id}/
   */
  async update(id, userData) {
    try {
      const response = await api.put(`/users/${id}/`, userData);
      return response.data;
    } catch (error) {
      const errorMsg = error.response?.data?.error || 
                      'Error al actualizar usuario';
      throw { 
        error: errorMsg,
        validationErrors: error.response?.data 
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
      throw { error: 'Error al actualizar usuario' };
    }
  },

  /**
   * Eliminar usuario
   * DELETE /api/users/{id}/
   */
  async delete(id) {
    try {
      await api.delete(`/users/${id}/`);
      return { success: true };
    } catch (error) {
      throw { error: 'Error al eliminar usuario' };
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
      throw { error: 'Error al obtener actividad' };
    }
  },

  /**
   * Obtener roles disponibles
   * GET /api/roles/
   */
  async getRoles() {
    try {
      const response = await api.get('/roles/');
      return response.data;
    } catch (error) {
      throw { error: 'Error al obtener roles' };
    }
  },

  /**
   * Buscar usuarios
   */
  async search(query) {
    try {
      const response = await api.get('/users/', {
        params: { search: query }
      });
      return response.data;
    } catch (error) {
      throw { error: 'Error en la búsqueda' };
    }
  }
};

export default userService;