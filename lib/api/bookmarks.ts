import apiClient from './client';
import { FeedResponse } from './feed';
import { Plant } from './plants';

export const bookmarksApi = {
  toggle: async (
    itemType: 'plant' | 'plant_history',
    itemId: string,
  ): Promise<{ bookmarked: boolean }> => {
    const response = await apiClient.post<{ bookmarked: boolean }>('/bookmarks/toggle', {
      itemType,
      itemId,
    });
    return response.data;
  },

  getStatus: async (
    itemType: 'plant' | 'plant_history',
    itemId: string,
  ): Promise<{ isBookmarked: boolean }> => {
    const response = await apiClient.get<{ isBookmarked: boolean }>('/bookmarks/status', {
      params: { itemType, itemId },
    });
    return response.data;
  },

  getPlants: async (filters?: { search?: string; genusId?: string }): Promise<Plant[]> => {
    const params: Record<string, string> = {};
    if (filters?.search) params.search = filters.search;
    if (filters?.genusId) params.genusId = filters.genusId;
    const response = await apiClient.get<Plant[]>('/bookmarks/plants', { params });
    return response.data;
  },

  getFeed: async (cursor?: string, filters?: { genusId?: string; varietyId?: string }): Promise<FeedResponse> => {
    const params: Record<string, string> = {};
    if (cursor) params.cursor = cursor;
    if (filters?.genusId) params.genusId = filters.genusId;
    if (filters?.varietyId) params.varietyId = filters.varietyId;
    const response = await apiClient.get<FeedResponse>('/bookmarks/feed', { params });
    return response.data;
  },
};
