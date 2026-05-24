import { useState, useEffect } from 'react';
import { authApi } from '../api/authApi';
import { apiClient } from '../api/client';

export type UserRole = 'USER' | 'ADMIN';

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
}

export type AuthView = 'login' | 'register';

/**
 * Session lives entirely in an HttpOnly cookie set by the backend; nothing
 * is read from or written to localStorage. The cookie is unreadable to JS
 * (XSS-safe) and the browser attaches it automatically on every API call
 * thanks to credentials: 'include' in the api client.
 *
 * On mount we ask /me — a 200 means the cookie is valid and we hydrate the
 * user, a 401 means there's no session (silent failure, no user set).
 */
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

  async function login(email: string, password: string): Promise<void> {
    setError(null);
    const res = await authApi.login({ email, password });
    setUser(res.user);
  }

  async function register(name: string, email: string, password: string): Promise<void> {
    setError(null);
    const res = await authApi.register({ name, email, password });
    setUser(res.user);
  }

  async function logout(): Promise<void> {
    try {
      await apiClient.post('/auth/logout', {});
    } catch {
      // Even if the request fails (network etc.), drop the local user so
      // the UI returns to the login screen. The cookie will be naturally
      // expired or cleared on next backend interaction.
    }
    setUser(null);
  }

  return { user, loading, error, setError, login, register, logout };
}
