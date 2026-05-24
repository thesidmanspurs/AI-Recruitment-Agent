import { apiClient } from './client';
import type { ApiResponse, AlertPayload, ActivityLog } from '../types';

export const outreachApi = {
  enrich(params: { candidateId: string; name: string; company: string; linkedinUrl?: string }): Promise<ApiResponse<unknown>> {
    return apiClient.post('/outreach/enrich', params);
  },

  generateMessage(params: { candidateId: string; originalSpec: string }): Promise<{ success: boolean; message: string; isSimulated: boolean }> {
    return apiClient.post('/outreach/generate-message', params);
  },

  sendOutreach(params: { candidateId: string; originalSpec: string }): Promise<ApiResponse<unknown>> {
    return apiClient.post('/outreach/send', params);
  },

  getAlerts(): Promise<ApiResponse<AlertPayload[]>> {
    return apiClient.get('/outreach/alerts');
  },

  getActivityLog(limit?: number): Promise<ApiResponse<ActivityLog[]>> {
    const qs = limit ? `?limit=${limit}` : '';
    return apiClient.get(`/outreach/activity${qs}`);
  },
};
