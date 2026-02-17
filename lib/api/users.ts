import apiClient from './client';
import { UserResponse, UpdateUserDto } from '../types/user';

export const usersApi = {
  // Get current user profile
  getProfile: async (): Promise<UserResponse> => {
    const response = await apiClient.get<UserResponse>('/users/profile');
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
