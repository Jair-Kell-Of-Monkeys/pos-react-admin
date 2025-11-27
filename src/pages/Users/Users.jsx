// src/pages/Users/Users.jsx
import React, { useState, useEffect } from 'react';
import { userService, saleService } from '../../api';
import toast, { Toaster } from 'react-hot-toast';
import './Users.css';

const Users = () => {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeView, setActiveView] = useState('list');
  
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    first_name: '',
    last_name: ''
  });
  
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [employeeSales, setEmployeeSales] = useState([]);
  const [employeeStats, setEmployeeStats] = useState(null);
  
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [employeeToDelete, setEmployeeToDelete] = useState(null);

  useEffect(() => {
    loadEmployees();
  }, []);

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
      const employee = await userService.getById(employeeId);
      setSelectedEmployee(employee);

      const stats = await userService.getActivity(employeeId);
      setEmployeeStats(stats);

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

  const handleCreateEmployee = async (e) => {
    e.preventDefault();
    
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
      await userService.create({
        ...formData,
        role: 2
      });

      toast.success('✅ Empleado creado exitosamente', { id: loadingToast });
      
      setFormData({
        username: '',
        email: '',
        password: '',
        first_name: '',
        last_name: ''
      });
      
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
      
      await loadEmployees();
      
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

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
    }).format(amount || 0);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('es-MX', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const openDeleteModal = (employee) => {
    setEmployeeToDelete(employee);
    setShowDeleteModal(true);
  };

  return (
    <div className="users-container">
      <Toaster position="top-right" />

      {/* Header */}
      <div className="users-header">
        <div className="header-content">
          <h1 className="header-title">
            <i className='bx bxs-group'></i>
            Gestión de Empleados
          </h1>
          <p className="subtitle">Administra tu equipo de trabajo</p>
        </div>
        
        {activeView === 'list' && (
          <button 
            onClick={() => setActiveView('create')}
            className="btn-primary"
            disabled={loading}
          >
            <i className='bx bx-user-plus'></i>
            <span>Agregar Empleado</span>
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
            <i className='bx bx-arrow-back'></i>
            <span>Volver a la lista</span>
          </button>
        )}
      </div>

      {/* VISTA: LISTA DE EMPLEADOS */}
      {activeView === 'list' && (
        <div className="employees-list">
          {loading ? (
            <div className="loading-state">
              <div className="spinner"></div>
              <p>Cargando empleados...</p>
            </div>
          ) : employees.length === 0 ? (
            <div className="empty-state">
              <i className='bx bxs-user-x empty-icon'></i>
              <h3>No tienes empleados registrados</h3>
              <p>Comienza agregando tu primer empleado para gestionar tu equipo</p>
              <button 
                onClick={() => setActiveView('create')}
                className="btn-primary"
              >
                <i className='bx bx-user-plus'></i>
                Agregar Primer Empleado
              </button>
            </div>
          ) : (
            <div className="employees-grid">
              {employees.map((employee) => (
                <div key={employee.id} className="employee-card">
                  <div className="employee-avatar">
                    <span className="avatar-letter">
                      {employee.first_name?.[0] || employee.username?.[0] || '?'}
                    </span>
                  </div>
                  
                  <div className="employee-info">
                    <h3>{employee.first_name} {employee.last_name}</h3>
                    <p className="employee-username">
                      <i className='bx bx-at'></i>
                      {employee.username}
                    </p>
                    <p className="employee-email">
                      <i className='bx bx-envelope'></i>
                      {employee.email}
                    </p>
                  </div>

                  <div className="employee-actions">
                    <button 
                      onClick={() => loadEmployeeDetails(employee.id)}
                      className="btn-icon primary"
                      title="Ver detalles"
                    >
                      <i className='bx bx-show'></i>
                    </button>
                    <button 
                      onClick={() => handleResetPassword(employee.id)}
                      className="btn-icon warning"
                      title="Cambiar contraseña"
                    >
                      <i className='bx bx-key'></i>
                      <span>Contraseña</span>
                    </button>
                    <button 
                      onClick={() => openDeleteModal(employee)}
                      className="btn-icon danger"
                      title="Eliminar empleado"
                    >
                      <i className='bx bx-trash'></i>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* VISTA: CREAR EMPLEADO */}
      {activeView === 'create' && (
        <div className="create-employee">
          <div className="form-container">
            <h2>
              <i className='bx bxs-user-plus'></i>
              Agregar Nuevo Empleado
            </h2>
            <p className="form-description">
              Complete los datos del nuevo empleado. Se le asignará automáticamente el rol de empleado.
            </p>

            <form onSubmit={handleCreateEmployee}>
              <div className="form-row">
                <div className="form-group">
                  <label>
                    <i className='bx bx-user'></i>
                    Nombre de usuario *
                  </label>
                  <input
                    type="text"
                    value={formData.username}
                    onChange={(e) => setFormData({...formData, username: e.target.value})}
                    placeholder="usuario123"
                    required
                  />
                </div>

                <div className="form-group">
                  <label>
                    <i className='bx bx-envelope'></i>
                    Email *
                  </label>
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
                  <label>
                    <i className='bx bx-id-card'></i>
                    Nombre
                  </label>
                  <input
                    type="text"
                    value={formData.first_name}
                    onChange={(e) => setFormData({...formData, first_name: e.target.value})}
                    placeholder="Juan"
                  />
                </div>

                <div className="form-group">
                  <label>
                    <i className='bx bx-id-card'></i>
                    Apellido
                  </label>
                  <input
                    type="text"
                    value={formData.last_name}
                    onChange={(e) => setFormData({...formData, last_name: e.target.value})}
                    placeholder="Pérez"
                  />
                </div>
              </div>

              <div className="form-group">
                <label>
                  <i className='bx bx-lock-alt'></i>
                  Contraseña *
                </label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({...formData, password: e.target.value})}
                  placeholder="Mínimo 6 caracteres"
                  required
                  minLength={6}
                />
                <small>
                  <i className='bx bx-info-circle'></i>
                  La contraseña debe tener al menos 6 caracteres
                </small>
              </div>

              <div className="form-actions">
                <button 
                  type="button"
                  onClick={() => setActiveView('list')}
                  className="btn-secondary"
                  disabled={loading}
                >
                  <i className='bx bx-x'></i>
                  Cancelar
                </button>
                <button 
                  type="submit"
                  className="btn-primary"
                  disabled={loading}
                >
                  <i className='bx bx-check'></i>
                  {loading ? 'Creando...' : 'Crear Empleado'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* VISTA: DETALLES DEL EMPLEADO */}
      {activeView === 'detail' && selectedEmployee && (
        <div className="employee-detail">
          {/* Información del empleado */}
          <div className="detail-header">
            <div className="detail-avatar">
              <i className='bx bxs-user-circle avatar-bg-icon'></i>
              <span className="avatar-letter">
                {selectedEmployee.first_name?.[0] || selectedEmployee.username?.[0] || '?'}
              </span>
            </div>
            <div className="detail-info">
              <h2>{selectedEmployee.first_name} {selectedEmployee.last_name}</h2>
              <p className="detail-username">
                <i className='bx bx-at'></i>
                {selectedEmployee.username}
              </p>
              <p className="detail-email">
                <i className='bx bx-envelope'></i>
                {selectedEmployee.email}
              </p>
            </div>
          </div>

          {/* Estadísticas del empleado */}
          {employeeStats && (
            <div className="employee-stats">
              <h3>
                <i className='bx bxs-bar-chart-alt-2'></i>
                Estadísticas
              </h3>
              <div className="stats-grid">
                <div className="stat-card">
                  <div className="stat-icon-wrapper success">
                    <i className='bx bxs-dollar-circle'></i>
                  </div>
                  <div className="stat-content">
                    <p className="stat-label">Total Vendido</p>
                    <p className="stat-value">{formatCurrency(employeeStats.total_sales_amount)}</p>
                  </div>
                </div>

                <div className="stat-card">
                  <div className="stat-icon-wrapper primary">
                    <i className='bx bxs-shopping-bags'></i>
                  </div>
                  <div className="stat-content">
                    <p className="stat-label">Ventas Realizadas</p>
                    <p className="stat-value">{employeeStats.sales_count}</p>
                  </div>
                </div>

                <div className="stat-card">
                  <div className="stat-icon-wrapper info">
                    <i className='bx bxs-trending-up'></i>
                  </div>
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
            <h3>
              <i className='bx bxs-cart'></i>
              Ventas Recientes
            </h3>
            
            {loading ? (
              <div className="loading-state">
                <div className="spinner"></div>
                <p>Cargando ventas...</p>
              </div>
            ) : employeeSales.length === 0 ? (
              <div className="empty-state-small">
                <i className='bx bx-cart-download'></i>
                <p>Este empleado aún no ha realizado ventas</p>
              </div>
            ) : (
              <div className="table-wrapper">
                <table className="users-sales-table">
                  <thead>
                    <tr>
                      <th><i className='bx bx-hash'></i> ID</th>
                      <th><i className='bx bx-calendar'></i> Fecha</th>
                      <th><i className='bx bx-dollar'></i> Total</th>
                      <th><i className='bx bx-credit-card'></i> Método de Pago</th>
                      <th><i className='bx bx-info-circle'></i> Estado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {employeeSales.map((sale) => (
                      <tr key={sale.id}>
                        <td>
                          <span className="id-badge">#{sale.id}</span>
                        </td>
                        <td className="date-cell">
                          <i className='bx bx-time-five'></i>
                          {formatDate(sale.date)}
                        </td>
                        <td className="amount">{formatCurrency(sale.total_price)}</td>
                        <td>
                          <span className={`payment-method ${sale.payment_method || 'efectivo'}`}>
                            {(sale.payment_method === 'efectivo' || !sale.payment_method) && <i className='bx bx-money'></i>}
                            {sale.payment_method === 'tarjeta' && <i className='bx bx-credit-card'></i>}
                            {sale.payment_method === 'transferencia' && <i className='bx bx-transfer'></i>}
                            {sale.payment_method || 'Efectivo'}
                          </span>
                        </td>
                        <td>
                          {sale.is_cancelled ? (
                            <span className="status-badge cancelled">
                              <i className='bx bx-x-circle'></i>
                              Cancelada
                            </span>
                          ) : (
                            <span className="status-badge active">
                              <i className='bx bx-check-circle'></i>
                              Completada
                            </span>
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

      {/* MODAL: CONFIRMAR ELIMINACIÓN */}
      {showDeleteModal && employeeToDelete && (
        <div className="modal-overlay" onClick={() => setShowDeleteModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>
                <i className='bx bxs-error-circle'></i>
                Confirmar Eliminación
              </h3>
              <button onClick={() => setShowDeleteModal(false)} className="btn-close">
                <i className='bx bx-x'></i>
              </button>
            </div>
            
            <div className="modal-body">
              <p>¿Estás seguro de que deseas eliminar al empleado?</p>
              <div className="employee-to-delete">
                <i className='bx bxs-user-circle employee-icon'></i>
                <div>
                  <strong>{employeeToDelete.first_name} {employeeToDelete.last_name}</strong>
                  <small>
                    <i className='bx bx-at'></i>
                    {employeeToDelete.username}
                  </small>
                </div>
              </div>
              <p className="warning-text">
                <i className='bx bx-error-alt'></i>
                Esta acción no se puede deshacer. El empleado ya no podrá acceder al sistema.
              </p>
            </div>

            <div className="modal-actions">
              <button 
                onClick={() => setShowDeleteModal(false)}
                className="btn-secondary"
                disabled={loading}
              >
                <i className='bx bx-x'></i>
                Cancelar
              </button>
              <button 
                onClick={handleDeleteEmployee}
                className="btn-danger"
                disabled={loading}
              >
                <i className='bx bx-trash'></i>
                {loading ? 'Eliminando...' : 'Eliminar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Users;