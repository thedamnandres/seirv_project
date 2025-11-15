import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { vehicleService } from '../services/api';

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
      const data = await vehicleService.getAll();   // GET /api/v1/vehicles
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
      await vehicleService.delete(id);              // DELETE /vehicles/{id}
      await loadVehicles();
    } catch (err) {
      console.error(err);
      setError('No se pudo eliminar el vehículo');
    }
  };

  if (loading) {
    return (
      <div className="loading">
        <div className="loading-spinner" />
      </div>
    );
  }

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
          {vehicles.map((vehicle) => (
            <div key={vehicle.id} className="vehicle-card">
              <div className="vehicle-header">
                <h3>
                  {vehicle.make} {vehicle.model}
                </h3>
                <span className="vehicle-year">{vehicle.year}</span>
              </div>

              <div className="vehicle-info">
                <div className="info-item">
                  <span className="label">Placa:</span>
                  <span className="value">{vehicle.license_plate}</span>
                </div>
                <div className="info-item">
                  <span className="label">Kilometraje:</span>
                  <span className="value">
                    {vehicle.mileage?.toLocaleString()} km
                  </span>
                </div>
                <div className="info-item">
                  <span className="label">Categoría:</span>
                  <span className="value">{vehicle.category_name}</span>
                </div>
                <div className="info-item">
                  <span className="label">IRV:</span>
                  <span className={`badge badge-${vehicle.irv_level?.toLowerCase()}`}>
                    {vehicle.irv_level}
                  </span>
                </div>
              </div>

              <div className="vehicle-actions">
                {/* si luego hay detalle, aquí se puede enlazar */}
                {/* <Link to={`/vehicles/${vehicle.id}`} className="btn btn-outline btn-sm">
                  Ver detalle
                </Link> */}
                <button
                  type="button"
                  onClick={() => handleDelete(vehicle.id)}
                  className="btn btn-danger btn-sm"
                >
                  Eliminar
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
