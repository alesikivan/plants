import apiClient from './client';
import { UserResponse, UpdateUserDto, AdminCreateUserDto, AdminUpdateUserDto, UserProfileWithStats } from '../types/user';
import { Plant, PlantHistory } from './plants';
import { Shelf } from './shelves';

export type { UserResponse, UpdateUserDto, AdminCreateUserDto, AdminUpdateUserDto, UserProfileWithStats };

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
};
