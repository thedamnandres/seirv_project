import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { vehicleService, adminRecallsService } from '../services/api';
import Loading from '../components/Loading';
import './AdminRecalls.scss';

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

export default function AdminRecallDetail() {
  const { id } = useParams(); // recall_id
  const navigate = useNavigate();

  const [recall, setRecall] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [severity, setSeverity] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState('');

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError('');
      try {
        const data = await vehicleService.getAdminRecallById(id);
        setRecall(data);
        setSeverity(data.severity ?? '');
        setNotes(data.notes ?? '');
      } catch (err) {
        console.error(err);
        setError(
          err.response?.data?.detail ||
            'No se pudo cargar el detalle del recall.'
        );
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [id]);

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

      // El severity_score se calcula automáticamente en el backend
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
      
      // Disparar evento personalizado para que VehicleDetail recargue los recalls
      window.dispatchEvent(new CustomEvent('recallSeverityUpdated', {
        detail: { recallId: recall.id, vehicleId: recall.vehicle_id }
      }));
    } catch (err) {
      console.error(err);
      const detail =
        err.response?.data?.detail || 'Ocurrió un error al actualizar la severidad.';
      setError(
        Array.isArray(detail)
          ? detail.map((d) => d.msg || d).join(' | ')
          : String(detail)
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <Loading />;

  if (error) {
    return (
      <div className="page admin-recall-detail">
        <div className="page-header">
          <button
            type="button"
            className="btn btn-outline btn-sm"
            onClick={() => navigate(-1)}
          >
            ← Volver
          </button>
          <h1>Detalle de Recall (Admin)</h1>
        </div>

        <div className="alert alert-error">{error}</div>
      </div>
    );
  }

  if (!recall) {
    return (
      <div className="page admin-recall-detail">
        <div className="page-header">
          <button
            type="button"
            className="btn btn-outline btn-sm"
            onClick={() => navigate(-1)}
          >
            ← Volver
          </button>
          <h1>Detalle de Recall (Admin)</h1>
        </div>
        <p>No se encontró información del recall.</p>
      </div>
    );
  }

  const severityLabel = getSeverityLabel(recall.severity);
  const severityClass = getSeverityClass(recall.severity);

  return (
    <div className="page admin-recall-detail">
      <div className="page-header">
        <button
          type="button"
          className="btn btn-outline btn-sm"
          onClick={() => navigate(-1)}
        >
          ← Volver
        </button>

        <div>
          <h1>
            Recall {recall.nhtsa_campaign_number || `#${recall.id}`}
          </h1>
          <p className="page-subtitle">
            Vehículo #{recall.vehicle_id} ·{' '}
            {recall.report_received_date
              ? new Date(recall.report_received_date).toLocaleDateString()
              : 'Fecha no disponible'}
          </p>
        </div>

        <div className="page-actions">
          <span className={`severity-badge ${severityClass}`}>
            {severityLabel}
          </span>
        </div>
      </div>

      {error && <div className="alert alert-error">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      <div className="admin-recall-layout">
        {/* Panel izquierdo: meta info */}
        <section className="card meta-card">
          <h2>Información general</h2>
          <dl className="meta-list">
            <div className="meta-row">
              <dt>ID interno</dt>
              <dd>{recall.id}</dd>
            </div>
            <div className="meta-row">
              <dt>Vehículo ID</dt>
              <dd>{recall.vehicle_id}</dd>
            </div>
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
              <dt>Score calculado</dt>
              <dd>
                {recall.severity_score 
                  ? `${recall.severity_score.toFixed(1)} (automático)`
                  : 'N/A'}
              </dd>
            </div>
            <div className="meta-row">
              <dt>Última sincronización</dt>
              <dd>
                {recall.last_synced_at
                  ? new Date(recall.last_synced_at).toLocaleString()
                  : 'N/A'}
              </dd>
            </div>
            <div className="meta-row">
              <dt>Última actualización</dt>
              <dd>
                {recall.updated_at
                  ? new Date(recall.updated_at).toLocaleString()
                  : 'N/A'}
              </dd>
            </div>
          </dl>
        </section>

        {/* Panel derecho: textos largos */}
        <section className="card detail-card">
          <h2>Detalle técnico</h2>

          <div className="detail-block">
            <h3>Problema</h3>
            <p>{recall.summary || 'Sin descripción'}</p>
          </div>

          {recall.consequence && (
            <div className="detail-block warning-block">
              <h3>Consecuencia</h3>
              <p>{recall.consequence}</p>
            </div>
          )}

          {recall.remedy && (
            <div className="detail-block info-block">
              <h3>Solución propuesta</h3>
              <p>{recall.remedy}</p>
            </div>
          )}

          {recall.notes && (
            <div className="detail-block notes-block">
              <h3>Notas internas</h3>
              <p>{recall.notes}</p>
            </div>
          )}
        </section>

        {/* Panel de edición de severidad */}
        <section className="card edit-severity-card">
          <h2>Editar severidad</h2>
          <p className="admin-recall-form-hint">
            Ajusta el nivel de severidad. El score se calculará automáticamente. 
            Al guardar, se recalculará el IRV del vehículo.
          </p>

          <form onSubmit={handleUpdateSeverity} className="admin-recall-form">
            <div className="field-group">
              <label htmlFor="severity">Severidad</label>
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
        </section>
      </div>
    </div>
  );
}
