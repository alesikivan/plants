import apiClient from './client';
import { UserResponse, UpdateUserDto, UserProfileWithStats } from '../types/user';

export const usersApi = {
  // Get current user profile
  getProfile: async (): Promise<UserResponse> => {
    const response = await apiClient.get<UserResponse>('/users/profile');
    return response.data;
  },

  // Search users with optional query
  searchUsers: async (query?: string): Promise<UserProfileWithStats[]> => {
    const params = query ? { q: query } : {};
    const response = await apiClient.get<UserProfileWithStats[]>('/users/search', { params });
    return response.data;
  },

  // Get user profile by ID with stats
  getUserProfile: async (userId: string): Promise<UserProfileWithStats> => {
    const response = await apiClient.get<UserProfileWithStats>(`/users/${userId}/profile`);
    return response.data;
  },

  // Update current user profile
  updateProfile: async (data: UpdateUserDto): Promise<UserResponse> => {
    const response = await apiClient.patch<UserResponse>('/users/profile', data);
    return response.data;
  },

  // Get all users (admin only)
  getAllUsers: async (): Promise<UserResponse[]> => {
    const response = await apiClient.get<UserResponse[]>('/users');
    return response.data;
  },
};
