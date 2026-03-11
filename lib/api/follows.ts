import apiClient from './client';

export interface FollowUser {
  id: string;
  name: string;
  avatar?: string;
}

export interface FollowList {
  items: FollowUser[];
  total: number;
}

export interface FollowStats {
  followersCount: number;
  followingCount: number;
  isFollowing: boolean | null;
}

export interface PublicFollowStats {
  followersCount: number;
  followingCount: number;
}

export interface FollowListParams {
  q?: string;
  page?: number;
  limit?: number;
}

export const followsApi = {
  follow: async (userId: string): Promise<void> => {
    await apiClient.post(`/follows/${userId}`);
  },

  unfollow: async (userId: string): Promise<void> => {
    await apiClient.delete(`/follows/${userId}`);
  },

  getStats: async (userId: string): Promise<FollowStats> => {
    const response = await apiClient.get<FollowStats>(`/follows/${userId}/stats`);
    return response.data;
  },

  getPublicStats: async (userId: string): Promise<PublicFollowStats> => {
    const response = await apiClient.get<PublicFollowStats>(`/follows/${userId}/public-stats`);
    return response.data;
  },

  getFollowers: async (userId: string, params?: FollowListParams): Promise<FollowList> => {
    const response = await apiClient.get<FollowList>(`/follows/${userId}/followers`, { params });
    return response.data;
  },

  getFollowing: async (userId: string, params?: FollowListParams): Promise<FollowList> => {
    const response = await apiClient.get<FollowList>(`/follows/${userId}/following`, { params });
    return response.data;
  },
};
