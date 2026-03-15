import apiClient from './client';
import { FeedResponse } from './feed';

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

  getFeed: async (cursor?: string): Promise<FeedResponse> => {
    const params: Record<string, string> = {};
    if (cursor) params.cursor = cursor;
    const response = await apiClient.get<FeedResponse>('/bookmarks/feed', { params });
    return response.data;
  },
};
