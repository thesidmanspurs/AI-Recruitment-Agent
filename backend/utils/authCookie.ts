import type { Request, Response } from 'express';
import { env } from '../config/env.js';

export const AUTH_COOKIE_NAME = 'talentscanr_token';

function maxAgeMs(): number {
  const raw = env.JWT_EXPIRES_IN.trim();
  const m = raw.match(/^(\d+)([smhd])$/);
  if (!m) return 7 * 24 * 60 * 60 * 1000;
  const n = Number(m[1]);
  const mult: Record<string, number> = { s: 1_000, m: 60_000, h: 3_600_000, d: 86_400_000 };
  return n * (mult[m[2]] ?? 86_400_000);
}

export function getCookieDomain(req?: Request): string | undefined {
  if (!env.COOKIE_DOMAIN) return undefined;
  if (!req) return env.COOKIE_DOMAIN;
  const rawHost = (req.get('x-forwarded-host') || req.get('host') || '').split(':')[0];
  const targetDomain = env.COOKIE_DOMAIN.replace(/^\./, '');
  if (rawHost === targetDomain || rawHost.endsWith('.' + targetDomain)) {
    return env.COOKIE_DOMAIN;
  }
  return undefined;
}

export function setAuthCookie(res: Response, token: string, req?: Request): void {
  const domain = getCookieDomain(req);
  res.cookie(AUTH_COOKIE_NAME, token, {
    httpOnly: true,
    secure: env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: maxAgeMs(),
    ...(domain ? { domain } : {}),
  });
}

export function clearAuthCookie(res: Response, req?: Request): void {
  const domain = getCookieDomain(req);
  res.clearCookie(AUTH_COOKIE_NAME, {
    httpOnly: true,
    secure: env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    ...(domain ? { domain } : {}),
  });
}
