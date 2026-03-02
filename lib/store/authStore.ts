import { create } from 'zustand';
import { UserResponse, UpdateUserDto } from '../types/user';
import { authApi } from '../api/auth';
import { usersApi } from '../api/users';
import { LoginDto, RegisterDto } from '../types/auth';

interface AuthState {
  user: UserResponse | null;
  loading: boolean;
  initialized: boolean;
  login: (data: LoginDto) => Promise<void>;
  register: (data: RegisterDto) => Promise<void>;
  logout: () => Promise<void>;
  fetchUser: () => Promise<void>;
  setUser: (user: UserResponse | null) => void;
  updateProfile: (data: UpdateUserDto) => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  loading: false,
  initialized: false,

  fetchUser: async () => {
    try {
      set({ loading: true });
      const userData = await usersApi.getProfile();
      set({ user: userData, initialized: true });
    } catch (error) {
      // User not authenticated - это нормальное поведение
      // Ошибка не логируется, так как обрабатывается в interceptor
      set({ user: null, initialized: true });
    } finally {
      set({ loading: false });
    }
  },

  login: async (data: LoginDto) => {
    set({ loading: true });
    try {
      const response = await authApi.login(data);
      set({ user: response.user, initialized: true });
    } finally {
      set({ loading: false });
    }
  },

  register: async (data: RegisterDto) => {
    set({ loading: true });
    try {
      const response = await authApi.register(data);
      set({ user: response.user, initialized: true });
    } finally {
      set({ loading: false });
    }
  },

  logout: async () => {
    set({ loading: true });
    try {
      await authApi.logout();
    } finally {
      // Clear user regardless of API call success/failure
      set({ user: null, loading: false });
    }
  },

  setUser: (user: UserResponse | null) => {
    set({ user });
  },

  updateProfile: async (data: UpdateUserDto) => {
    set({ loading: true });
    try {
      const updatedUser = await usersApi.updateProfile(data);
      set({ user: updatedUser });
    } finally {
      set({ loading: false });
    }
  },
}));
