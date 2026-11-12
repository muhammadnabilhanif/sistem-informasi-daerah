import { apiClient } from './client';

// ============================================
// 1. ALL INTERFACES (di luar, di atas)
// ============================================

export interface VillageProfile {
  id: string;
  villageId: string;
  description?: string;
  history?: string;
  vision?: string;
  mission?: string;
  motto?: string;
  address?: string;
  phone?: string;
  email?: string;
  website?: string;
  latitude?: number;
  longitude?: number;
  totalAreaKm2?: number;
  landAreaKm2?: number;
  waterAreaKm2?: number;
  northBoundary?: string;
  southBoundary?: string;
  westBoundary?: string;
  eastBoundary?: string;
  status: string;
  publishedAt?: string;
}

export interface VillageOfficial {
  id: string;
  villageId: string;
  name: string;
  position: string;
  positionLevel: number;
  photoUrl?: string;
  biography?: string;
  phone?: string;
  email?: string;
  startDate: string;
  endDate?: string;
  isActive: boolean;
  isPublic: boolean;
  orderIndex: number;
}

export interface VillageProgram {
  id: string;
  villageId: string;
  title: string;
  description?: string;
  category?: string;
  budget?: number;
  status: string;
  startDate?: string;
  endDate?: string;
  isPublic: boolean;
}

// ✅ TAMBAHKAN INI UNTUK ANNOUNCEMENTS
export interface Announcement {
  id: string;
  villageId: string;
  title: string;
  content: string;
  summary?: string;
  priority: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
  status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
  publishedAt?: string;
  expiredAt?: string;
  isPublic: boolean;
  createdAt: string;
  updatedAt: string;
}

