import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { user, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();

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
            </>
          )}
        </div>

        <div className="navbar-right">
          {isAuthenticated && (
            <>
              <span className="navbar-user">
                {user?.full_name || user?.username}
              </span>
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
