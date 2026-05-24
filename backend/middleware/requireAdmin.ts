import type { Request, Response, NextFunction } from 'express';
import { createError } from './errorHandler.js';

export function requireAdmin(req: Request, _res: Response, next: NextFunction): void {
  if (!req.user) return next(createError('Not authenticated.', 401));
  if (req.user.role !== 'ADMIN') return next(createError('Admin privileges required.', 403));
  next();
}
