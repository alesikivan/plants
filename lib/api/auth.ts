import apiClient from './client';
import { LoginDto, RegisterDto, AuthResponse } from '../types/auth';

export const authApi = {
  // Register
  register: async (data: RegisterDto): Promise<AuthResponse> => {
    const response = await apiClient.post<AuthResponse>('/auth/register', data);
    return response.data;
  },

  // Login
  login: async (data: LoginDto): Promise<AuthResponse> => {
    const response = await apiClient.post<AuthResponse>('/auth/login', data);
    return response.data;
  },

  // Logout
  logout: async (): Promise<void> => {
    await apiClient.post('/auth/logout');
  },

  // Refresh (called automatically from interceptor)
  refresh: async (): Promise<void> => {
    await apiClient.post('/auth/refresh');
  },
};
