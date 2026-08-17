import type { Request, Response } from 'express';
import crypto from 'node:crypto';
import { env, isGoogleConfigured } from '../config/env.js';
import { authService } from '../services/auth/authService.js';
import { setAuthCookie, getCookieDomain } from '../utils/authCookie.js';

const STATE_COOKIE = 'aries_oauth_state';
const ORIGIN_COOKIE = 'aries_oauth_origin';
const INTENT_COOKIE = 'aries_oauth_intent';
const GOOGLE_AUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth';
const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token';

function getClientOrigin(req: Request): string {
  const host = (req.get('x-forwarded-host') || req.get('host') || '').split(':')[0];
  const proto = req.get('x-forwarded-proto') || req.protocol || 'https';
  if (host.includes('localhost') || host.includes('127.0.0.1')) {
    const port = req.get('x-forwarded-port') || host.split(':')[1] || '3000';
    return `${proto}://${host.split(':')[0]}:${port}`;
  }
  if (host.includes('run.app')) {
    return `${proto}://${host}`;
  }
  return env.APP_URL.replace(/\/$/, '') || `${proto}://${host}`;
}

function decodeJwtPayload(jwtStr: string): Record<string, unknown> {
  const part = jwtStr.split('.')[1];
  if (!part) throw new Error('malformed id_token');
  return JSON.parse(Buffer.from(part, 'base64url').toString('utf8'));
}

export const googleAuthController = {
  // GET /api/auth/google
  start(req: Request, res: Response): void {
    const origin = getClientOrigin(req);
    if (!isGoogleConfigured()) {
      res.redirect(`${origin}/?auth_error=${encodeURIComponent('Google sign-in is not configured.')}`);
      return;
    }

    const state = crypto.randomBytes(16).toString('hex');
    const domain = getCookieDomain(req);
    const intent = req.query.intent as string | undefined;

    res.cookie(STATE_COOKIE, state, {
      httpOnly: true,
      secure: env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 10 * 60 * 1000,
      ...(domain ? { domain } : {}),
    });

    res.cookie(ORIGIN_COOKIE, origin, {
      httpOnly: true,
      secure: env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 10 * 60 * 1000,
      ...(domain ? { domain } : {}),
    });

    if (intent && (intent === 'ranking' || intent === 'sourcing' || intent === 'both')) {
      res.cookie(INTENT_COOKIE, intent, {
        httpOnly: true,
        secure: env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 10 * 60 * 1000,
        ...(domain ? { domain } : {}),
      });
    }

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
    const domain = getCookieDomain(req);
    const savedOrigin = req.cookies?.[ORIGIN_COOKIE] || getClientOrigin(req);
    const savedIntent = (req.cookies?.[INTENT_COOKIE] as 'sourcing' | 'ranking' | 'both' | undefined) || undefined;

    const fail = (msg: string) => {
      res.clearCookie(STATE_COOKIE, { path: '/', ...(domain ? { domain } : {}) });
      res.clearCookie(ORIGIN_COOKIE, { path: '/', ...(domain ? { domain } : {}) });
      res.clearCookie(INTENT_COOKIE, { path: '/', ...(domain ? { domain } : {}) });
      res.redirect(`${savedOrigin}/?auth_error=${encodeURIComponent(msg)}`);
    };

    try {
      if (!isGoogleConfigured()) return fail('Google sign-in is not configured.');

      const { code, state, error } = req.query as Record<string, string | undefined>;
      if (error) return fail(`Google denied the request (${error}).`);
      if (!code) return fail('Missing authorization code.');

      // CSRF validation
      const expected = req.cookies?.[STATE_COOKIE];
      res.clearCookie(STATE_COOKIE, { path: '/', ...(domain ? { domain } : {}) });
      res.clearCookie(ORIGIN_COOKIE, { path: '/', ...(domain ? { domain } : {}) });
      res.clearCookie(INTENT_COOKIE, { path: '/', ...(domain ? { domain } : {}) });

      if (!expected || !state || expected !== state) {
        return fail('Sign-in session expired. Please try again.');
      }

      // Token exchange
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
      const verifiedEmail = claims.email_verified === true || claims.email_verified === 'true';
      if (!claims.sub || !claims.email) return fail('Google profile was incomplete.');
      if (!verifiedEmail) return fail('Your Google email is not verified.');

      const userResult = await authService.googleSignIn({
        googleId: claims.sub,
        email: claims.email,
        name: claims.name,
        avatarUrl: claims.picture,
        intent: savedIntent,
      });

      setAuthCookie(res, userResult.token, req);

      const plan = userResult.user.planType;
      const isAdmin = userResult.user.role === 'ADMIN';

      if (isAdmin || plan === 'PRO') {
        if (savedIntent === 'ranking') res.redirect(`${savedOrigin}/ranking`);
        else res.redirect(`${savedOrigin}/home`);
      } else if (plan === 'RANKING') {
        res.redirect(`${savedOrigin}/ranking`);
      } else if (plan === 'SOURCING') {
        res.redirect(`${savedOrigin}/home`);
      } else {
        if (savedIntent === 'ranking') res.redirect(`${savedOrigin}/ranking`);
        else if (savedIntent === 'sourcing') res.redirect(`${savedOrigin}/home`);
        else res.redirect(`${savedOrigin}/welcome`);
      }
    } catch (err) {
      console.error('[Google OAuth] callback error:', err instanceof Error ? err.message : err);
      fail('Could not complete Google sign-in.');
    }
  },
};
