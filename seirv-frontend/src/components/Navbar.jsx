import { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { user, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  // Detección de admin - normalizar a lowercase string
  const isAdmin = user?.role && String(user.role).toLowerCase().trim() === 'admin';

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
                <Link to="/admin/users" className="nav-link">
                  Gestión de Usuarios
                </Link>
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
                  {user?.full_name || user?.username}
                </span>
              </div>
              <button type="button" className="btn btn-outline btn-sm" onClick={handleLogout}>
                Cerrar sesión
              </button>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
