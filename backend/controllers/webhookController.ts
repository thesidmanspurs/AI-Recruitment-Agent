import type { Request, Response, NextFunction } from 'express';
import { env } from '../config/env.js';
import { candidateRepository } from '../repositories/candidateRepository.js';
import { campaignRepository } from '../repositories/campaignRepository.js';

/**
 * Apollo phone-reveal webhook.
 *
 * Apollo Basic delivers revealed phone numbers asynchronously: the original
 * `people/match` call returns immediately with `phone_numbers: []`, then
 * Apollo POSTs the phone to `webhook_url` once their backend has it (anywhere
 * from seconds to hours later).
 *
 * Auth: query-string token. We pass `?secret=<APOLLO_WEBHOOK_SECRET>` when
 * registering the webhook with Apollo. Anything without that secret is
 * rejected as 401. Apollo Basic does not sign payloads, so this is the only
 * available guard short of IP-allowlisting (which Apollo can't guarantee).
 *
 * Payload shape (Apollo docs are sparse; this is defensive parsing):
 *   { id: "5f...", phone_numbers: [{ sanitized_number, raw_number }, ...] }
 *   — or sometimes the full person object under `person: {...}`.
 *
 * We always look up the Candidate row by Apollo `id` (stored at enrichment
 * time), so the webhook never trusts any other identifying data.
 */
type WebhookPayload = {
  id?: string;
  person?: { id?: string; phone_numbers?: Array<{ sanitized_number?: string; raw_number?: string }> };
  phone_numbers?: Array<{ sanitized_number?: string; raw_number?: string }>;
  phone?: string;
};

export const webhookController = {
  async apolloPhoneReveal(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const tokenIn = String(req.query.secret ?? req.headers['x-apollo-webhook-secret'] ?? '');
      if (!env.APOLLO_WEBHOOK_SECRET || tokenIn !== env.APOLLO_WEBHOOK_SECRET) {
        res.status(401).json({ error: 'invalid webhook token' });
        return;
      }

      const body: WebhookPayload = req.body ?? {};
      // DIAGNOSTIC: log every payload Apollo sends so we can see what
      // fields they're actually using. Strip after the format is known.
      console.log('[Apollo webhook payload]', JSON.stringify(body).slice(0, 1000));

      const apolloId = body.id ?? body.person?.id;
      const phones = body.person?.phone_numbers ?? body.phone_numbers ?? [];
      const phone =
        phones[0]?.sanitized_number ??
        phones[0]?.raw_number ??
        body.phone ??
        undefined;

      if (!apolloId) {
        console.log('[Apollo webhook] ignored: no apollo id. Top-level keys =', Object.keys(body));
        res.json({ ok: true, ignored: 'no apollo id in payload', topLevelKeys: Object.keys(body) });
        return;
      }
      if (!phone) {
        console.log('[Apollo webhook] ignored: no phone for', apolloId, 'phones arr =', JSON.stringify(phones));
        res.json({ ok: true, ignored: 'no phone in payload', apolloId });
        return;
      }

      const candidate = await candidateRepository.findByApolloId(apolloId);
      if (!candidate) {
        // Apollo may push a reveal for a record we no longer track (campaign
        // wiped, candidate deleted). Ack so Apollo stops retrying.
        res.json({ ok: true, ignored: 'no candidate for apollo id', apolloId });
        return;
      }

      await candidateRepository.updateByApolloId(apolloId, {
        phone,
        phoneEnriched: true,
      });

      await campaignRepository.addLog(candidate.campaignId, {
        message: `Apollo phone reveal received for ${candidate.name} (${phone}).`,
        candidateId: candidate.id,
        candidateName: candidate.name,
        type: 'ENRICH',
      });

      res.json({ ok: true, candidateId: candidate.id });
    } catch (err) {
      next(err);
    }
  },
};
