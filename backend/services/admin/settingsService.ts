import { prisma } from '../../config/database.js';
import { createError } from '../../middleware/errorHandler.js';

/**
 * Singleton key/value settings store. We keep values as strings on the table
 * and coerce per-key on read so any caller can ask for a typed value without
 * worrying about the storage representation.
 */

export const SETTING_KEYS = {
  DAILY_FREE_LIMIT: 'daily_free_limit',
} as const;

const DEFAULTS: Record<string, string> = {
  [SETTING_KEYS.DAILY_FREE_LIMIT]: '50',
};

export const settingsService = {
  async listAll() {
    const rows = await prisma.appSetting.findMany({ orderBy: { key: 'asc' } });
    // Ensure known defaults appear even if not seeded.
    const map = new Map(rows.map(r => [r.key, r]));
    return Object.keys(DEFAULTS).map(k => {
      const r = map.get(k);
      return {
        key: k,
        value: r?.value ?? DEFAULTS[k],
        updatedAt: r?.updatedAt ?? null,
        updatedBy: r?.updatedBy ?? null,
        isDefault: !r,
      };
    });
  },

  async getString(key: string): Promise<string> {
    const row = await prisma.appSetting.findUnique({ where: { key } });
    return row?.value ?? DEFAULTS[key] ?? '';
  },

  async getInt(key: string): Promise<number> {
    const raw = await this.getString(key);
    const n = Number.parseInt(raw, 10);
    return Number.isFinite(n) ? n : 0;
  },

  async setString(key: string, value: string, updatedBy?: string) {
    return prisma.appSetting.upsert({
      where: { key },
      create: { key, value, updatedBy: updatedBy ?? null },
      update: { value, updatedBy: updatedBy ?? null },
    });
  },

  async setDailyFreeLimit(limit: number, updatedBy?: string) {
    if (!Number.isFinite(limit) || limit < 0) {
      throw createError('Daily free limit must be a non-negative integer.', 400);
    }
    if (limit > 100_000) {
      throw createError('Daily free limit is unreasonably large.', 400);
    }
    return this.setString(SETTING_KEYS.DAILY_FREE_LIMIT, String(Math.floor(limit)), updatedBy);
  },
};
