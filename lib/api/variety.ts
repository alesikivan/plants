import { apiClient } from './client';
import { Genus } from './genus';

export interface Variety {
  _id: string;
  nameRu: string;
  nameEn: string;
  genusId: string | Genus;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateVarietyDto {
  nameRu: string;
  nameEn: string;
  genusId: string;
  description?: string;
}

export interface ValidateVarietyResult {
  suggestion: { recognized: boolean; nameRu: string; nameEn: string };
}

export const varietyApi = {
  getAll: async (genusId?: string, search?: string): Promise<Variety[]> => {
    const params: any = {};
    if (genusId) params.genusId = genusId;
    if (search) params.search = search;
    const response = await apiClient.get<Variety[]>('/variety', { params });
    return response.data;
  },

  getOne: async (id: string): Promise<Variety> => {
    const response = await apiClient.get<Variety>(`/variety/${id}`);
    return response.data;
  },

  create: async (data: CreateVarietyDto): Promise<Variety> => {
    const response = await apiClient.post<Variety>('/variety', data);
    return response.data;
  },

  validate: async (query: string, genusId: string): Promise<ValidateVarietyResult> => {
    const response = await apiClient.post<ValidateVarietyResult>('/variety/validate', { query, genusId });
    return response.data;
  },

  update: async (id: string, data: Partial<CreateVarietyDto>): Promise<Variety> => {
    const response = await apiClient.patch<Variety>(`/variety/${id}`, data);
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/variety/${id}`);
  },
};
