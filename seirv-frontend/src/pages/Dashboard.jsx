import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Dashboard() {
  const { user } = useAuth();

  const displayName = user?.full_name || user?.username || 'Usuario';

  return (
    <div className="dashboard-page">
      <header className="dashboard-header">
        <h1 className="dashboard-greeting">Bienvenido, {displayName}! 👋</h1>
        <p className="dashboard-subtitle">
          Sistema de Evaluación del Índice de Riesgo Vehicular (SEIRV).
        </p>
      </header>

      <section className="dashboard-grid">
        {/* Mis Vehículos */}
        <article className="dashboard-card">
          <div className="dashboard-card-header">
            <div className="dashboard-card-icon">🚗</div>
            <div>
              <div className="dashboard-card-title">Mis Vehículos</div>
              <p className="dashboard-card-text">
                Gestiona tu flota de vehículos y registra nuevos vehículos.
              </p>
            </div>
          </div>
          <Link to="/vehicles" className="dashboard-card-link">
            Ver vehículos
          </Link>
        </article>

        {/* Estadísticas - Próximamente */}
        <article className="dashboard-card">
          <div className="dashboard-card-header">
            <div className="dashboard-card-icon">📊</div>
            <div>
              <div className="dashboard-card-title">
                Estadísticas
                <span className="dashboard-badge-soon">Próximamente</span>
              </div>
              <p className="dashboard-card-text">
                Visualiza el índice de riesgo y resumen de tu flota.
              </p>
            </div>
          </div>
        </article>

        {/* Recalls - Próximamente */}
        <article className="dashboard-card">
          <div className="dashboard-card-header">
            <div className="dashboard-card-icon">🔔</div>
            <div>
              <div className="dashboard-card-title">
                Recalls
                <span className="dashboard-badge-soon">Próximamente</span>
              </div>
              <p className="dashboard-card-text">
                Consulta los recalls y alertas de seguridad de tus vehículos.
              </p>
            </div>
          </div>
        </article>

        {/* Mi Perfil - Próximamente */}
        <article className="dashboard-card">
          <div className="dashboard-card-header">
            <div className="dashboard-card-icon">👤</div>
            <div>
              <div className="dashboard-card-title">
                Mi Perfil
                <span className="dashboard-badge-soon">Próximamente</span>
              </div>
              <p className="dashboard-card-text">
                Gestiona tu información personal y preferencias del sistema.
              </p>
            </div>
          </div>
        </article>
      </section>
    </div>
  );
}
