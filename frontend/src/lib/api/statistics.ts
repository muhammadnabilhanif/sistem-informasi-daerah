import { apiClient } from './client';

export const statisticsApi = {
    async getSuperAdminStats() {
        const response = await apiClient.get('/statistics/super-admin');
        return response.data;
    },

    async getVillageStats() {
        const response = await apiClient.get('/statistics/village');
        return response.data;
    },

    async getCitizenStats() {
        const response = await apiClient.get('/statistics/citizen');
        return response.data;
    },

    async getRecentActivities() {
        const response = await apiClient.get('/statistics/activities');
        return response.data;
    },
};