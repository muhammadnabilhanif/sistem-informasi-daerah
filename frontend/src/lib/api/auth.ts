import { apiClient } from './client';

// Type definitions (dari yang lama)
export interface LoginData {
    email: string;
    password: string;
}

export interface RegisterData {
    email: string;
    name: string;
    password: string;
    phone?: string;
}

export interface AuthResponse {
    message: string;
    user: {
        id: string;
        email: string;
        name: string;
        role: string;
        villageId?: string;
    };
    token: string;
}

// API functions (dari yang baru - dengan error handling)
export const authApi = {
    async login(data: LoginData): Promise<AuthResponse> {
        try {
            const response = await apiClient.post('/auth/login', data);
            return response.data;
        } catch (error: any) {
            console.error('Login error:', error.response?.data || error.message);
            throw error;
        }
    },

    async register(data: RegisterData): Promise<AuthResponse> {
        try {
            const response = await apiClient.post('/auth/register', data);
            return response.data;
        } catch (error: any) {
            console.error('Register error:', error.response?.data || error.message);
            throw error;
        }
    },

    async getProfile(): Promise<AuthResponse['user']> {
        try {
            const response = await apiClient.get('/auth/profile');
            return response.data;
        } catch (error: any) {
            console.error('Get profile error:', error.response?.data || error.message);
            throw error;
        }
    },
};