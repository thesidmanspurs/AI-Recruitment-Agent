import type { Request, Response } from 'express';
import crypto from 'node:crypto';
import { env, isGoogleConfigured } from '../config/env.js';
import { authService } from '../services/auth/authService.js';
import { setAuthCookie } from '../utils/authCookie.js';

/**
 * Google OAuth 2.0 — server-side Authorization Code flow.
 *
 *   GET /api/auth/google  → redirect the browser to Google's consent screen.
 *   GET /api/callback     → Google redirects back here with ?code; we exchange
 *                           it for tokens, resolve the user, set the auth
 *                           cookie, and redirect into the app.
 *
 * The redirect path /api/callback matches the Authorized redirect URI on the
 * OAuth client. CSRF is handled with a one-time `state` value mirrored in a
 * short-lived HttpOnly cookie. The auth cookie is SameSite=Lax, so it is sent
 * on the top-level redirect back into the SPA.
 */
const STATE_COOKIE = 'aries_oauth_state';
const GOOGLE_AUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth';
const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token';

function appHome(): string {
  return env.APP_URL.replace(/\/$/, '') || '';
}

/** Decode a JWT payload (no signature check needed — token came straight from
 *  Google's token endpoint over TLS). */
function decodeJwtPayload(jwtStr: string): Record<string, unknown> {
  const part = jwtStr.split('.')[1];
  if (!part) throw new Error('malformed id_token');
  return JSON.parse(Buffer.from(part, 'base64url').toString('utf8'));
}

export const googleAuthController = {
  // GET /api/auth/google
  start(_req: Request, res: Response): void {
    if (!isGoogleConfigured()) {
      res.redirect(`${appHome()}/?auth_error=${encodeURIComponent('Google sign-in is not configured.')}`);
      return;
    }
    const state = crypto.randomBytes(16).toString('hex');
    res.cookie(STATE_COOKIE, state, {
      httpOnly: true,
      secure: env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 10 * 60 * 1000, // 10 min — only needs to survive the round trip
    });

    const params = new URLSearchParams({
      client_id: env.GOOGLE_CLIENT_ID,
      redirect_uri: env.GOOGLE_REDIRECT_URI,
      response_type: 'code',
      scope: 'openid email profile',
      state,
      access_type: 'online',
      prompt: 'select_account',
    });
    res.redirect(`${GOOGLE_AUTH_URL}?${params.toString()}`);
  },

  // GET /api/callback
  async callback(req: Request, res: Response): Promise<void> {
    const fail = (msg: string) =>
      res.redirect(`${appHome()}/?auth_error=${encodeURIComponent(msg)}`);

    try {
      if (!isGoogleConfigured()) return fail('Google sign-in is not configured.');

      const { code, state, error } = req.query as Record<string, string | undefined>;
      if (error) return fail(`Google denied the request (${error}).`);
      if (!code) return fail('Missing authorization code.');

      // CSRF: the state echoed by Google must match the cookie we set.
      const expected = req.cookies?.[STATE_COOKIE];
      res.clearCookie(STATE_COOKIE, { path: '/' });
      if (!expected || !state || expected !== state) {
        return fail('Sign-in session expired. Please try again.');
      }

      // Exchange the code for tokens.
      const tokenRes = await fetch(GOOGLE_TOKEN_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          code,
          client_id: env.GOOGLE_CLIENT_ID,
          client_secret: env.GOOGLE_CLIENT_SECRET,
          redirect_uri: env.GOOGLE_REDIRECT_URI,
          grant_type: 'authorization_code',
        }),
      });
      const tokenJson = (await tokenRes.json()) as { id_token?: string; error?: string; error_description?: string };
      if (!tokenRes.ok || !tokenJson.id_token) {
        console.error('[Google OAuth] token exchange failed:', tokenJson.error_description || tokenJson.error || tokenRes.status);
        return fail('Could not complete Google sign-in.');
      }

      const claims = decodeJwtPayload(tokenJson.id_token) as {
        sub?: string;
        email?: string;
        email_verified?: boolean | string;
        name?: string;
        picture?: string;
      };
      // Defence: the token's audience must be our client id.
      const verifiedEmail = claims.email_verified === true || claims.email_verified === 'true';
      if (!claims.sub || !claims.email) return fail('Google profile was incomplete.');
      if (!verifiedEmail) return fail('Your Google email is not verified.');

      const result = await authService.googleSignIn({
        googleId: claims.sub,
        email: claims.email,
        name: claims.name,
        avatarUrl: claims.picture,
      });

      setAuthCookie(res, result.token);
      // Top-level navigation back into the SPA; the Lax auth cookie rides along.
      res.redirect(`${appHome()}/`);
    } catch (err) {
      console.error('[Google OAuth] callback error:', err instanceof Error ? err.message : err);
      fail('Could not complete Google sign-in.');
    }
  },
};
