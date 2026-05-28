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
interface ApolloPersonReveal {
  id?: string;
  status?: string;
  phone_numbers?: Array<{ sanitized_number?: string; raw_number?: string }>;
}

type WebhookPayload = {
  // Apollo's real bulk-reveal envelope: { status, credits_consumed, people:[...] }
  status?: string;
  credits_consumed?: number;
  people?: ApolloPersonReveal[];
  // Legacy / alternate shapes we still accept defensively.
  id?: string;
  person?: ApolloPersonReveal;
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
      console.log('[Apollo webhook payload]', JSON.stringify(body).slice(0, 1000));

      // Normalise the payload into a list of {id, phone} updates. Apollo's
      // real shape is { people: [{id, phone_numbers:[{sanitized_number}]}] }
      // but we keep tolerant of the older single-record shapes for safety.
      const people: ApolloPersonReveal[] =
        body.people && Array.isArray(body.people) && body.people.length > 0
          ? body.people
          : body.person
            ? [body.person]
            : body.id
              ? [{ id: body.id, phone_numbers: body.phone_numbers }]
              : [];

      if (people.length === 0) {
        console.log('[Apollo webhook] ignored: no people array. Keys =', Object.keys(body));
        res.json({ ok: true, ignored: 'no people in payload', topLevelKeys: Object.keys(body) });
        return;
      }

      const results: Array<{ apolloId: string; status: string; candidateId?: string }> = [];
      for (const p of people) {
        if (!p.id) continue;
        const phone =
          p.phone_numbers?.[0]?.sanitized_number ??
          p.phone_numbers?.[0]?.raw_number ??
          undefined;
        const candidate = await candidateRepository.findByApolloId(p.id);
        if (!candidate) {
          results.push({ apolloId: p.id, status: 'no_candidate_match' });
          continue;
        }
        if (!phone) {
          // Apollo replied but had no phone on file (people[].status="failure"
          // or empty phone_numbers). Mark the candidate phone slot as
          // "enriched but empty" so the row moves out of the "Pending" state
          // and the recruiter knows Re-enrich won't help. Polling stops
          // because phoneEnriched is now true.
          await candidateRepository.updateByApolloId(p.id, {
            phoneEnriched: true,
            phone: null,
          });
          await campaignRepository.addLog(candidate.campaignId, {
            message: `Apollo confirmed no phone on file for ${candidate.name}.`,
            candidateId: candidate.id,
            candidateName: candidate.name,
            type: 'ENRICH',
          });
          results.push({ apolloId: p.id, status: 'no_phone_available', candidateId: candidate.id });
          continue;
        }
        await candidateRepository.updateByApolloId(p.id, {
          phone,
          phoneEnriched: true,
        });
        await campaignRepository.addLog(candidate.campaignId, {
          message: `Apollo phone reveal received for ${candidate.name} (${phone}).`,
          candidateId: candidate.id,
          candidateName: candidate.name,
          type: 'ENRICH',
        });
        results.push({ apolloId: p.id, status: 'updated', candidateId: candidate.id });
      }

      console.log('[Apollo webhook] processed', JSON.stringify(results));
      res.json({ ok: true, results });
    } catch (err) {
      next(err);
    }
  },
};
