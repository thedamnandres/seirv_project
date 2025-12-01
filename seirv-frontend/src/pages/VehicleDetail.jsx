import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Loading from '../components/Loading';
import { vehicleService, adminRecallsService } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { normalizeRole } from '../utils/user';
import { getIRVLevelClass, getIRVLevelText } from '../utils/irv';
import './Recalls.scss';

// Helper para severidad de recalls
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

// Helper para formatear fecha
const formatDate = (dateString) => {
  if (!dateString) return null;
  
  try {
    // Intentar parsear diferentes formatos
    let date;
    
    // Formato ISO: "2023-01-15" o "2023-01-15T00:00:00"
    if (dateString.includes('-')) {
      date = new Date(dateString);
    }
    // Formato DD/MM/YYYY: "01/12/2021"
    else if (dateString.includes('/')) {
      const parts = dateString.split('/');
      if (parts.length === 3) {
        // Asumir DD/MM/YYYY
        date = new Date(`${parts[2]}-${parts[1]}-${parts[0]}`);
      }
    }
    // Otro formato, intentar parsear directamente
    else {
      date = new Date(dateString);
    }
    
    // Verificar que la fecha sea válida
    if (isNaN(date.getTime())) {
      return null;
    }
    
    // Formatear como DD/MM/YYYY
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    
    return `${day}/${month}/${year}`;
  } catch (error) {
    console.error('Error formateando fecha:', error);
    return null;
  }
};

