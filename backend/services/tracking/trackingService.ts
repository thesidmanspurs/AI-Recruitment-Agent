import { candidateRepository } from '../../repositories/candidateRepository.js';
import { campaignRepository } from '../../repositories/campaignRepository.js';
import { prisma } from '../../config/database.js';
import { env } from '../../config/env.js';

/**
 * Phase 5 — outreach tracking + 48h smart alerts.
 *
 * The semantics here:
 *   - `alertTriggered` on Candidate = "we've already written an ALERT log for
 *     this no-response so the activity feed isn't spammy". It is NOT a
 *     "user has dismissed" flag.
 *   - `checkForAlerts()` returns the *current state* of alerts (all candidates
 *     past 48h with no reply, plus recent replies). It is idempotent for the
 *     UI but writes a log row on the first time a given candidate qualifies.
 */

export interface NoResponseAlert {
  id: string;
  type: 'no-response';
  candidateId: string;
  candidateName: string;
  email: string | null;
  phone: string | null;
  outreachSentAt: string;
  daysSinceOutreach: number;
  message: string;
}

export interface NewResponseAlert {
  id: string;
  type: 'new-response';
  candidateId: string;
  candidateName: string;
  message: string;
  repliedAt: string;
}

export type AlertItem = NoResponseAlert | NewResponseAlert;

const RECENT_REPLY_WINDOW_HOURS = 24 * 7; // surface replies for 7 days

export const trackingService = {
  async checkForAlerts(campaignId: string): Promise<AlertItem[]> {
    const thresholdMs = env.ALERT_THRESHOLD_HOURS * 3_600_000;
    const recentReplyCutoff = new Date(Date.now() - RECENT_REPLY_WINDOW_HOURS * 3_600_000);
    const now = Date.now();

    // ── 1. No-response alerts ────────────────────────────────────────────
    const sentNoReply = await prisma.candidate.findMany({
      where: { campaignId, outreachStatus: 'OUTREACH_SENT', outreachSentAt: { not: null } },
      orderBy: { outreachSentAt: 'asc' },
    });

    const noResponse: NoResponseAlert[] = [];
    for (const c of sentNoReply) {
      if (!c.outreachSentAt) continue;
      const hoursElapsed = (now - c.outreachSentAt.getTime()) / 3_600_000;
      if (hoursElapsed < env.ALERT_THRESHOLD_HOURS) continue;

      noResponse.push({
        id: `alert-noreply-${c.id}`,
        type: 'no-response',
        candidateId: c.id,
        candidateName: c.name,
        email: c.email,
        phone: c.phone,
        outreachSentAt: c.outreachSentAt.toISOString(),
        daysSinceOutreach: Math.floor(hoursElapsed / 24),
        message: `${c.name} hasn't replied in ${Math.floor(hoursElapsed)}h. Suggested action: ${
          c.phone ? 'phone call' : 'follow-up email'
        }.`,
      });

      // Write a one-shot ALERT log so the cross-tenant activity feed
      // surfaces this once. Subsequent calls don't re-log.
      if (!c.alertTriggered) {
        await prisma.candidate.update({
          where: { id: c.id },
          data: { alertTriggered: true, daysSinceOutreach: Math.floor(hoursElapsed / 24) },
        });
        await campaignRepository.addLog(campaignId, {
          message: `48h no-response alert triggered for ${c.name}.`,
          candidateId: c.id,
          candidateName: c.name,
          type: 'ALERT',
        });
      }
    }

    // ── 2. New-response alerts ───────────────────────────────────────────
    const recentReplies = await prisma.candidate.findMany({
      where: {
        campaignId,
        outreachStatus: 'REPLIED',
        updatedAt: { gte: recentReplyCutoff },
      },
      orderBy: { updatedAt: 'desc' },
    });

    const newResponse: NewResponseAlert[] = recentReplies.map(c => ({
      id: `alert-reply-${c.id}`,
      type: 'new-response',
      candidateId: c.id,
      candidateName: c.name,
      repliedAt: c.updatedAt.toISOString(),
      message: `${c.name} replied to outreach.`,
    }));

    // Replies first (they're more actionable), then no-response by oldest first.
    return [...newResponse, ...noResponse];
  },

  startAlertScheduler(): NodeJS.Timeout {
    console.log('[Tracking] 48h alert scheduler started (runs hourly)');
    return setInterval(
      async () => {
        // Background sweep so ALERT log rows get created even if no user
        // has opened the dashboard. We re-use checkForAlerts which has the
        // single-source-of-truth logic.
        try {
          const campaigns = await prisma.campaign.findMany({
            where: { status: { in: ['RUNNING', 'PAUSED'] } },
            select: { id: true },
          });
          for (const c of campaigns) await trackingService.checkForAlerts(c.id);
        } catch (err) {
          console.warn('[Tracking] hourly sweep error:', err);
        }
      },
      60 * 60 * 1_000
    );
  },
};

// Silence the now-unused import (candidateRepository) — kept for symmetry with
// other services that pair repo + service in the same module.
void candidateRepository;
