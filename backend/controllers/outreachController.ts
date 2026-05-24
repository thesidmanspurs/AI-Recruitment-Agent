import type { Request, Response, NextFunction } from 'express';
import { apolloService, ApolloError } from '../services/apollo/apolloService.js';
import { geminiService } from '../services/ai/geminiService.js';
import { emailService } from '../services/outreach/emailService.js';
import { formatGeminiError } from '../services/ai/geminiErrors.js';
import { trackingService } from '../services/tracking/trackingService.js';
import { usageService } from '../services/usage/usageService.js';
import { campaignRepository } from '../repositories/campaignRepository.js';
import { candidateRepository } from '../repositories/candidateRepository.js';
import { createError } from '../middleware/errorHandler.js';

export const outreachController = {
  // POST /api/campaigns/:campaignId/outreach/enrich/:candidateId
  // Phase 4 — calls Apollo People Match and persists the contact fields
  // back onto the candidate row. Gracefully falls back when the Apollo plan
  // lacks API access (free tier returns 403).
  async enrichCandidate(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { campaignId, candidateId } = req.params;
      const campaign = await campaignRepository.findById(campaignId, req.user!.id);
      if (!campaign) return next(createError('Campaign not found.', 404));

      const candidate = await candidateRepository.findById(candidateId, campaignId);
      if (!candidate) return next(createError('Candidate not found.', 404));

      // Credit minimization: if the candidate already has the contact data
      // we would otherwise spend a credit to fetch, return the cached row
      // without calling Apollo. The user can force-refresh by sending
      // `?force=1` on the URL (used by the "Re-enrich" button only when the
      // recruiter explicitly opts in).
      const force = req.query.force === '1' || req.query.force === 'true';
      const hasUsableData = !!candidate.email; // email is the field that costs a credit
      if (hasUsableData && !force) {
        res.json({
          success: true,
          candidate,
          result: {
            found: true,
            email: candidate.email,
            phone: candidate.phone,
            location: candidate.location,
          },
          isSimulated: false,
          fromCache: true, // tells the UI not to deduct from credit balance
        });
        return;
      }

      let result;
      let isSimulated = false;
      let simulationReason: string | undefined;

      if (apolloService.isAvailable()) {
        try {
          result = await apolloService.enrichContact({
            candidateId: candidate.id,
            name: candidate.name,
            company: candidate.company,
            linkedinUrl: candidate.linkedinUrl ?? undefined,
          });
        } catch (err) {
          // 401/403/429 → fall back to a deterministic mock so the demo path
          // continues. Surface the reason so the UI can show why.
          isSimulated = true;
          simulationReason =
            err instanceof ApolloError
              ? `Apollo ${err.status}: ${err.message}`
              : err instanceof Error
                ? err.message
                : 'Apollo call failed.';
          result = mockEnrichment(candidate.name, candidate.company);
          console.warn('[Apollo] enrichContact failed, using fallback:', simulationReason);
        }
      } else {
        isSimulated = true;
        simulationReason = 'APOLLO_API_KEY not configured on the server.';
        result = mockEnrichment(candidate.name, candidate.company);
      }

      // Persist what we got — but never *clear* existing contact data.
      // Apollo's free tier returns 200 with empty email/phone (the redacted
      // signature). Without this guard a re-enrich would wipe whatever the
      // candidate already had (e.g. mock data from a previous enrich, or a
      // manually-pasted email).
      const updated = await candidateRepository.update(candidate.id, {
        email: result.email ?? candidate.email ?? null,
        phone: result.phone ?? candidate.phone ?? null,
        location: result.location ?? candidate.location ?? null,
        emailEnriched: !!result.email || candidate.emailEnriched,
        phoneEnriched: !!result.phone || candidate.phoneEnriched,
        outreachStatus: 'ENRICHED',
      });

      await campaignRepository.addLog(campaignId, {
        message: result.found
          ? `Enriched ${candidate.name}${result.email ? ` (${result.email})` : ''}${
              isSimulated ? ' (simulation)' : ''
            }`
          : `No contact info found for ${candidate.name}${isSimulated ? ' (simulation)' : ''}`,
        candidateId: candidate.id,
        candidateName: candidate.name,
        type: 'ENRICH',
      });

      res.json({
        success: true,
        candidate: updated,
        result,
        isSimulated,
        simulationReason,
        fromCache: false,
      });
    } catch (err) {
      next(err);
    }
  },

  // POST /api/campaigns/:campaignId/outreach/send/:candidateId
  // body: { subject?, body?, channel? }  — if subject/body omitted, generates fresh.
  async sendOutreach(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { campaignId, candidateId } = req.params;
      const userId = req.user!.id;
      const {
        subject: subjectOverride,
        body: bodyOverride,
        channel,
      } = req.body as { subject?: string; body?: string; channel?: 'EMAIL' | 'LINKEDIN_DM' | 'PLATFORM_MESSAGE' };

      const campaign = await campaignRepository.findById(campaignId, userId);
      if (!campaign) return next(createError('Campaign not found.', 404));
      const candidate = await candidateRepository.findById(candidateId, campaignId);
      if (!candidate) return next(createError('Candidate not found.', 404));

      // Charge a usage credit for outreach (Gemini-generated message + send).
      // If the user provided an override message, we still charge — the cost
      // is the *send + tracking*, not just the generation.
      await usageService.assertWithinLimit(userId);

      // Generate message if recruiter didn't supply one
      let subject = subjectOverride?.trim();
      let body = bodyOverride?.trim();
      let messageSimulated = false;
      let messageSimReason: string | undefined;
      if (!subject || !body) {
        const drafted = await draftMessage(campaign, candidate, req.user!.name);
        subject = drafted.subject;
        body = drafted.body;
        messageSimulated = drafted.isSimulated;
        messageSimReason = drafted.simulationReason;
      }

      // Decide channel: email if we have an enriched email, otherwise LinkedIn DM
      const useChannel =
        channel ?? (candidate.email ? 'EMAIL' : 'LINKEDIN_DM');

      let sendSimulated = false;
      let sendReason: string | undefined;

      if (useChannel === 'EMAIL') {
        if (!candidate.email) {
          return next(createError('Candidate has no email yet — enrich first or pick a different channel.', 400));
        }
        try {
          const r = await emailService.sendEmail({ to: candidate.email, subject, body });
          sendSimulated = r.simulated;
          if (r.simulated) sendReason = 'SMTP not configured — outreach logged but not actually delivered.';
        } catch (err) {
          // We don't fall back to mock here; an SMTP error is a real failure
          // the recruiter should see and retry. Return 502.
          return next(createError(`Email send failed: ${err instanceof Error ? err.message : String(err)}`, 502));
        }
      } else {
        // LinkedIn DM / platform message — no real connector yet, simulate.
        sendSimulated = true;
        sendReason = `${useChannel} dispatch is simulated (no integration configured).`;
      }

      const updated = await candidateRepository.update(candidate.id, {
        outreachMessage: `${subject}\n\n${body}`,
        outreachChannel: useChannel,
        outreachStatus: 'OUTREACH_SENT',
        outreachSentAt: new Date(),
        daysSinceOutreach: 0,
        alertTriggered: false,
      });

      await campaignRepository.addLog(campaignId, {
        message: `Outreach sent to ${candidate.name} via ${useChannel}${
          sendSimulated || messageSimulated ? ' (simulation)' : ''
        }: "${subject.slice(0, 80)}"`,
        candidateId: candidate.id,
        candidateName: candidate.name,
        type: 'OUTREACH',
      });

      await usageService.record(userId);
      const usage = await usageService.snapshot(userId);

      res.json({
        success: true,
        candidate: updated,
        subject,
        body,
        channel: useChannel,
        isSimulated: messageSimulated || sendSimulated,
        simulationReason: messageSimReason ?? sendReason,
        usage,
      });
    } catch (err) {
      next(err);
    }
  },

  // POST /api/campaigns/:campaignId/outreach/mark-replied/:candidateId
  // Manual reply confirmation (we don't have IMAP polling yet — this is the
  // demo workaround so Phase 5's REPLIED state actually gets reached).
  async markReplied(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { campaignId, candidateId } = req.params;
      const campaign = await campaignRepository.findById(campaignId, req.user!.id);
      if (!campaign) return next(createError('Campaign not found.', 404));
      const candidate = await candidateRepository.findById(candidateId, campaignId);
      if (!candidate) return next(createError('Candidate not found.', 404));
      if (candidate.outreachStatus === 'SOURCED' || candidate.outreachStatus === 'ENRICHED') {
        return next(createError('No outreach has been sent to this candidate.', 400));
      }

      const updated = await candidateRepository.update(candidate.id, {
        outreachStatus: 'REPLIED',
        alertTriggered: false,
      });

      await campaignRepository.addLog(campaignId, {
        message: `${candidate.name} replied to outreach.`,
        candidateId: candidate.id,
        candidateName: candidate.name,
        type: 'REPLY',
      });

      res.json({ success: true, candidate: updated });
    } catch (err) {
      next(err);
    }
  },

  // POST /api/campaigns/:campaignId/outreach/generate-message
  // Returns a fresh AI-drafted message without persisting it — used for the
  // "preview & edit" flow on the frontend before the recruiter clicks Send.
  async generateMessage(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { campaignId } = req.params;
      const { candidateId } = req.body as { candidateId?: string };
      if (!candidateId) return next(createError('candidateId is required.', 400));

      const campaign = await campaignRepository.findById(campaignId, req.user!.id);
      if (!campaign) return next(createError('Campaign not found.', 404));
      const candidate = await candidateRepository.findById(candidateId, campaignId);
      if (!candidate) return next(createError('Candidate not found.', 404));

      const { subject, body, isSimulated, simulationReason } = await draftMessage(campaign, candidate, req.user!.name);
      res.json({ success: true, subject, body, isSimulated, simulationReason });
    } catch (err) {
      next(err);
    }
  },

  // GET /api/campaigns/:campaignId/outreach/alerts
  async getAlerts(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { campaignId } = req.params;
      const campaign = await campaignRepository.findById(campaignId, req.user!.id);
      if (!campaign) return next(createError('Campaign not found.', 404));

      const alerts = await trackingService.checkForAlerts(campaignId);
      res.json({ success: true, data: alerts });
    } catch (err) {
      next(err);
    }
  },

  // ── (helper below in this module) ──

  // GET /api/campaigns/:campaignId/outreach/activity
  async getActivityLog(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { campaignId } = req.params;
      const campaign = await campaignRepository.findById(campaignId, req.user!.id);
      if (!campaign) return next(createError('Campaign not found.', 404));

      const limit = parseInt(req.query.limit as string) || 50;
      const logs = await campaignRepository.getRecentLogs(campaignId, limit);
      res.json({ success: true, data: logs });
    } catch (err) {
      next(err);
    }
  },
};

