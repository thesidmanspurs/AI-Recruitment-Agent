import cors, { type CorsOptions } from 'cors';
import { env } from '../config/env.js';
import type { AppError } from './errorHandler.js';

/**
 * CORS policy for /api.
 *
 * Allowlist order of precedence:
 *   1. CORS_ORIGIN env/secret  (comma-separated list — preferred)
 *   2. APP_URL / APP_BASE_URL  (auto-derived fallback for same-origin deploys)
 *
 * Same-origin requests (no `Origin` header — e.g. server-to-server, curl)
 * are always permitted. Cross-origin mismatches return 403, not 500.
 *
 * fetch with credentials:'include' causes the browser to send Origin even on
 * same-origin POST requests, so the allowlist must include the production URL.
 */

// Build effective allowlist: explicit CORS_ORIGIN first, then APP_URL fallback.
function buildAllowlist(): string[] {
  if (env.CORS_ORIGIN.length > 0) return env.CORS_ORIGIN;
  // Same-origin deploy: derive from APP_URL/APP_BASE_URL so the server can
  // answer its own frontend without requiring CORS_ORIGIN to be set.
  const appUrl = (env.APP_URL || '').replace(/\/$/, '');
  return appUrl ? [appUrl] : [];
}

const corsOptions: CorsOptions = {
  origin(requestOrigin, callback) {
    if (!requestOrigin) return callback(null, true); // non-browser callers

    const allowlist = buildAllowlist();

    if (allowlist.length === 0 || allowlist.includes(requestOrigin)) {
      return callback(null, true);
    }

    // Return a proper 403 instead of an untyped Error that becomes 500.
    const err: AppError = new Error(`CORS: origin "${requestOrigin}" not permitted.`);
    err.statusCode = 403;
    err.isOperational = true;
    return callback(err);
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
  maxAge: 600,
};

export const apiCors = cors(corsOptions);
