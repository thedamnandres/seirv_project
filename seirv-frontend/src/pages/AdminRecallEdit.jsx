// src/pages/AdminRecallEdit.jsx
import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { adminRecallsService } from '../services/api';
import './AdminRecalls.scss';

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

export default function AdminRecallEdit() {
  // Aceptar tanto :id como :recallId en la ruta
  const params = useParams();
  const recallIdParam = params.recallId ?? params.id;

  const navigate = useNavigate();

  const [recall, setRecall] = useState(null);
  const [severity, setSeverity] = useState('');
  const [notes, setNotes] = useState('');

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Cargar datos del recall
  useEffect(() => {
    const idNumber = Number(recallIdParam);
    if (!recallIdParam || Number.isNaN(idNumber) || idNumber <= 0) {
      setError('ID de recall inválido.');
      setLoading(false);
      return;
    }

    const load = async () => {
      setLoading(true);
      setError('');
      try {
        const data = await adminRecallsService.getById(idNumber);
        setRecall(data);
        setSeverity(data.severity ?? '');
        setNotes(data.notes ?? '');
      } catch (err) {
        console.error(err);
        const detail =
          err.response?.data?.detail ||
          'No se pudo cargar la información del recall.';
        setError(
          Array.isArray(detail)
            ? detail.map((d) => d.msg || d).join(' | ')
            : String(detail)
        );
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [recallIdParam]);

  const handleSave = async (e) => {
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
      // basado en el nivel de severidad (1 -> 1.0, 2 -> 2.0, 3 -> 3.0)
      
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

  if (loading) {
    return (
      <div className="admin-recalls-page">
        <p>Cargando recall…</p>
      </div>
    );
  }

  if (error && !recall) {
    return (
      <div className="admin-recalls-page">
        <div className="alert alert-error">{error}</div>
        <Link to="/admin/recalls" className="btn btn-outline">
          Volver al panel de recalls
        </Link>
      </div>
    );
  }

  if (!recall) {
    return null;
  }

  return (
    <div className="admin-recalls-page">
      <header className="admin-recalls-header">
        <h1>Actualizar severidad</h1>
        <p>
          Ajusta el nivel de severidad de este recall. Al guardar, se recalculará
          el IRV del vehículo asociado.
        </p>
      </header>

      <div className="admin-recalls-top-actions">
        <Link to="/admin/recalls" className="btn btn-outline btn-sm">
          ← Volver al panel
        </Link>
        <span className="recall-id-pill">Recall ID: {recall.id}</span>
      </div>

      {error && <div className="alert alert-error">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      <section className="admin-recalls-detail-layout">
        {/* Columna izquierda: resumen */}
        <div className="admin-recall-card">
          <div className="admin-recall-card-header">
            <h2>{recall.nhtsa_campaign_number || `Recall #${recall.id}`}</h2>
            <span className={`severity-badge ${getSeverityClass(recall.severity)}`}>
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
                <strong>Score calculado:</strong> {recall.severity_score.toFixed(1)} (automático)
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

        {/* Columna derecha: formulario */}
        <div className="admin-recall-form-card">
          <h2>Editar severidad</h2>
          <p className="admin-recall-form-hint">
            Selecciona el nivel de severidad (1 = Bajo, 2 = Medio, 3 = Alto). 
            El score de severidad se calculará automáticamente en el backend. 
            El IRV se recalculará automáticamente al guardar.
          </p>

          <form onSubmit={handleSave} className="admin-recall-form">
            <div className="field-group">
              <label>Severidad (1–3)</label>
              <div className="severity-radio-group">
                <label className="severity-radio severity-low">
                  <input
                    type="radio"
                    name="severity"
                    value="1"
                    checked={severity === '1' || severity === 1}
                    onChange={(e) => setSeverity(e.target.value)}
                  />
                  <span>Baja (1)</span>
                </label>
                <label className="severity-radio severity-medium">
                  <input
                    type="radio"
                    name="severity"
                    value="2"
                    checked={severity === '2' || severity === 2}
                    onChange={(e) => setSeverity(e.target.value)}
                  />
                  <span>Media (2)</span>
                </label>
                <label className="severity-radio severity-high">
                  <input
                    type="radio"
                    name="severity"
                    value="3"
                    checked={severity === '3' || severity === 3}
                    onChange={(e) => setSeverity(e.target.value)}
                  />
                  <span>Alta (3)</span>
                </label>
              </div>
            </div>

            <div className="field-group">
              <label htmlFor="notes">Notas internas (opcional)</label>
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
    </div>
  );
}
