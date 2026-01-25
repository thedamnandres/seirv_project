import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { reportsService } from "../services/reportsService";

// ================= UI Components (FUERA del componente principal) =================
const Badge = ({ variant = "neutral", children }) => (
  <span className={`badge badge-${variant}`}>{children}</span>
);

const Card = ({ title, subtitle, children, right }) => (
  <section className="card">
    <div className="card-header">
      <div>
        <h2 className="card-title">{title}</h2>
        {subtitle ? <p className="card-subtitle">{subtitle}</p> : null}
      </div>
      {right ? <div className="card-right">{right}</div> : null}
    </div>
    <div className="card-body">{children}</div>
  </section>
);

const StatCard = ({ label, main, hint, actions }) => (
  <div className="stat-card">
    <div>
      <div className="stat-label">{label}</div>
      <div className="stat-main">{main}</div>
      {hint ? <div className="stat-hint">{hint}</div> : null}
    </div>
    {actions ? <div className="stat-actions">{actions}</div> : null}
  </div>
);

// =============================== PAGE ===============================
export default function Reports() {
  // ============= 1) Por tipo =============
  const [vehicleType, setVehicleType] = useState("SUV");
  const [byType, setByType] = useState(null);
  const [byTypeLoading, setByTypeLoading] = useState(false);
  const [byTypeError, setByTypeError] = useState(null);

  const [sortKey, setSortKey] = useState("recalls");
  const [sortDir, setSortDir] = useState("asc");

  // ============= 2) Por marca =============
  const [topBrands, setTopBrands] = useState(null);
  const [brandsLoading, setBrandsLoading] = useState(false);
  const [brandsError, setBrandsError] = useState(null);

  const [brandSelected, setBrandSelected] = useState("");
  const [worstByBrand, setWorstByBrand] = useState(null);
  const [worstLoading, setWorstLoading] = useState(false);
  const [worstError, setWorstError] = useState(null);

  // ============= 3) Combinado =============
  const [comboType, setComboType] = useState("");
  const [comboMake, setComboMake] = useState("");
  const [comboModel, setComboModel] = useState("");

  const [safest, setSafest] = useState(null);
  const [safestLoading, setSafestLoading] = useState(false);
  const [safestError, setSafestError] = useState(null);

  // Debounce timers (refs, no re-render)
  const debounceTimerBrand = useRef(null);
  const debounceTimerCombo = useRef(null);

  // --------- load: por tipo ----------
  useEffect(() => {
    // opcional: evita spamear si está vacío
    if (!vehicleType?.trim()) {
      setByType(null);
      setByTypeError(null);
      return;
    }

    setByTypeLoading(true);
    setByTypeError(null);

    reportsService
      .getVehiclesByType(vehicleType.trim())
      .then(setByType)
      .catch((e) => setByTypeError(e?.response?.data?.detail || e.message))
      .finally(() => setByTypeLoading(false));
  }, [vehicleType]);

  // --------- load: top brands ----------
  useEffect(() => {
    setBrandsLoading(true);
    setBrandsError(null);

    reportsService
      .getTopBrands(10)
      .then((data) => {
        setTopBrands(data);
        if (!brandSelected && data?.brands?.length) setBrandSelected(data.brands[0].make);
      })
      .catch((e) => setBrandsError(e?.response?.data?.detail || e.message))
      .finally(() => setBrandsLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // --------- load: worst vehicles by brand (debounced) ----------
  useEffect(() => {
    const value = brandSelected?.trim();
    if (!value) {
      setWorstByBrand(null);
      setWorstError(null);
      return;
    }

    if (debounceTimerBrand.current) clearTimeout(debounceTimerBrand.current);

    debounceTimerBrand.current = setTimeout(() => {
      setWorstLoading(true);
      setWorstError(null);

      reportsService
        .getWorstVehiclesByBrand(value, 10)
        .then(setWorstByBrand)
        .catch((e) => setWorstError(e?.response?.data?.detail || e.message))
        .finally(() => setWorstLoading(false));
    }, 450);

    return () => {
      if (debounceTimerBrand.current) clearTimeout(debounceTimerBrand.current);
    };
  }, [brandSelected]);

  // --------- load: safest (debounced) ----------
  useEffect(() => {
    if (debounceTimerCombo.current) clearTimeout(debounceTimerCombo.current);

    debounceTimerCombo.current = setTimeout(() => {
      const t = comboType.trim();
      const m = comboMake.trim();
      const mo = comboModel.trim();

      if (!t && !m && !mo) {
        setSafest(null);
        setSafestError(null);
        return;
      }

      setSafestLoading(true);
      setSafestError(null);

      reportsService
        .getSafestVehicle({
          vehicle_type: t || undefined,
          make: m || undefined,
          model: mo || undefined,
        })
        .then(setSafest)
        .catch((e) => setSafestError(e?.response?.data?.detail || e.message))
        .finally(() => setSafestLoading(false));
    }, 500);

    return () => {
      if (debounceTimerCombo.current) clearTimeout(debounceTimerCombo.current);
    };
  }, [comboType, comboMake, comboModel]);

  // --------- sorting table ----------
  function toggleSort(key) {
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSortKey(key);
      setSortDir("asc");
    }
  }

  const sortedVehicles = useMemo(() => {
    const list = byType?.vehicles ? [...byType.vehicles] : [];
    const mul = sortDir === "asc" ? 1 : -1;

    list.sort((a, b) => {
      const va = a[sortKey];
      const vb = b[sortKey];
      if (typeof va === "number" && typeof vb === "number") return (va - vb) * mul;
      return String(va).localeCompare(String(vb)) * mul;
    });

    return list;
  }, [byType, sortKey, sortDir]);

  return (
    <div className="reports-page">
      <div className="page-head">
        <div>
          <h1 className="page-title">Reportes de Recalls</h1>
          <p className="page-desc">
            Explora recalls con filtros por <b>Tipo</b>, <b>Marca</b> y un filtro <b>Combinado</b> para encontrar el carro más seguro.
          </p>
        </div>
        <div className="page-hint">
          <Badge variant="info">Interactivo</Badge>
          <span>Resultados en tiempo real</span>
        </div>
      </div>

      {/* ===================== 1) Tipo ===================== */}
      <Card
        title="1) Por tipo"
        subtitle="Filtra por categoría (SUV, Sedan, etc.) y revisa todos los vehículos ordenados por recalls."
        right={
          <div className="inline">
            <label className="label">Tipo</label>
            <input
              className="input"
              value={vehicleType}
              onChange={(e) => setVehicleType(e.target.value)}
              placeholder="SUV"
              autoComplete="off"
            />
          </div>
        }
      >
        {byTypeLoading && <div className="notice">🔄 Cargando vehículos…</div>}
        {byTypeError && <div className="notice error">❌ {byTypeError}</div>}

        {byType && (
          <>
            <StatCard
              label="Vehículo con menos recalls (del tipo seleccionado)"
              main={
                <>
                  <b>{byType.least_recalls_vehicle.make}</b> {byType.least_recalls_vehicle.model}{" "}
                  <span className="muted">({byType.least_recalls_vehicle.year})</span>{" "}
                  <Badge variant="success">{byType.least_recalls_vehicle.recalls} recalls</Badge>
                </>
              }
              hint={`Total analizado: ${byType.count} vehículos`}
              actions={
                <Link className="btn btn-primary" to={`/vehicles/${byType.least_recalls_vehicle.id}`}>
                  Ver detalle
                </Link>
              }
            />

            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    {[
                      { key: "make", label: "Marca" },
                      { key: "model", label: "Modelo" },
                      { key: "year", label: "Año" },
                      { key: "recalls", label: "Recalls" },
                      { key: "irv_level", label: "IRV" },
                      { key: "actions", label: "" },
                    ].map((c) => (
                      <th
                        key={c.key}
                        onClick={() => ["make", "model", "year", "recalls"].includes(c.key) && toggleSort(c.key)}
                        className={["make", "model", "year", "recalls"].includes(c.key) ? "th-sort" : ""}
                      >
                        {c.label}{" "}
                        {sortKey === c.key ? <span className="muted">{sortDir === "asc" ? "▲" : "▼"}</span> : null}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {sortedVehicles.map((v) => {
                    const best = v.id === byType.least_recalls_vehicle.id;
                    return (
                      <tr key={v.id} className={best ? "row-best" : ""}>
                        <td>{v.make}</td>
                        <td>{v.model}</td>
                        <td>{v.year}</td>
                        <td>
                          <Badge variant={v.recalls === 0 ? "success" : v.recalls <= 2 ? "info" : "warning"}>
                            {v.recalls}
                          </Badge>
                        </td>
                        <td>
                          {v.irv_level ? <Badge variant="neutral">{v.irv_level}</Badge> : <span className="muted">—</span>}
                        </td>
                        <td className="td-right">
                          <Link className="btn btn-ghost" to={`/vehicles/${v.id}`}>
                            Ver
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}
      </Card>

      {/* ===================== 2) Marca ===================== */}
      <Card
        title="2) Por marca"
        subtitle="Identifica marcas con más recalls y cuáles vehículos de esa marca concentran más incidentes."
      >
        <div className="grid-2">
          <div className="panel">
            <div className="panel-head">
              <h3 className="panel-title">Top marcas con más recalls</h3>
              {brandsLoading ? <Badge variant="info">Cargando…</Badge> : null}
            </div>
            {brandsError && <div className="notice error">❌ {brandsError}</div>}

            {topBrands && (
              <ol className="brand-list">
                {topBrands.brands.map((b, idx) => (
                  <li key={b.make} className="brand-item">
                    <button
                      className={`brand-btn ${b.make === brandSelected ? "active" : ""}`}
                      onClick={() => setBrandSelected(b.make)}
                      type="button"
                    >
                      <span className="muted">#{idx + 1}</span> <b>{b.make}</b>
                    </button>
                    <Badge variant="warning">{b.total_recalls}</Badge>
                  </li>
                ))}
              </ol>
            )}
          </div>

          <div className="panel">
            <div className="panel-head">
              <h3 className="panel-title">Vehículos más recallados de la marca</h3>
              <div className="inline">
                <label className="label">Marca</label>
                <input
                  className="input"
                  value={brandSelected}
                  onChange={(e) => setBrandSelected(e.target.value)}
                  placeholder="Toyota"
                  autoComplete="off"
                />
              </div>
            </div>

            {worstLoading && <div className="notice">🔄 Cargando…</div>}
            {worstError && <div className="notice error">❌ {worstError}</div>}

            {worstByBrand && (
              <>
                {worstByBrand.count === 0 ? (
                  <div className="notice">No hay vehículos con recalls para esa marca.</div>
                ) : (
                  <div className="table-wrap">
                    <table className="table">
                      <thead>
                        <tr>
                          <th>Modelo</th>
                          <th>Año</th>
                          <th>Tipo</th>
                          <th>Recalls</th>
                          <th></th>
                        </tr>
                      </thead>
                      <tbody>
                        {worstByBrand.vehicles.map((v) => (
                          <tr key={v.id}>
                            <td>{v.model}</td>
                            <td>{v.year}</td>
                            <td>
                              <Badge variant="neutral">{v.type}</Badge>
                            </td>
                            <td>
                              <Badge variant="danger">{v.recalls}</Badge>
                            </td>
                            <td className="td-right">
                              <Link className="btn btn-ghost" to={`/vehicles/${v.id}`}>
                                Ver
                              </Link>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </Card>

      {/* ===================== 3) Combinado ===================== */}
      <Card
        title="3) Combinado: carro más seguro"
        subtitle="Aplica cualquier combinación de filtros (tipo, marca, modelo). El sistema devuelve el vehículo con menos recalls."
        right={<Badge variant="info">Auto-update</Badge>}
      >
        <div className="grid-3">
          <div>
            <label className="label">Tipo</label>
            <input className="input" value={comboType} onChange={(e) => setComboType(e.target.value)} placeholder="SUV" autoComplete="off" />
          </div>
          <div>
            <label className="label">Marca</label>
            <input className="input" value={comboMake} onChange={(e) => setComboMake(e.target.value)} placeholder="Toyota" autoComplete="off" />
          </div>
          <div>
            <label className="label">Modelo</label>
            <input className="input" value={comboModel} onChange={(e) => setComboModel(e.target.value)} placeholder="Supra" autoComplete="off" />
          </div>
        </div>

        {safestLoading && <div className="notice">🔄 Buscando…</div>}
        {safestError && <div className="notice error">❌ {safestError}</div>}

        {!safestLoading && !safestError && !safest ? (
          <div className="notice muted">Escribe al menos un filtro para ver el resultado.</div>
        ) : null}

        {safest && (
          <StatCard
            label="Resultado: vehículo más seguro (menos recalls)"
            main={
              <>
                <b>{safest.safest_vehicle.make}</b> {safest.safest_vehicle.model}{" "}
                <span className="muted">({safest.safest_vehicle.year})</span>{" "}
                <Badge variant="success">{safest.safest_vehicle.recalls} recalls</Badge>
                <span className="spacer" />
                <Badge variant="neutral">{safest.safest_vehicle.type}</Badge>
                {safest.safest_vehicle.irv_level ? <Badge variant="info">{safest.safest_vehicle.irv_level}</Badge> : null}
              </>
            }
            hint="Tip: usa Marca + Tipo para comparar dentro de una categoría específica."
            actions={
              <Link className="btn btn-primary" to={`/vehicles/${safest.safest_vehicle.id}`}>
                Ver detalle
              </Link>
            }
          />
        )}
      </Card>
    </div>
  );
}
