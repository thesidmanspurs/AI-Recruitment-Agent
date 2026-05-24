import type { Request, Response, NextFunction } from 'express';
import { authService } from '../services/auth/authService.js';
import { createError } from '../middleware/errorHandler.js';
import type { RegisterRequest, LoginRequest } from '../types/auth.types.js';

export const authController = {
  // POST /api/auth/register
  async register(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { name, email, password } = req.body as RegisterRequest;
      if (!name || !email || !password) {
        return next(createError('name, email and password are required.', 400));
      }
      if (password.length < 8) {
        return next(createError('Password must be at least 8 characters.', 400));
      }
      const result = await authService.register({ name, email, password });
      res.status(201).json({ success: true, ...result });
    } catch (err) {
      next(err);
    }
  },

  // POST /api/auth/login
  async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { email, password } = req.body as LoginRequest;
      if (!email || !password) {
        return next(createError('email and password are required.', 400));
      }
      const result = await authService.login({ email, password });
      res.json({ success: true, ...result });
    } catch (err) {
      next(err);
    }
  },

  // GET /api/auth/me
  async me(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id;
      const profile = await authService.getProfile(userId);
      res.json({ success: true, user: profile });
    } catch (err) {
      next(err);
    }
  },
};
