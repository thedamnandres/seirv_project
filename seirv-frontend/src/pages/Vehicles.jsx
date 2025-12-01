import { useEffect, useState } from 'react';
import Loading from '../components/Loading';
import { Link } from 'react-router-dom';
import { vehicleService } from '../services/api';

// Helpers simples para IRV (puedes moverlos luego a src/utils/irv.js si quieres)
const getIRVLevelClass = (irvLevel) => {
  if (!irvLevel) return 'irv-level-sin-recalls';

  const level = String(irvLevel).toLowerCase();
  if (level === 'bajo') return 'irv-level-bajo';
  if (level === 'medio') return 'irv-level-medio';
  if (level === 'alto') return 'irv-level-alto';
  return 'irv-level-sin-recalls';
};

const getIRVLevelText = (irvLevel) => {
  if (!irvLevel) return 'Sin Recalls';
  const level = String(irvLevel).toLowerCase();
  const map = {
    bajo: 'Riesgo Bajo',
    medio: 'Riesgo Medio',
    alto: 'Riesgo Alto',
    'sin recalls': 'Sin Recalls',
    'n/a': 'Sin Recalls',
  };
  return map[level] || 'Sin Recalls';
};

export default function Vehicles() {
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadVehicles();
  }, []);

  const loadVehicles = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await vehicleService.getAll(); // GET /api/v1/vehicles
      console.log('DEBUG vehicles:', data);
      setVehicles(data || []);
    } catch (err) {
      console.error(err);
      setError('Error al cargar los vehículos');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('¿Seguro que deseas eliminar este vehículo?')) return;
    try {
      await vehicleService.delete(id); // DELETE /vehicles/{id}
      await loadVehicles();
    } catch (err) {
      console.error(err);
      setError('No se pudo eliminar el vehículo');
    }
  };

  if (loading) return <Loading />;

  return (
    <div className="vehicles-page">
      <div className="vehicles-header">
        <h1>Mis Vehículos</h1>
        <Link to="/vehicles/new" className="btn">
          ➕ Agregar Vehículo
        </Link>
      </div>

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
            // Detectar si hay valor numérico válido para irv_value
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
                  <button
                    type="button"
                    onClick={() => handleDelete(vehicle.id)}
                    className="btn btn-danger btn-sm"
                  >
                    Eliminar
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
