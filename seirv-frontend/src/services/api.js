// services/api.js
import axios from 'axios';

// Usar variable de entorno o default a localhost para desarrollo
// Remover barra final si existe para evitar dobles barras en las URLs
const getApiBaseUrl = () => {
  const url = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';
  return url.endsWith('/') ? url.slice(0, -1) : url;
};
const API_BASE_URL = getApiBaseUrl();

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
});

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ======================= VEHICLES =======================
export const vehicleService = {
  async getAll() {
    const res = await apiClient.get('/vehicles');
    return res.data;
  },

  async getById(id) {
    const res = await apiClient.get(`/vehicles/${id}`);
    return res.data;
  },

  async create(payload) {
    const res = await apiClient.post('/vehicles', payload);
    return res.data;
  },

  async delete(id) {
    await apiClient.delete(`/vehicles/${id}`);
  },

  async getRecalls(vehicleId) {
    const res = await apiClient.get(`/vehicles/${vehicleId}/recalls`);
    return res.data;
  },

  // Sincroniza recalls desde la API externa para un vehículo
  async syncRecalls(vehicleId) {
    const res = await apiClient.post(`/vehicles/${vehicleId}/recalls/sync`);
    return res.data;
  },

  // Calcula / recalcula el IRV del vehículo
  async calculateIRV(vehicleId, includeBreakdown = false) {
    const res = await apiClient.post(
      `/vehicles/${vehicleId}/irv/calculate`,
      null,
      {
        params: { include_breakdown: includeBreakdown },
      }
    );
    return res.data;
  },
};

// ======================= USERS =======================
export const userService = {
  async getAll(skip = 0, limit = 100) {
    const res = await apiClient.get('/users/admin/all', {
      params: { skip, limit },
    });
    return res.data;
  },

  async getById(id) {
    const res = await apiClient.get(`/users/admin/${id}`);
    return res.data;
  },

  async update(id, payload) {
    const res = await apiClient.put(`/users/admin/${id}`, payload);
    return res.data;
  },

  async delete(id) {
    await apiClient.delete(`/users/admin/${id}`);
  },
};
