import type { Request, Response, NextFunction } from 'express';
import { adminService } from '../services/admin/adminService.js';
import { settingsService, SETTING_KEYS } from '../services/admin/settingsService.js';
import { parsePageParams } from '../services/admin/paginate.js';
import { createError } from '../middleware/errorHandler.js';
import { prisma } from '../config/database.js';
import { encryptSecret, isEncryptionAvailable } from '../utils/crypto.js';
import { emailService, EmailNotConfiguredError } from '../services/outreach/emailService.js';

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

  async getBilling(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await adminService.billingOverview();
      res.json({ success: true, ...data });
    } catch (err) {
      next(err);
    }
  },

  async grantCredits(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { userId } = req.params;
      const { credits, note } = req.body as { credits?: number | string; note?: string };
      const amount = parseInt(String(credits), 10);
      if (!Number.isFinite(amount) || amount <= 0) {
        return next(createError('credits must be a positive integer.', 400));
      }
      const balance = await adminService.grantCredits(userId, amount, note);
      res.json({ success: true, balance });
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

  // ── Email requests + admin email config ────────────────────────────────
  async listEmailRequests(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const status = (req.query.status as string) || undefined;
      const rows = await prisma.emailRequest.findMany({
        where: status ? { status: status as 'PENDING' | 'CONFIGURED' | 'REJECTED' } : undefined,
        orderBy: [{ status: 'asc' }, { createdAt: 'desc' }],
        include: {
          user: {
            select: { id: true, name: true, email: true, emailProvider: true, emailVerifiedAt: true },
          },
        },
      });
      res.json({ success: true, requests: rows });
    } catch (err) {
      next(err);
    }
  },

  // Admin configures a user's email (typically Resend) on their behalf.
  // body: { userId, provider, fromAddress, fromName?, resendApiKey?, gmailAppPassword?, requestId? }
  async configureUserEmail(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!isEncryptionAvailable()) {
        return next(createError('Server encryption is not configured (ENCRYPTION_KEY missing).', 500));
      }
      const { userId, provider, fromAddress, fromName, resendApiKey, gmailAppPassword, requestId } =
        req.body as {
          userId?: string;
          provider?: 'GMAIL' | 'RESEND';
          fromAddress?: string;
          fromName?: string;
          resendApiKey?: string;
          gmailAppPassword?: string;
          requestId?: string;
        };
      if (!userId) return next(createError('userId is required.', 400));
      if (provider !== 'GMAIL' && provider !== 'RESEND') {
        return next(createError('provider must be GMAIL or RESEND.', 400));
      }
      if (!fromAddress || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(fromAddress.trim())) {
        return next(createError('A valid fromAddress is required.', 400));
      }
      const data: Record<string, unknown> = {
        emailProvider: provider,
        emailFromAddress: fromAddress.trim(),
        emailFromName: fromName?.trim() || null,
        emailVerifiedAt: null, // admin must run a test send to verify
      };
      if (provider === 'RESEND') {
        if (resendApiKey && resendApiKey.trim()) {
          data.resendApiKeyEnc = encryptSecret(resendApiKey.trim());
        } else {
          const existing = await prisma.user.findUnique({
            where: { id: userId },
            select: { resendApiKeyEnc: true },
          });
          if (!existing?.resendApiKeyEnc) return next(createError('resendApiKey is required.', 400));
        }
      } else {
        if (gmailAppPassword && gmailAppPassword.trim()) {
          data.gmailAppPasswordEnc = encryptSecret(gmailAppPassword.replace(/\s+/g, ''));
        } else {
          const existing = await prisma.user.findUnique({
            where: { id: userId },
            select: { gmailAppPasswordEnc: true },
          });
          if (!existing?.gmailAppPasswordEnc) return next(createError('gmailAppPassword is required.', 400));
        }
      }
      await prisma.user.update({ where: { id: userId }, data });
      if (requestId) {
        await prisma.emailRequest.update({
          where: { id: requestId },
          data: { status: 'CONFIGURED', handledAt: new Date() },
        }).catch(() => { /* request may not exist */ });
      }
      res.json({ success: true });
    } catch (err) {
      next(err);
    }
  },

  // Admin runs a test send for a user to verify the config they just set.
  async testUserEmail(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { userId } = req.params;
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { email: true, emailFromAddress: true },
      });
      const to = (req.body?.to as string) || user?.emailFromAddress || user?.email;
      if (!to) return next(createError('No destination for the test.', 400));
      try {
        const r = await emailService.testSendForUser(userId, to);
        await prisma.user.update({ where: { id: userId }, data: { emailVerifiedAt: new Date() } });
        res.json({ success: true, messageId: r.messageId, sentTo: to });
      } catch (err) {
        if (err instanceof EmailNotConfiguredError) return next(createError(err.message, 400));
        return next(createError(`Test send failed: ${err instanceof Error ? err.message : String(err)}`, 502));
      }
    } catch (err) {
      next(err);
    }
  },
};
