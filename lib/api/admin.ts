import { apiClient } from './client';

interface UploadFolder {
  name: string;
  files: number;
  sizeBytes: number;
  sizeMb: string;
}

interface UploadsInfo {
  total: { files: number; sizeBytes: number; sizeMb: string };
  byFolder: UploadFolder[];
}

interface CountStats {
  total: number;
  today: number;
  last3days: number;
  lastWeek: number;
  lastMonth: number;
}

interface PlantStats extends CountStats {
  archived: number;
}

interface AdminInfoResponse {
  uploads: UploadsInfo;
  stats: {
    users: CountStats;
    plants: PlantStats;
    shelves: CountStats;
    plantHistory: CountStats;
    genus: { total: number };
    varieties: { total: number };
  };
}

export type TelegramCommunityTopic = 'general' | 'plants' | 'history';

export const adminApi = {
  /** Send a manual message (plain text + up to 10 photos) from the bot into the Telegram community topics */
  async telegramBroadcast(
    text: string,
    topics: TelegramCommunityTopic[],
    photos: File[] = [],
  ): Promise<{ sent: number }> {
    const formData = new FormData();
    formData.append('text', text);
    formData.append('topics', JSON.stringify(topics));
    photos.forEach((file) => formData.append('photos', file));
    const response = await apiClient.post<{ sent: number }>('/admin/telegram/broadcast', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  async getInfo(): Promise<AdminInfoResponse> {
    const response = await apiClient.get('/admin/info');
    return response.data;
  },

  async broadcastNotification(
    title: string,
    message: string,
    userIds?: string[],
  ): Promise<{ sent: number }> {
    const response = await apiClient.post<{ sent: number }>('/admin/notifications/broadcast', {
      title,
      message,
      userIds,
    });
    return response.data;
  },
};
