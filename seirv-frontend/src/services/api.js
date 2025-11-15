// services/api.js
import axios from 'axios';

export const apiClient = axios.create({
  baseURL: 'http://localhost:8000/api/v1',
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
