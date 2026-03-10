import { create } from 'zustand';
import { UserResponse, UpdateUserDto } from '../types/user';
import { authApi } from '../api/auth';
import { usersApi } from '../api/users';
import { LoginDto, RegisterDto } from '../types/auth';

async function revalidatePublicProfileCache(): Promise<void> {
  try {
    await fetch('/api/revalidate/profile', {
      method: 'POST',
      credentials: 'include',
    });
  } catch {
    // Revalidation failure should not block profile updates.
  }
}

interface AuthState {
  user: UserResponse | null;
  loading: boolean;
  initialized: boolean;
  login: (data: LoginDto) => Promise<void>;
  register: (data: RegisterDto) => Promise<{ requiresVerification?: boolean }>;
  logout: () => Promise<void>;
  fetchUser: () => Promise<void>;
  setUser: (user: UserResponse | null) => void;
  updateProfile: (data: UpdateUserDto) => Promise<void>;
  uploadAvatar: (file: File) => Promise<void>;
  removeAvatar: () => Promise<void>;
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
      if (response.requiresVerification) {
        return { requiresVerification: true };
      }
      set({ user: response.user, initialized: true });
      return {};
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
      await revalidatePublicProfileCache();
    } finally {
      set({ loading: false });
    }
  },

  uploadAvatar: async (file: File) => {
    const updatedUser = await usersApi.uploadAvatar(file);
    set({ user: updatedUser });
    await revalidatePublicProfileCache();
  },

  removeAvatar: async () => {
    const updatedUser = await usersApi.removeAvatar();
    set({ user: updatedUser });
    await revalidatePublicProfileCache();
  },
}));
