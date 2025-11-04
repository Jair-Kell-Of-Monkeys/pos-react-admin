import api from './axios.config';

const systemService = {
  /**
   * Crear respaldo de la base de datos (solo admin)
   * POST /api/system/backup/
   */
  async createBackup() {
    try {
      const response = await api.post('/system/backup/');
      return response.data;
    } catch (error) {
      console.error('Error al crear respaldo:', error);
      throw { 
        error: error.response?.data?.error || 
               error.response?.data?.detail || 
               'Error al crear respaldo del sistema' 
      };
    }
  },

  /**
   * Verificar estado de salud del sistema
   * GET /api/system/health/
   * No requiere autenticación
   */
  async healthCheck() {
    try {
      const response = await api.get('/system/health/');
      return response.data;
    } catch (error) {
      console.error('Error al verificar salud del sistema:', error);
      
      // Si el sistema está caído, devolver el error con información
      return {
        status: 'unhealthy',
        error: error.response?.data?.error || 'Sistema no disponible',
        components: error.response?.data?.components || {}
      };
    }
  },

  /**
   * Obtener información del sistema
   * Útil para dashboard de administrador
   */
  async getSystemInfo() {
    try {
      const health = await this.healthCheck();
      
      return {
        health: health.status,
        components: health.components || {},
        timestamp: health.timestamp || new Date().toISOString(),
        isHealthy: health.status === 'healthy'
      };
    } catch (error) {
      console.error('Error al obtener información del sistema:', error);
      throw { 
        error: 'Error al obtener información del sistema' 
      };
    }
  },

  /**
   * Verificar si el sistema está operativo
   * Retorna true/false
   */
  async isSystemHealthy() {
    try {
      const health = await this.healthCheck();
      return health.status === 'healthy';
    } catch (error) {
      console.error('Sistema no saludable:', error);
      return false;
    }
  },

  /**
   * Obtener lista de respaldos disponibles (si el backend lo soporta)
   * Esta función es opcional y depende de si implementas el endpoint
   */
  async getBackups() {
    try {
      const response = await api.get('/system/backups/');
      return Array.isArray(response.data) 
        ? response.data 
        : (response.data.results || []);
    } catch (error) {
      console.error('Error al obtener respaldos:', error);
      throw { 
        error: error.response?.data?.error || 
               'Error al obtener lista de respaldos' 
      };
    }
  },

  /**
   * Restaurar un respaldo (si el backend lo soporta)
   * Esta función es opcional
   */
  async restoreBackup(backupId) {
    try {
      const response = await api.post(`/system/restore/${backupId}/`);
      return response.data;
    } catch (error) {
      console.error('Error al restaurar respaldo:', error);
      throw { 
        error: error.response?.data?.error || 
               'Error al restaurar respaldo' 
      };
    }
  },

  /**
   * Verificar estado de los componentes del sistema
   * Retorna el estado de cada componente
   */
  async getComponentsStatus() {
    try {
      const health = await this.healthCheck();
      
      const components = health.components || {};
      const status = {
        database: components.database || 'unknown',
        mediaQrCodes: components.media_qr_codes || 'unknown',
        mediaBarcodes: components.media_barcodes || 'unknown',
        overall: health.status || 'unknown'
      };
      
      return status;
    } catch (error) {
      console.error('Error al obtener estado de componentes:', error);
      throw { 
        error: 'Error al obtener estado de componentes' 
      };
    }
  },

  /**
   * Ejecutar diagnóstico completo del sistema
   * Útil para troubleshooting
   */
  async runDiagnostics() {
    try {
      const results = {
        timestamp: new Date().toISOString(),
        tests: {}
      };
      
      // Test 1: Health check
      try {
        const health = await this.healthCheck();
        results.tests.healthCheck = {
          status: health.status === 'healthy' ? 'pass' : 'fail',
          data: health
        };
      } catch (error) {
        results.tests.healthCheck = {
          status: 'fail',
          error: error.message
        };
      }
      
      // Test 2: API connectivity
      try {
        await api.get('/system/health/');
        results.tests.apiConnectivity = {
          status: 'pass',
          message: 'API respondiendo correctamente'
        };
      } catch (error) {
        results.tests.apiConnectivity = {
          status: 'fail',
          error: 'API no disponible'
        };
      }
      
      // Determinar estado general
      const allPassed = Object.values(results.tests).every(
        test => test.status === 'pass'
      );
      
      results.overallStatus = allPassed ? 'healthy' : 'unhealthy';
      
      return results;
    } catch (error) {
      console.error('Error al ejecutar diagnósticos:', error);
      throw { 
        error: 'Error al ejecutar diagnósticos del sistema' 
      };
    }
  }
};

export default systemService;