import type { Request, Response, NextFunction } from 'express';
import { authService } from '../services/auth/authService.js';
import { createError } from '../middleware/errorHandler.js';
import { setAuthCookie, clearAuthCookie } from '../utils/authCookie.js';
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
      setAuthCookie(res, result.token);
      // We no longer return the JWT in the body — the HttpOnly cookie carries
      // it. Returning the user is enough for the client to bootstrap state.
      res.status(201).json({ success: true, user: result.user });
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
      setAuthCookie(res, result.token);
      res.json({ success: true, user: result.user });
    } catch (err) {
      next(err);
    }
  },

  // POST /api/auth/logout
  // Clears the HttpOnly cookie. The JWT itself stays valid until expiry
  // because JWTs are stateless — but with the cookie gone the browser has
  // no way to present it. If we ever need true revocation we'll add a
  // tokenVersion column and bump it on logout.
  logout(_req: Request, res: Response): void {
    clearAuthCookie(res);
    res.json({ success: true });
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

  // PATCH /api/auth/profile  body: { name?, outreachSignature? }
  async updateProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id;
      const { name, outreachSignature } = req.body as {
        name?: string;
        outreachSignature?: string | null;
      };
      const profile = await authService.updateProfile(userId, {
        name: name?.trim(),
        // Empty string ⇒ null so the user can clear their signature.
        outreachSignature:
          outreachSignature === undefined
            ? undefined
            : outreachSignature && outreachSignature.trim()
              ? outreachSignature
              : null,
      });
      res.json({ success: true, user: profile });
    } catch (err) {
      next(err);
    }
  },

  // POST /api/auth/forgot-password
  async forgotPassword(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { email } = req.body as { email?: string };
      if (!email?.trim()) return next(createError('Email is required.', 400));

      const { passwordResetService } = await import('../services/auth/passwordResetService.js');
      await passwordResetService.forgotPassword(email.trim());

      res.json({
        success: true,
        message: 'If an account exists with that email, a password reset link has been sent.',
      });
    } catch (err) {
      next(err);
    }
  },

  // POST /api/auth/reset-password
  async resetPassword(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { token, password } = req.body as { token?: string; password?: string };
      if (!token?.trim() || !password) {
        return next(createError('Token and password are required.', 400));
      }

      const { passwordResetService } = await import('../services/auth/passwordResetService.js');
      await passwordResetService.resetPassword(token.trim(), password);

      res.json({
        success: true,
        message: 'Your password has been successfully reset. You can now log in.',
      });
    } catch (err) {
      next(err);
    }
  },
};
