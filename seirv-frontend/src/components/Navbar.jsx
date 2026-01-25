// Importaciones ligeras
import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { normalizeRole } from '../utils/user';

export default function Navbar() {
  const { user, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Detectar admin con tu helper normalizeRole
  const isAdmin = normalizeRole(user?.role) === 'admin';

  const handleLogout = () => {
    logout();
    navigate('/login');
    setDropdownOpen(false);
  };

  // Cerrar dropdown al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    };

    if (dropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [dropdownOpen]);

  return (
    <nav className="navbar">
      <div className="navbar-inner">
        <div className="navbar-left">
          <Link to="/dashboard" className="navbar-logo-link">
            <span className="navbar-logo">🚗 SEIRV</span>
          </Link>

          {isAuthenticated && (
            <div className="navbar-nav-links">
              <Link to="/dashboard" className="nav-link">
                Dashboard
              </Link>

              <Link to="/recalls" className="nav-link">
                Recalls
              </Link>

              {/* ✅ NUEVO: Reportes */}
              <Link to="/reports" className="nav-link">
                Reportes
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
            </div>
          )}
        </div>

        <div className="navbar-right">
          {isAuthenticated && (
            <div className="navbar-user-menu" ref={dropdownRef}>
              <button
                type="button"
                className="navbar-user-button"
                onClick={() => setDropdownOpen(!dropdownOpen)}
                aria-expanded={dropdownOpen}
                aria-haspopup="true"
              >
                <span className="navbar-user-icon">👤</span>
                <span className="navbar-user-name">
                  {user?.full_name || user?.username || user?.email}
                </span>
                <span className="navbar-user-arrow">
                  {dropdownOpen ? '▲' : '▼'}
                </span>
              </button>

              {dropdownOpen && (
                <div className="navbar-dropdown">
                  <Link
                    to="/profile/edit"
                    className="navbar-dropdown-item"
                    onClick={() => setDropdownOpen(false)}
                  >
                    ✏️ Editar Perfil
                  </Link>
                  <button
                    type="button"
                    className="navbar-dropdown-item navbar-dropdown-item-danger"
                    onClick={handleLogout}
                  >
                    🚪 Cerrar Sesión
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
 