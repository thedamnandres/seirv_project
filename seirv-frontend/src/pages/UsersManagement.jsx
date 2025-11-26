import { useEffect, useState } from 'react';
import { userService } from '../services/api';

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

  if (loading) {
    return (
      <div className="loading">
        <div className="loading-spinner" />
      </div>
    );
  }

  return (
    <div className="vehicles-page">
      <div className="vehicles-header">
        <h1>Gestión de Usuarios</h1>
      </div>

      {error && (
        <div className="alert alert-error" style={{ marginBottom: '1rem' }}>
          {error}
        </div>
      )}
      {success && (
        <div className="alert alert-success" style={{ marginBottom: '1rem', backgroundColor: '#d1fae5', color: '#065f46', border: '1px solid #10b981' }}>
          {success}
        </div>
      )}

      {users.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">👤</div>
          <h3>No hay usuarios registrados</h3>
        </div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', background: '#fff', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 10px 25px rgba(15, 23, 42, 0.08)' }}>
            <thead>
              <tr style={{ background: '#f9fafb', borderBottom: '2px solid #e5e7eb' }}>
                <th style={{ padding: '1rem', textAlign: 'left', fontWeight: 600, color: '#374151' }}>Usuario</th>
                <th style={{ padding: '1rem', textAlign: 'left', fontWeight: 600, color: '#374151' }}>Email</th>
                <th style={{ padding: '1rem', textAlign: 'left', fontWeight: 600, color: '#374151' }}>Rol</th>
                <th style={{ padding: '1rem', textAlign: 'center', fontWeight: 600, color: '#374151' }}>Estado</th>
                <th style={{ padding: '1rem', textAlign: 'center', fontWeight: 600, color: '#374151' }}>Vehículos</th>
                <th style={{ padding: '1rem', textAlign: 'center', fontWeight: 600, color: '#374151' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                  <td style={{ padding: '1rem' }}>
                    <div style={{ fontWeight: 600, color: '#111827' }}>{user.full_name}</div>
                    <div style={{ fontSize: '0.85rem', color: '#6b7280' }}>@{user.username}</div>
                  </td>
                  <td style={{ padding: '1rem', color: '#374151' }}>{user.email}</td>
                  <td style={{ padding: '1rem' }}>
                    <span className={`badge ${user.role === 'admin' ? 'badge-medio' : 'badge-bajo'}`}>
                      {user.role === 'admin' ? '👑 Admin' : '👤 Usuario'}
                    </span>
                  </td>
                  <td style={{ padding: '1rem', textAlign: 'center' }}>
                    <span className={`badge ${user.is_active ? 'badge-bajo' : 'badge-alto'}`}>
                      {user.is_active ? '✓ Activo' : '✗ Inactivo'}
                    </span>
                  </td>
                  <td style={{ padding: '1rem', textAlign: 'center', color: '#374151', fontWeight: 600 }}>
                    {user.total_vehicles || 0}
                  </td>
                  <td style={{ padding: '1rem', textAlign: 'center' }}>
                    <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
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
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: '#fff',
            borderRadius: '16px',
            padding: '2rem',
            maxWidth: '500px',
            width: '90%',
            maxHeight: '90vh',
            overflow: 'auto'
          }}>
            <h2 style={{ marginTop: 0, marginBottom: '1.5rem' }}>Editar Usuario</h2>
            
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, color: '#4b5563' }}>
                Nombre Completo
              </label>
              <input
                type="text"
                value={editingUser.full_name}
                onChange={(e) => setEditingUser({ ...editingUser, full_name: e.target.value })}
                style={{
                  width: '100%',
                  padding: '0.6rem 0.8rem',
                  border: '1px solid #d1d5db',
                  borderRadius: '10px',
                  fontSize: '0.95rem'
                }}
              />
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, color: '#4b5563' }}>
                Email
              </label>
              <input
                type="email"
                value={editingUser.email}
                onChange={(e) => setEditingUser({ ...editingUser, email: e.target.value })}
                style={{
                  width: '100%',
                  padding: '0.6rem 0.8rem',
                  border: '1px solid #d1d5db',
                  borderRadius: '10px',
                  fontSize: '0.95rem'
                }}
              />
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, color: '#4b5563' }}>
                Rol
              </label>
              <select
                value={editingUser.role}
                onChange={(e) => setEditingUser({ ...editingUser, role: e.target.value })}
                style={{
                  width: '100%',
                  padding: '0.6rem 0.8rem',
                  border: '1px solid #d1d5db',
                  borderRadius: '10px',
                  fontSize: '0.95rem'
                }}
              >
                <option value="user">Usuario</option>
                <option value="admin">Administrador</option>
              </select>
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={editingUser.is_active}
                  onChange={(e) => setEditingUser({ ...editingUser, is_active: e.target.checked })}
                />
                <span style={{ fontWeight: 600, color: '#4b5563' }}>Usuario activo</span>
              </label>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
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