/**
 * Generate an outreach message via Gemini, falling back to a deterministic
 * template if Gemini is unavailable (no key / 429 / 404). The fallback is
 * good enough for the demo path; recruiters will edit before sending anyway.
 */
async function draftMessage(
  campaign: { jobTitle: string; extractedKeywords: string[] },
  candidate: { name: string; currentTitle: string; company: string; strengths: string[] },
  recruiterName: string
): Promise<{ subject: string; body: string; isSimulated: boolean; simulationReason?: string }> {
  if (geminiService.isAvailable()) {
    try {
      const msg = await geminiService.generateOutreachMessage({
        candidateName: candidate.name,
        candidateTitle: candidate.currentTitle,
        candidateCompany: candidate.company,
        candidateStrengths: candidate.strengths,
        jobTitle: campaign.jobTitle,
        jobKeywords: campaign.extractedKeywords,
        recruiterName,
      });
      return { ...msg, isSimulated: false };
    } catch (err) {
      console.warn('[Gemini] generateOutreachMessage failed:', err);
      return { ...templateMessage(campaign, candidate, recruiterName), isSimulated: true, simulationReason: formatGeminiError(err) };
    }
  }
  return {
    ...templateMessage(campaign, candidate, recruiterName),
    isSimulated: true,
    simulationReason: 'GEMINI_API_KEY not configured on the server.',
  };
}

