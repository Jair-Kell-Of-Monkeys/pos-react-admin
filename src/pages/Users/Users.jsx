// src/pages/Users/Users.jsx
import React, { useState, useEffect } from 'react';
import { userService, saleService } from '../../api';
import toast, { Toaster } from 'react-hot-toast';
import './Users.css';

const Users = () => {
  // Estados principales
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeView, setActiveView] = useState('list'); // list, create, detail
  
  // Estados para crear/editar empleado
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    first_name: '',
    last_name: ''
  });
  
  // Estado para empleado seleccionado
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [employeeSales, setEmployeeSales] = useState([]);
  const [employeeStats, setEmployeeStats] = useState(null);
  
  // Estado para modal de confirmación
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [employeeToDelete, setEmployeeToDelete] = useState(null);

  useEffect(() => {
    loadEmployees();
  }, []);

  // ========== CARGAR DATOS ==========

  const loadEmployees = async () => {
    setLoading(true);
    try {
      const data = await userService.getEmployees();
      console.log('👥 Empleados cargados:', data);
      setEmployees(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error al cargar empleados:', error);
      toast.error(error.error || 'Error al cargar empleados');
      setEmployees([]);
    } finally {
      setLoading(false);
    }
  };

  const loadEmployeeDetails = async (employeeId) => {
    setLoading(true);
    try {
      // Cargar datos del empleado
      const employee = await userService.getById(employeeId);
      setSelectedEmployee(employee);

      // Cargar estadísticas del empleado
      const stats = await userService.getActivity(employeeId);
      setEmployeeStats(stats);

      // Cargar ventas del empleado
      const sales = await saleService.getByUser(employeeId);
      setEmployeeSales(Array.isArray(sales) ? sales : (sales.results || []));

      setActiveView('detail');
    } catch (error) {
      console.error('Error al cargar detalles del empleado:', error);
      toast.error(error.error || 'Error al cargar información del empleado');
    } finally {
      setLoading(false);
    }
  };

  // ========== ACCIONES CRUD ==========

  const handleCreateEmployee = async (e) => {
    e.preventDefault();
    
    // Validaciones
    if (!formData.username || !formData.email || !formData.password) {
      toast.error('Por favor completa todos los campos obligatorios');
      return;
    }

    if (formData.password.length < 6) {
      toast.error('La contraseña debe tener al menos 6 caracteres');
      return;
    }

    setLoading(true);
    const loadingToast = toast.loading('Creando empleado...');

    try {
      // El backend asignará automáticamente el rol de empleado y el manager actual
      await userService.create({
        ...formData,
        role: 2 // 2 = empleado
      });

      toast.success('✅ Empleado creado exitosamente', { id: loadingToast });
      
      // Limpiar formulario
      setFormData({
        username: '',
        email: '',
        password: '',
        first_name: '',
        last_name: ''
      });
      
      // Recargar lista y volver a la vista principal
      await loadEmployees();
      setActiveView('list');
      
    } catch (error) {
      console.error('Error al crear empleado:', error);
      toast.error(error.error || 'Error al crear empleado', { id: loadingToast });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteEmployee = async () => {
    if (!employeeToDelete) return;

    setLoading(true);
    const loadingToast = toast.loading('Eliminando empleado...');

    try {
      await userService.delete(employeeToDelete.id);
      toast.success('✅ Empleado eliminado exitosamente', { id: loadingToast });
      
      setShowDeleteModal(false);
      setEmployeeToDelete(null);
      
      // Recargar lista
      await loadEmployees();
      
      // Si estábamos viendo los detalles del empleado eliminado, volver a la lista
      if (selectedEmployee?.id === employeeToDelete.id) {
        setActiveView('list');
        setSelectedEmployee(null);
      }
      
    } catch (error) {
      console.error('Error al eliminar empleado:', error);
      toast.error(error.error || 'Error al eliminar empleado', { id: loadingToast });
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (employeeId) => {
    const newPassword = prompt('Ingresa la nueva contraseña para el empleado:');
    
    if (!newPassword) return;
    
    if (newPassword.length < 6) {
      toast.error('La contraseña debe tener al menos 6 caracteres');
      return;
    }

    setLoading(true);
    const loadingToast = toast.loading('Cambiando contraseña...');

    try {
      await userService.changePassword(employeeId, newPassword);
      toast.success('✅ Contraseña actualizada exitosamente', { id: loadingToast });
    } catch (error) {
      console.error('Error al cambiar contraseña:', error);
      toast.error(error.error || 'Error al cambiar contraseña', { id: loadingToast });
    } finally {
      setLoading(false);
    }
  };

  // ========== UTILIDADES ==========

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN'
    }).format(amount || 0);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('es-MX', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const openDeleteModal = (employee) => {
    setEmployeeToDelete(employee);
    setShowDeleteModal(true);
  };

  // ========== RENDER ==========

  return (
    <div className="users-container">
      <Toaster position="top-right" />

      {/* Header */}
      <div className="users-header">
        <div>
          <h1>👥 Gestión de Empleados</h1>
          <p>Administra tu equipo de trabajo</p>
        </div>
        
        {activeView === 'list' && (
          <button 
            onClick={() => setActiveView('create')}
            className="btn-primary"
            disabled={loading}
          >
            ➕ Agregar Empleado
          </button>
        )}
        
        {activeView !== 'list' && (
          <button 
            onClick={() => {
              setActiveView('list');
              setSelectedEmployee(null);
              setFormData({
                username: '',
                email: '',
                password: '',
                first_name: '',
                last_name: ''
              });
            }}
            className="btn-secondary"
          >
            ← Volver a la lista
          </button>
        )}
      </div>

      {/* ========== VISTA: LISTA DE EMPLEADOS ========== */}
      {activeView === 'list' && (
        <div className="employees-list">
          {loading ? (
            <div className="loading-state">
              <div className="spinner"></div>
              <p>Cargando empleados...</p>
            </div>
          ) : employees.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">👥</div>
              <h3>No tienes empleados registrados</h3>
              <p>Comienza agregando tu primer empleado para gestionar tu equipo</p>
              <button 
                onClick={() => setActiveView('create')}
                className="btn-primary"
              >
                ➕ Agregar Primer Empleado
              </button>
            </div>
          ) : (
            <div className="employees-grid">
              {employees.map((employee) => (
                <div key={employee.id} className="employee-card">
                  <div className="employee-avatar">
                    {employee.first_name?.[0] || employee.username?.[0] || '?'}
                  </div>
                  
                  <div className="employee-info">
                    <h3>{employee.first_name} {employee.last_name}</h3>
                    <p className="employee-username">@{employee.username}</p>
                    <p className="employee-email">{employee.email}</p>
                  </div>

                  <div className="employee-actions">
                    <button 
                      onClick={() => loadEmployeeDetails(employee.id)}
                      className="btn-view"
                      title="Ver detalles"
                    >
                      👁️ Ver Detalles
                    </button>
                    <button 
                      onClick={() => handleResetPassword(employee.id)}
                      className="btn-reset"
                      title="Cambiar contraseña"
                    >
                      🔑 Contraseña
                    </button>
                    <button 
                      onClick={() => openDeleteModal(employee)}
                      className="btn-delete"
                      title="Eliminar empleado"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ========== VISTA: CREAR EMPLEADO ========== */}
      {activeView === 'create' && (
        <div className="create-employee">
          <div className="form-container">
            <h2>➕ Agregar Nuevo Empleado</h2>
            <p className="form-description">
              Complete los datos del nuevo empleado. Se le asignará automáticamente el rol de empleado.
            </p>

            <form onSubmit={handleCreateEmployee}>
              <div className="form-row">
                <div className="form-group">
                  <label>Nombre de usuario *</label>
                  <input
                    type="text"
                    value={formData.username}
                    onChange={(e) => setFormData({...formData, username: e.target.value})}
                    placeholder="usuario123"
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Email *</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    placeholder="empleado@ejemplo.com"
                    required
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Nombre</label>
                  <input
                    type="text"
                    value={formData.first_name}
                    onChange={(e) => setFormData({...formData, first_name: e.target.value})}
                    placeholder="Juan"
                  />
                </div>

                <div className="form-group">
                  <label>Apellido</label>
                  <input
                    type="text"
                    value={formData.last_name}
                    onChange={(e) => setFormData({...formData, last_name: e.target.value})}
                    placeholder="Pérez"
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Contraseña *</label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({...formData, password: e.target.value})}
                  placeholder="Mínimo 6 caracteres"
                  required
                  minLength={6}
                />
                <small>La contraseña debe tener al menos 6 caracteres</small>
              </div>

              <div className="form-actions">
                <button 
                  type="button"
                  onClick={() => setActiveView('list')}
                  className="btn-secondary"
                  disabled={loading}
                >
                  Cancelar
                </button>
                <button 
                  type="submit"
                  className="btn-primary"
                  disabled={loading}
                >
                  {loading ? 'Creando...' : '✓ Crear Empleado'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========== VISTA: DETALLES DEL EMPLEADO ========== */}
      {activeView === 'detail' && selectedEmployee && (
        <div className="employee-detail">
          {/* Información del empleado */}
          <div className="detail-header">
            <div className="detail-avatar">
              {selectedEmployee.first_name?.[0] || selectedEmployee.username?.[0] || '?'}
            </div>
            <div className="detail-info">
              <h2>{selectedEmployee.first_name} {selectedEmployee.last_name}</h2>
              <p className="detail-username">@{selectedEmployee.username}</p>
              <p className="detail-email">{selectedEmployee.email}</p>
            </div>
          </div>

          {/* Estadísticas del empleado */}
          {employeeStats && (
            <div className="employee-stats">
              <h3>📊 Estadísticas</h3>
              <div className="stats-grid">
                <div className="stat-card">
                  <div className="stat-icon">💰</div>
                  <div className="stat-content">
                    <p className="stat-label">Total Vendido</p>
                    <p className="stat-value">{formatCurrency(employeeStats.total_sales_amount)}</p>
                  </div>
                </div>

                <div className="stat-card">
                  <div className="stat-icon">🛒</div>
                  <div className="stat-content">
                    <p className="stat-label">Ventas Realizadas</p>
                    <p className="stat-value">{employeeStats.sales_count}</p>
                  </div>
                </div>

                <div className="stat-card">
                  <div className="stat-icon">📈</div>
                  <div className="stat-content">
                    <p className="stat-label">Promedio por Venta</p>
                    <p className="stat-value">
                      {employeeStats.sales_count > 0
                        ? formatCurrency(employeeStats.total_sales_amount / employeeStats.sales_count)
                        : formatCurrency(0)}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Ventas del empleado */}
          <div className="employee-sales">
            <h3>🛒 Ventas Recientes</h3>
            
            {loading ? (
              <div className="loading-state">
                <div className="spinner"></div>
                <p>Cargando ventas...</p>
              </div>
            ) : employeeSales.length === 0 ? (
              <div className="empty-state-small">
                <p>Este empleado aún no ha realizado ventas</p>
              </div>
            ) : (
              <div className="sales-table">
                <table>
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Fecha</th>
                      <th>Total</th>
                      <th>Método de Pago</th>
                      <th>Estado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {employeeSales.map((sale) => (
                      <tr key={sale.id}>
                        <td>#{sale.id}</td>
                        <td>{formatDate(sale.date)}</td>
                        <td className="amount">{formatCurrency(sale.total_price)}</td>
                        <td>
                          <span className={`payment-method ${sale.payment_method}`}>
                            {sale.payment_method === 'efectivo' && '💵'}
                            {sale.payment_method === 'tarjeta' && '💳'}
                            {sale.payment_method === 'transferencia' && '🏦'}
                            {' '}
                            {sale.payment_method || 'N/A'}
                          </span>
                        </td>
                        <td>
                          {sale.is_cancelled ? (
                            <span className="status-badge cancelled">❌ Cancelada</span>
                          ) : (
                            <span className="status-badge active">✅ Completada</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========== MODAL: CONFIRMAR ELIMINACIÓN ========== */}
      {showDeleteModal && employeeToDelete && (
        <div className="modal-overlay" onClick={() => setShowDeleteModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>⚠️ Confirmar Eliminación</h3>
            </div>
            
            <div className="modal-body">
              <p>¿Estás seguro de que deseas eliminar al empleado?</p>
              <div className="employee-to-delete">
                <strong>{employeeToDelete.first_name} {employeeToDelete.last_name}</strong>
                <small>@{employeeToDelete.username}</small>
              </div>
              <p className="warning-text">
                Esta acción no se puede deshacer. El empleado ya no podrá acceder al sistema.
              </p>
            </div>

            <div className="modal-actions">
              <button 
                onClick={() => setShowDeleteModal(false)}
                className="btn-secondary"
                disabled={loading}
              >
                Cancelar
              </button>
              <button 
                onClick={handleDeleteEmployee}
                className="btn-danger"
                disabled={loading}
              >
                {loading ? 'Eliminando...' : '🗑️ Eliminar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Users;