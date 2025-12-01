import { useState, useEffect } from 'react';
import { vehicleService } from '../services/api';
import './Recalls.scss';

const getSeverityMeta = (severity, severityScore) => {
  const num = Number(severity);
  let label = 'Sin severidad';
  let cls = 'severity-none';

  if (num === 3) {
    label = 'Alta';
    cls = 'severity-high';
  } else if (num === 2) {
    label = 'Media';
    cls = 'severity-medium';
  } else if (num === 1) {
    label = 'Baja';
    cls = 'severity-low';
  }

  const score =
    typeof severityScore === 'number'
      ? severityScore.toFixed(1)
      : null;

  return { label, cls, score };
};

export default function Recalls() {
  const [vehicles, setVehicles] = useState([]);
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [recalls, setRecalls] = useState(null);
  const [loading, setLoading] = useState(false);
  const [syncLoading, setSyncLoading] = useState(false);
  const [error, setError] = useState(null);
  const [infoMessage, setInfoMessage] = useState(null);

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
    setInfoMessage(null);
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
    setInfoMessage(null);

    try {
      const res = await vehicleService.syncRecalls(selectedVehicle.id);
      // mensaje del backend o uno genérico
      setInfoMessage(
        res?.message || 'Recalls sincronizados correctamente.'
      );
      // recargar recalls para reflejar cambios
      const data = await vehicleService.getRecalls(selectedVehicle.id);
      setRecalls(data);
    } catch (err) {
      console.error('Error al sincronizar recalls:', err);
      if (err.response?.status === 404) {
        setError(
          'La sincronización de recalls aún no está disponible en el backend (404).'
        );
      } else {
        setError('Error al sincronizar los recalls');
      }
    } finally {
      setSyncLoading(false);
    }
  };

  return (
    <div className="recalls-page">
      <div className="recalls-header">
        <h1>🔍 Consulta de Recalls</h1>
        <p>Selecciona un vehículo para ver sus llamados a revisión de NHTSA</p>
      </div>

      <div className="recalls-content">
        {/* Lista de vehículos */}
        <div className="vehicles-sidebar">
          <h3>Mis Vehículos</h3>
          {vehicles.length === 0 ? (
            <p className="empty-message">No tienes vehículos registrados</p>
          ) : (
            <div className="vehicles-list">
              {vehicles.map((vehicle) => (
                <div
                  key={vehicle.id}
                  className={`vehicle-card ${
                    selectedVehicle?.id === vehicle.id ? 'selected' : ''
                  }`}
                  onClick={() => handleSelectVehicle(vehicle)}
                >
                  <div className="vehicle-info">
                    <h4>
                      {vehicle.year} {vehicle.make} {vehicle.model}
                    </h4>
                    <p className="license-plate">{vehicle.license_plate}</p>
                  </div>
                  <div className="vehicle-arrow">→</div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Panel de recalls */}
        <div className="recalls-panel">
          {!selectedVehicle && (
            <div className="empty-state">
              <div className="empty-icon">🚗</div>
              <p>Selecciona un vehículo para consultar sus recalls</p>
            </div>
          )}

          {selectedVehicle && (
            <>
              {/* Acciones arriba del panel */}
              <div className="recalls-actions">
                <h2>
                  {selectedVehicle.year} {selectedVehicle.make}{' '}
                  {selectedVehicle.model}
                </h2>
                <button
                  className="btn btn-primary"
                  onClick={handleSyncRecalls}
                  disabled={syncLoading || loading}
                >
                  {syncLoading ? 'Sincronizando...' : '🔄 Sincronizar Recalls'}
                </button>
              </div>

              {loading && (
                <div className="loading-state">
                  <div className="spinner" />
                  <p>Consultando NHTSA...</p>
                </div>
              )}

              {error && (
                <div className="error-state">
                  <div className="error-icon">⚠️</div>
                  <p>{error}</p>
                </div>
              )}

              {infoMessage && !loading && (
                <div className="info-state">
                  <div className="info-icon">✅</div>
                  <p>{infoMessage}</p>
                </div>
              )}

              {recalls && !loading && (
                <div className="recalls-results">
                  <div className="results-header">
                    <h3>
                      {recalls.year} {recalls.make} {recalls.model}
                    </h3>
                    <div
                      className={`recall-badge ${
                        recalls.total_recalls > 0 ? 'warning' : 'success'
                      }`}
                    >
                      {recalls.total_recalls}{' '}
                      {recalls.total_recalls === 1 ? 'Recall' : 'Recalls'}
                    </div>
                  </div>

                  {recalls.total_recalls === 0 ? (
                    <div className="no-recalls">
                      <div className="success-icon">✅</div>
                      <h3>Sin recalls activos</h3>
                      <p>
                        Este vehículo no tiene llamados a revisión reportados en
                        NHTSA
                      </p>
                    </div>
                  ) : (
                    <div className="recalls-list">
                      {recalls.recalls.map((recall, index) => {
                        const {
                          label: severityLabel,
                          cls: severityCls,
                          score,
                        } = getSeverityMeta(
                          recall.severity,
                          recall.severity_score
                        );

                        return (
                          <div
                            key={
                              recall.NHTSACampaignNumber ||
                              recall.campaign_number ||
                              index
                            }
                            className="recall-item"
                          >
                            <div className="recall-header">
                              <span className="recall-number">
                                #
                                {recall.NHTSACampaignNumber ||
                                  recall.campaign_number ||
                                  'N/A'}
                              </span>
                              <span className="recall-date">
                                {recall.ReportReceivedDate ||
                                  recall.date ||
                                  'Fecha no disponible'}
                              </span>
                              <span
                                className={`severity-badge ${severityCls}`}
                                title={
                                  score
                                    ? `Score de severidad: ${score} / 5`
                                    : undefined
                                }
                              >
                                Severidad: {severityLabel}
                              </span>
                            </div>

                            {score && (
                              <div className="severity-score">
                                Score: {score} / 5
                              </div>
                            )}

                            <div className="recall-component">
                              <strong>Componente:</strong>{' '}
                              {recall.Component ||
                                recall.component ||
                                'No especificado'}
                            </div>

                            <div className="recall-summary">
                              <strong>Problema:</strong>
                              <p>
                                {recall.Summary ||
                                  recall.summary ||
                                  'Sin descripción'}
                              </p>
                            </div>

                            {recall.Consequence && (
                              <div className="recall-consequence">
                                <strong>⚠️ Consecuencia:</strong>
                                <p>{recall.Consequence}</p>
                              </div>
                            )}

                            {recall.Remedy && (
                              <div className="recall-remedy">
                                <strong>🔧 Solución:</strong>
                                <p>{recall.Remedy}</p>
                              </div>
                            )}

                            {recall.Manufacturer && (
                              <div className="recall-manufacturer">
                                <strong>Fabricante:</strong>{' '}
                                {recall.Manufacturer}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
