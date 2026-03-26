import { apiClient } from './client';
import { Genus } from './genus';
import { Variety } from './variety';
import type { Shelf } from './shelves';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

export interface Plant {
  _id: string;
  genusId: string | Genus;
  varietyId?: string | Variety;
  userId: string;
  shelfIds: string[];
  purchaseDate?: string;
  photo?: string;
  description?: string;
  isArchived?: boolean;
  sortOrder?: number;
  createdAt: string;
  updatedAt: string;
  shelves?: Shelf[];
}

export interface CreatePlantDto {
  genusId: string;
  varietyId?: string;
  shelfIds?: string[];
  purchaseDate?: string;
  photo?: File;
  description?: string;
}

export interface UpdatePlantDto {
  genusId?: string;
  varietyId?: string;
  removeVariety?: boolean;
  shelfIds?: string[];
  purchaseDate?: string;
  photo?: File;
  description?: string;
  removePhoto?: boolean;
}

export interface PlantHistory {
  _id: string;
  plantId: string;
  userId: string;
  date: string;
  comment: string;
  photos: string[];
  createdAt: string;
  updatedAt: string;
}

export interface CreatePlantHistoryDto {
  date: string;
  comment?: string;
  photos?: File[];
}

export interface UpdatePlantHistoryDto {
  date?: string;
  comment?: string;
  photos?: File[];
  removePhotos?: string[];
}

// Helper function to get photo URL
export const getPlantPhotoUrl = (photoFilename: string | undefined): string | undefined => {
  if (!photoFilename) return undefined;
  return `${API_BASE_URL}/plants/photo/${photoFilename}`;
};

// Helper function to get plant history photo URL
export const getPlantHistoryPhotoUrl = (photoFilename: string | undefined): string | undefined => {
  if (!photoFilename) return undefined;
  return `${API_BASE_URL}/plants/history/photo/${photoFilename}`;
};

export interface PlantFilters {
  search?: string;
  genusId?: string;
  varietyId?: string;
  shelfId?: string;
  showArchived?: boolean;
}

