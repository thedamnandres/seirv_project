import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
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

export default function AdminRecallDetail() {
  const { id } = useParams(); // recall_id
  const navigate = useNavigate();

  const [recall, setRecall] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError('');
      try {
        const data = await vehicleService.getAdminRecallById(id);
        setRecall(data);
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

          <Link
            to={`/admin/recalls/${recall.id}/edit`}
            className="btn btn-primary btn-sm"
          >
            Editar severidad
          </Link>
        </div>
      </div>

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
              <dt>Score</dt>
              <dd>{recall.severity_score ?? 'N/A'}</dd>
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
      </div>
    </div>
  );
}
