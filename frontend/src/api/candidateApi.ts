import { apiClient } from './client';
import type { ApiResponse, Candidate, JobAnalysis } from '../types';

export const candidateApi = {
  source(params: Omit<JobAnalysis, 'preferredPlatforms'>): Promise<ApiResponse<Candidate[]> & { candidates: Candidate[]; isSimulated: boolean }> {
    return apiClient.post('/candidates/source', params);
  },

  list(): Promise<ApiResponse<Candidate[]>> {
    return apiClient.get('/candidates');
  },

  getById(id: string): Promise<ApiResponse<Candidate>> {
    return apiClient.get(`/candidates/${id}`);
  },

  getApprovedQueue(): Promise<ApiResponse<Candidate[]>> {
    return apiClient.get('/candidates/approved-queue');
  },
};
