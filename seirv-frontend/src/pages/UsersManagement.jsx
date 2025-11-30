import { useEffect, useState } from 'react';
import { userService } from '../services/api';
import Loading from '../components/Loading';
import './UsersManagement.scss';

export default function UsersManagement() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [editingUser, setEditingUser] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      const data = await userService.getAll(0, 100);
      setUsers(data || []);
    } catch (err) {
      console.error('Error al cargar usuarios:', err);
      const errorMessage = err.response?.data?.detail || err.message || 'Error al cargar los usuarios';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (user) => {
    setEditingUser({ ...user });
    setShowEditModal(true);
  };

  const handleSave = async () => {
    if (!editingUser) return;
    
    setSaving(true);
    setError('');
    setSuccess('');
    
    try {
      await userService.update(editingUser.id, {
        email: editingUser.email,
        full_name: editingUser.full_name,
        role: editingUser.role,
        is_active: editingUser.is_active,
      });
      setSuccess('Usuario actualizado exitosamente');
      setShowEditModal(false);
      setEditingUser(null);
      await loadUsers();
      // Limpiar el mensaje de éxito después de 3 segundos
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('Error al actualizar usuario:', err);
      const errorMessage = err.response?.data?.detail || 'Error al actualizar el usuario';
      setError(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('¿Seguro que deseas eliminar este usuario? Esta acción no se puede deshacer.')) return;
    
    setError('');
    setSuccess('');
    
    try {
      await userService.delete(id);
      setSuccess('Usuario eliminado exitosamente');
      await loadUsers();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('Error al eliminar usuario:', err);
      const errorMessage = err.response?.data?.detail || 'No se pudo eliminar el usuario';
      setError(errorMessage);
    }
  };

  const handleToggleActive = async (user) => {
    setError('');
    setSuccess('');
    
    try {
      await userService.update(user.id, {
        is_active: !user.is_active,
      });
      setSuccess(`Usuario ${!user.is_active ? 'activado' : 'desactivado'} exitosamente`);
      await loadUsers();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('Error al cambiar estado del usuario:', err);
      const errorMessage = err.response?.data?.detail || 'Error al cambiar el estado del usuario';
      setError(errorMessage);
    }
  };

  if (loading) return <Loading />;

  return (
    <div className="vehicles-page">
      <div className="vehicles-header">
        <h1>Gestión de Usuarios</h1>
      </div>

      {error && (
        <div className="alert alert-error custom-alert">
          {error}
        </div>
      )}
      {success && (
        <div className="alert alert-success custom-alert alert-success-custom">
          {success}
        </div>
      )}

      {users.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">👤</div>
          <h3>No hay usuarios registrados</h3>
        </div>
      ) : (
        <div className="users-table-wrapper">
          <table className="users-table">
            <thead>
              <tr>
                <th>Usuario</th>
                <th>Email</th>
                <th>Rol</th>
                <th className="center">Estado</th>
                <th className="center">Vehículos</th>
                <th className="center">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id}>
                  <td>
                    <div className="user-name">{user.full_name}</div>
                    <div className="user-sub">@{user.username}</div>
                  </td>
                  <td className="user-email">{user.email}</td>
                  <td>
                    <span className={`badge ${user.role === 'admin' ? 'badge-medio' : 'badge-bajo'}`}>
                      {user.role === 'admin' ? '👑 Admin' : '👤 Usuario'}
                    </span>
                  </td>
                  <td className="center">
                    <span className={`badge ${user.is_active ? 'badge-bajo' : 'badge-alto'}`}>
                      {user.is_active ? '✓ Activo' : '✗ Inactivo'}
                    </span>
                  </td>
                  <td className="center user-vehicles">
                    {user.total_vehicles || 0}
                  </td>
                  <td className="center">
                    <div className="actions-container">
                      <button
                        type="button"
                        onClick={() => handleEdit(user)}
                        className="btn btn-outline btn-sm"
                      >
                        Editar
                      </button>
                      <button
                        type="button"
                        onClick={() => handleToggleActive(user)}
                        className="btn btn-outline btn-sm"
                      >
                        {user.is_active ? 'Desactivar' : 'Activar'}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(user.id)}
                        className="btn btn-danger btn-sm"
                      >
                        Eliminar
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal de edición */}
      {showEditModal && editingUser && (
        <div className="users-modal-overlay">
          <div className="users-modal">
            <h2>Editar Usuario</h2>
            
            <div className="form-group">
              <label>
                Nombre Completo
              </label>
              <input
                type="text"
                value={editingUser.full_name}
                onChange={(e) => setEditingUser({ ...editingUser, full_name: e.target.value })}
                className="modal-input"
              />
            </div>

            <div className="form-group">
              <label>
                Email
              </label>
              <input
                type="email"
                value={editingUser.email}
                onChange={(e) => setEditingUser({ ...editingUser, email: e.target.value })}
                className="modal-input"
              />
            </div>

            <div className="form-group">
              <label>
                Rol
              </label>
              <select
                value={editingUser.role}
                onChange={(e) => setEditingUser({ ...editingUser, role: e.target.value })}
                className="modal-input"
              >
                <option value="user">Usuario</option>
                <option value="admin">Administrador</option>
              </select>
            </div>

            <div className="form-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={editingUser.is_active}
                  onChange={(e) => setEditingUser({ ...editingUser, is_active: e.target.checked })}
                />
                <span className="checkbox-text">Usuario activo</span>
              </label>
            </div>

            <div className="modal-actions">
              <button
                type="button"
                onClick={() => {
                  setShowEditModal(false);
                  setEditingUser(null);
                }}
                className="btn btn-secondary"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSave}
                className="btn"
                disabled={saving}
              >
                {saving ? 'Guardando...' : 'Guardar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

