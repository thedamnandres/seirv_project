// Importaciones ligeras
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { normalizeRole } from '../utils/user';

export default function Navbar() {
  const { user, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  // Detectar admin con tu helper normalizeRole
  const isAdmin = normalizeRole(user?.role) === 'admin';

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="navbar">
      <div className="navbar-inner">
        <div className="navbar-left">
          <span className="navbar-logo">🚗 SEIRV</span>

          {isAuthenticated && (
            <>
              <Link to="/dashboard" className="nav-link">
                Dashboard
              </Link>

              <Link to="/vehicles" className="nav-link">
                Mis Vehículos
              </Link>

              <Link to="/recalls" className="nav-link">
                Recalls
              </Link>

              {isAdmin && (
                <>
                  <Link to="/admin/recalls" className="nav-link">
                    Panel Recalls
                  </Link>

                  <Link to="/admin/users" className="nav-link">
                    Gestión de Usuarios
                  </Link>
                </>
              )}
            </>
          )}
        </div>

        <div className="navbar-right">
          {isAuthenticated && (
            <>
              <div className="navbar-user-container">
                <span className="navbar-user-icon">👤</span>
                <span className="navbar-user">
                  {user?.full_name || user?.username || user?.email}
                </span>
              </div>

              <button
                type="button"
                className="btn btn-outline btn-sm"
                onClick={handleLogout}
              >
                Cerrar sesión
              </button>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
