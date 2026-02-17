import { apiClient } from './client';

export interface Genus {
  _id: string;
  nameRu: string;
  nameEn: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateGenusDto {
  nameRu: string;
  nameEn: string;
  description?: string;
}

export const genusApi = {
  getAll: async (search?: string): Promise<Genus[]> => {
    const params = search ? { search } : {};
    const response = await apiClient.get<Genus[]>('/genus', { params });
    return response.data;
  },

  getOne: async (id: string): Promise<Genus> => {
    const response = await apiClient.get<Genus>(`/genus/${id}`);
    return response.data;
  },

  create: async (data: CreateGenusDto): Promise<Genus> => {
    const response = await apiClient.post<Genus>('/genus', data);
    return response.data;
  },

  update: async (id: string, data: Partial<CreateGenusDto>): Promise<Genus> => {
    const response = await apiClient.patch<Genus>(`/genus/${id}`, data);
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/genus/${id}`);
  },
};
