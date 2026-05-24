import { prisma } from '../../config/database.js';
import { createError } from '../../middleware/errorHandler.js';
import { settingsService, SETTING_KEYS } from '../admin/settingsService.js';

/**
 * Per-user daily usage tracking + enforcement.
 *
 * "Usage" here = one AI-paid operation. We currently count Gemini sourcing
 * calls (Phase 2); the same hook will catch outreach generation (Phase 5)
 * when that lands.
 *
 * The cap can be set globally via the `daily_free_limit` AppSetting, or
 * overridden per-user via `User.dailyLimitOverride`. The override wins.
 *
 * Date key is YYYY-MM-DD in UTC so the day boundary is deterministic across
 * timezones and survives daylight-saving transitions.
 */

function todayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

export const usageService = {
  /**
   * Returns the effective per-user limit (override → global default).
   */
  async getEffectiveLimit(userId: string): Promise<number> {
    const [user, globalLimit] = await Promise.all([
      prisma.user.findUnique({
        where: { id: userId },
        select: { dailyLimitOverride: true },
      }),
      settingsService.getInt(SETTING_KEYS.DAILY_FREE_LIMIT),
    ]);
    if (user?.dailyLimitOverride != null) return user.dailyLimitOverride;
    return globalLimit;
  },

  /**
   * Current usage count for today.
   */
  async getTodayUsage(userId: string): Promise<number> {
    const row = await prisma.usageDaily.findUnique({
      where: { userId_date: { userId, date: todayKey() } },
    });
    return row?.count ?? 0;
  },

  /**
   * Snapshot for UI banners: today's count, the cap, and what's left.
   */
  async snapshot(userId: string) {
    const [used, limit] = await Promise.all([
      this.getTodayUsage(userId),
      this.getEffectiveLimit(userId),
    ]);
    return {
      date: todayKey(),
      used,
      limit,
      remaining: Math.max(0, limit - used),
      exceeded: used >= limit,
    };
  },

  /**
   * Throws 429 if the user has nothing left to spend today. Call this BEFORE
   * the paid operation; pair with `record()` once the op has succeeded.
   */
  async assertWithinLimit(userId: string) {
    const snap = await this.snapshot(userId);
    if (snap.exceeded) {
      throw createError(
        `Daily free usage exhausted (${snap.used}/${snap.limit}). Resets at 00:00 UTC.`,
        429
      );
    }
  },

  /**
   * Increment today's count by `by`. Uses upsert so the first call of the day
   * creates the row, subsequent calls just bump the counter. Returns the new
   * count.
   */
  async record(userId: string, by = 1): Promise<number> {
    const date = todayKey();
    const row = await prisma.usageDaily.upsert({
      where: { userId_date: { userId, date } },
      create: { userId, date, count: by },
      update: { count: { increment: by } },
    });
    return row.count;
  },

  /**
   * Admin view: last 30 days of usage for a single user.
   */
  async historyForUser(userId: string, days = 30) {
    const cutoff = new Date();
    cutoff.setUTCDate(cutoff.getUTCDate() - (days - 1));
    const cutoffKey = cutoff.toISOString().slice(0, 10);
    return prisma.usageDaily.findMany({
      where: { userId, date: { gte: cutoffKey } },
      orderBy: { date: 'desc' },
      select: { date: true, count: true },
    });
  },
};
