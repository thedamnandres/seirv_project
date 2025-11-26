import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// Función helper para obtener el rol como string
const getUserRole = (user) => {
  if (!user?.role) return null;
  // Si es un objeto con 'value', obtener el value
  if (typeof user.role === 'object' && user.role !== null && 'value' in user.role) {
    return user.role.value;
  }
  // Si ya es string, devolverlo directamente
  return String(user.role).toLowerCase().trim();
};

export default function AdminRoute({ children }) {
  const { isAuthenticated, loading, user } = useAuth();

  if (loading) {
    return (
      <div className="loading">
        <div className="loading-spinner" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Verificar que el usuario sea admin
  const userRole = getUserRole(user);
  if (userRole !== 'admin') {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}

