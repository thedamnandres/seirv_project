import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { vehicleService } from '../services/api';
import { vehicleCatalogService } from '../services/vehicleCatalog';

export default function VehicleForm() {
  const navigate = useNavigate();

  const [makes, setMakes] = useState([]);
  const [models, setModels] = useState([]);
  const [years, setYears] = useState([]);
  const [categories, setCategories] = useState([]);

  const [formData, setFormData] = useState({
    make: '',
    model: '',
    year: '',
    license_plate: '',
    mileage: '',
    category_id: '',
  });

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Cargar marcas y categorías al inicio
useEffect(() => {
  const loadInitialData = async () => {
    try {
      // Usamos el endpoint que YA existe
      const data = await vehicleCatalogService.getDropdown();

      // data: { makes, models, years, categories }
      setMakes(data.makes || []);
      setCategories(data.categories || []);
    } catch (err) {
      console.error(err);
      setError('Error al cargar datos iniciales del formulario');
    }
  };
  loadInitialData();
}, []);

  // Handlers para selects en cascada
  const handleMakeChange = async (e) => {
    const make = e.target.value;

    setFormData((prev) => ({
      ...prev,
      make,
      model: '',
      year: '',
    }));

    setModels([]);
    setYears([]);

    if (!make) return;

    try {
      const modelsData = await vehicleCatalogService.getModels(make);
      setModels(modelsData || []);
    } catch (err) {
      console.error(err);
      setError('Error al cargar los modelos');
    }
  };

  const handleModelChange = async (e) => {
    const model = e.target.value;

    setFormData((prev) => ({
      ...prev,
      model,
      year: '',
    }));

    setYears([]);

    if (!model || !formData.make) return;

    try {
      const yearsData = await vehicleCatalogService.getYears(formData.make, model);
      setYears(yearsData || []);
    } catch (err) {
      console.error(err);
      setError('Error al cargar los años');
    }
  };

  const handleYearChange = (e) => {
    const year = e.target.value;
    setFormData((prev) => ({
      ...prev,
      year,
    }));
  };

  // Otros campos (placa, km, categoría)
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const payload = {
        ...formData,
        year: formData.year ? Number(formData.year) : null,
        mileage: formData.mileage ? Number(formData.mileage) : null,
      };

      await vehicleService.create(payload); // POST /api/v1/vehicles
      navigate('/vehicles');
    } catch (err) {
      console.error(err);
      const msg = err.response?.data?.detail || 'Error al guardar el vehículo';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    navigate('/vehicles');
  };

  return (
    <div className="vehicle-form-page">
      <div className="form-container">
        <h1>Agregar Nuevo Vehículo</h1>
        <p className="form-subtitle">
          Selecciona la marca, modelo y año desde el catálogo y completa los datos del vehículo.
        </p>

        {error && <div className="alert alert-error">{error}</div>}

        <form onSubmit={handleSubmit} className="vehicle-form">
          {/* Selección de catálogo */}
          <section className="form-section">
            <h2>Información del Vehículo</h2>

            <div className="form-row">
              <div className="form-group">
                <label>Marca *</label>
                <select
                  name="make"
                  value={formData.make}
                  onChange={handleMakeChange}
                  required
                >
                  <option value="">Selecciona una marca</option>
                  {makes.map((make) => (
                    <option key={make} value={make}>
                      {make}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Modelo *</label>
                <select
                  name="model"
                  value={formData.model}
                  onChange={handleModelChange}
                  required
                  disabled={!formData.make}
                >
                  <option value="">
                    {formData.make ? 'Selecciona un modelo' : 'Primero selecciona una marca'}
                  </option>
                  {models.map((model) => (
                    <option key={model} value={model}>
                      {model}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Año *</label>
                <select
                  name="year"
                  value={formData.year}
                  onChange={handleYearChange}
                  required
                  disabled={!formData.model}
                >
                  <option value="">
                    {formData.model ? 'Selecciona un año' : 'Primero selecciona un modelo'}
                  </option>
                  {years.map((year) => (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </section>

          {/* Placa + kilometraje */}
          <section className="form-section">
            <div className="form-row">
              <div className="form-group">
                <label>Placa *</label>
                <input
                  name="license_plate"
                  type="text"
                  placeholder="ABC-1234"
                  value={formData.license_plate}
                  onChange={handleChange}
                  required
                />
                <small>Formato sugerido: ABC-1234 (placa ecuatoriana)</small>
              </div>

              <div className="form-group">
                <label>Kilometraje *</label>
                <input
                  name="mileage"
                  type="number"
                  min="0"
                  placeholder="Ej: 50000"
                  value={formData.mileage}
                  onChange={handleChange}
                  required
                />
                <small>Ingresa el kilometraje actual del vehículo.</small>
              </div>
            </div>
          </section>

          {/* Categoría de riesgo */}
          <section className="form-section">
            <div className="form-group">
              <label>Categoría de Riesgo *</label>
              <select
                name="category_id"
                value={formData.category_id}
                onChange={handleChange}
                required
              >
                <option value="">Selecciona una categoría</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
              <small>Las categorías se cargan automáticamente desde el catálogo del sistema.</small>
            </div>
          </section>

          <div className="form-actions">
            <button
              type="button"
              className="btn btn-outline"
              onClick={handleCancel}
              disabled={loading}
            >
              Cancelar
            </button>
            <button type="submit" className="btn" disabled={loading}>
              {loading ? 'Guardando...' : 'Guardar Vehículo'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
