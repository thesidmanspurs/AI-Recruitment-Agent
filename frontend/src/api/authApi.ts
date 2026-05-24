import { apiClient } from './client';
import type { UserRole } from '../hooks/useAuth';

export interface AuthResponse {
  success: boolean;
  user: { id: string; email: string; name: string; role: UserRole };
}

export const authApi = {
  register(data: { name: string; email: string; password: string }): Promise<AuthResponse> {
    return apiClient.post('/auth/register', data);
  },

  login(data: { email: string; password: string }): Promise<AuthResponse> {
    return apiClient.post('/auth/login', data);
  },

  me(): Promise<{
    success: boolean;
    user: { id: string; email: string; name: string; role: UserRole; createdAt: string; lastLoginAt: string | null };
  }> {
    return apiClient.get('/auth/me');
  },
};
