import type { Request, Response, NextFunction } from 'express';
import { apolloSourcingService } from '../services/apollo/apolloSourcingService.js';
import { apolloService, ApolloError } from '../services/apollo/apolloService.js';
import { campaignRepository } from '../repositories/campaignRepository.js';
import { candidateRepository } from '../repositories/candidateRepository.js';
import { screenProfiles } from '../services/screening/screeningService.js';
import { usageService } from '../services/usage/usageService.js';
import { createError } from '../middleware/errorHandler.js';

export const candidateController = {
  // POST /api/campaigns/:campaignId/candidates/source
  async sourceCandidates(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { campaignId } = req.params;
      const userId = req.user!.id;

      const campaign = await campaignRepository.findById(campaignId, userId);
      if (!campaign) return next(createError('Campaign not found.', 404));

      // Daily-usage gate: throws 429 if the user is at their cap for today.
      // Each sourcing action costs 1 credit regardless of fallback, because
      // the user's intent (and our platform work) is the same either way.
      await usageService.assertWithinLimit(userId);

      // STRICT POLICY: real people only.
      // Sourcing uses Apollo People Search exclusively. No AI-invented
      // candidates, no fixture rows — if Apollo can't deliver, the call
      // fails loudly with a 503 and zero rows persisted.
      if (!apolloSourcingService.isAvailable()) {
        return next(
          createError(
            'Sourcing is unavailable: APOLLO_PEOPLE_SEARCH_KEY is not configured on the server. ' +
              'Sourcing requires a real candidate source — synthetic profiles are not allowed.',
            503
          )
        );
      }

      // Parse pagination params from query string (or body for flexibility).
      // Defaults: page=1, pageSize=25.
      // If page not provided, auto-advance: existing count / pageSize + 1
      // → each "Source candidates" click moves to the next Apollo page.
      const pageParam = (req.query.page ?? req.body?.page) as string | number | undefined;
      const pageSizeParam = (req.query.pageSize ?? req.body?.pageSize) as string | number | undefined;
      const pageSize = Math.min(50, Math.max(1, Number(pageSizeParam) || 25));
      let page = Number(pageParam);
      if (!Number.isFinite(page) || page < 1) {
        const existingCount = (await candidateRepository.findAllByCampaign(campaignId)).length;
        page = Math.floor(existingCount / pageSize) + 1;
      }

      // Step 1: Apollo Search — get IDs + first_name + obfuscated last_name
      let searchResult;
      try {
        searchResult = await apolloSourcingService.searchRaw({
          title: campaign.jobTitle,
          alternateTitles: campaign.alternateTitles,
          extractedKeywords: campaign.extractedKeywords,
          preferredPlatforms: campaign.preferredPlatforms,
          limit: pageSize,
          page,
        });
      } catch (err) {
        const reason =
          err instanceof ApolloError
            ? `Apollo Search ${err.status}: ${err.message}`
            : err instanceof Error
              ? err.message
              : 'Apollo Search call failed.';
        return next(createError(`Sourcing failed: ${reason}`, 502));
      }

      const searchHits = searchResult.hits;
      if (searchHits.length === 0) {
        return next(
          createError(
            'Apollo Search returned no matches for this job spec. Try broader keywords or a less specific title.',
            404
          )
        );
      }

      // Step 2: chain Match-by-id for each hit — the unlock on Basic.
      // Search alone gives us first_name + obfuscated last_name + id; Match
      // by id returns the FULL verified record. 1 Apollo credit per match.
      // Run in parallel with concurrency cap to respect rate limits.
      const enrichments = await Promise.all(
        searchHits.map(h =>
          apolloService
            .enrichById(h.id)
            .catch(err => {
              console.warn(`[Apollo] match-by-id failed for ${h.id}:`, err instanceof Error ? err.message : err);
              return { found: false } as Awaited<ReturnType<typeof apolloService.enrichById>>;
            })
        )
      );

      // Pair each Match result with its Search source so we can fall back
      // to Search-only data (first_name, organization) when Match returns
      // nothing — still a real person, just unenriched.
      type EnrichmentRow = (typeof enrichments)[number];
      const paired: Array<{ search: typeof searchHits[number]; match: EnrichmentRow }> =
        searchHits.map((s, i) => ({ search: s, match: enrichments[i] }));

      const enrichmentByName = new Map<string, EnrichmentRow>();
      const rawProfiles = paired
        .map(({ search, match }) => {
          const name = match.found && match.name
            ? match.name
            : `${search.first_name ?? ''}${search.last_name_obfuscated ? ' ' + search.last_name_obfuscated : ''}`.trim();
          if (!name) return null;
          enrichmentByName.set(name.toLowerCase(), match);
          return {
            name,
            currentTitle: match.title ?? search.title ?? 'Unknown',
            company: match.company ?? search.organization?.name ?? 'Independent',
            bio: `${match.title ?? search.title ?? ''}${match.company ? ' at ' + match.company : ''}`.trim() ||
              'Apollo-verified candidate.',
            openToWork: false,
            platform: 'LinkedIn' as const,
            matchScore: match.email ? 9.5 : (match.found ? 8.5 : 7.0),
            matchExplanation: match.email
              ? `Apollo Match verified email on file (${match.email}).`
              : match.found
                ? 'Apollo Match resolved profile, email not revealed on this tier.'
                : 'Apollo Search hit; Match could not resolve full record.',
            skills: [],
            strengths: [
              match.email ? 'Verified email on file' : '',
              match.location ? `Based in ${match.location}` : '',
              match.linkedinUrl ? 'LinkedIn profile linked' : '',
            ].filter(Boolean),
            gaps: match.email ? [] : ['Email reveal needed (Apollo plan-gated)'],
          };
        })
        .filter((p): p is NonNullable<typeof p> => p !== null);

      if (rawProfiles.length === 0) {
        return next(
          createError(
            'Apollo Search returned candidates but Match could not resolve any of them. ' +
              'Often a transient Apollo issue — try again in a moment.',
            502
          )
        );
      }

      // Phase 3 — algorithmic screening (dedupe, validate, threshold split)
      const screening = screenProfiles(rawProfiles);

      // Cross-batch dedupe: drop anyone whose name already exists in this
      // campaign. Without this, re-sourcing on the fallback path (or even
      // Gemini occasionally repeating a real name) accumulates duplicates.
      const existing = await candidateRepository.existingNames(campaignId);
      const fresh = screening.persisted.filter(
        p => !existing.has(p.name.trim().toLowerCase())
      );
      const skippedExisting = screening.persisted.length - fresh.length;

      // Persist the screened-and-deduped list (above + below threshold both
      // saved so the user can audit who got screened out and why).
      const candidates = await candidateRepository.createMany(
        fresh.map(p => ({ ...p, campaignId }))
      );

      // Attach Match-by-id enrichment to each freshly-persisted candidate —
      // since Match already ran during sourcing, the rows land in the UI
      // already ENRICHED (email + linkedin + location filled in). Saves the
      // recruiter a click and a credit.
      for (const c of candidates) {
        const snap = enrichmentByName.get(c.name.toLowerCase());
        if (!snap || !snap.found) continue;
        await candidateRepository.update(c.id, {
          email: snap.email ?? null,
          phone: snap.phone ?? null,
          location: snap.location ?? null,
          linkedinUrl: snap.linkedinUrl ?? null,
          emailEnriched: !!snap.email,
          phoneEnriched: !!snap.phone,
          outreachStatus: 'ENRICHED',
        });
      }
      // Re-read so the response reflects the enriched fields
      const enrichedCandidates = await candidateRepository.findAllByCampaign(campaignId);

      await campaignRepository.addLog(campaignId, {
        message:
          `Sourced ${screening.summary.total}, ${screening.summary.approved} approved ` +
          `(≥${screening.summary.threshold}), ${screening.summary.belowThreshold} below threshold, ` +
          `${screening.summary.duplicatesMerged} duplicate(s) merged in-batch` +
          (skippedExisting > 0
            ? `, ${skippedExisting} already on the campaign (skipped).`
            : '.'),
        type: 'INFO',
      });

      // Advance campaign status to RUNNING
      await campaignRepository.update(campaignId, userId, { status: 'RUNNING' });

      // Charge one credit for this action and return the fresh snapshot
      // so the UI can update its "X/Y used today" chip without an extra fetch.
      await usageService.record(userId);
      const usage = await usageService.snapshot(userId);

      res.json({
        success: true,
        candidates: enrichedCandidates,
        approvedCount: enrichedCandidates.filter(c => c.matchScore >= screening.summary.threshold).length,
        screening: { ...screening.summary, skippedExisting },
        isSimulated: false,
        simulationReason: undefined,
        source: 'apollo',
        usage,
        pagination: {
          page: searchResult.page,
          pageSize: searchResult.perPage,
          totalEntries: searchResult.totalEntries,
          totalPages: searchResult.totalPages,
          hasMore: searchResult.page < searchResult.totalPages,
          // Heads-up for the UI on what the next click will cost
          nextPageCreditEstimate: searchResult.page < searchResult.totalPages
            ? Math.min(
                searchResult.perPage,
                searchResult.totalEntries - searchResult.page * searchResult.perPage
              )
            : 0,
        },
      });
    } catch (err) {
      next(err);
    }
  },

  // DELETE /api/campaigns/:campaignId/candidates
  // Wipe every candidate row on this campaign so the user can re-source from
  // scratch. Cascade-deletes their activity log rows via Prisma onDelete.
  // POST /api/campaigns/:campaignId/candidates/from-linkedin
  // body: { linkedinUrls: string[] }
  // For each URL, hit Apollo Match (linkedin_url) — returns real verified
  // record (name, title, company, email). Persists as a fresh candidate.
  // Costs 1 Apollo credit per URL that returns a match.
  async addFromLinkedIn(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { campaignId } = req.params;
      const userId = req.user!.id;
      const { linkedinUrls } = req.body as { linkedinUrls?: string[] };
      if (!Array.isArray(linkedinUrls) || linkedinUrls.length === 0) {
        return next(createError('linkedinUrls (string[]) is required.', 400));
      }
      const urls = linkedinUrls
        .map(u => (u ?? '').trim())
        .filter(u => /linkedin\.com\/in\//.test(u));
      if (urls.length === 0) {
        return next(createError('No valid LinkedIn profile URLs in the request.', 400));
      }

      const campaign = await campaignRepository.findById(campaignId, userId);
      if (!campaign) return next(createError('Campaign not found.', 404));

      // Charge one credit per URL up front against the daily usage cap.
      // (Apollo credits are separate, but our internal cap is per-action.)
      await usageService.assertWithinLimit(userId);

      if (!apolloService.isAvailable()) {
        return next(createError('Apollo is not configured on the server.', 503));
      }

      // Skip URLs that already map to a candidate on this campaign.
      const existingByLinkedIn = new Set(
        (
          await candidateRepository.findAllByCampaign(campaignId)
        )
          .map(c => (c.linkedinUrl ?? '').toLowerCase())
          .filter(Boolean)
      );

      const added: Awaited<ReturnType<typeof candidateRepository.findById>>[] = [];
      const skipped: Array<{ url: string; reason: string }> = [];

      for (const url of urls) {
        if (existingByLinkedIn.has(url.toLowerCase())) {
          skipped.push({ url, reason: 'Already on this campaign.' });
          continue;
        }
        let result;
        try {
          result = await apolloService.enrichByLinkedInUrl(url);
        } catch (err) {
          skipped.push({
            url,
            reason: err instanceof ApolloError ? `Apollo ${err.status}: ${err.message}` : String(err),
          });
          continue;
        }
        if (!result.found || !result.name) {
          skipped.push({ url, reason: 'Apollo found no match for that URL.' });
          continue;
        }

        // Persist the real Apollo record as a candidate row.
        const persisted = await candidateRepository.createMany([
          {
            campaignId,
            name: result.name,
            currentTitle: result.title ?? 'Unknown',
            company: result.company ?? 'Independent',
            bio: `${result.title ?? ''}${result.company ? ' at ' + result.company : ''}`.trim(),
            openToWork: false,
            platform: 'LinkedIn',
            // Manual paste = recruiter has already vetted this person.
            // Score 9 reflects that intent; they go straight to Approved Queue.
            matchScore: 9.0,
            matchExplanation: 'Added by recruiter via LinkedIn URL; Apollo verified.',
            skills: [],
            strengths: result.location ? [`Based in ${result.location}`] : [],
            gaps: [],
          },
        ]);

        // Immediately attach the enrichment data (email/phone/etc) so the
        // row lands in the UI already enriched — no second click needed.
        const enriched = await candidateRepository.update(persisted[0].id, {
          email: result.email ?? null,
          phone: result.phone ?? null,
          location: result.location ?? null,
          linkedinUrl: result.linkedinUrl ?? url,
          emailEnriched: !!result.email,
          phoneEnriched: !!result.phone,
          outreachStatus: 'ENRICHED',
        });
        added.push(enriched);

        await campaignRepository.addLog(campaignId, {
          message: `Added ${result.name} via LinkedIn URL${result.email ? ` (${result.email})` : ''}`,
          candidateId: enriched.id,
          candidateName: result.name,
          type: 'ENRICH',
        });
      }

      // One usage credit per submission (not per URL — the recruiter ran
      // "lookup these N people" as a single intent).
      await usageService.record(userId);
      const usage = await usageService.snapshot(userId);

      // Advance campaign status to RUNNING if anyone was added
      if (added.length > 0 && campaign.status === 'DRAFT') {
        await campaignRepository.update(campaignId, userId, { status: 'RUNNING' });
      }

      res.json({
        success: true,
        added,
        addedCount: added.length,
        skipped,
        skippedCount: skipped.length,
        usage,
      });
    } catch (err) {
      next(err);
    }
  },

  async resetCandidates(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { campaignId } = req.params;
      const campaign = await campaignRepository.findById(campaignId, req.user!.id);
      if (!campaign) return next(createError('Campaign not found.', 404));

      const result = await candidateRepository.deleteByCampaign(campaignId);
      await campaignRepository.addLog(campaignId, {
        message: `Sourcing reset: removed ${result.count} candidate(s).`,
        type: 'SYSTEM',
      });
      res.json({ success: true, deleted: result.count });
    } catch (err) {
      next(err);
    }
  },

  // GET /api/campaigns/:campaignId/candidates
  async listCandidates(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { campaignId } = req.params;
      const campaign = await campaignRepository.findById(campaignId, req.user!.id);
      if (!campaign) return next(createError('Campaign not found.', 404));

      const candidates = await candidateRepository.findAllByCampaign(campaignId);
      res.json({ success: true, data: candidates });
    } catch (err) {
      next(err);
    }
  },

  // GET /api/campaigns/:campaignId/candidates/approved
  async getApprovedQueue(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { campaignId } = req.params;
      const campaign = await campaignRepository.findById(campaignId, req.user!.id);
      if (!campaign) return next(createError('Campaign not found.', 404));

      const candidates = await candidateRepository.findApprovedQueue(campaignId);
      res.json({ success: true, data: candidates });
    } catch (err) {
      next(err);
    }
  },

  // GET /api/campaigns/:campaignId/candidates/below-threshold
  async getBelowThreshold(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { campaignId } = req.params;
      const campaign = await campaignRepository.findById(campaignId, req.user!.id);
      if (!campaign) return next(createError('Campaign not found.', 404));

      const candidates = await candidateRepository.findBelowThreshold(campaignId);
      res.json({ success: true, data: candidates });
    } catch (err) {
      next(err);
    }
  },

  // GET /api/campaigns/:campaignId/candidates/:id
  async getCandidate(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { campaignId, id } = req.params;
      const campaign = await campaignRepository.findById(campaignId, req.user!.id);
      if (!campaign) return next(createError('Campaign not found.', 404));

      const candidate = await candidateRepository.findById(id, campaignId);
      if (!candidate) return next(createError('Candidate not found.', 404));
      res.json({ success: true, data: candidate });
    } catch (err) {
      next(err);
    }
  },
};
