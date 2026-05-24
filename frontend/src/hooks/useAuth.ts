import { useState, useEffect } from 'react';
import { authApi } from '../api/authApi';
import { ApiError } from '../api/client';

export type UserRole = 'USER' | 'ADMIN';

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
}

export type AuthView = 'login' | 'register';

const TOKEN_KEY = 'jwt_token';

export function useAuth() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true); // true on first mount while checking stored token
  const [error, setError] = useState<string | null>(null);

  // Restore session from localStorage on mount
  useEffect(() => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) {
      setLoading(false);
      return;
    }
    authApi
      .me()
      .then(res => setUser(res.user))
      .catch(() => localStorage.removeItem(TOKEN_KEY))
      .finally(() => setLoading(false));
  }, []);

  async function login(email: string, password: string): Promise<void> {
    setError(null);
    const res = await authApi.login({ email, password });
    localStorage.setItem(TOKEN_KEY, res.token);
    setUser(res.user);
  }

  async function register(name: string, email: string, password: string): Promise<void> {
    setError(null);
    const res = await authApi.register({ name, email, password });
    localStorage.setItem(TOKEN_KEY, res.token);
    setUser(res.user);
  }

  function logout(): void {
    localStorage.removeItem(TOKEN_KEY);
    setUser(null);
  }

  return { user, loading, error, setError, login, register, logout };
}
