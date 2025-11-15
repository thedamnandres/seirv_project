import { NavLink, useNavigate } from "react-router-dom";

export default function MainLayout({ children }) {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/");
  };

  return (
    <div className="app-shell">
      <nav className="navbar">
        <div className="nav-left">
          <span className="nav-logo-icon">🚗</span>
          <span className="nav-logo-text">SEIRV</span>
        </div>

        <div className="nav-links">
          <NavLink
            to="/dashboard"
            className={({ isActive }) =>
              isActive ? "nav-link nav-link-active" : "nav-link"
            }
          >
            Dashboard
          </NavLink>
          <NavLink
            to="/vehicles"
            className={({ isActive }) =>
              isActive ? "nav-link nav-link-active" : "nav-link"
            }
          >
            Mis Vehículos
          </NavLink>
        </div>

        <div className="nav-right">
          <div className="nav-username">
            <span>👤</span>
            <span>Esteban Narvaez</span>
          </div>
          <button className="btn-outline" onClick={handleLogout}>
            Cerrar sesión
          </button>
        </div>
      </nav>

      <main className="main-content">
        <div className="main-container">{children}</div>
      </main>
    </div>
  );
}