export default function VehicleDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const isAdmin = normalizeRole(user?.role) === 'admin';

  const [vehicle, setVehicle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [recalls, setRecalls] = useState(null);
  const [recallsLoading, setRecallsLoading] = useState(false);

  const [syncLoading, setSyncLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [editingMileage, setEditingMileage] = useState(false);
  const [newMileage, setNewMileage] = useState('');
  const [updatingMileage, setUpdatingMileage] = useState(false);

  // Estados para edición de severidad de recall
  const [editingSeverity, setEditingSeverity] = useState(null); // ID del recall que se está editando
  const [newSeverity, setNewSeverity] = useState('');
  const [savingSeverity, setSavingSeverity] = useState(false);

  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    loadVehicle();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  useEffect(() => {
    if (vehicle) {
      loadRecalls();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vehicle?.id]);

  // Recargar recalls cuando la ventana recibe foco (útil cuando se edita severidad en otra pestaña)
  useEffect(() => {
    const handleFocus = () => {
      if (vehicle?.id) {
        loadRecalls();
      }
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vehicle?.id]);

  // Escuchar evento cuando se actualiza la severidad de un recall
  useEffect(() => {
    const handleRecallUpdate = (event) => {
      const { vehicleId } = event.detail;
      // Si el recall actualizado pertenece al vehículo actual, recargar recalls
      if (vehicle?.id && vehicleId === vehicle.id) {
        loadRecalls();
      }
    };

    window.addEventListener('recallSeverityUpdated', handleRecallUpdate);
    return () => window.removeEventListener('recallSeverityUpdated', handleRecallUpdate);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vehicle?.id]);

  const loadVehicle = async () => {
    setLoading(true);
    setError('');
    setMessage('');
    try {
      const data = await vehicleService.getById(id); // GET /vehicles/{id}
      setVehicle(data);
    } catch (err) {
      console.error(err);
      setError('Error al cargar el vehículo');
    } finally {
      setLoading(false);
    }
  };

  const loadRecalls = async (forceRefresh = false) => {
    if (!vehicle?.id) return;
    setRecallsLoading(true);
    try {
      // Forzar recarga desde el servidor sin caché
      const data = await vehicleService.getRecalls(vehicle.id, forceRefresh);
      setRecalls(data);
    } catch (err) {
      console.error('Error al cargar recalls:', err);
      // No mostramos error aquí, solo no mostramos recalls
    } finally {
      setRecallsLoading(false);
    }
  };

  const handleSyncRecalls = async () => {
    if (!vehicle) return;
    setSyncLoading(true);
    setMessage('');
    setError('');
    try {
      const res = await vehicleService.syncRecalls(id); // POST /vehicles/{id}/recalls/sync
      if (res && typeof res === 'object') {
        setVehicle((prev) => ({
          ...(prev || {}),
          irv_value: res.irv_value ?? prev?.irv_value,
          irv_raw: res.irv_raw ?? prev?.irv_raw,
          irv_level: res.irv_level ?? prev?.irv_level,
          last_irv_calculation:
            res.last_calculation ?? prev?.last_irv_calculation,
        }));
      }
      setMessage(res?.message || 'Recalls sincronizados correctamente.');
      // Recargar vehículo para obtener IRV actualizado
      await loadVehicle();
      // Recargar recalls después de sincronizar
      await loadRecalls();
    } catch (err) {
      console.error(err);
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

  const handleDelete = async () => {
    if (!vehicle) return;
    if (!window.confirm('¿Seguro que deseas eliminar este vehículo? Esta acción no se puede deshacer.')) {
      return;
    }
    setDeleteLoading(true);
    setError('');
    try {
      await vehicleService.delete(id);
      setMessage('Vehículo eliminado correctamente.');
      // Redirigir al dashboard después de eliminar
      setTimeout(() => {
        navigate('/dashboard');
      }, 1000);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.detail || 'Error al eliminar el vehículo');
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleEditMileage = () => {
    setEditingMileage(true);
    setNewMileage(vehicle?.mileage?.toString() || '');
    setError('');
    setMessage('');
  };

  const handleCancelEditMileage = () => {
    setEditingMileage(false);
    setNewMileage('');
  };

  const handleSaveMileage = async () => {
    if (!vehicle) return;
    const mileageNum = parseInt(newMileage, 10);
    
    if (isNaN(mileageNum) || mileageNum < 0 || mileageNum > 500000) {
      setError('El kilometraje debe ser un número entre 0 y 500,000 km');
      return;
    }

    if (mileageNum < vehicle.mileage) {
      setError(`El nuevo kilometraje (${mileageNum.toLocaleString()} km) no puede ser menor al actual (${vehicle.mileage.toLocaleString()} km)`);
      return;
    }

    setUpdatingMileage(true);
    setError('');
    setMessage('');
    
    try {
      const updated = await vehicleService.update(id, { mileage: mileageNum });
      setVehicle(updated);
      setEditingMileage(false);
      setNewMileage('');
      setMessage(`Kilometraje actualizado a ${mileageNum.toLocaleString()} km. El IRV se ha recalculado automáticamente.`);
      // Recargar vehículo para obtener IRV actualizado
      await loadVehicle();
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.detail || 'Error al actualizar el kilometraje');
    } finally {
      setUpdatingMileage(false);
    }
  };

  const handleEditSeverity = (recallId, currentSeverity) => {
    setEditingSeverity(recallId);
    setNewSeverity(String(currentSeverity));
    setError('');
    setMessage('');
  };

  const handleCancelEditSeverity = () => {
    setEditingSeverity(null);
    setNewSeverity('');
  };

  const handleSaveSeverity = async (recallId) => {
    if (!recallId) return;
    
    const severityNum = parseInt(newSeverity, 10);
    if (isNaN(severityNum) || ![1, 2, 3].includes(severityNum)) {
      setError('La severidad debe ser 1 (Baja), 2 (Media) o 3 (Alta)');
      return;
    }

    setSavingSeverity(true);
    setError('');
    setMessage('');

    try {
      const payload = {
        severity: severityNum,
      };

      await adminRecallsService.updateSeverity(recallId, payload, true); // recalculate_irv = true

      setEditingSeverity(null);
      setNewSeverity('');
      setMessage('Severidad actualizada correctamente. El IRV se ha recalculado automáticamente.');
      
      // Recargar recalls y vehículo para mostrar cambios
      await loadRecalls();
      await loadVehicle();
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.detail || 'Error al actualizar la severidad');
    } finally {
      setSavingSeverity(false);
    }
  };


  // ---------- RENDER ----------

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

  // 👇 A partir de aquí YA EXISTE `vehicle`, así que no peta
  const hasIrv =
    typeof vehicle.irv_value === 'number' ||
    (vehicle.irv_value !== null &&
      vehicle.irv_value !== undefined &&
      !Number.isNaN(Number(vehicle.irv_value)));

  const irvScore = hasIrv ? Number(vehicle.irv_value) : null;
  const levelClass = getIRVLevelClass(vehicle.irv_level);
  const levelText = getIRVLevelText(vehicle.irv_level);

  const hasBreakdown =
    vehicle.irv_breakdown &&
    typeof vehicle.irv_breakdown === 'object' &&
    Object.keys(vehicle.irv_breakdown).length > 0;

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
        {/* Card principal */}
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
              {editingMileage ? (
                <div className="mileage-edit-form">
                  <input
                    type="number"
                    min="0"
                    max="500000"
                    value={newMileage}
                    onChange={(e) => setNewMileage(e.target.value)}
                    className="mileage-input"
                    placeholder="Nuevo kilometraje"
                    disabled={updatingMileage}
                  />
                  <div className="mileage-edit-actions">
                    <button
                      type="button"
                      className="btn btn-primary btn-sm"
                      onClick={handleSaveMileage}
                      disabled={updatingMileage}
                    >
                      {updatingMileage ? 'Guardando...' : '✓ Guardar'}
                    </button>
                    <button
                      type="button"
                      className="btn btn-outline btn-sm"
                      onClick={handleCancelEditMileage}
                      disabled={updatingMileage}
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              ) : (
                <div className="mileage-display">
              <span className="value">
                {vehicle.mileage != null
                  ? `${vehicle.mileage.toLocaleString()} km`
                  : 'N/A'}
              </span>
                  <button
                    type="button"
                    className="btn btn-outline btn-xs"
                    onClick={handleEditMileage}
                    title="Editar kilometraje"
                  >
                    ✏️
                  </button>
                </div>
              )}
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
            {vehicle.last_irv_calculation && (
              <div className="info-item">
                <span className="label">Último cálculo IRV:</span>
                <span className="value">
                  {new Date(vehicle.last_irv_calculation).toLocaleString()}
                </span>
              </div>
            )}
          </div>

          <div className="vehicle-actions">
            <button
              type="button"
              className="btn btn-primary btn-sm"
              onClick={handleSyncRecalls}
              disabled={syncLoading}
              title="Sincronizar nuevos recalls desde NHTSA (no modifica severidad editada)"
            >
              {syncLoading ? 'Sincronizando...' : '🔄 Sincronizar Recalls'}
            </button>
            <button
              type="button"
              className="btn btn-danger btn-sm"
              onClick={handleDelete}
              disabled={deleteLoading}
              title="Eliminar este vehículo"
            >
              {deleteLoading ? 'Eliminando...' : '🗑️ Eliminar'}
            </button>
          </div>
        </div>

        {/* Sección de Cálculo IRV */}
        {vehicle.irv_breakdown && (
          <div className="vehicle-card irv-calculation-card">
            <h3>Cálculo del IRV</h3>
            
            <div className="irv-formula-section">
              <div className="formula-block">
                <h4>IRV Crudo</h4>
                <div className="formula">
                  <div className="formula-line">
                    <span className="formula-label">IRV_crudo =</span>
                  </div>
                  <div className="formula-line">
                    <span className="formula-label">
                      ( Σ(Severidad × Peso_Tiempo) / Total_Recalls ) × Factor_Categoría × Factor_Kilometraje
                    </span>
                  </div>
                  <div className="formula-calculation">
                    <div className="calculation-step">
                      <span className="step-label">Total Recalls:</span>
                      <span className="step-value">
                        {vehicle.irv_breakdown.total_recalls || 0}
                      </span>
                    </div>
                    {vehicle.irv_breakdown.recall_details && vehicle.irv_breakdown.recall_details.length > 0 && (
                      <div className="calculation-step">
                        <span className="step-label">Peso_Tiempo promedio:</span>
                        <span className="step-value">
                          {(
                            vehicle.irv_breakdown.recall_details.reduce(
                              (sum, r) => sum + (r.time_weight || 0),
                              0
                            ) / vehicle.irv_breakdown.recall_details.length
                          ).toFixed(2)}
                        </span>
                      </div>
                    )}
                    <div className="calculation-step">
                      <span className="step-label">Σ(Severidad × Peso_Tiempo):</span>
                      <span className="step-value">
                        {vehicle.irv_breakdown.sum_severity_time?.toFixed(2) || 'N/A'}
                      </span>
                    </div>
                    <div className="calculation-step">
                      <span className="step-label">Promedio (Σ / Total):</span>
                      <span className="step-value">
                        {vehicle.irv_breakdown.average_severity_time?.toFixed(2) || 'N/A'}
                      </span>
                    </div>
                    <div className="calculation-step">
                      <span className="step-label">Factor Categoría:</span>
                      <span className="step-value">
                        {vehicle.irv_breakdown.category_factor?.toFixed(2) || 'N/A'}
                      </span>
                    </div>
                    <div className="calculation-step">
                      <span className="step-label">Factor Kilometraje:</span>
                      <span className="step-value">
                        {vehicle.irv_breakdown.mileage_factor?.toFixed(2) || 'N/A'}
                      </span>
                    </div>
                    <div className="calculation-result">
                      <span className="result-label">IRV Crudo =</span>
                      <span className="result-value">
                        {vehicle.irv_breakdown.average_severity_time?.toFixed(2) || 'N/A'} ×{' '}
                        {vehicle.irv_breakdown.category_factor?.toFixed(2) || 'N/A'} ×{' '}
                        {vehicle.irv_breakdown.mileage_factor?.toFixed(2) || 'N/A'} ={' '}
                        <strong>{vehicle.irv_raw?.toFixed(2) || vehicle.irv_breakdown.irv_raw?.toFixed(2) || 'N/A'}</strong>
                      </span>
                    </div>
                    
                    {/* Desglose detallado de Peso_Tiempo por recall */}
                    {vehicle.irv_breakdown.recall_details && vehicle.irv_breakdown.recall_details.length > 0 && (
                      <div className="time-weight-breakdown">
                        <h5>Desglose de Peso_Tiempo por Recall:</h5>
                        <div className="time-weight-list">
                          {vehicle.irv_breakdown.recall_details.map((detail, idx) => (
                            <div key={idx} className="time-weight-item">
                              <span className="time-weight-label">
                                Recall #{idx + 1}:
                              </span>
                              <span className="time-weight-value">
                                Peso_Tiempo = {detail.time_weight?.toFixed(2) || 'N/A'}
                                {detail.days_elapsed !== null && detail.days_elapsed !== undefined && (
                                  <span className="days-elapsed">
                                    {' '}({detail.days_elapsed} días)
                                  </span>
                                )}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="formula-block">
                <h4>IRV Normalizado</h4>
                <div className="formula">
                  <div className="formula-line">
                    <span className="formula-label">IRV_normalizado =</span>
                  </div>
                  <div className="formula-line">
                    <span className="formula-label">
                      ( IRV_crudo / IRV_máx_teórico ) × 100
                    </span>
                  </div>
                  <div className="formula-calculation">
                    <div className="calculation-result">
                      <span className="result-label">IRV Normalizado =</span>
                      <span className="result-value">
                        ( {vehicle.irv_raw?.toFixed(2) || vehicle.irv_breakdown?.irv_raw?.toFixed(2) || 'N/A'} /{' '}
                        {vehicle.irv_breakdown?.irv_max_teorico?.toFixed(1) || '15.0'} ) × 100 ={' '}
                        <strong>{vehicle.irv_value?.toFixed(0) || 'N/A'}</strong>
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Panel de Recalls - Ahora debajo de la tarjeta */}
        <div className="vehicle-detail-recalls-section">
          <div className="recalls-section-header">
          <h2>Recalls del vehículo</h2>
            <div className="recalls-actions">
              <button
                className="btn btn-primary btn-sm"
                onClick={handleSyncRecalls}
                disabled={syncLoading || loading}
                title="Sincronizar nuevos recalls desde NHTSA (no modifica severidad editada)"
              >
                {syncLoading ? 'Sincronizando...' : '🔄 Sincronizar Recalls'}
              </button>
            </div>
          </div>

          {recallsLoading && (
            <div className="loading-state">
              <div className="spinner" />
              <p>Cargando recalls...</p>
            </div>
          )}

          {!recallsLoading && recalls && (
            <div className="recalls-results">
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
                          {(recall.ReportReceivedDate || recall.date) && (
                            <span className="recall-date" title={recall.ReportReceivedDate || recall.date}>
                              📅 {formatDate(recall.ReportReceivedDate || recall.date) || (recall.ReportReceivedDate || recall.date)}
                            </span>
                          )}
                          <div className="severity-section">
                            {editingSeverity === recall.id ? (
                              <div className="severity-edit-form">
                                <select
                                  value={newSeverity}
                                  onChange={(e) => setNewSeverity(e.target.value)}
                                  className="severity-select"
                                  disabled={savingSeverity}
                                >
                                  <option value="1">1 — Baja</option>
                                  <option value="2">2 — Media</option>
                                  <option value="3">3 — Alta</option>
                                </select>
                                <div className="severity-edit-actions">
                                  <button
                                    type="button"
                                    className="btn btn-primary btn-xs"
                                    onClick={() => handleSaveSeverity(recall.id)}
                                    disabled={savingSeverity}
                                  >
                                    {savingSeverity ? '...' : '✓'}
                                  </button>
                                  <button
                                    type="button"
                                    className="btn btn-outline btn-xs"
                                    onClick={handleCancelEditSeverity}
                                    disabled={savingSeverity}
                                  >
                                    ✕
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <div className="severity-display">
                                <span
                                  className={`severity-badge ${severityCls}`}
                                  title={
                                    score
                                      ? `Score de severidad: ${score} / 5`
                                      : undefined
                                  }
                                >
                                  Severidad: {recall.severity !== null && recall.severity !== undefined ? `${recall.severity} — ` : ''}{severityLabel}
                                </span>
                                {isAdmin && recall.id && (
                                  <button
                                    type="button"
                                    className="btn btn-outline btn-xs severity-edit-btn"
                                    onClick={() => handleEditSeverity(recall.id, recall.severity)}
                                    title="Editar severidad (solo admin)"
                                  >
                                    ✏️
                                  </button>
                                )}
                              </div>
                            )}
                          </div>
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
                            <strong>Fabricante:</strong> {recall.Manufacturer}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {!recallsLoading && !recalls && (
            <p className="empty-message">
              Haz clic en "Sincronizar" para cargar los recalls de este vehículo.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
