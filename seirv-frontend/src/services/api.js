const API_BASE = 'http://localhost:8000/api/v1';


// Helper para manejar respuestas
async function handleResponse(res, defaultMessage) {
  if (!res.ok) {
    let errorData = {};
    try {
      errorData = await res.json();
    } catch {
      // ignore
    }
    const msg = errorData.detail || defaultMessage || 'Error en la petición';
    const err = new Error(msg);
    err.response = { data: errorData };
    throw err;
  }
  try {
    return await res.json();
  } catch {
    return null;
  }
}

/* ========= VEHICLES ========= */

export const vehicleService = {
  // GET /api/v1/vehicles
  getAll: async () => {
    const res = await fetch(`${API_BASE}/vehicles`);
    return handleResponse(res, 'Error al obtener los vehículos');
  },

  // POST /api/v1/vehicles
  create: async (payload) => {
    const token = localStorage.getItem('access_token');
    const res = await fetch(`${API_BASE}/vehicles`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(payload),
    });
    return handleResponse(res, 'Error al crear el vehículo');
  },

  // DELETE /api/v1/vehicles/{id}
  delete: async (id) => {
    const token = localStorage.getItem('access_token');
    const res = await fetch(`${API_BASE}/vehicles/${id}`, {
      method: 'DELETE',
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });
    // algunos DELETE no devuelven cuerpo
    if (!res.ok) {
      let errorData = {};
      try {
        errorData = await res.json();
      } catch {
        // ignore
      }
      const msg = errorData.detail || 'Error al eliminar el vehículo';
      const err = new Error(msg);
      err.response = { data: errorData };
      throw err;
    }
    return null;
  },
};

/* ========= CATEGORIES ========= */

export const categoryService = {
  // GET /api/v1/categories/dropdown
  getDropdown: async () => {
    const res = await fetch(`${API_BASE}/categories/dropdown`);
    return handleResponse(res, 'Error al obtener las categorías');
  },
};
