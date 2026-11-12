import { apiClient } from './client';

// ==================== TYPES ====================

export interface AuditLog {
  id: string;
  userId?: string;
  userName?: string;
  userEmail?: string;
  userRole?: string;
  villageId?: string;
  village?: { id: string; name: string };
  action: string;
  resource: string;
  resourceId?: string;
  description?: string;
  oldValues?: any;
  newValues?: any;
  ipAddress?: string;
  userAgent?: string;
  statusCode?: number;
  errorMessage?: string;
  durationMs?: number;
  createdAt: string;
}

export interface AuditLogSummary {
  total: number;
  todayCount: number;
  byAction: Array<{ action: string; count: number }>;
  byResource: Array<{ resource: string; count: number }>;
  recentActivities: Array<{
    id: string;
    action: string;
    resource: string;
    userName?: string;
    description?: string;
    createdAt: string;
  }>;
}

export interface AuditLogFilters {
  userId?: string;
  action?: string;
  resource?: string;
  villageId?: string;
  startDate?: string;
  endDate?: string;
  limit?: number;
  offset?: number;
}

export interface AuditLogResponse {
  data: AuditLog[];
  total: number;
  limit: number;
  offset: number;
}

// ==================== API FUNCTIONS ====================

export const auditLogsApi = {
  async getSummary(villageId?: string): Promise<AuditLogSummary> {
    const url = villageId ? `/audit-logs/summary?villageId=${villageId}` : '/audit-logs/summary';
    const response = await apiClient.get(url);
    return response.data;
  },

  async getLogs(filters?: AuditLogFilters): Promise<AuditLogResponse> {
    const params = new URLSearchParams();
    if (filters?.userId) params.append('userId', filters.userId);
    if (filters?.action) params.append('action', filters.action);
    if (filters?.resource) params.append('resource', filters.resource);
    if (filters?.villageId) params.append('villageId', filters.villageId);
    if (filters?.startDate) params.append('startDate', filters.startDate);
    if (filters?.endDate) params.append('endDate', filters.endDate);
    if (filters?.limit) params.append('limit', filters.limit.toString());
    if (filters?.offset) params.append('offset', filters.offset.toString());

    const response = await apiClient.get(`/audit-logs?${params.toString()}`);
    return response.data;
  },

  async getLog(id: string): Promise<AuditLog> {
    const response = await apiClient.get(`/audit-logs/${id}`);
    return response.data;
  },

  async deleteLog(id: string) {
    const response = await apiClient.delete(`/audit-logs/${id}`);
    return response.data;
  },

  async cleanOld(days: number = 90) {
    const response = await apiClient.delete(`/audit-logs/clean?days=${days}`);
    return response.data;
  },
};