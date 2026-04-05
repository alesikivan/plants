import apiClient from './client';

export interface NotificationActor {
  id: string;
  name: string;
  avatar?: string;
}

export interface NotificationItem {
  id: string;
  type: 'new_follower' | 'new_bookmark_plant' | 'new_bookmark_history' | 'wishlist_saved' | 'system';
  actor: NotificationActor;
  data: Record<string, string>;
  isRead: boolean;
  createdAt: string;
}

export interface NotificationsResponse {
  items: NotificationItem[];
  unreadCount: number;
}

export const notificationsApi = {
  getAll: async (): Promise<NotificationsResponse> => {
    const response = await apiClient.get<NotificationsResponse>('/notifications');
    return response.data;
  },

  getUnreadCount: async (): Promise<{ count: number }> => {
    const response = await apiClient.get<{ count: number }>('/notifications/unread-count');
    return response.data;
  },

  markAllRead: async (): Promise<void> => {
    await apiClient.post('/notifications/read-all');
  },

  clearAll: async (): Promise<void> => {
    await apiClient.delete('/notifications');
  },
};