function templateMessage(
  campaign: { jobTitle: string; extractedKeywords: string[] },
  candidate: { name: string; currentTitle: string; company: string; strengths: string[] },
  recruiterName: string
): { subject: string; body: string } {
  const firstName = candidate.name.split(' ')[0];
  const topStrength = candidate.strengths[0] ?? 'your background';
  const topKeyword = campaign.extractedKeywords[0] ?? 'this stack';
  return {
    subject: `${campaign.jobTitle} — quick chat?`,
    body:
      `Hi ${firstName},\n\n` +
      `I came across your ${candidate.currentTitle} work at ${candidate.company} — ` +
      `${topStrength} stood out, especially given how central ${topKeyword} is to the ${campaign.jobTitle} role we're hiring for.\n\n` +
      `Would you be open to a 15-minute chat next week to compare notes?\n\n` +
      `Best,\n${recruiterName}`,
  };
}

/**
 * Deterministic mock enrichment used when Apollo is unavailable (no key,
 * 403 plan-locked, network error). Generates a plausible-looking email so
 * the demo path stays meaningful and downstream Phase 5 has something to
 * outreach to. Phone is omitted because mocking that has no real value.
 */
function mockEnrichment(name: string, company: string) {
  const slug = (s: string) =>
    s
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '')
      .slice(0, 40);
  const localPart = slug(name).replace(/\s+/g, '.') || 'contact';
  const domain = (slug(company) || 'example') + '.com';
  return {
    found: true,
    email: `${localPart}@${domain}`,
    phone: undefined as string | undefined,
    location: undefined as string | undefined,
  };
}
