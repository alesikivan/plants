import { apiClient } from './client';
import { Plant } from './plants';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

export interface Shelf {
  _id: string;
  name: string;
  photo?: string;
  userId: string;
  plantIds: string[];
  createdAt: string;
  updatedAt: string;
  plants?: Plant[];
  plantsCount?: number;
}

export interface CreateShelfDto {
  name: string;
  photo?: File;
}

export interface UpdateShelfDto {
  name?: string;
  photo?: File;
  removePhoto?: boolean;
}

// Helper function to get photo URL
export const getShelfPhotoUrl = (photoFilename: string | undefined): string | undefined => {
  if (!photoFilename) return undefined;
  return `${API_BASE_URL}/shelves/photo/${photoFilename}`;
};

export const shelvesApi = {
  getAll: async (): Promise<Shelf[]> => {
    const response = await apiClient.get<Shelf[]>('/shelves');
    return response.data;
  },

  getOne: async (id: string): Promise<Shelf> => {
    const response = await apiClient.get<Shelf>(`/shelves/${id}`);
    return response.data;
  },

  create: async (data: CreateShelfDto): Promise<Shelf> => {
    const formData = new FormData();
    formData.append('name', data.name);

    if (data.photo) {
      formData.append('photo', data.photo);
    }

    const response = await apiClient.post<Shelf>('/shelves', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  update: async (id: string, data: UpdateShelfDto): Promise<Shelf> => {
    const formData = new FormData();

    if (data.name) {
      formData.append('name', data.name);
    }
    if (data.photo) {
      formData.append('photo', data.photo);
    }
    if (data.removePhoto) {
      formData.append('removePhoto', 'true');
    }

    const response = await apiClient.patch<Shelf>(`/shelves/${id}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/shelves/${id}`);
  },

  addPlant: async (shelfId: string, plantId: string): Promise<void> => {
    await apiClient.post(`/shelves/${shelfId}/plants/${plantId}`);
  },

  removePlant: async (shelfId: string, plantId: string): Promise<void> => {
    await apiClient.delete(`/shelves/${shelfId}/plants/${plantId}`);
  },

  updatePlants: async (shelfId: string, plantIds: string[]): Promise<void> => {
    await apiClient.put(`/shelves/${shelfId}/plants`, { plantIds });
  },

  adminGetAll: async (): Promise<Shelf[]> => {
    const response = await apiClient.get<Shelf[]>('/shelves/admin/all');
    return response.data;
  },

  adminDelete: async (id: string): Promise<void> => {
    await apiClient.delete(`/shelves/admin/${id}`);
  },
};
