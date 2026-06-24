import type { Response } from 'express';
import { env } from '../config/env.js';

/**
 * HttpOnly auth cookie helpers.
 *
 * Storing the JWT in an HttpOnly cookie is the defense against XSS-style
 * token theft: even if attacker JS runs on our origin, it cannot read or
 * exfiltrate the cookie. localStorage offers no such guarantee.
 *
 * Flags:
 *   httpOnly  — invisible to document.cookie / fetch / any client JS
 *   secure    — HTTPS only in production (Cloud Run is always HTTPS)
 *   sameSite  — 'lax' lets the cookie ride along on top-level navigation
 *               but blocks third-party AJAX, which is the CSRF surface
 *   path: /   — sent on every API request (and SPA navigation, but only
 *               /api/* actually reads it server-side)
 *   maxAge    — matches JWT_EXPIRES_IN; we keep the cookie alive as long
 *               as the underlying JWT could plausibly still be valid
 */
export const AUTH_COOKIE_NAME = 'talentscanr_token';

function maxAgeMs(): number {
  // env.JWT_EXPIRES_IN is "7d" by default; map common suffixes to ms.
  const raw = env.JWT_EXPIRES_IN.trim();
  const m = raw.match(/^(\d+)([smhd])$/);
  if (!m) return 7 * 24 * 60 * 60 * 1000;
  const n = Number(m[1]);
  const unit = m[2];
  const mult: Record<string, number> = { s: 1_000, m: 60_000, h: 3_600_000, d: 86_400_000 };
  return n * (mult[unit] ?? 86_400_000);
}

export function setAuthCookie(res: Response, token: string): void {
  res.cookie(AUTH_COOKIE_NAME, token, {
    httpOnly: true,
    secure: env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: maxAgeMs(),
    ...(env.COOKIE_DOMAIN ? { domain: env.COOKIE_DOMAIN } : {}),
  });
}

export function clearAuthCookie(res: Response): void {
  res.clearCookie(AUTH_COOKIE_NAME, {
    httpOnly: true,
    secure: env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    ...(env.COOKIE_DOMAIN ? { domain: env.COOKIE_DOMAIN } : {}),
  });
}
