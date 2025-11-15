// services/vehicleCatalog.js
import { apiClient } from './api'; // mismo axios con el token

export const vehicleCatalogService = {
  async getMakes() {
    const res = await apiClient.get('/catalog/makes');
    return res.data;
  },

  async getModels(make) {
    const res = await apiClient.get('/catalog/models', {
      params: { make },
    });
    return res.data;
  },

  async getYears(make, model) {
    const res = await apiClient.get('/catalog/years', {
      params: { make, model },
    });
    return res.data;
  },

  async getDropdown() {
    const res = await apiClient.get('/catalog/dropdown');
    return res.data;   // { makes, models, years, categories }
  },
};
