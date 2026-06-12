import bcrypt from 'bcryptjs';
import { prisma } from '../../config/database.js';
import { createError } from '../../middleware/errorHandler.js';
import { creditService } from '../credits/creditService.js';
import { paginate, type PageParams, type Paginated } from './paginate.js';

const SALT_ROUNDS = 12;

export const adminService = {
  /**
   * Paginated list of users with aggregate behavior stats (campaign count,
   * candidate count, last login).
   */
  async listUsers(params: PageParams): Promise<Paginated<{
    id: string;
    email: string;
    name: string;
    role: 'USER' | 'ADMIN';
    isBlocked: boolean;
    blockedAt: Date | null;
    blockedReason: string | null;
    dailyLimitOverride: number | null;
    createdAt: Date;
    lastLoginAt: Date | null;
    campaignCount: number;
    candidateCount: number;
  }>> {
    const [users, total] = await Promise.all([
      prisma.user.findMany({
        skip: params.skip,
        take: params.take,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          isBlocked: true,
          blockedAt: true,
          blockedReason: true,
          dailyLimitOverride: true,
          createdAt: true,
          lastLoginAt: true,
          _count: { select: { campaigns: true } },
        },
      }),
      prisma.user.count(),
    ]);

    // Candidate counts only for the users on the current page.
    const userIds = users.map(u => u.id);
    const userCampaigns = userIds.length
      ? await prisma.campaign.findMany({
          where: { userId: { in: userIds } },
          select: { id: true, userId: true },
        })
      : [];
    const campaignToUser = new Map(userCampaigns.map(c => [c.id, c.userId]));
    const campaignIds = userCampaigns.map(c => c.id);
    const candidateGroups = campaignIds.length
      ? await prisma.candidate.groupBy({
          by: ['campaignId'],
          where: { campaignId: { in: campaignIds } },
          _count: { _all: true },
        })
      : [];
    const candidateCountByUser = new Map<string, number>();
    for (const g of candidateGroups) {
      const uid = campaignToUser.get(g.campaignId);
      if (!uid) continue;
      candidateCountByUser.set(uid, (candidateCountByUser.get(uid) ?? 0) + g._count._all);
    }

    const data = users.map(u => ({
      id: u.id,
      email: u.email,
      name: u.name,
      role: u.role,
      isBlocked: u.isBlocked,
      blockedAt: u.blockedAt,
      blockedReason: u.blockedReason,
      dailyLimitOverride: u.dailyLimitOverride,
      createdAt: u.createdAt,
      lastLoginAt: u.lastLoginAt,
      campaignCount: u._count.campaigns,
      candidateCount: candidateCountByUser.get(u.id) ?? 0,
    }));

    return paginate(data, total, params);
  },

  /**
   * Deep behavior view for one user: profile, every campaign, recent activity logs
   * across all their campaigns. Used by the admin detail drawer.
   */
  async getUserBehavior(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
        lastLoginAt: true,
      },
    });
    if (!user) throw createError('User not found.', 404);

    const campaigns = await prisma.campaign.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        jobTitle: true,
        status: true,
        createdAt: true,
        _count: { select: { candidates: true, activityLogs: true } },
      },
    });

    const campaignIds = campaigns.map(c => c.id);
    const recentActivity = campaignIds.length
      ? await prisma.activityLog.findMany({
          where: { campaignId: { in: campaignIds } },
          orderBy: { timestamp: 'desc' },
          take: 50,
          select: {
            id: true,
            campaignId: true,
            type: true,
            message: true,
            candidateName: true,
            timestamp: true,
          },
        })
      : [];

    return {
      user,
      campaigns: campaigns.map(c => ({
        id: c.id,
        name: c.name,
        jobTitle: c.jobTitle,
        status: c.status,
        createdAt: c.createdAt,
        candidateCount: c._count.candidates,
        activityCount: c._count.activityLogs,
      })),
      recentActivity,
    };
  },

  /**
   * Platform-wide aggregate metrics for the admin overview cards.
   */
  async getStats() {
    const [userCount, campaignCount, candidateCount, outreachSent, activeUsers] =
      await Promise.all([
        prisma.user.count(),
        prisma.campaign.count(),
        prisma.candidate.count(),
        prisma.candidate.count({ where: { outreachStatus: { not: 'SOURCED' } } }),
        prisma.user.count({
          where: { lastLoginAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } },
        }),
      ]);

    return { userCount, campaignCount, candidateCount, outreachSent, activeUsers };
  },

  /**
   * Paginated "hot campaigns" — most candidates sourced across the platform.
   */
  async getHotCampaigns(params: PageParams) {
    const [campaigns, total] = await Promise.all([
      prisma.campaign.findMany({
        skip: params.skip,
        take: params.take,
        orderBy: { candidates: { _count: 'desc' } },
        select: {
          id: true,
          name: true,
          jobTitle: true,
          status: true,
          createdAt: true,
          user: { select: { id: true, name: true, email: true } },
          _count: { select: { candidates: true, activityLogs: true } },
        },
      }),
      prisma.campaign.count(),
    ]);
    const data = campaigns.map(c => ({
      id: c.id,
      name: c.name,
      jobTitle: c.jobTitle,
      status: c.status,
      createdAt: c.createdAt,
      candidateCount: c._count.candidates,
      activityCount: c._count.activityLogs,
      owner: c.user,
    }));
    return paginate(data, total, params);
  },

  /**
   * Paginated cross-tenant activity feed.
   */
  async getSystemActivity(params: PageParams) {
    const [events, total] = await Promise.all([
      prisma.activityLog.findMany({
        skip: params.skip,
        take: params.take,
        orderBy: { timestamp: 'desc' },
        select: {
          id: true,
          type: true,
          message: true,
          candidateName: true,
          timestamp: true,
          campaign: {
            select: {
              id: true,
              name: true,
              user: { select: { id: true, name: true, email: true } },
            },
          },
        },
      }),
      prisma.activityLog.count(),
    ]);
    const data = events.map(e => ({
      id: e.id,
      type: e.type,
      message: e.message,
      candidateName: e.candidateName,
      timestamp: e.timestamp,
      campaign: { id: e.campaign.id, name: e.campaign.name },
      owner: e.campaign.user,
    }));
    return paginate(data, total, params);
  },

  /**
   * Outreach pipeline funnel — counts at each stage, system-wide. Used to
   * visualise drop-off (sourced → enriched → outreach sent → replied).
   */
  async getPipelineFunnel() {
    const groups = await prisma.candidate.groupBy({
      by: ['outreachStatus'],
      _count: { _all: true },
    });
    const stages = ['SOURCED', 'ENRICHED', 'OUTREACH_SENT', 'OPENED', 'REPLIED', 'NO_RESPONSE'] as const;
    const counts: Record<string, number> = Object.fromEntries(stages.map(s => [s, 0]));
    for (const g of groups) counts[g.outreachStatus] = g._count._all;
    return stages.map(stage => ({ stage, count: counts[stage] ?? 0 }));
  },

  /**
   * Candidate distribution by sourcing platform — how much each channel
   * (LinkedIn / Upwork / Reddit) is contributing across the platform.
   */
  async getPlatformBreakdown() {
    const groups = await prisma.candidate.groupBy({
      by: ['platform'],
      _count: { _all: true },
    });
    const platforms = ['LinkedIn', 'Upwork', 'Reddit'] as const;
    return platforms.map(platform => ({
      platform,
      count: groups.find(g => g.platform === platform)?._count._all ?? 0,
    }));
  },

  /**
   * Match-score histogram bucketed in 0.5 increments. Lets the admin spot
   * whether the AI scoring is healthy (skewed too high → over-grading).
   */
  async getScoreDistribution() {
    const candidates = await prisma.candidate.findMany({ select: { matchScore: true } });
    const buckets: Array<{ range: string; lo: number; hi: number; count: number }> = [];
    for (let lo = 0; lo < 10; lo += 1) {
      buckets.push({ range: `${lo}.0–${lo}.4`, lo, hi: lo + 0.5, count: 0 });
      buckets.push({ range: `${lo}.5–${lo}.9`, lo: lo + 0.5, hi: lo + 1, count: 0 });
    }
    for (const c of candidates) {
      const score = c.matchScore;
      const bucket = buckets.find(b => score >= b.lo && score < b.hi);
      if (bucket) bucket.count += 1;
    }
    // Only return buckets 5.0+ — anything lower is noise
    return buckets.filter(b => b.lo >= 5);
  },

  /**
   * Most recent user signups for the admin overview ("who joined today").
   */
  async getRecentSignups(limit = 6) {
    return prisma.user.findMany({
      take: limit,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
        lastLoginAt: true,
      },
    });
  },

  /**
   * Promote/demote a user. Cannot demote the only remaining admin.
   */
  async setRole(userId: string, role: 'USER' | 'ADMIN') {
    if (role === 'USER') {
      const admins = await prisma.user.count({ where: { role: 'ADMIN' } });
      const target = await prisma.user.findUnique({ where: { id: userId }, select: { role: true } });
      if (target?.role === 'ADMIN' && admins <= 1) {
        throw createError('Cannot remove the last admin.', 400);
      }
    }
    return prisma.user.update({
      where: { id: userId },
      data: { role },
      select: { id: true, email: true, name: true, role: true },
    });
  },

  /**
   * Admin-only user creation. Mirrors the public register flow but skips the
   * "self-signup" gates: admin can set role + per-user daily-limit override at
   * creation time. Reuses bcrypt for the password.
   */
  async createUser(input: {
    name: string;
    email: string;
    password: string;
    role?: 'USER' | 'ADMIN';
    dailyLimitOverride?: number | null;
  }) {
    const existing = await prisma.user.findUnique({ where: { email: input.email } });
    if (existing) throw createError('An account with this email already exists.', 409);
    if (input.password.length < 8) {
      throw createError('Password must be at least 8 characters.', 400);
    }
    const passwordHash = await bcrypt.hash(input.password, SALT_ROUNDS);
    return prisma.user.create({
      data: {
        name: input.name,
        email: input.email,
        passwordHash,
        role: input.role ?? 'USER',
        dailyLimitOverride: input.dailyLimitOverride ?? null,
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isBlocked: true,
        dailyLimitOverride: true,
        createdAt: true,
      },
    });
  },

  /**
   * Update mutable profile fields. Password change is a separate dedicated
   * action because it requires hashing.
   */
  async updateUser(
    userId: string,
    input: { name?: string; email?: string; dailyLimitOverride?: number | null }
  ) {
    if (input.email) {
      const conflict = await prisma.user.findFirst({
        where: { email: input.email, NOT: { id: userId } },
        select: { id: true },
      });
      if (conflict) throw createError('Another account already uses this email.', 409);
    }
    return prisma.user.update({
      where: { id: userId },
      data: {
        name: input.name,
        email: input.email,
        // Explicit "set to null to clear override". `undefined` leaves it alone.
        ...(input.dailyLimitOverride !== undefined && {
          dailyLimitOverride: input.dailyLimitOverride,
        }),
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isBlocked: true,
        dailyLimitOverride: true,
      },
    });
  },

  /**
   * Admin password reset. No old-password check; this is an out-of-band action
   * for when a user has lost access. Forces a re-login by changing the hash.
   */
  async resetPassword(userId: string, newPassword: string) {
    if (newPassword.length < 8) {
      throw createError('Password must be at least 8 characters.', 400);
    }
    const passwordHash = await bcrypt.hash(newPassword, SALT_ROUNDS);
    await prisma.user.update({ where: { id: userId }, data: { passwordHash } });
    return { success: true };
  },

  /**
   * Hard delete a user. Cascade removes their campaigns + candidates + activity
   * because of the `onDelete: Cascade` relations in schema. Last-admin guard.
   */
  async deleteUser(userId: string) {
    const target = await prisma.user.findUnique({ where: { id: userId }, select: { role: true } });
    if (!target) throw createError('User not found.', 404);
    if (target.role === 'ADMIN') {
      const admins = await prisma.user.count({ where: { role: 'ADMIN' } });
      if (admins <= 1) throw createError('Cannot delete the last admin.', 400);
    }
    await prisma.user.delete({ where: { id: userId } });
    return { success: true };
  },

  /**
   * Block / unblock. A blocked user's JWT still verifies, but the authenticate
   * middleware rejects any request that bears it — so block takes effect
   * immediately on their next API call.
   */
  async setBlocked(userId: string, blocked: boolean, reason?: string) {
    const target = await prisma.user.findUnique({ where: { id: userId }, select: { role: true } });
    if (!target) throw createError('User not found.', 404);
    if (blocked && target.role === 'ADMIN') {
      const admins = await prisma.user.count({ where: { role: 'ADMIN', isBlocked: false } });
      if (admins <= 1) throw createError('Cannot block the last active admin.', 400);
    }
    return prisma.user.update({
      where: { id: userId },
      data: {
        isBlocked: blocked,
        blockedAt: blocked ? new Date() : null,
        blockedReason: blocked ? (reason ?? null) : null,
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isBlocked: true,
        blockedAt: true,
        blockedReason: true,
      },
    });
  },

  // ── Billing / subscriptions ──────────────────────────────────────────────
  /**
   * Platform-wide billing overview: active subscriptions, lifetime revenue
   * (sum of real money on purchase + subscription-invoice transactions),
   * outstanding credit liability, the subscriber/customer list, and the most
   * recent purchase transactions.
   */
  async billingOverview() {
    const [activeSubscriptions, revenueAgg, balanceAgg, subscribers, recent] = await Promise.all([
      prisma.user.count({ where: { subscriptionStatus: { in: ['active', 'trialing'] } } }),
      prisma.creditTransaction.aggregate({
        where: { type: { in: ['TOPUP_PURCHASE', 'SUBSCRIPTION_GRANT'] }, status: 'COMPLETED' },
        _sum: { amountCents: true },
        _count: true,
      }),
      prisma.user.aggregate({ _sum: { creditBalance: true } }),
      prisma.user.findMany({
        where: { OR: [{ subscriptionStatus: { not: null } }, { stripeCustomerId: { not: null } }] },
        select: {
          id: true, email: true, name: true, creditBalance: true,
          subscriptionStatus: true, subscriptionPlan: true, subscriptionCurrentPeriodEnd: true,
        },
        orderBy: [{ subscriptionStatus: 'asc' }, { subscriptionCurrentPeriodEnd: 'desc' }],
        take: 100,
      }),
      prisma.creditTransaction.findMany({
        where: { type: { in: ['TOPUP_PURCHASE', 'SUBSCRIPTION_GRANT', 'ADMIN_GRANT', 'REFUND'] } },
        orderBy: { createdAt: 'desc' },
        take: 30,
        select: {
          id: true, type: true, credits: true, amountCents: true, currency: true,
          reason: true, createdAt: true,
          user: { select: { email: true, name: true } },
        },
      }),
    ]);

    return {
      summary: {
        activeSubscriptions,
        lifetimeRevenueCents: revenueAgg._sum.amountCents ?? 0,
        paidTransactions: revenueAgg._count,
        creditsOutstanding: balanceAgg._sum.creditBalance ?? 0,
      },
      subscribers,
      recentTransactions: recent,
    };
  },

  /** Admin-granted credits (no charge). Records an ADMIN_GRANT ledger entry. */
  async grantCredits(userId: string, credits: number, note?: string) {
    const user = await prisma.user.findUnique({ where: { id: userId }, select: { id: true } });
    if (!user) throw createError('User not found.', 404);
    const balance = await creditService.addCredits({
      userId,
      credits,
      type: 'ADMIN_GRANT',
      reason: note?.trim() || 'Manual credit grant by admin',
    });
    return balance ?? (await creditService.getBalance(userId));
  },
};
