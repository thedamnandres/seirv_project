import { useState, useEffect } from 'react';
import { vehicleService } from '../services/api';
import './Recalls.scss';

export default function Recalls() {
  const [vehicles, setVehicles] = useState([]);
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [recalls, setRecalls] = useState(null);
  const [loading, setLoading] = useState(false);
  const [syncLoading, setSyncLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadVehicles();
  }, []);

  const loadVehicles = async () => {
    try {
      const data = await vehicleService.getAll();
      setVehicles(data);
    } catch (err) {
      console.error('Error al cargar vehículos:', err);
      setError('No se pudieron cargar los vehículos');
    }
  };

  const handleSelectVehicle = async (vehicle) => {
    setSelectedVehicle(vehicle);
    setRecalls(null);
    setError(null);
    setLoading(true);

    try {
      const data = await vehicleService.getRecalls(vehicle.id);
      setRecalls(data);
    } catch (err) {
      console.error('Error al obtener recalls:', err);
      setError(err.response?.data?.detail || 'Error al consultar los recalls');
    } finally {
      setLoading(false);
    }
  };

  const handleSyncRecalls = async () => {
    if (!selectedVehicle) return;

    setSyncLoading(true);
    setError(null);

    try {
      const res = await vehicleService.syncRecalls(selectedVehicle.id);
      await handleSelectVehicle(selectedVehicle); // recargar recalls actualizado
    } catch (err) {
      console.error('Error al sincronizar recalls:', err);
      setError('No se pudieron sincronizar los recalls');
    } finally {
      setSyncLoading(false);
    }
  };

  // Helper: badge por severidad
  const getSeverityBadgeClass = (severity) => {
    const lvl = String(severity || '').toLowerCase();
    if (lvl === 'bajo') return 'severity-badge low';
    if (lvl === 'medio') return 'severity-badge medium';
    if (lvl === 'alto') return 'severity-badge high';
    return 'severity-badge none';
  };

  return (
    <div className="recalls-page">
      <div className="recalls-header">
        <h1>🔍 Consulta de Recalls</h1>
        <p>Selecciona un vehículo para ver sus llamados a revisión</p>
      </div>

      <div className="recalls-content">
        {/* Sidebar vehículos */}
        <div className="vehicles-sidebar">
          <h3>Mis Vehículos</h3>

          {vehicles.length === 0 ? (
            <p className="empty-message">No tienes vehículos registrados</p>
          ) : (
            <div className="vehicles-list">
              {vehicles.map((vehicle) => (
                <div
                  key={vehicle.id}
                  className={`vehicle-card ${selectedVehicle?.id === vehicle.id ? 'selected' : ''}`}
                  onClick={() => handleSelectVehicle(vehicle)}
                >
                  <div className="vehicle-info">
                    <h4>{vehicle.year} {vehicle.make} {vehicle.model}</h4>
                    <p className="license-plate">{vehicle.license_plate}</p>
                  </div>
                  <div className="vehicle-arrow">→</div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Panel principal */}
        <div className="recalls-panel">
          {!selectedVehicle && (
            <div className="empty-state">
              <div className="empty-icon">🚗</div>
              <p>Selecciona un vehículo para consultar sus recalls</p>
            </div>
          )}

          {selectedVehicle && loading && (
            <div className="loading-state">
              <div className="spinner" />
              <p>Consultando NHTSA...</p>
            </div>
          )}

          {selectedVehicle && error && (
            <div className="error-state">
              <div className="error-icon">⚠️</div>
              <p>{error}</p>
              <button 
                className="btn btn-primary"
                onClick={() => handleSelectVehicle(selectedVehicle)}
              >
                Reintentar
              </button>
            </div>
          )}

          {selectedVehicle && recalls && !loading && (
            <div className="recalls-results">
              <div className="results-header">
                <h2>{recalls.year} {recalls.make} {recalls.model}</h2>

                <div className={`recall-badge ${recalls.total_recalls > 0 ? 'warning' : 'success'}`}>
                  {recalls.total_recalls} {recalls.total_recalls === 1 ? 'Recall' : 'Recalls'}
                </div>
              </div>

              <button
                className="btn btn-outline btn-sm sync-button"
                onClick={handleSyncRecalls}
                disabled={syncLoading}
              >
                {syncLoading ? 'Sincronizando...' : '🔄 Sincronizar Recalls'}
              </button>

              {/* LISTA DE RECALLS */}
              {recalls.total_recalls === 0 ? (
                <div className="no-recalls">
                  <div className="success-icon">✅</div>
                  <h3>Sin recalls activos</h3>
                  <p>Este vehículo no tiene llamados a revisión registrados.</p>
                </div>
              ) : (
                <div className="recalls-list">
                  {recalls.recalls.map((recall, index) => (
                    <div key={recall.campaign_number || index} className="recall-item">

                      <div className="recall-header">
                        <span className="recall-number">
                          #{recall.campaign_number || recall.NHTSACampaignNumber || 'N/A'}
                        </span>
                        <span className="recall-date">
                          {recall.date || recall.ReportReceivedDate || 'Fecha no disponible'}
                        </span>
                      </div>

                      {/* BADGE DE SEVERIDAD */}
                      <div className={getSeverityBadgeClass(recall.severity)}>
                        {recall.severity || 'Sin severidad'}
                      </div>

                      {/* SCORE */}
                      {recall.severity_score && (
                        <div className="recall-score">
                          Score: {recall.severity_score}
                        </div>
                      )}

                      <div className="recall-component">
                        <strong>Componente:</strong> {recall.component || recall.Component || 'No especificado'}
                      </div>

                      <div className="recall-summary">
                        <strong>Problema:</strong>
                        <p>{recall.summary || recall.Summary || 'Sin descripción'}</p>
                      </div>

                      {recall.consequence && (
                        <div className="recall-consequence">
                          <strong>⚠️ Consecuencia:</strong>
                          <p>{recall.consequence}</p>
                        </div>
                      )}

                      {recall.remedy && (
                        <div className="recall-remedy">
                          <strong>🔧 Solución:</strong>
                          <p>{recall.remedy}</p>
                        </div>
                      )}

                      <div className="recall-source">
                        <small>Fuente: {recall.source || 'NHTSA'}</small>
                      </div>

                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
