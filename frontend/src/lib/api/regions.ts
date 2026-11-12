import { apiClient } from './client';

// ==================== TYPES ====================

export interface Province {
  id: string;
  code: string;
  name: string;
  capital?: string;
  isActive: boolean;
  _count?: { regencies: number };
  createdAt: string;
  updatedAt: string;
}

export interface Regency {
  id: string;
  code: string;
  name: string;
  capital?: string;
  type?: string;
  provinceId: string;
  isActive: boolean;
  province?: Province;
  _count?: { districts: number };
}

export interface District {
  id: string;
  code: string;
  name: string;
  regencyId: string;
  isActive: boolean;
  regency?: Regency;
  _count?: { villages: number };
}

export interface Village {
  id: string;
  code: string;
  name: string;
  type?: string;
  districtId: string;
  isActive: boolean;
  district?: District;
}

// ==================== API FUNCTIONS ====================

export const regionsApi = {
  // ===== PROVINCE =====
  async getProvinces() {
    const response = await apiClient.get('/regions/provinces');
    return response.data;
  },

  async getProvince(id: string) {
    const response = await apiClient.get(`/regions/provinces/${id}`);
    return response.data;
  },

  async createProvince(data: { code: string; name: string; capital?: string }) {
    const response = await apiClient.post('/regions/provinces', data);
    return response.data;
  },

  async updateProvince(id: string, data: { code?: string; name?: string; capital?: string; isActive?: boolean }) {
    const response = await apiClient.put(`/regions/provinces/${id}`, data);
    return response.data;
  },

  async deleteProvince(id: string) {
    const response = await apiClient.delete(`/regions/provinces/${id}`);
    return response.data;
  },

  // ===== REGENCY =====
  async getRegencies(provinceId?: string) {
    const url = provinceId ? `/regions/regencies?provinceId=${provinceId}` : '/regions/regencies';
    const response = await apiClient.get(url);
    return response.data;
  },

  async getRegency(id: string) {
    const response = await apiClient.get(`/regions/regencies/${id}`);
    return response.data;
  },

  async createRegency(data: { code: string; name: string; capital?: string; provinceId: string; type?: string }) {
    const response = await apiClient.post('/regions/regencies', data);
    return response.data;
  },

  async updateRegency(id: string, data: { code?: string; name?: string; capital?: string; provinceId?: string; type?: string; isActive?: boolean }) {
    const response = await apiClient.put(`/regions/regencies/${id}`, data);
    return response.data;
  },

  async deleteRegency(id: string) {
    const response = await apiClient.delete(`/regions/regencies/${id}`);
    return response.data;
  },

  // ===== DISTRICT =====
  async getDistricts(regencyId?: string) {
    const url = regencyId ? `/regions/districts?regencyId=${regencyId}` : '/regions/districts';
    const response = await apiClient.get(url);
    return response.data;
  },

  async getDistrict(id: string) {
    const response = await apiClient.get(`/regions/districts/${id}`);
    return response.data;
  },

  async createDistrict(data: { code: string; name: string; regencyId: string }) {
    const response = await apiClient.post('/regions/districts', data);
    return response.data;
  },

  async updateDistrict(id: string, data: { code?: string; name?: string; regencyId?: string; isActive?: boolean }) {
    const response = await apiClient.put(`/regions/districts/${id}`, data);
    return response.data;
  },

  async deleteDistrict(id: string) {
    const response = await apiClient.delete(`/regions/districts/${id}`);
    return response.data;
  },

  // ===== VILLAGE =====
  async getVillages(districtId?: string) {
    const url = districtId ? `/regions/villages?districtId=${districtId}` : '/regions/villages';
    const response = await apiClient.get(url);
    return response.data;
  },

  async getVillage(id: string) {
    const response = await apiClient.get(`/regions/villages/${id}`);
    return response.data;
  },

  async createVillage(data: { code: string; name: string; districtId: string; type?: string }) {
    const response = await apiClient.post('/regions/villages', data);
    return response.data;
  },

  async updateVillage(id: string, data: { code?: string; name?: string; districtId?: string; type?: string; isActive?: boolean }) {
    const response = await apiClient.put(`/regions/villages/${id}`, data);
    return response.data;
  },

  async deleteVillage(id: string) {
    const response = await apiClient.delete(`/regions/villages/${id}`);
    return response.data;
  },
};