const API_BASE = 'http://localhost:8000/api/v1';


// Servicios de Catálogo de Vehículos (NHTSA)
export const vehicleCatalogService = {
  // Obtener todas las marcas únicas
  getMakes: async () => {
    const res = await fetch(`${API_BASE}/catalog/makes`);

    if (!res.ok) {
      throw new Error('Error al cargar las marcas');
    }

    return res.json();
  },

  // Obtener modelos por marca
  getModels: async (make) => {
    const res = await fetch(
      `${API_BASE}/catalog/models?make=${encodeURIComponent(make)}`
    );

    if (!res.ok) {
      throw new Error('Error al cargar los modelos');
    }

    return res.json();
  },

  // Obtener años por marca y modelo
  getYears: async (make, model) => {
    const params = new URLSearchParams({
      make,
      model,
    }).toString();

    const res = await fetch(`${API_BASE}/catalog/years?${params}`);

    if (!res.ok) {
      throw new Error('Error al cargar los años');
    }

    return res.json();
  },

  // Buscar vehículos con filtros (si algún día lo usas)
  search: async (filters = {}) => {
    const params = new URLSearchParams(filters).toString();
    const res = await fetch(`${API_BASE}/catalog/search?${params}`);

    if (!res.ok) {
      throw new Error('Error al buscar en el catálogo');
    }

    return res.json();
  },
};
