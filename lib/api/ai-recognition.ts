import { apiClient } from './client';

export interface AiRecognitionLog {
  _id: string;
  userId?: string;
  userName?: string;
  type: 'genus' | 'variety';
  query: string;
  recognized: boolean;
  resultNameRu: string;
  resultNameEn: string;
  genusId?: string;
  genusNameRu?: string;
  genusNameEn?: string;
  createdAt: string;
}

export interface AiRecognitionTypeStats {
  total: number;
  recognized: number;
  notRecognized: number;
  recognizedPercent: number;
}

export interface AiRecognitionStats {
  total: number;
  recognized: number;
  notRecognized: number;
  recognizedPercent: number;
  notRecognizedPercent: number;
  byType: {
    genus: AiRecognitionTypeStats;
    variety: AiRecognitionTypeStats;
  };
  period: {
    today: number;
    last3days: number;
    lastWeek: number;
    lastMonth: number;
  };
}

export interface AiRecognitionListResponse {
  items: AiRecognitionLog[];
  total: number;
  page: number;
  limit: number;
  pages: number;
  nextCursor?: string;
}

export const aiRecognitionApi = {
  async getStats(): Promise<AiRecognitionStats> {
    const response = await apiClient.get('/admin/ai-recognition/stats');
    return response.data;
  },

  async getList(params?: {
    page?: number;
    limit?: number;
    type?: 'genus' | 'variety';
    recognized?: boolean;
    cursor?: string;
  }): Promise<AiRecognitionListResponse> {
    const query: Record<string, string> = {};
    if (params?.page) query.page = String(params.page);
    if (params?.limit) query.limit = String(params.limit);
    if (params?.type) query.type = params.type;
    if (params?.recognized !== undefined) query.recognized = String(params.recognized);
    if (params?.cursor) query.cursor = params.cursor;

    const response = await apiClient.get('/admin/ai-recognition/list', { params: query });
    return response.data;
  },
};
