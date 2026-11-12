import { apiClient } from './client';

// ==================== TYPES ====================

export interface ServiceType {
  id: string;
  villageId: string;
  name: string;
  code: string;
  description?: string;
  requirements?: string[];
  template?: string;
  processingDays: number;
  isActive: boolean;
  orderIndex: number;
  createdAt: string;
  updatedAt: string;
  village?: { id: string; name: string };
  _count?: { requests: number };
}

export interface ServiceRequest {
  id: string;
  requestNumber: string;
  serviceTypeId: string;
  serviceType?: ServiceType;
  applicantId: string;
  applicant?: { id: string; name: string; email: string; phone?: string };
  purpose: string;
  notes?: string;
  attachments?: any[];
  applicantName: string;
  applicantNik?: string;
  applicantPhone?: string;
  applicantAddress?: string;
  status: 'PENDING' | 'VERIFIED' | 'APPROVED' | 'REJECTED' | 'COMPLETED';
  verifiedById?: string;
  verifiedBy?: { id: string; name: string };
  verifiedAt?: string;
  rejectionReason?: string;
  resultFileUrl?: string;
  completedAt?: string;
  statusLogs?: ServiceStatusLog[];
  createdAt: string;
  updatedAt: string;
}

export interface ServiceStatusLog {
  id: string;
  requestId: string;
  status: string;
  notes?: string;
  changedById?: string;
  changedBy?: { id: string; name: string };
  createdAt: string;
}

export interface ServiceStats {
  total: number;
  pending: number;
  verified: number;
  approved: number;
  rejected: number;
  completed: number;
}

// ==================== API FUNCTIONS ====================

export const servicesApi = {
  // ===== SERVICE TYPES =====

  async getPublicTypes(villageId: string): Promise<ServiceType[]> {
    const response = await apiClient.get(`/services/types/public?villageId=${villageId}`);
    return response.data;
  },

  async getTypes(villageId?: string): Promise<ServiceType[]> {
    const url = villageId ? `/services/types?villageId=${villageId}` : '/services/types';
    const response = await apiClient.get(url);
    return response.data;
  },

  async getType(id: string): Promise<ServiceType> {
    const response = await apiClient.get(`/services/types/${id}`);
    return response.data;
  },

  async createType(data: {
    villageId: string;
    name: string;
    code: string;
    description?: string;
    requirements?: string[];
    template?: string;
    processingDays?: number;
    orderIndex?: number;
  }): Promise<ServiceType> {
    const response = await apiClient.post('/services/types', data);
    return response.data;
  },

  async updateType(id: string, data: Partial<ServiceType>): Promise<ServiceType> {
    const response = await apiClient.put(`/services/types/${id}`, data);
    return response.data;
  },

  async deleteType(id: string) {
    const response = await apiClient.delete(`/services/types/${id}`);
    return response.data;
  },

  // ===== SERVICE REQUESTS =====

  async getRequests(filters?: {
    status?: string;
    villageId?: string;
  }): Promise<ServiceRequest[]> {
    const params = new URLSearchParams();
    if (filters?.status) params.append('status', filters.status);
    if (filters?.villageId) params.append('villageId', filters.villageId);

    const url = params.toString() ? `/services/requests?${params}` : '/services/requests';
    const response = await apiClient.get(url);
    return response.data;
  },

  async getRequest(id: string): Promise<ServiceRequest> {
    const response = await apiClient.get(`/services/requests/${id}`);
    return response.data;
  },

  async createRequest(data: {
    serviceTypeId: string;
    purpose: string;
    notes?: string;
    attachments?: any[];
    applicantNik?: string;
    applicantPhone?: string;
    applicantAddress?: string;
  }): Promise<ServiceRequest> {
    const response = await apiClient.post('/services/requests', data);
    return response.data;
  },

  async createRequestWithFiles(
    data: {
      serviceTypeId: string;
      purpose: string;
      notes?: string;
      applicantNik?: string;
      applicantPhone?: string;
      applicantAddress?: string;
    },
    files: File[],
  ): Promise<ServiceRequest> {
    const formData = new FormData();
    formData.append('serviceTypeId', data.serviceTypeId);
    formData.append('purpose', data.purpose);
    if (data.notes) formData.append('notes', data.notes);
    if (data.applicantNik) formData.append('applicantNik', data.applicantNik);
    if (data.applicantPhone) formData.append('applicantPhone', data.applicantPhone);
    if (data.applicantAddress) formData.append('applicantAddress', data.applicantAddress);
    files.forEach((file) => formData.append('files', file));

    const response = await apiClient.post('/services/requests', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  async updateRequestStatus(
    id: string,
    data: {
      status: string;
      notes?: string;
      rejectionReason?: string;
      resultFileUrl?: string;
    },
  ): Promise<ServiceRequest> {
    const response = await apiClient.put(`/services/requests/${id}/status`, data);
    return response.data;
  },

  async deleteRequest(id: string) {
    const response = await apiClient.delete(`/services/requests/${id}`);
    return response.data;
  },

  // ===== STATS =====

  async getStats(): Promise<ServiceStats> {
    const response = await apiClient.get('/services/stats');
    return response.data;
  },
};