export type UserRole = 'USER' | 'ADMIN';

export interface JwtPayload {
  userId: string;
  email: string;
  role: UserRole;
  iat?: number;
  exp?: number;
}

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  planType?: 'SOURCING' | 'RANKING' | 'PRO' | 'NONE' | null;
}

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
  intent?: 'sourcing' | 'ranking' | 'both';
}

export interface LoginRequest {
  email: string;
  password: string;
  intent?: 'sourcing' | 'ranking' | 'both';
}

export interface AuthResponse {
  token: string;
  user: {
    id: string;
    email: string;
    name: string;
    role: UserRole;
    planType?: 'SOURCING' | 'RANKING' | 'PRO' | 'NONE' | null;
  };
}
