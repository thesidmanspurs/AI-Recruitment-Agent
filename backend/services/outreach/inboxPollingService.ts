import { ImapFlow } from 'imapflow';
import { env } from '../../config/env.js';
import { prisma } from '../../config/database.js';

/**
 * Inbox polling — connects to Gmail via IMAP using the existing SMTP
 * credentials (Google App Password works for both SMTP and IMAP) and
 * scans recent inbox messages for replies to our outreaches.
 *
 * Match strategy (most specific first):
 *   1. From-address match: any sender email that exactly matches a
 *      candidate's `email` field on a campaign in OUTREACH_SENT status.
 *   2. (Later) In-Reply-To header match if we ever store the Message-Id
 *      of sent outreaches. Not required for v1 since the from-address
 *      strategy is already reliable for direct replies.
 *
 * When a match is found:
 *   - Candidate.outreachStatus → REPLIED
 *   - Candidate.repliedAt → message date
 *   - Candidate.replyPreview → first 400 chars of body
 *   - ActivityLog gets a REPLY entry
 *
 * Runtime: this module exports `startInboxPoller()` which spawns a
 * setInterval that runs every POLL_INTERVAL_MS. Pause is automatic
 * while Cloud Run scales the instance to zero — when traffic resumes,
 * the poller resumes too. For guaranteed every-5-min cadence, bump
 * Cloud Run --min-instances=1 (adds ~$8/mo).
 *
 * Auth: re-uses SMTP_USER + SMTP_PASS (Gmail App Password) — no new
 * credentials. SMTP_HOST is replaced with imap.gmail.com for IMAP.
 */
const POLL_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes
const LOOKBACK_DAYS = 14; // only scan inbox messages from the last 14 days

function isConfigured(): boolean {
  const real = (v: string) => !!v && v !== 'PLACEHOLDER';
  return real(env.SMTP_USER) && real(env.SMTP_PASS);
}

/** Strip HTML / quoted-reply blocks for a clean preview. */
function cleanPreview(raw: string): string {
  let s = raw.replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&');
  s = s.replace(/^>.*$/gm, '');
  s = s.replace(/On .* wrote:[\s\S]*$/m, '');
  s = s.replace(/\s+/g, ' ').trim();
  return s.slice(0, 400);
}

async function pollOnce(): Promise<{ scanned: number; matched: number }> {
  if (!isConfigured()) return { scanned: 0, matched: 0 };

  const client = new ImapFlow({
    host: 'imap.gmail.com',
    port: 993,
    secure: true,
    auth: { user: env.SMTP_USER, pass: env.SMTP_PASS },
    logger: false,
  });

  let scanned = 0;
  let matched = 0;

  try {
    await client.connect();
    const lock = await client.getMailboxLock('INBOX');
    try {
      const since = new Date(Date.now() - LOOKBACK_DAYS * 24 * 60 * 60 * 1000);
      const uids = await client.search({ since });
      if (!uids || uids.length === 0) return { scanned: 0, matched: 0 };

      // Fetch only envelopes (headers) first — cheap. Bodies pulled
      // on a per-match basis below.
      for await (const msg of client.fetch(uids, { envelope: true, internalDate: true })) {
        scanned++;
        const fromList = msg.envelope?.from ?? [];
        if (fromList.length === 0) continue;
        const senderEmail = fromList[0]?.address?.toLowerCase().trim();
        if (!senderEmail) continue;

        // Look for a candidate whose email matches and who's already been
        // contacted. Restricted to OUTREACH_SENT / OPENED / NO_RESPONSE so
        // we don't flip already-REPLIED rows back and forth.
        const candidate = await prisma.candidate.findFirst({
          where: {
            email: { equals: senderEmail, mode: 'insensitive' },
            outreachStatus: { in: ['OUTREACH_SENT', 'OPENED', 'NO_RESPONSE'] },
            outreachSentAt: { not: null },
          },
          select: { id: true, name: true, campaignId: true, outreachSentAt: true },
        });
        if (!candidate) continue;

        // Skip if the message arrived before we sent the outreach — it's
        // an older email from the same person, not a reply.
        const messageDate = msg.internalDate ?? new Date();
        if (candidate.outreachSentAt && messageDate < candidate.outreachSentAt) continue;

        // Pull the body for the preview. Prefer text/plain; fall back to
        // a stripped HTML version.
        let preview = '';
        try {
          const dl = await client.download(String(msg.uid), undefined, { uid: true });
          const stream = dl.content;
          const chunks: Buffer[] = [];
          for await (const chunk of stream) chunks.push(chunk as Buffer);
          preview = cleanPreview(Buffer.concat(chunks).toString('utf8'));
        } catch {
          /* preview is best-effort */
        }

        await prisma.candidate.update({
          where: { id: candidate.id },
          data: {
            outreachStatus: 'REPLIED',
            repliedAt: messageDate,
            replyPreview: preview || null,
            alertTriggered: false,
          },
        });
        await prisma.activityLog.create({
          data: {
            campaignId: candidate.campaignId,
            candidateId: candidate.id,
            candidateName: candidate.name,
            type: 'REPLY',
            message: `Reply detected from ${candidate.name} (${senderEmail}).`,
          },
        });
        matched++;
      }
    } finally {
      lock.release();
    }
  } catch (err) {
    console.warn('[Inbox poll] failed:', err instanceof Error ? err.message : err);
  } finally {
    try { await client.logout(); } catch { /* ignore */ }
  }

  if (scanned > 0 || matched > 0) {
    console.log(`[Inbox poll] scanned=${scanned} matched=${matched}`);
  }
  return { scanned, matched };
}

let pollTimer: NodeJS.Timeout | null = null;
let isPolling = false;

export const inboxPollingService = {
  isAvailable: isConfigured,
  pollOnce,

  start(): void {
    if (pollTimer || !isConfigured()) return;
    console.log('[Inbox poll] starting (every 5 min)');
    // Fire once shortly after start so the first poll runs without
    // waiting the full interval.
    setTimeout(() => {
      if (!isPolling) {
        isPolling = true;
        pollOnce().finally(() => { isPolling = false; });
      }
    }, 15_000);
    pollTimer = setInterval(() => {
      if (isPolling) return; // skip if previous run still in flight
      isPolling = true;
      pollOnce().finally(() => { isPolling = false; });
    }, POLL_INTERVAL_MS);
  },

  stop(): void {
    if (pollTimer) clearInterval(pollTimer);
    pollTimer = null;
  },
};
