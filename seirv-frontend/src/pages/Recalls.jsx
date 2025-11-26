import { useState, useEffect } from 'react';
import { vehicleService } from '../services/api';
import './Recalls.scss';

export default function Recalls() {
  const [vehicles, setVehicles] = useState([]);
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [recalls, setRecalls] = useState(null);
  const [loading, setLoading] = useState(false);
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

        {/* Panel de recalls */}
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

              {recalls.total_recalls === 0 ? (
                <div className="no-recalls">
                  <div className="success-icon">✅</div>
                  <h3>Sin recalls activos</h3>
                  <p>Este vehículo no tiene llamados a revisión reportados en NHTSA</p>
                </div>
              ) : (
                <div className="recalls-list">
                  {recalls.recalls.map((recall, index) => (
                    <div key={recall.NHTSACampaignNumber || index} className="recall-item">
                      <div className="recall-header">
                        <span className="recall-number">
                          #{recall.NHTSACampaignNumber || 'N/A'}
                        </span>
                        <span className="recall-date">
                          {recall.ReportReceivedDate || 'Fecha no disponible'}
                        </span>
                      </div>
                      
                      <div className="recall-component">
                        <strong>Componente:</strong> {recall.Component || 'No especificado'}
                      </div>

                      <div className="recall-summary">
                        <strong>Problema:</strong>
                        <p>{recall.Summary || 'Sin descripción'}</p>
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
