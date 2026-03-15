import apiClient from './client';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3008/api';

export interface FeedUser {
  _id: string;
  name: string;
  avatar?: string;
}

export interface FeedGenus {
  _id: string;
  nameRu: string;
  nameEn: string;
}

export interface FeedVariety {
  _id: string;
  nameRu: string;
  nameEn: string;
}

export interface FeedPlantItem {
  type: 'plant';
  _id: string;
  createdAt: string;
  isOwnItem: boolean;
  isBookmarked: boolean;
  plant: {
    _id: string;
    photo?: string;
    description?: string;
    genusId: FeedGenus;
    varietyId?: FeedVariety;
  };
  user: FeedUser;
}

export interface FeedHistoryItem {
  type: 'plant_history';
  _id: string;
  createdAt: string;
  isOwnItem: boolean;
  isBookmarked: boolean;
  historyEntry: {
    _id: string;
    date: string;
    comment: string;
    photos: string[];
  };
  plantMeta: {
    _id: string;
    photo?: string;
    genusId: FeedGenus;
    varietyId?: FeedVariety;
  };
  user: FeedUser;
}

export type FeedItem = FeedPlantItem | FeedHistoryItem;

export interface FeedResponse {
  items: FeedItem[];
  nextCursor: string | null;
  hasMore: boolean;
}

export const getFeedPlantPhotoUrl = (filename: string | undefined): string | undefined => {
  if (!filename) return undefined;
  return `${API_BASE_URL}/plants/photo/${filename}`;
};

export const getFeedHistoryPhotoUrl = (filename: string | undefined): string | undefined => {
  if (!filename) return undefined;
  return `${API_BASE_URL}/plants/history/photo/${filename}`;
};

export const getFeedAvatarUrl = (filename: string | undefined): string | undefined => {
  if (!filename) return undefined;
  return `${API_BASE_URL}/users/avatar/${filename}`;
};

export const feedApi = {
  getGlobal: async (cursor?: string): Promise<FeedResponse> => {
    const params: Record<string, string> = {};
    if (cursor) params.cursor = cursor;
    const response = await apiClient.get<FeedResponse>('/feed/global', { params });
    return response.data;
  },

  getFollowing: async (cursor?: string): Promise<FeedResponse> => {
    const params: Record<string, string> = {};
    if (cursor) params.cursor = cursor;
    const response = await apiClient.get<FeedResponse>('/feed/following', { params });
    return response.data;
  },
};
