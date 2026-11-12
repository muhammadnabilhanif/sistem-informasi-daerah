import { apiClient } from './client';

// ==================== TYPES ====================

export interface User {
  id: string;
  email: string;
  name: string;
  phone?: string;
  isActive: boolean;
  isVerified: boolean;
  lastLoginAt?: string;
  role: 'SUPER_ADMIN' | 'VILLAGE_ADMIN' | 'CITIZEN';
  village?: { id: string; name: string } | null;
  createdAt: string;
}

export interface UserStats {
  total: number;
  superAdmin: number;
  villageAdmin: number;
  citizen: number;
  active: number;
}

// ==================== API FUNCTIONS ====================

export const usersApi = {
  async getStats(): Promise<UserStats> {
    const response = await apiClient.get('/users/stats');
    return response.data;
  },

  async getUsers(role?: string): Promise<User[]> {
    const url = role ? `/users?role=${role}` : '/users';
    const response = await apiClient.get(url);
    return response.data;
  },

  async getUser(id: string): Promise<User> {
    const response = await apiClient.get(`/users/${id}`);
    return response.data;
  },

  async createUser(data: {
    email: string;
    name: string;
    password: string;
    phone?: string;
    role?: string;
    isActive?: boolean;
  }): Promise<User> {
    const response = await apiClient.post('/users', data);
    return response.data;
  },

  async updateUser(id: string, data: {
    name?: string;
    phone?: string;
    role?: string;
    isActive?: boolean;
    isVerified?: boolean;
  }): Promise<User> {
    const response = await apiClient.put(`/users/${id}`, data);
    return response.data;
  },

  async changePassword(id: string, newPassword: string) {
    const response = await apiClient.put(`/users/${id}/change-password`, { newPassword });
    return response.data;
  },

  async deleteUser(id: string) {
    const response = await apiClient.delete(`/users/${id}`);
    return response.data;
  },
};