export const plantsApi = {
  getAll: async (filters?: PlantFilters): Promise<Plant[]> => {
    const params: Record<string, string> = {};
    if (filters?.search) params.search = filters.search;
    if (filters?.genusId) params.genusId = filters.genusId;
    if (filters?.varietyId) params.varietyId = filters.varietyId;
    if (filters?.shelfId) params.shelfId = filters.shelfId;
    if (filters?.showArchived) params.showArchived = 'true';
    const response = await apiClient.get<Plant[]>('/plants', { params });
    return response.data;
  },

  getOne: async (id: string): Promise<Plant> => {
    const response = await apiClient.get<Plant>(`/plants/${id}`);
    return response.data;
  },

  getPublic: async (id: string): Promise<Plant & { showPlantHistory: boolean }> => {
    const response = await apiClient.get<Plant & { showPlantHistory: boolean }>(
      `/plants/public/${id}`
    );
    return response.data;
  },

  reorder: async (ids: string[]): Promise<void> => {
    await apiClient.patch('/plants/reorder', { ids });
  },

  create: async (data: CreatePlantDto): Promise<Plant> => {
    const formData = new FormData();
    formData.append('genusId', data.genusId);

    if (data.varietyId) {
      formData.append('varietyId', data.varietyId);
    }
    if (data.shelfIds && data.shelfIds.length > 0) {
      data.shelfIds.forEach((shelfId) => {
        formData.append('shelfIds[]', shelfId);
      });
    }
    if (data.purchaseDate) {
      formData.append('purchaseDate', data.purchaseDate);
    }
    if (data.photo) {
      formData.append('photo', data.photo);
    }
    if (data.description) {
      formData.append('description', data.description);
    }

    const response = await apiClient.post<Plant>('/plants', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  update: async (id: string, data: UpdatePlantDto): Promise<Plant> => {
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
    if (data.shelfIds !== undefined) {
      data.shelfIds.forEach((shelfId) => {
        formData.append('shelfIds[]', shelfId);
      });
    }
    if (data.purchaseDate) {
      formData.append('purchaseDate', data.purchaseDate);
    }
    if (data.photo) {
      formData.append('photo', data.photo);
    }
    if (data.description !== undefined) {
      formData.append('description', data.description);
    }
    if (data.removePhoto) {
      formData.append('removePhoto', 'true');
    }

    const response = await apiClient.patch<Plant>(`/plants/${id}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  archive: async (id: string): Promise<Plant> => {
    const response = await apiClient.patch<Plant>(`/plants/${id}/archive`);
    return response.data;
  },

  unarchive: async (id: string): Promise<Plant> => {
    const response = await apiClient.patch<Plant>(`/plants/${id}/unarchive`);
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/plants/${id}`);
  },

  adminGetAll: async (): Promise<Plant[]> => {
    const response = await apiClient.get<Plant[]>('/plants/admin/all');
    return response.data;
  },

  adminUpdate: async (id: string, data: UpdatePlantDto): Promise<Plant> => {
    const formData = new FormData();
    if (data.genusId) formData.append('genusId', data.genusId);
    if (data.varietyId) formData.append('varietyId', data.varietyId);
    if (data.removeVariety) formData.append('removeVariety', 'true');
    if (data.purchaseDate) formData.append('purchaseDate', data.purchaseDate);
    if (data.photo) formData.append('photo', data.photo);
    if (data.description !== undefined) formData.append('description', data.description);
    if (data.removePhoto) formData.append('removePhoto', 'true');
    const response = await apiClient.patch<Plant>(`/plants/admin/${id}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  adminDelete: async (id: string): Promise<void> => {
    await apiClient.delete(`/plants/admin/${id}`);
  },
};

export const plantHistoryApi = {
  getAll: async (plantId: string): Promise<PlantHistory[]> => {
    const response = await apiClient.get<PlantHistory[]>(`/plants/${plantId}/history`);
    return response.data;
  },

  getOne: async (plantId: string, historyId: string): Promise<PlantHistory> => {
    const response = await apiClient.get<PlantHistory>(`/plants/${plantId}/history/${historyId}`);
    return response.data;
  },

  create: async (plantId: string, data: CreatePlantHistoryDto): Promise<PlantHistory> => {
    const formData = new FormData();
    formData.append('date', data.date);

    if (data.comment) {
      formData.append('comment', data.comment);
    }

    if (data.photos && data.photos.length > 0) {
      data.photos.forEach((photo) => {
        formData.append('photos', photo);
      });
    }

    const response = await apiClient.post<PlantHistory>(
      `/plants/${plantId}/history`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    return response.data;
  },

  update: async (
    plantId: string,
    historyId: string,
    data: UpdatePlantHistoryDto
  ): Promise<PlantHistory> => {
    const formData = new FormData();

    if (data.date) {
      formData.append('date', data.date);
    }
    if (data.comment) {
      formData.append('comment', data.comment);
    }
    if (data.photos && data.photos.length > 0) {
      data.photos.forEach((photo) => {
        formData.append('photos', photo);
      });
    }
    if (data.removePhotos && data.removePhotos.length > 0) {
      data.removePhotos.forEach((photo) => {
        formData.append('removePhotos[]', photo);
      });
    }

    const response = await apiClient.patch<PlantHistory>(
      `/plants/${plantId}/history/${historyId}`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    return response.data;
  },

  delete: async (plantId: string, historyId: string): Promise<void> => {
    await apiClient.delete(`/plants/${plantId}/history/${historyId}`);
  },

  adminGetAll: async (): Promise<PlantHistory[]> => {
    const response = await apiClient.get<PlantHistory[]>('/plants/admin/history');
    return response.data;
  },

  adminDelete: async (historyId: string): Promise<void> => {
    await apiClient.delete(`/plants/admin/history/${historyId}`);
  },

  getPublic: async (plantId: string): Promise<PlantHistory[]> => {
    const response = await apiClient.get<PlantHistory[]>(`/plants/public/${plantId}/history`);
    return response.data;
  },
};
