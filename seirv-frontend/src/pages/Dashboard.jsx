import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Dashboard() {
  const { user } = useAuth();

  const displayName = user?.full_name || user?.username || 'Usuario';

  return (
    <div className="dashboard-page">
      <header className="dashboard-header">
        <h1 className="dashboard-greeting">Bienvenido, {displayName} 👋</h1>
        <p className="dashboard-subtitle">
          Este es tu panel del Sistema de Evaluación del Índice de Riesgo Vehicular (SEIRV).
        </p>
      </header>

      <section className="dashboard-grid">
        <article className="dashboard-card">
          <div className="dashboard-card-header">
            <div className="dashboard-card-icon">🚗</div>
            <div>
              <div className="dashboard-card-title">Mis Vehículos</div>
              <p className="dashboard-card-text">
                Gestiona la información de tu flota y registra nuevos vehículos.
              </p>
            </div>
          </div>
          <Link to="/vehicles" className="dashboard-card-link">
            Ver vehículos
          </Link>
        </article>

        <article className="dashboard-card">
          <div className="dashboard-card-header">
            <div className="dashboard-card-icon">📊</div>
            <div>
              <div className="dashboard-card-title">Estadísticas</div>
              <p className="dashboard-card-text">
                Próximamente podrás visualizar indicadores de riesgo y resumen de tu flota.
              </p>
            </div>
          </div>
        </article>

        <article className="dashboard-card">
          <div className="dashboard-card-header">
            <div className="dashboard-card-icon">⚙️</div>
            <div>
              <div className="dashboard-card-title">Configuración</div>
              <p className="dashboard-card-text">
                Administra categorías de riesgo y preferencias del sistema.
              </p>
            </div>
          </div>
        </article>
      </section>
    </div>
  );
}
