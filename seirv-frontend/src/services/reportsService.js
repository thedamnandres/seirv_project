// src/services/reportsService.js
import { apiClient } from "./api";

export const reportsService = {
  // 1) Por tipo: lista todos + least_recalls_vehicle
  async getVehiclesByType(vehicleType) {
    const res = await apiClient.get("/reports/vehicles-by-type", {
      params: { vehicle_type: vehicleType },
    });
    return res.data;
  },

  // (opcional) si quieres seguir usando el endpoint top1
  async getLeastRecallsByType(vehicleType) {
    const res = await apiClient.get("/reports/least-recalls-by-type", {
      params: { vehicle_type: vehicleType },
    });
    return res.data;
  },

  // 2A) Top marcas con más recalls
  async getTopBrands(limit = 10) {
    const res = await apiClient.get("/reports/top-brands-by-recalls", {
      params: { limit },
    });
    return res.data;
  },

  // 2B) Peores vehículos de una marca
  async getWorstVehiclesByBrand(make, limit = 10) {
    const res = await apiClient.get("/reports/worst-vehicles-by-brand", {
      params: { make, limit },
    });
    return res.data;
  },

  // 3) Más seguro con filtros combinados (opcionales)
  async getSafestVehicle({ vehicle_type, make, model }) {
    const params = {};
    if (vehicle_type) params.vehicle_type = vehicle_type;
    if (make) params.make = make;
    if (model) params.model = model;

    const res = await apiClient.get("/reports/safest-vehicle", { params });
    return res.data;
  },

  // 4) Distribución de IRV
  async getIrvDistribution() {
    const res = await apiClient.get("/reports/irv-distribution");
    return res.data;
  },

  // 4B) Distribución de IRV del usuario autenticado
  async getIrvDistributionUser() {
    const res = await apiClient.get("/reports/irv-distribution-user");
    return res.data;
  },

  // 5) Opciones para dropdowns
  async getAvailableTypes() {
    const res = await apiClient.get("/reports/available-types");
    return res.data;
  },

  async getAvailableMakes() {
    const res = await apiClient.get("/reports/available-makes");
    return res.data;
  },

  async getAvailableModels(make = null) {
    const params = make ? { make } : {};
    const res = await apiClient.get("/reports/available-models", { params });
    return res.data;
  },
};
