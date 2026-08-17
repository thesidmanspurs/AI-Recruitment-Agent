import { apiClient } from './client';
import type { UserRole } from '../hooks/useAuth';

export interface AuthResponse {
  success: boolean;
  user: {
    id: string;
    email: string;
    name: string;
    role: UserRole;
    planType?: 'SOURCING' | 'RANKING' | 'PRO' | 'NONE' | null;
  };
}

export const authApi = {
  register(data: { name: string; email: string; password: string; intent?: 'sourcing' | 'ranking' | 'both' }): Promise<AuthResponse> {
    return apiClient.post('/auth/register', data);
  },

  login(data: { email: string; password: string; intent?: 'sourcing' | 'ranking' | 'both' }): Promise<AuthResponse> {
    return apiClient.post('/auth/login', data);
  },

  me(): Promise<{
    success: boolean;
    user: {
      id: string; email: string; name: string; role: UserRole;
      planType?: 'SOURCING' | 'RANKING' | 'PRO' | 'NONE' | null;
      outreachSignature?: string | null;
      createdAt: string; lastLoginAt: string | null;
    };
  }> {
    return apiClient.get('/auth/me');
  },

  updateProfile(input: { name?: string; outreachSignature?: string | null }) {
    return apiClient.patch<{
      success: boolean;
      user: { id: string; email: string; name: string; outreachSignature?: string | null };
    }>('/auth/profile', input);
  },

  forgotPassword(email: string): Promise<{ success: boolean; message: string }> {
    return apiClient.post('/auth/forgot-password', { email });
  },

  resetPassword(token: string, password: string): Promise<{ success: boolean; message: string }> {
    return apiClient.post('/auth/reset-password', { token, password });
  },
};
