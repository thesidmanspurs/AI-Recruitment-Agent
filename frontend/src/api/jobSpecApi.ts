import { apiClient } from './client';
import type { ApiResponse, JobSpec, JobAnalysis } from '../types';

export const jobSpecApi = {
  analyze(jobText: string): Promise<ApiResponse<JobAnalysis> & { analysis: JobAnalysis; isSimulated: boolean }> {
    return apiClient.post('/job-spec/analyze', { jobText });
  },

  list(): Promise<ApiResponse<JobSpec[]>> {
    return apiClient.get('/job-spec');
  },

  getById(id: string): Promise<ApiResponse<JobSpec>> {
    return apiClient.get(`/job-spec/${id}`);
  },
};
