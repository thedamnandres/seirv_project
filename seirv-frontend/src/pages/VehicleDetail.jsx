// src/pages/VehicleDetail.jsx
import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import Loading from '../components/Loading';
import { vehicleService } from '../services/api';

// Helpers reutilizados para IRV
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

export default function VehicleDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [vehicle, setVehicle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [syncLoading, setSyncLoading] = useState(false);
  const [irvLoading, setIrvLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    loadVehicle();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const loadVehicle = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await vehicleService.getById(id);
      setVehicle(data);
    } catch (err) {
      console.error(err);
      setError('Error al cargar el vehículo');
    } finally {
      setLoading(false);
    }
  };

  const handleSyncRecalls = async () => {
    setSyncLoading(true);
    setMessage('');
    setError('');
    try {
      const res = await vehicleService.syncRecalls(id);
      // Sea que el backend devuelva el vehículo completo o sólo algunos campos, mergeamos
      setVehicle((prev) => ({ ...(prev || {}), ...(res || {}) }));
      setMessage('Recalls sincronizados correctamente.');
    } catch (err) {
      console.error(err);
      setError('Error al sincronizar los recalls');
    } finally {
      setSyncLoading(false);
    }
  };

  const handleRecalcIRV = async () => {
    setIrvLoading(true);
    setMessage('');
    setError('');
    try {
      const res = await vehicleService.calculateIRV(id, true); // includeBreakdown = true
      // Igual: merge con lo que venga (irv_value, irv_level, breakdown, etc.)
      setVehicle((prev) => ({ ...(prev || {}), ...(res || {}) }));
      setMessage('IRV recalculado correctamente.');
    } catch (err) {
      console.error(err);
      setError('Error al recalcular el IRV');
    } finally {
      setIrvLoading(false);
    }
  };

  if (loading) return <Loading />;

  if (!vehicle) {
    return (
      <div className="vehicle-detail-page">
        <p>No se encontró el vehículo.</p>
        <button className="btn" onClick={() => navigate('/vehicles')}>
          ← Volver a Mis Vehículos
        </button>
      </div>
    );
  }

  const hasIrv =
    typeof vehicle.irv_value === 'number' ||
    (vehicle.irv_value !== null &&
      vehicle.irv_value !== undefined &&
      !Number.isNaN(Number(vehicle.irv_value)));

  const irvScore = hasIrv ? Number(vehicle.irv_value) : null;
  const levelClass = getIRVLevelClass(vehicle.irv_level);
  const levelText = getIRVLevelText(vehicle.irv_level);

  return (
    <div className="vehicle-detail-page">
      <div className="vehicle-detail-header">
        <button className="btn btn-outline" onClick={() => navigate('/vehicles')}>
          ← Volver
        </button>
        <h1>
          {vehicle.make} {vehicle.model}{' '}
          <span className="vehicle-detail-year">{vehicle.year}</span>
        </h1>
      </div>

      {error && <div className="alert alert-error">{error}</div>}
      {message && <div className="alert alert-success">{message}</div>}

      <div className="vehicle-detail-layout">
        {/* Card principal con IRV */}
        <div className="vehicle-card vehicle-detail-card">
          <div className="vehicle-header">
            <h3>
              {vehicle.make} {vehicle.model}
            </h3>
            <span className="vehicle-year">{vehicle.year}</span>
          </div>

          <div className="irv-display" role="group" aria-label="IRV">
            <div className="irv-value">
              {irvScore !== null ? Math.round(irvScore) : 'N/A'}
            </div>
            <div className={`irv-badge ${levelClass}`}>{levelText}</div>
          </div>

          <div className="vehicle-info">
            <div className="info-item">
              <span className="label">Placa:</span>
              <span className="value">{vehicle.license_plate || 'N/A'}</span>
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
              <span className="value">{vehicle.category_name || 'N/A'}</span>
            </div>
            {typeof vehicle.total_recalls === 'number' && (
              <div className="info-item">
                <span className="label">Recalls:</span>
                <span className="value">{vehicle.total_recalls}</span>
              </div>
            )}
          </div>

          <div className="vehicle-actions">
            <button
              type="button"
              className="btn btn-outline btn-sm"
              onClick={handleSyncRecalls}
              disabled={syncLoading || irvLoading}
            >
              {syncLoading ? 'Sincronizando...' : 'Sincronizar Recalls'}
            </button>
            <button
              type="button"
              className="btn btn-primary btn-sm"
              onClick={handleRecalcIRV}
              disabled={irvLoading || syncLoading}
            >
              {irvLoading ? 'Recalculando IRV...' : 'Recalcular IRV'}
            </button>
          </div>
        </div>

        {/* Panel opcional para breakdown de IRV o lista de recalls */}
        {vehicle.irv_breakdown && (
          <div className="vehicle-detail-panel">
            <h2>Detalle de IRV</h2>
            <pre className="irv-breakdown">
              {JSON.stringify(vehicle.irv_breakdown, null, 2)}
            </pre>
          </div>
        )}

        <div className="vehicle-detail-panel">
          <h2>Ver Recalls</h2>
          <p>
            Puedes revisar el detalle de recalls de este vehículo en la sección{' '}
            <Link to="/recalls">Recalls</Link>.
          </p>
        </div>
      </div>
    </div>
  );
}
