import apiClient from './client';
import { UserResponse, UpdateUserDto, AdminCreateUserDto, AdminUpdateUserDto, UserProfileWithStats } from '../types/user';
import { Plant, PlantHistory } from './plants';
import { Shelf } from './shelves';

export type { UserResponse, UpdateUserDto, AdminCreateUserDto, AdminUpdateUserDto, UserProfileWithStats };

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3008/api';

export const getAvatarUrl = (avatarFilename: string | undefined): string | undefined => {
  if (!avatarFilename) return undefined;
  return `${API_BASE_URL}/users/avatar/${avatarFilename}`;
};

export const usersApi = {
  // Get current user profile
  getProfile: async (): Promise<UserResponse> => {
    const response = await apiClient.get<UserResponse>('/users/profile');
    return response.data;
  },

  // Search users with optional query and sort
  searchUsers: async (query?: string, sort?: string): Promise<UserProfileWithStats[]> => {
    const params: Record<string, string> = {};
    if (query) params.q = query;
    if (sort) params.sort = sort;
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

  // Public: get another user's plants
  getUserPlants: async (userId: string): Promise<Plant[]> => {
    const response = await apiClient.get<Plant[]>(`/users/${userId}/plants`);
    return response.data;
  },

  // Public: get a single plant of another user
  getUserPlant: async (userId: string, plantId: string): Promise<Plant> => {
    const response = await apiClient.get<Plant>(`/users/${userId}/plants/${plantId}`);
    return response.data;
  },

  // Public: get plant history of another user's plant
  getUserPlantHistory: async (userId: string, plantId: string): Promise<PlantHistory[]> => {
    const response = await apiClient.get<PlantHistory[]>(`/users/${userId}/plants/${plantId}/history`);
    return response.data;
  },

  // Public: get another user's wishlist
  getUserWishlist: async (userId: string): Promise<import('./wishlist').Wishlist[]> => {
    const response = await apiClient.get(`/users/${userId}/wishlist`);
    return response.data;
  },

  // Public: get another user's shelves
  getUserShelves: async (userId: string): Promise<Shelf[]> => {
    const response = await apiClient.get<Shelf[]>(`/users/${userId}/shelves`);
    return response.data;
  },

  // Public: get a single shelf of another user
  getUserShelf: async (userId: string, shelfId: string): Promise<Shelf> => {
    const response = await apiClient.get<Shelf>(`/users/${userId}/shelves/${shelfId}`);
    return response.data;
  },

  // Admin: create user
  adminCreateUser: async (data: AdminCreateUserDto): Promise<UserResponse> => {
    const response = await apiClient.post<UserResponse>('/users', data);
    return response.data;
  },

  // Admin: update user (name, email, role, isBlocked)
  adminUpdateUser: async (userId: string, data: AdminUpdateUserDto): Promise<UserResponse> => {
    const response = await apiClient.patch<UserResponse>(`/users/${userId}`, data);
    return response.data;
  },

  // Admin: delete user
  adminDeleteUser: async (userId: string): Promise<void> => {
    await apiClient.delete(`/users/${userId}`);
  },

  // Upload avatar for current user
  uploadAvatar: async (file: File): Promise<UserResponse> => {
    const formData = new FormData();
    formData.append('avatar', file);
    const response = await apiClient.patch<UserResponse>('/users/profile/avatar', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  // Remove avatar for current user
  removeAvatar: async (): Promise<UserResponse> => {
    const response = await apiClient.delete<UserResponse>('/users/profile/avatar');
    return response.data;
  },
};
