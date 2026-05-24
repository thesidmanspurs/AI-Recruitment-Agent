import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { prisma } from '../config/database.js';
import { createError } from './errorHandler.js';
import { AUTH_COOKIE_NAME } from '../utils/authCookie.js';
import type { JwtPayload } from '../types/auth.types.js';

/**
 * JWT verify + freshness check.
 *
 * The role and block status on the JWT are point-in-time snapshots; if an
 * admin demotes or blocks a user after issuance, the user could keep using
 * their token until expiry. So we do one cheap DB lookup per request to
 * reject blocked users and refresh `req.user.role` from the source of truth.
 *
 * Trade-off: +1 query per protected request. For a small/medium app this is
 * negligible, and it lets "block user" take effect instantly. If this ever
 * shows up in latency profiles, the fix is a short in-memory user cache
 * keyed by userId with a 5-30s TTL.
 */
export async function authenticate(
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> {
  // Prefer the HttpOnly auth cookie (XSS-resistant). Fall back to the
  // Authorization header for non-browser clients (curl, mobile apps, tests).
  const cookieToken = (req.cookies as Record<string, string> | undefined)?.[AUTH_COOKIE_NAME];
  const authHeader = req.headers.authorization;
  const headerToken =
    authHeader && authHeader.startsWith('Bearer ') ? authHeader.slice(7) : undefined;
  const token = cookieToken || headerToken;
  if (!token) {
    return next(createError('Missing or invalid authentication credentials.', 401));
  }
  let payload: JwtPayload;
  try {
    payload = jwt.verify(token, env.JWT_SECRET) as JwtPayload;
  } catch {
    return next(createError('Token is invalid or expired.', 401));
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: { id: true, email: true, name: true, role: true, isBlocked: true, blockedReason: true },
    });
    if (!user) return next(createError('Account no longer exists.', 401));
    if (user.isBlocked) {
      return next(
        createError(
          user.blockedReason
            ? `Account is blocked: ${user.blockedReason}`
            : 'Account is blocked.',
          403
        )
      );
    }
    req.user = { id: user.id, email: user.email, name: user.name, role: user.role };
    next();
  } catch (err) {
    next(err);
  }
}
