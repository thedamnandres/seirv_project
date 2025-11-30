import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Loading from './Loading';
import { normalizeRole } from '../utils/user';

export default function AdminRoute({ children }) {
  const { isAuthenticated, loading, user } = useAuth();

  if (loading) return <Loading />;

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Verificar que el usuario sea admin
  const userRole = normalizeRole(user?.role);
  if (userRole !== 'admin') {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}

