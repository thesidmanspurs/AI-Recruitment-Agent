import cors, { type CorsOptions } from 'cors';
import { env } from '../config/env.js';

/**
 * CORS policy for /api.
 *
 * The allowlist is sourced from env.CORS_ORIGIN (comma-separated). Same-origin
 * requests (no `Origin` header — e.g. server-to-server, curl) are always
 * permitted. Anything else must match the allowlist exactly; mismatches are
 * rejected by cors() with a 500 / NotAllowedByCors error which the global
 * error handler will surface to the client.
 *
 * We never use `*` as origin because the API uses Bearer tokens; browsers
 * forbid `*` whenever credentials/auth headers are echoed back.
 */
const corsOptions: CorsOptions = {
  origin(requestOrigin, callback) {
    if (!requestOrigin) return callback(null, true); // non-browser callers
    if (env.CORS_ORIGIN.length === 0) {
      // No allowlist configured — assume same-origin deploy and reject
      // cross-origin requests to fail safe in production.
      return callback(new Error(`CORS: origin "${requestOrigin}" not permitted (allowlist empty).`));
    }
    if (env.CORS_ORIGIN.includes(requestOrigin)) {
      return callback(null, true);
    }
    return callback(new Error(`CORS: origin "${requestOrigin}" not permitted.`));
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: false, // Bearer tokens travel in Authorization, not cookies
  maxAge: 600,
};

export const apiCors = cors(corsOptions);
