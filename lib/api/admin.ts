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

export const adminApi = {
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
