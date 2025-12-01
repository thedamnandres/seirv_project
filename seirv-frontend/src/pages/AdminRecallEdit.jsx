import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { vehicleService } from '../services/api';
import Loading from '../components/Loading';

const getSeverityLabel = (severity) => {
  if (severity === 3) return 'Severidad Alta';
  if (severity === 2) return 'Severidad Media';
  if (severity === 1) return 'Severidad Baja';
  return 'Sin severidad';
};

const getSeverityClass = (severity) => {
  if (severity === 3) return 'severity-high';
  if (severity === 2) return 'severity-medium';
  if (severity === 1) return 'severity-low';
  return 'severity-none';
};

export default function AdminRecallEdit() {
  const { id } = useParams(); // recall_id
  const navigate = useNavigate();

  const [recall, setRecall] = useState(null);

  const [severity, setSeverity] = useState(2);
  const [severityScore, setSeverityScore] = useState('');
  const [notes, setNotes] = useState('');

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // 1) Cargar datos del recall
  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError('');
      try {
        const data = await vehicleService.getAdminRecallById(id);
        setRecall(data);
        // Inicializar formulario
        setSeverity(data.severity ?? 2);
        setSeverityScore(
          data.severity_score !== null && data.severity_score !== undefined
            ? String(data.severity_score)
            : ''
        );
        setNotes(data.notes || '');
      } catch (err) {
        console.error(err);
        setError(
          err.response?.data?.detail ||
            'No se pudo cargar el recall para edición.'
        );
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [id]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');

    try {
      const payload = {
        severity: Number(severity),
      };

      if (severityScore !== '') {
        payload.severity_score = Number(severityScore);
      }
      if (notes.trim()) {
        payload.notes = notes.trim();
      }

      const updated = await vehicleService.updateRecallSeverity(
        id,
        payload,
        true // recalcular IRV
      );

      setRecall(updated);
      setSuccess('Severidad actualizada correctamente y IRV recalculado.');
    } catch (err) {
      console.error(err);
      setError(
        err.response?.data?.detail ||
          'Ocurrió un error al actualizar la severidad.'
      );
    } finally {
      setSaving(false);
    }
  };

  const handleBack = () => {
    // vuelve al detalle, si quieres puedes cambiar a /admin/recalls
    navigate(-1);
  };

  if (loading) return <Loading />;

  if (error && !recall) {
    return (
      <div className="page admin-recall-edit">
        <div className="page-header">
          <button
            type="button"
            className="btn btn-outline btn-sm"
            onClick={handleBack}
          >
            ← Volver
          </button>
          <h1>Editar severidad de Recall</h1>
        </div>
        <div className="alert alert-error">{error}</div>
      </div>
    );
  }

  const severityNumber = Number(severity);
  const previewLabel = getSeverityLabel(severityNumber);
  const previewClass = getSeverityClass(severityNumber);

  return (
    <div className="page admin-recall-edit">
      <div className="page-header">
        <button
          type="button"
          className="btn btn-outline btn-sm"
          onClick={handleBack}
        >
          ← Volver
        </button>

        <div>
          <h1>Editar severidad de Recall</h1>
          {recall && (
            <p className="page-subtitle">
              {recall.nhtsa_campaign_number || `Recall #${recall.id}`} ·
              Vehículo #{recall.vehicle_id}
            </p>
          )}
        </div>

        <div className="page-actions">
          <span className={`severity-badge ${previewClass}`}>
            {previewLabel}
          </span>
        </div>
      </div>

      <div className="admin-recall-layout">
        {/* Panel info (izquierda) */}
        {recall && (
          <section className="card meta-card">
            <h2>Información actual</h2>
            <dl className="meta-list">
              <div className="meta-row">
                <dt>Campaña NHTSA</dt>
                <dd>{recall.nhtsa_campaign_number || 'N/A'}</dd>
              </div>
              <div className="meta-row">
                <dt>Componente</dt>
                <dd>{recall.component || 'N/A'}</dd>
              </div>
              <div className="meta-row">
                <dt>Fabricante</dt>
                <dd>{recall.manufacturer || 'N/A'}</dd>
              </div>
              <div className="meta-row">
                <dt>Severidad actual</dt>
                <dd>
                  <span className={`severity-badge ${getSeverityClass(recall.severity)}`}>
                    {getSeverityLabel(recall.severity)}
                  </span>
                </dd>
              </div>
              <div className="meta-row">
                <dt>Score actual</dt>
                <dd>{recall.severity_score ?? 'N/A'}</dd>
              </div>
            </dl>
          </section>
        )}

        {/* Panel formulario (derecha) */}
        <section className="card form-card">
          <h2>Actualizar severidad</h2>

          {error && <div className="alert alert-error">{error}</div>}
          {success && <div className="alert alert-success">{success}</div>}

          <form onSubmit={handleSubmit} className="form-vertical">
            {/* Severidad */}
            <div className="form-group">
              <label>Severidad (1–3)</label>
              <div className="severity-options">
                <label className="severity-option">
                  <input
                    type="radio"
                    name="severity"
                    value="1"
                    checked={severityNumber === 1}
                    onChange={(e) => setSeverity(e.target.value)}
                  />
                  <span className="badge severity-low">Baja (1)</span>
                </label>

                <label className="severity-option">
                  <input
                    type="radio"
                    name="severity"
                    value="2"
                    checked={severityNumber === 2}
                    onChange={(e) => setSeverity(e.target.value)}
                  />
                  <span className="badge severity-medium">Media (2)</span>
                </label>

                <label className="severity-option">
                  <input
                    type="radio"
                    name="severity"
                    value="3"
                    checked={severityNumber === 3}
                    onChange={(e) => setSeverity(e.target.value)}
                  />
                  <span className="badge severity-high">Alta (3)</span>
                </label>
              </div>
            </div>

            {/* Score opcional */}
            <div className="form-group">
              <label htmlFor="severityScore">
                Score (1.0 – 5.0, opcional)
              </label>
              <input
                id="severityScore"
                type="number"
                min="1"
                max="5"
                step="0.1"
                value={severityScore}
                onChange={(e) => setSeverityScore(e.target.value)}
                className="form-control"
                placeholder="Ej: 3.5"
              />
              <small className="form-text">
                Déjalo vacío si no quieres modificar el score.
              </small>
            </div>

            {/* Notas opcionales */}
            <div className="form-group">
              <label htmlFor="notes">Notas internas (opcional)</label>
              <textarea
                id="notes"
                rows={4}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="form-control"
                placeholder="Ej: 'Corregido manualmente: recall crítico de frenos'"
              />
            </div>

            <div className="form-actions">
              <button
                type="button"
                className="btn btn-outline"
                onClick={handleBack}
                disabled={saving}
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={saving}
              >
                {saving ? 'Guardando...' : 'Guardar cambios'}
              </button>
            </div>
          </form>
        </section>
      </div>
    </div>
  );
}