// ✅ TAMBAHKAN INTERFACE INI
export interface News {
  id: string;
  villageId: string;
  title: string;
  slug: string;
  content: string;
  excerpt?: string;
  thumbnailUrl?: string;
  authorName?: string;
  category?: string;
  tags?: string;
  views: number;
  status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
  publishedAt?: string;
  isFeatured: boolean;
  isPublic: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Agenda {
  id: string;
  villageId: string;
  title: string;
  description?: string;
  location?: string;
  latitude?: number;
  longitude?: number;
  startDatetime: string;
  endDatetime?: string;
  category?: string;
  organizer?: string;
  status: 'UPCOMING' | 'ONGOING' | 'COMPLETED' | 'CANCELLED';
  isPublic: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PublicDocument {
  id: string;
  villageId: string;
  title: string;
  description?: string;
  fileName: string;
  filePath: string;
  fileSize: number;
  fileType: string;
  mimeType: string;
  category?: string;
  tags?: string;
  status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
  isPublic: boolean;
  publishedAt?: string;
  expiredAt?: string;
  downloads: number;
  createdAt: string;
  updatedAt: string;
}

export interface ResidentStatistic {
  id: string;
  villageId: string;
  year: number;
  semester: number;
  totalPopulation: number;
  maleCount: number;
  femaleCount: number;
  totalHouseholds: number;
  totalFamilies: number;
  ageGroups?: any;
  educationStats?: any;
  occupationStats?: any;
  religionStats?: any;
  dataSource?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

// ============================================
// 2. API FUNCTIONS
// ============================================

export const villagesApi = {
  // ===== PROFILE =====
  async getProfile(villageId: string) {
    const response = await apiClient.get(`/villages/${villageId}/profile`);
    return response.data;
  },

  async createProfile(data: any) {
    const response = await apiClient.post('/villages/profile', data);
    return response.data;
  },

  async updateProfile(villageId: string, data: any) {
    const response = await apiClient.put(`/villages/${villageId}/profile`, data);
    return response.data;
  },

  async deleteProfile(villageId: string) {
    const response = await apiClient.delete(`/villages/${villageId}/profile`);
    return response.data;
  },

  // ===== OFFICIALS =====
  async getOfficials(villageId: string) {
    const response = await apiClient.get(`/villages/${villageId}/officials`);
    return response.data;
  },

  async createOfficial(data: any) {
    const response = await apiClient.post('/villages/officials', data);
    return response.data;
  },

  async updateOfficial(id: string, data: any) {
    const response = await apiClient.put(`/villages/officials/${id}`, data);
    return response.data;
  },

  async deleteOfficial(id: string) {
    const response = await apiClient.delete(`/villages/officials/${id}`);
    return response.data;
  },

  // ===== PROGRAMS =====
  async getPrograms(villageId: string) {
    const response = await apiClient.get(`/villages/${villageId}/programs`);
    return response.data;
  },

  async createProgram(data: any) {
    const response = await apiClient.post('/villages/programs', data);
    return response.data;
  },

  async updateProgram(id: string, data: any) {
    const response = await apiClient.put(`/villages/programs/${id}`, data);
    return response.data;
  },

  async deleteProgram(id: string) {
    const response = await apiClient.delete(`/villages/programs/${id}`);
    return response.data;
  },

  // ===== ANNOUNCEMENTS =====
  async getAnnouncements(villageId?: string, status?: string) {
    const params = new URLSearchParams();
    if (villageId) params.append('villageId', villageId);
    if (status) params.append('status', status);
    const response = await apiClient.get(`/announcements?${params.toString()}`);
    return response.data;
  },

  async getPublicAnnouncements(villageId: string) {
    const response = await apiClient.get(`/announcements/public?villageId=${villageId}`);
    return response.data;
  },

  async getAnnouncement(id: string) {
    const response = await apiClient.get(`/announcements/${id}`);
    return response.data;
  },

  async createAnnouncement(data: any) {
    const response = await apiClient.post('/announcements', data);
    return response.data;
  },

  async updateAnnouncement(id: string, data: any) {
    const response = await apiClient.put(`/announcements/${id}`, data);
    return response.data;
  },

  async deleteAnnouncement(id: string) {
    const response = await apiClient.delete(`/announcements/${id}`);
    return response.data;
  },

  async publishAnnouncement(id: string) {
    const response = await apiClient.post(`/announcements/${id}/publish`);
    return response.data;
  },

  // ===== NEWS =====
  async getNews(villageId?: string, status?: string) {
    const params = new URLSearchParams();
    if (villageId) params.append('villageId', villageId);
    if (status) params.append('status', status);
    const response = await apiClient.get(`/news?${params.toString()}`);
    return response.data;
  },

  async getPublicNews(villageId: string) {
    const response = await apiClient.get(`/news/public?villageId=${villageId}`);
    return response.data;
  },

  async getNewsBySlug(slug: string) {
    const response = await apiClient.get(`/news/slug/${slug}`);
    return response.data;
  },

  async getNewsById(id: string) {
    const response = await apiClient.get(`/news/${id}`);
    return response.data;
  },

  async createNews(data: any) {
    const response = await apiClient.post('/news', data);
    return response.data;
  },

  async updateNews(id: string, data: any) {
    const response = await apiClient.put(`/news/${id}`, data);
    return response.data;
  },

  async deleteNews(id: string) {
    const response = await apiClient.delete(`/news/${id}`);
    return response.data;
  },

  async publishNews(id: string) {
    const response = await apiClient.post(`/news/${id}/publish`);
    return response.data;
  },

  // ===== AGENDAS =====
  async getAgendas(villageId?: string, status?: string) {
    const params = new URLSearchParams();
    if (villageId) params.append('villageId', villageId);
    if (status) params.append('status', status);
    const response = await apiClient.get(`/agendas?${params.toString()}`);
    return response.data;
  },

  async getPublicAgendas(villageId: string) {
    const response = await apiClient.get(`/agendas/public?villageId=${villageId}`);
    return response.data;
  },

  async getAgenda(id: string) {
    const response = await apiClient.get(`/agendas/${id}`);
    return response.data;
  },

  async createAgenda(data: any) {
    const response = await apiClient.post('/agendas', data);
    return response.data;
  },

  async updateAgenda(id: string, data: any) {
    const response = await apiClient.put(`/agendas/${id}`, data);
    return response.data;
  },

  async deleteAgenda(id: string) {
    const response = await apiClient.delete(`/agendas/${id}`);
    return response.data;
  },

  // ===== DOCUMENTS =====
  async getDocuments(villageId?: string, status?: string) {
    const params = new URLSearchParams();
    if (villageId) params.append('villageId', villageId);
    if (status) params.append('status', status);
    const response = await apiClient.get(`/documents?${params.toString()}`);
    return response.data;
  },

  async getPublicDocuments(villageId: string) {
    const response = await apiClient.get(`/documents/public?villageId=${villageId}`);
    return response.data;
  },

  async getDocument(id: string) {
    const response = await apiClient.get(`/documents/${id}`);
    return response.data;
  },

  async createDocument(formData: FormData) {
    const response = await apiClient.post('/documents', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  async updateDocument(id: string, data: any) {
    const response = await apiClient.put(`/documents/${id}`, data);
    return response.data;
  },

  async deleteDocument(id: string) {
    const response = await apiClient.delete(`/documents/${id}`);
    return response.data;
  },

  async publishDocument(id: string) {
    const response = await apiClient.post(`/documents/${id}/publish`);
    return response.data;
  },

  getDownloadUrl(id: string) {
    return `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/documents/${id}/download`;
  },

  // ===== RESIDENT STATISTICS =====
  async getResidentStatistics(villageId?: string, year?: number) {
    const params = new URLSearchParams();
    if (villageId) params.append('villageId', villageId);
    if (year) params.append('year', year.toString());
    const response = await apiClient.get(`/residents/statistics?${params.toString()}`);
    return response.data;
  },

  async getLatestResidentStatistics(villageId: string) {
    const response = await apiClient.get(`/residents/statistics/public?villageId=${villageId}`);
    return response.data;
  },

  async getResidentStatistic(id: string) {
    const response = await apiClient.get(`/residents/statistics/${id}`);
    return response.data;
  },

  async createResidentStatistic(data: any) {
    const response = await apiClient.post('/residents/statistics', data);
    return response.data;
  },

  async updateResidentStatistic(id: string, data: any) {
    const response = await apiClient.put(`/residents/statistics/${id}`, data);
    return response.data;
  },

  async deleteResidentStatistic(id: string) {
    const response = await apiClient.delete(`/residents/statistics/${id}`);
    return response.data;
  },
};