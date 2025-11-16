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

export const vehicleService = {
  async getAll() {
    const res = await apiClient.get('/vehicles');
    return res.data;
  },
  async create(payload) {
    const res = await apiClient.post('/vehicles', payload);
    return res.data;
  },
  async delete(id) {
    await apiClient.delete(`/vehicles/${id}`);
  },
};
