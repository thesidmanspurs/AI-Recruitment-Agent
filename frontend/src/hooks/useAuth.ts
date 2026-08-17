import { useState, useEffect } from 'react';
import { authApi } from '../api/authApi';
import { apiClient } from '../api/client';

export type UserRole = 'USER' | 'ADMIN';

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  planType?: 'SOURCING' | 'RANKING' | 'PRO' | 'NONE' | null;
}

export type AuthView = 'login' | 'register';

export function useAuth() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    authApi
      .me()
      .then(res => setUser(res.user))
      .catch(() => {/* no session — that's fine */})
      .finally(() => setLoading(false));
  }, []);

  async function login(email: string, password: string, intent?: 'sourcing' | 'ranking' | 'both'): Promise<AuthUser> {
    setError(null);
    const res = await authApi.login({ email, password, intent });
    setUser(res.user);
    return res.user;
  }

  async function register(name: string, email: string, password: string, intent?: 'sourcing' | 'ranking' | 'both'): Promise<AuthUser> {
    setError(null);
    const res = await authApi.register({ name, email, password, intent });
    setUser(res.user);
    return res.user;
  }

  async function logout(): Promise<void> {
    try {
      await apiClient.post('/auth/logout', {});
    } catch {
      // Ignore network errors on logout
    }
    setUser(null);
  }

  return { user, loading, error, setError, login, register, logout };
}
