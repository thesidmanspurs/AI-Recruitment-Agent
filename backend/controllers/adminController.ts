import type { Request, Response, NextFunction } from 'express';
import { adminService } from '../services/admin/adminService.js';
import { settingsService, SETTING_KEYS } from '../services/admin/settingsService.js';
import { parsePageParams } from '../services/admin/paginate.js';
import { createError } from '../middleware/errorHandler.js';

export const adminController = {
  async listUsers(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const page = await adminService.listUsers(parsePageParams(req.query as Record<string, string>));
      res.json({ success: true, ...page });
    } catch (err) {
      next(err);
    }
  },

  async getUserBehavior(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await adminService.getUserBehavior(req.params.userId);
      res.json({ success: true, ...data });
    } catch (err) {
      next(err);
    }
  },

  async getStats(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const stats = await adminService.getStats();
      res.json({ success: true, stats });
    } catch (err) {
      next(err);
    }
  },

  async getHotCampaigns(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const page = await adminService.getHotCampaigns(parsePageParams(req.query as Record<string, string>));
      res.json({ success: true, ...page });
    } catch (err) {
      next(err);
    }
  },

  async getSystemActivity(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const page = await adminService.getSystemActivity(parsePageParams(req.query as Record<string, string>));
      res.json({ success: true, ...page });
    } catch (err) {
      next(err);
    }
  },

  async getPipelineFunnel(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const funnel = await adminService.getPipelineFunnel();
      res.json({ success: true, funnel });
    } catch (err) {
      next(err);
    }
  },

  async getPlatformBreakdown(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const platforms = await adminService.getPlatformBreakdown();
      res.json({ success: true, platforms });
    } catch (err) {
      next(err);
    }
  },

  async getScoreDistribution(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const buckets = await adminService.getScoreDistribution();
      res.json({ success: true, buckets });
    } catch (err) {
      next(err);
    }
  },

  async getRecentSignups(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const users = await adminService.getRecentSignups();
      res.json({ success: true, users });
    } catch (err) {
      next(err);
    }
  },

  async setRole(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { role } = req.body as { role?: string };
      if (role !== 'USER' && role !== 'ADMIN') {
        return next(createError('role must be USER or ADMIN.', 400));
      }
      const user = await adminService.setRole(req.params.userId, role);
      res.json({ success: true, user });
    } catch (err) {
      next(err);
    }
  },

  async createUser(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { name, email, password, role, dailyLimitOverride } = req.body as {
        name?: string;
        email?: string;
        password?: string;
        role?: 'USER' | 'ADMIN';
        dailyLimitOverride?: number | null;
      };
      if (!name || !email || !password) {
        return next(createError('name, email and password are required.', 400));
      }
      if (role && role !== 'USER' && role !== 'ADMIN') {
        return next(createError('role must be USER or ADMIN.', 400));
      }
      const user = await adminService.createUser({ name, email, password, role, dailyLimitOverride });
      res.status(201).json({ success: true, user });
    } catch (err) {
      next(err);
    }
  },

  async updateUser(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { name, email, dailyLimitOverride } = req.body as {
        name?: string;
        email?: string;
        dailyLimitOverride?: number | null;
      };
      const user = await adminService.updateUser(req.params.userId, {
        name,
        email,
        dailyLimitOverride,
      });
      res.json({ success: true, user });
    } catch (err) {
      next(err);
    }
  },

  async resetPassword(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { password } = req.body as { password?: string };
      if (!password) return next(createError('password is required.', 400));
      await adminService.resetPassword(req.params.userId, password);
      res.json({ success: true });
    } catch (err) {
      next(err);
    }
  },

  async deleteUser(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (req.user?.id === req.params.userId) {
        return next(createError('You cannot delete your own account from the admin console.', 400));
      }
      await adminService.deleteUser(req.params.userId);
      res.json({ success: true });
    } catch (err) {
      next(err);
    }
  },

  async setBlocked(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { blocked, reason } = req.body as { blocked?: boolean; reason?: string };
      if (typeof blocked !== 'boolean') {
        return next(createError('blocked (boolean) is required.', 400));
      }
      if (blocked && req.user?.id === req.params.userId) {
        return next(createError('You cannot block your own account.', 400));
      }
      const user = await adminService.setBlocked(req.params.userId, blocked, reason);
      res.json({ success: true, user });
    } catch (err) {
      next(err);
    }
  },

  // ─── Settings ──────────────────────────────────────────────────────────────
  async listSettings(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const settings = await settingsService.listAll();
      res.json({ success: true, settings });
    } catch (err) {
      next(err);
    }
  },

  async updateSetting(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { key } = req.params;
      const { value } = req.body as { value?: string | number };
      if (value === undefined || value === null) {
        return next(createError('value is required.', 400));
      }
      // For now we only know one typed setting. As more land, route by key.
      if (key === SETTING_KEYS.DAILY_FREE_LIMIT) {
        const n = typeof value === 'string' ? Number.parseInt(value, 10) : value;
        await settingsService.setDailyFreeLimit(n, req.user?.email);
      } else {
        await settingsService.setString(key, String(value), req.user?.email);
      }
      const settings = await settingsService.listAll();
      res.json({ success: true, settings });
    } catch (err) {
      next(err);
    }
  },
};
