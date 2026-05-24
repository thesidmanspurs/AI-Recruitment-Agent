import { apiClient } from './client';

export interface UsageSnapshot {
  date: string;
  used: number;
  limit: number;
  remaining: number;
  exceeded: boolean;
}

export const usageApi = {
  me(): Promise<{ success: boolean } & UsageSnapshot> {
    return apiClient.get('/usage/me');
  },
};
