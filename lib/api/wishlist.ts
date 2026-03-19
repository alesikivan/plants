import { apiClient } from './client';
import { Genus } from './genus';
import { Variety } from './variety';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

export interface Wishlist {
  _id: string;
  genusId: string | Genus;
  varietyId?: string | Variety;
  userId: string;
  photo?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateWishlistDto {
  genusId: string;
  varietyId?: string;
  photo?: File;
}

export interface UpdateWishlistDto {
  genusId?: string;
  varietyId?: string;
  removeVariety?: boolean;
  removePhoto?: boolean;
  photo?: File;
}

// Helper function to get photo URL
export const getWishlistPhotoUrl = (photoFilename: string | undefined): string | undefined => {
  if (!photoFilename) return undefined;
  return `${API_BASE_URL}/wishlist/photo/${photoFilename}`;
};

export const wishlistApi = {
  getAll: async (filters?: { search?: string; genusId?: string; varietyId?: string }): Promise<Wishlist[]> => {
    const params: Record<string, string> = {};
    if (filters?.search) params.search = filters.search;
    if (filters?.genusId) params.genusId = filters.genusId;
    if (filters?.varietyId) params.varietyId = filters.varietyId;
    const response = await apiClient.get<Wishlist[]>('/wishlist', { params });
    return response.data;
  },

  getOne: async (id: string): Promise<Wishlist> => {
    const response = await apiClient.get<Wishlist>(`/wishlist/${id}`);
    return response.data;
  },

  create: async (data: CreateWishlistDto): Promise<Wishlist> => {
    const formData = new FormData();
    formData.append('genusId', data.genusId);

    if (data.varietyId) {
      formData.append('varietyId', data.varietyId);
    }
    if (data.photo) {
      formData.append('photo', data.photo);
    }

    const response = await apiClient.post<Wishlist>('/wishlist', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  update: async (id: string, data: UpdateWishlistDto): Promise<Wishlist> => {
    const formData = new FormData();

    if (data.genusId) {
      formData.append('genusId', data.genusId);
    }
    if (data.varietyId) {
      formData.append('varietyId', data.varietyId);
    }
    if (data.removeVariety) {
      formData.append('removeVariety', 'true');
    }
    if (data.removePhoto) {
      formData.append('removePhoto', 'true');
    }
    if (data.photo) {
      formData.append('photo', data.photo);
    }

    const response = await apiClient.patch<Wishlist>(`/wishlist/${id}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/wishlist/${id}`);
  },

  reorder: async (ids: string[]): Promise<void> => {
    await apiClient.patch('/wishlist/reorder', { ids });
  },
};
