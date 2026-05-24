import type { Request, Response, NextFunction } from 'express';
import { usageService } from '../services/usage/usageService.js';

export const usageController = {
  // GET /api/usage/me — today's snapshot for the authenticated user
  async me(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const snapshot = await usageService.snapshot(req.user!.id);
      res.json({ success: true, ...snapshot });
    } catch (err) {
      next(err);
    }
  },
};
