import { ImapFlow } from 'imapflow';
import { env } from '../../config/env.js';
import { prisma } from '../../config/database.js';
import { decryptSecret } from '../../utils/crypto.js';

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
  // The poller runs whenever encryption is available; it discovers Gmail
  // users at poll time. Resend users have no inbox to poll.
  return !!env.ENCRYPTION_KEY;
}

/** Strip HTML / quoted-reply blocks for a clean preview. */
function cleanPreview(raw: string): string {
  let s = raw.replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&');
  s = s.replace(/^>.*$/gm, '');
  s = s.replace(/On .* wrote:[\s\S]*$/m, '');
  s = s.replace(/\s+/g, ' ').trim();
  return s.slice(0, 400);
}

/** Poll one Gmail user's inbox for replies to THEIR campaigns' candidates. */
async function pollUser(user: {
  id: string;
  emailFromAddress: string;
  gmailAppPasswordEnc: string;
}): Promise<{ scanned: number; matched: number }> {
  let pass: string;
  try {
    pass = decryptSecret(user.gmailAppPasswordEnc);
  } catch {
    return { scanned: 0, matched: 0 };
  }

  const client = new ImapFlow({
    host: env.GMAIL_IMAP_HOST,
    port: 993,
    secure: true,
    auth: { user: user.emailFromAddress, pass },
    logger: false,
  });

  // Load this user's contacted candidates ONCE into an in-memory map keyed by
  // lowercased email. Avoids a DB query per inbox message (which exhausted the
  // connection pool when inboxes had thousands of messages).
  const contacted = await prisma.candidate.findMany({
    where: {
      outreachStatus: { in: ['OUTREACH_SENT', 'OPENED', 'NO_RESPONSE'] },
      outreachSentAt: { not: null },
      email: { not: null },
      campaign: { userId: user.id },
    },
    select: { id: true, name: true, campaignId: true, outreachSentAt: true, email: true },
  });
  if (contacted.length === 0) return { scanned: 0, matched: 0 };
  const byEmail = new Map<string, (typeof contacted)[number]>();
  for (const c of contacted) {
    if (c.email) byEmail.set(c.email.toLowerCase().trim(), c);
  }

  let scanned = 0;
  let matched = 0;
  try {
    await client.connect();
    const lock = await client.getMailboxLock('INBOX');
    try {
      const since = new Date(Date.now() - LOOKBACK_DAYS * 24 * 60 * 60 * 1000);
      const uids = await client.search({ since });
      if (!uids || uids.length === 0) return { scanned: 0, matched: 0 };

      for await (const msg of client.fetch(uids, { envelope: true, internalDate: true })) {
        scanned++;
        const senderEmail = msg.envelope?.from?.[0]?.address?.toLowerCase().trim();
        if (!senderEmail) continue;

        // In-memory match — no DB hit unless this sender is a contacted candidate.
        const candidate = byEmail.get(senderEmail);
        if (!candidate) continue;

        const messageDate = msg.internalDate ?? new Date();
        if (candidate.outreachSentAt && messageDate < candidate.outreachSentAt) continue;

        let preview = '';
        try {
          const dl = await client.download(String(msg.uid), undefined, { uid: true });
          const chunks: Buffer[] = [];
          for await (const chunk of dl.content) chunks.push(chunk as Buffer);
          preview = cleanPreview(Buffer.concat(chunks).toString('utf8'));
        } catch {
          /* preview best-effort */
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
        // Stop re-matching this candidate within the same run.
        byEmail.delete(senderEmail);
        matched++;
      }
    } finally {
      lock.release();
    }
  } catch (err) {
    console.warn(`[Inbox poll] user ${user.id} failed:`, err instanceof Error ? err.message : err);
  } finally {
    try { await client.logout(); } catch { /* ignore */ }
  }
  return { scanned, matched };
}

async function pollOnce(): Promise<{ scanned: number; matched: number }> {
  if (!isConfigured()) return { scanned: 0, matched: 0 };

  // Discover every verified Gmail user and poll each one's inbox.
  const gmailUsers = await prisma.user.findMany({
    where: {
      emailProvider: 'GMAIL',
      emailVerifiedAt: { not: null },
      gmailAppPasswordEnc: { not: null },
      emailFromAddress: { not: null },
    },
    select: { id: true, emailFromAddress: true, gmailAppPasswordEnc: true },
  });

  let scanned = 0;
  let matched = 0;
  for (const u of gmailUsers) {
    if (!u.emailFromAddress || !u.gmailAppPasswordEnc) continue;
    const r = await pollUser({
      id: u.id,
      emailFromAddress: u.emailFromAddress,
      gmailAppPasswordEnc: u.gmailAppPasswordEnc,
    });
    scanned += r.scanned;
    matched += r.matched;
  }

  if (scanned > 0 || matched > 0) {
    console.log(`[Inbox poll] users=${gmailUsers.length} scanned=${scanned} matched=${matched}`);
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
    // Every run is fully guarded: .catch() ensures a rejected pollOnce can
    // NEVER become an unhandled rejection (which would crash the process on
    // Node 22). The .finally() only resets the in-flight flag.
    const runGuarded = () => {
      if (isPolling) return;
      isPolling = true;
      Promise.resolve()
        .then(() => pollOnce())
        .catch(err => console.warn('[Inbox poll] run error:', err instanceof Error ? err.message : err))
        .finally(() => { isPolling = false; });
    };
    setTimeout(runGuarded, 15_000);
    pollTimer = setInterval(runGuarded, POLL_INTERVAL_MS);
  },

  stop(): void {
    if (pollTimer) clearInterval(pollTimer);
    pollTimer = null;
  },
};
