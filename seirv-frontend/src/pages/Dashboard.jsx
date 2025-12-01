import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { vehicleService } from '../services/api';
import Loading from '../components/Loading';
import { getIRVLevelClass, getIRVLevelText } from '../utils/irv';

export default function Dashboard() {
  const { user } = useAuth();
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const displayName = user?.full_name || user?.username || 'Usuario';

  useEffect(() => {
    loadVehicles();
  }, []);

  const loadVehicles = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await vehicleService.getAll();
      setVehicles(data || []);
    } catch (err) {
      console.error(err);
      setError('Error al cargar los vehículos');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <Loading />;

  return (
    <div className="dashboard-page">
      <header className="dashboard-header">
        <div className="dashboard-header-top">
          <div>
            <h1 className="dashboard-greeting">Bienvenido, {displayName}! 👋</h1>
            <p className="dashboard-subtitle">
              Sistema de Evaluación del Índice de Riesgo Vehicular (SEIRV).
            </p>
          </div>
          <Link to="/vehicles/new" className="btn">
            ➕ Agregar Vehículo
          </Link>
        </div>
      </header>

      {error && <div className="alert alert-error">{error}</div>}

      {vehicles.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">🚗</div>
          <h3>No tienes vehículos registrados</h3>
          <p>Agrega tu primer vehículo para comenzar.</p>
          <Link to="/vehicles/new" className="btn">
            Agregar Vehículo
          </Link>
        </div>
      ) : (
        <div className="vehicles-grid">
          {vehicles.map((vehicle) => {
            const hasIrv =
              typeof vehicle.irv_value === 'number' ||
              (vehicle.irv_value !== null &&
                vehicle.irv_value !== undefined &&
                !Number.isNaN(Number(vehicle.irv_value)));

            const irvScore = hasIrv ? Number(vehicle.irv_value) : null;
            const levelClass = getIRVLevelClass(vehicle.irv_level);
            const levelText = getIRVLevelText(vehicle.irv_level);

            return (
              <div key={vehicle.id} className="vehicle-card">
                <div className="vehicle-header">
                  <h3>
                    {vehicle.make} {vehicle.model}
                  </h3>
                  <span className="vehicle-year">{vehicle.year}</span>
                </div>

                {/* Bloque IRV grande en el centro */}
                <div className="irv-display" role="group" aria-label="IRV">
                  <div className="irv-value">
                    {irvScore !== null ? Math.round(irvScore) : 'N/A'}
                  </div>
                  <div className={`irv-badge ${levelClass}`}>{levelText}</div>
                </div>

                <div className="vehicle-info">
                  <div className="info-item">
                    <span className="label">Placa:</span>
                    <span className="value">
                      {vehicle.license_plate || 'N/A'}
                    </span>
                  </div>
                  <div className="info-item">
                    <span className="label">Kilometraje:</span>
                    <span className="value">
                      {vehicle.mileage != null
                        ? `${vehicle.mileage.toLocaleString()} km`
                        : 'N/A'}
                    </span>
                  </div>
                  <div className="info-item">
                    <span className="label">Categoría:</span>
                    <span className="value">
                      {vehicle.category_name || 'N/A'}
                    </span>
                  </div>
                  {typeof vehicle.total_recalls === 'number' && (
                    <div className="info-item">
                      <span className="label">Recalls:</span>
                      <span className="value">{vehicle.total_recalls}</span>
                    </div>
                  )}
                </div>

                <div className="vehicle-actions">
                  <Link
                    to={`/vehicles/${vehicle.id}`}
                    className="btn btn-outline btn-sm"
                  >
                    Ver detalle
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
