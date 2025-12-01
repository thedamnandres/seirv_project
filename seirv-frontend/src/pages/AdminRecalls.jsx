// src/pages/AdminRecalls.jsx
import { useState } from 'react';
import { adminRecallsService } from '../services/api';
import './AdminRecalls.scss';
import { useNavigate } from 'react-router-dom';

function getSeverityLabel(severity) {
  const n = Number(severity);
  if (n === 3) return 'Severidad Alta';
  if (n === 2) return 'Severidad Media';
  if (n === 1) return 'Severidad Baja';
  return 'Sin severidad asignada';
}

function getSeverityClass(severity) {
  const n = Number(severity);
  if (n === 3) return 'severity-high';
  if (n === 2) return 'severity-medium';
  if (n === 1) return 'severity-low';
  return 'severity-none';
}

export default function AdminRecalls() {
  const navigate = useNavigate();

  const [searchId, setSearchId] = useState('');
  const [recall, setRecall] = useState(null);

  const [severity, setSeverity] = useState('');
  const [severityScore, setSeverityScore] = useState('');
  const [notes, setNotes] = useState('');

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSearch = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setRecall(null);

    const idNumber = Number(searchId);
    if (!searchId || Number.isNaN(idNumber) || idNumber <= 0) {
      setError('Ingresa un ID de recall válido (entero positivo).');
      return;
    }

    setLoading(true);
    try {
      const data = await adminRecallsService.getById(idNumber);

      setRecall(data);
      // precargar formulario con valores actuales
      setSeverity(data.severity ?? '');
      setSeverityScore(
        typeof data.severity_score === 'number'
          ? String(data.severity_score)
          : ''
      );
      setNotes(data.notes ?? '');
    } catch (err) {
      console.error(err);
      const detail =
        err.response?.data?.detail ||
        'No se encontró el recall con ese ID o no se pudo cargar.';
      setError(
        Array.isArray(detail)
          ? detail.map((d) => d.msg || d).join(' | ')
          : String(detail)
      );
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateSeverity = async (e) => {
    e.preventDefault();
    if (!recall) return;

    setError('');
    setSuccess('');
    setSaving(true);

    try {
      const payload = {
        severity: Number(severity),
      };

      if (severityScore) {
        payload.severity_score = Number(severityScore);
      }
      if (notes.trim()) {
        payload.notes = notes.trim();
      }

      const updated = await adminRecallsService.updateSeverity(
        recall.id,
        payload,
        true // recalculate_irv
      );

      setRecall(updated);
      setSuccess('Severidad actualizada correctamente y IRV recalculado.');
    } catch (err) {
      console.error(err);
      const detail =
        err.response?.data?.detail || 'No se pudo actualizar la severidad.';
      setError(
        Array.isArray(detail)
          ? detail.map((d) => d.msg || d).join(' | ')
          : String(detail)
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="admin-recalls-page">
      <header className="admin-recalls-header">
        <h1>Panel de Administración de Recalls</h1>
        <p>
          Solo usuarios administradores. Aquí puedes revisar y ajustar la
          severidad de los recalls registrados en el sistema.
        </p>
      </header>

      {/* BUSCADOR POR RECALL_ID */}
      <section className="admin-recalls-search-card">
        <form onSubmit={handleSearch} className="admin-recalls-search-form">
          <div className="field-group">
            <label htmlFor="recall-id">
              ID de Recall
              <span className="field-hint">
                (usa el ID interno del sistema, entero positivo)
              </span>
            </label>
            <input
              id="recall-id"
              type="number"
              min="1"
              value={searchId}
              onChange={(e) => setSearchId(e.target.value)}
              placeholder="Ej: 5"
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            disabled={loading || !searchId}
          >
            {loading ? 'Buscando...' : 'Buscar Recall'}
          </button>
        </form>
      </section>

      {error && (
        <div className="alert alert-error" role="alert">
          {error}
        </div>
      )}

      {success && (
        <div className="alert alert-success" role="status">
          {success}
        </div>
      )}

      {/* DETALLE + FORMULARIO SOLO SI HAY RECALL */}
      {recall && (
        <section className="admin-recalls-detail-layout">
          {/* Columna: información del recall */}
          <div className="admin-recall-card">
            <div className="admin-recall-card-header">
              <h2>{recall.nhtsa_campaign_number || `Recall #${recall.id}`}</h2>
              <span
                className={`severity-badge ${getSeverityClass(
                  recall.severity
                )}`}
              >
                {getSeverityLabel(recall.severity)}
              </span>
            </div>

            <div className="admin-recall-meta">
              <p>
                <strong>Vehículo ID:</strong> {recall.vehicle_id}
              </p>
              {recall.component && (
                <p>
                  <strong>Componente:</strong> {recall.component}
                </p>
              )}
              {recall.manufacturer && (
                <p>
                  <strong>Fabricante:</strong> {recall.manufacturer}
                </p>
              )}
              {typeof recall.severity_score === 'number' && (
                <p>
                  <strong>Score actual:</strong>{' '}
                  {recall.severity_score.toFixed(1)}
                </p>
              )}
              {recall.report_received_date && (
                <p>
                  <strong>Fecha de reporte:</strong>{' '}
                  {new Date(recall.report_received_date).toLocaleString()}
                </p>
              )}
            </div>

            {recall.summary && (
              <div className="admin-recall-block">
                <h3>Problema</h3>
                <p>{recall.summary}</p>
              </div>
            )}

            {recall.consequence && (
              <div className="admin-recall-block consequence">
                <h3>Consecuencia</h3>
                <p>{recall.consequence}</p>
              </div>
            )}

            {recall.remedy && (
              <div className="admin-recall-block remedy">
                <h3>Solución</h3>
                <p>{recall.remedy}</p>
              </div>
            )}
          </div>

          {/* Columna: formulario de severidad */}
          <div className="admin-recall-form-card">
            <div className="admin-recall-form-header">
              <h2>Editar severidad</h2>
              <button
                type="button"
                className="btn btn-outline btn-sm"
                onClick={() => navigate(`/admin/recalls/${recall.id}/edit`)}
              >
                Abrir página de edición
              </button>
            </div>

            <p className="admin-recall-form-hint">
              Ajusta el nivel de severidad (1 = Bajo, 2 = Medio, 3 = Alto). Al
              guardar, se recalculará el IRV del vehículo.
            </p>

            <form
              onSubmit={handleUpdateSeverity}
              className="admin-recall-form"
            >
              <div className="field-group">
                <label htmlFor="severity">Severidad (1, 2 o 3)</label>
                <select
                  id="severity"
                  value={severity}
                  onChange={(e) => setSeverity(e.target.value)}
                  required
                >
                  <option value="">Selecciona un nivel…</option>
                  <option value="1">1 — Baja</option>
                  <option value="2">2 — Media</option>
                  <option value="3">3 — Alta</option>
                </select>
              </div>

              <div className="field-group">
                <label htmlFor="severity-score">
                  Score de severidad (1.0 – 5.0)
                  <span className="field-hint">Opcional</span>
                </label>
                <input
                  id="severity-score"
                  type="number"
                  step="0.1"
                  min="1"
                  max="5"
                  value={severityScore}
                  onChange={(e) => setSeverityScore(e.target.value)}
                  placeholder="Ej: 3.5"
                />
              </div>

              <div className="field-group">
                <label htmlFor="notes">
                  Notas internas
                  <span className="field-hint">
                    Opcional (solo visible para admin)
                  </span>
                </label>
                <textarea
                  id="notes"
                  rows={4}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Ej: Corregido manualmente: recall crítico de frenos…"
                />
              </div>

              <button
                type="submit"
                className="btn btn-primary"
                disabled={saving || !severity}
              >
                {saving ? 'Guardando…' : 'Guardar cambios'}
              </button>
            </form>
          </div>
        </section>
      )}
    </div>
  );
}
