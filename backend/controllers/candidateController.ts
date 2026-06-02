import type { Request, Response, NextFunction } from 'express';
import { apolloSourcingService } from '../services/apollo/apolloSourcingService.js';
import { apolloService, ApolloError } from '../services/apollo/apolloService.js';
import { redditService } from '../services/reddit/redditService.js';
import { geminiService } from '../services/ai/geminiService.js';
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
      // Sourcing combines Apollo (LinkedIn) + Reddit (hiring subreddits).
      // At least one source must be configured; we never invent candidates.
      if (!apolloSourcingService.isAvailable() && !redditService.isAvailable()) {
        return next(
          createError(
            'Sourcing is unavailable: neither Apollo nor Reddit is configured on the server. ' +
              'At least one real source is required.',
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
      // Optional location filter — accepts a single string or array, normalised
      // to string[]. Forwarded to Apollo's person_locations.
      const locationsRaw = (req.body?.locations ?? req.query.locations) as unknown;
      const locations: string[] = Array.isArray(locationsRaw)
        ? locationsRaw.map(String).map(s => s.trim()).filter(Boolean)
        : typeof locationsRaw === 'string' && locationsRaw.trim()
          ? locationsRaw.split(',').map(s => s.trim()).filter(Boolean)
          : [];
      const pageSize = Math.min(50, Math.max(1, Number(pageSizeParam) || 25));
      let page = Number(pageParam);
      if (!Number.isFinite(page) || page < 1) {
        const existingCount = (await candidateRepository.findAllByCampaign(campaignId)).length;
        page = Math.floor(existingCount / pageSize) + 1;
      }

      // Step 1: Apollo Search — get IDs + first_name + obfuscated last_name.
      // We treat Apollo failures as soft: if it errors or returns nothing,
      // we still try Reddit. Only if BOTH come up empty do we report 404/502.
      let searchResult: Awaited<ReturnType<typeof apolloSourcingService.searchRaw>> | null = null;
      let apolloErrorMsg: string | null = null;
      try {
        searchResult = await apolloSourcingService.searchRaw({
          title: campaign.jobTitle,
          alternateTitles: campaign.alternateTitles,
          extractedKeywords: campaign.extractedKeywords,
          preferredPlatforms: campaign.preferredPlatforms,
          limit: pageSize,
          page,
          locations: locations.length > 0 ? locations : undefined,
        });
      } catch (err) {
        apolloErrorMsg =
          err instanceof ApolloError
            ? `Apollo Search ${err.status}: ${err.message}`
            : err instanceof Error
              ? err.message
              : 'Apollo Search call failed.';
        console.warn('[Apollo] sourcing failed:', apolloErrorMsg);
        await campaignRepository.addLog(campaignId, {
          message: `Apollo sourcing skipped: ${apolloErrorMsg}`,
          type: 'WARNING',
        });
      }

      const searchHits = searchResult?.hits ?? [];
      const apolloCreditsExhausted = false; // Search step doesn't spend match credits

      // ── Search-only sourcing (NO Apollo Match) ────────────────────────
      // We do NOT call Match-by-id here, so sourcing spends no lead credits
      // and fetches no email/phone. We persist what Search gives: a masked
      // name (first name + obfuscated surname with "?"→"•"), title, company,
      // location, linkedin_url, and the Apollo person id (so the user can
      // later enrich the ones they pick). Real name + email arrive only when
      // the recruiter selects candidates and clicks "Get email".
      const maskSurname = (s?: string | null): string =>
        (s ?? '').replace(/\?/g, '•').trim();

      // searchMeta keeps the per-candidate Apollo id / linkedin / location so
      // we can attach them after persistence (keyed by the display name).
      const searchMeta = new Map<string, { apolloId?: string; linkedinUrl?: string; location?: string }>();

      const rawProfiles = searchHits
        .map(search => {
          const first = (search.first_name ?? '').trim();
          const maskedLast = maskSurname(search.last_name_obfuscated);
          // Display name: "First •••" style. Keep the obfuscated surname (it
          // differs per person, preserving uniqueness for the DB) but masked.
          const name = [first, maskedLast].filter(Boolean).join(' ').trim()
            || (search.name ?? '').replace(/\?/g, '•').trim();
          if (!name) return null;
          const title = search.title ?? search.headline ?? 'Unknown';
          const company = search.organization?.name ?? 'Independent';
          const location = [search.city, search.state, search.country].filter(Boolean).join(', ') || undefined;
          searchMeta.set(name.toLowerCase(), {
            apolloId: search.id,
            linkedinUrl: search.linkedin_url ?? undefined,
            location,
          });
          return {
            name,
            currentTitle: title,
            company,
            bio: `${title}${company ? ' at ' + company : ''}`.trim() || 'Sourced from LinkedIn via Apollo.',
            openToWork: false,
            platform: 'LinkedIn' as const,
            matchScore: 6, // replaced by Gemini fit score below
            matchExplanation: 'Sourced from Apollo Search. Select to reveal email.',
            skills: [],
            strengths: [] as string[],
            gaps: ['Email not yet revealed — select and Get email'] as string[],
          };
        })
        .filter((p): p is NonNullable<typeof p> => p !== null);

      // ── Gemini fit scoring on the Search data (title/company vs the spec) ─
      if (geminiService.isAvailable() && rawProfiles.length > 0) {
        const BATCH = 6;
        for (let i = 0; i < rawProfiles.length; i += BATCH) {
          const slice = rawProfiles.slice(i, i + BATCH);
          await Promise.all(
            slice.map(async p => {
              const fit = await geminiService.scoreCandidateFit({
                candidateName: p.name,
                candidateTitle: p.currentTitle,
                candidateCompany: p.company,
                candidateBio: p.bio,
                jobTitle: campaign.jobTitle,
                jobKeywords: campaign.extractedKeywords,
                jobRequirements: campaign.requirements,
                alternateTitles: campaign.alternateTitles,
              }).catch(() => null);
              if (!fit) return;
              p.matchScore = fit.score;
              p.matchExplanation = fit.reasoning;
              p.strengths = fit.strengths.slice(0, 6);
              p.gaps = [...fit.gaps, 'Email not yet revealed — select and Get email'].slice(0, 4);
            })
          );
        }
      }

      // Reddit sourcing — runs in parallel intent (we already have the Apollo
      // result by this point, so this is sequential but cheap). We never let
      // a Reddit failure block the Apollo pipeline: any error here is logged
      // and swallowed so the user still sees their LinkedIn candidates.
      let redditProfiles: typeof rawProfiles = [];
      if (redditService.isAvailable()) {
        try {
          redditProfiles = await redditService.sourceCandidates({
            jobTitle: campaign.jobTitle,
            extractedKeywords: campaign.extractedKeywords,
            limit: Math.max(5, Math.floor(pageSize / 2)),
          });
          await campaignRepository.addLog(campaignId, {
            message: `Reddit sourcing: ${redditProfiles.length} candidate(s) discovered in hiring subreddits.`,
            type: 'INFO',
          });
        } catch (err) {
          console.warn('[Reddit] sourcing failed:', err instanceof Error ? err.message : err);
          await campaignRepository.addLog(campaignId, {
            message: `Reddit sourcing skipped: ${err instanceof Error ? err.message : 'unknown error'}`,
            type: 'WARNING',
          });
        }
      }

      const combinedProfiles = [...rawProfiles, ...redditProfiles];

      if (combinedProfiles.length === 0) {
        if (apolloCreditsExhausted) {
          return next(
            createError(
              'Your Apollo lead credits are used up — Apollo could not unlock any of the ' +
                'profiles it found. Credits reset on your Apollo billing cycle. In the ' +
                'meantime, use “Re-score” to re-evaluate existing candidates (no Apollo credits needed).',
              402
            )
          );
        }
        return next(
          createError(
            'No candidates resolved from either Apollo or Reddit. ' +
              'Often a transient upstream issue — try again in a moment.',
            502
          )
        );
      }

      // Phase 3 — algorithmic screening (dedupe, validate, threshold split)
      const screening = screenProfiles(combinedProfiles);

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

      // Attach Search metadata (Apollo id, linkedin, location) so the rows
      // can be enriched later. NO email/phone yet — these stay SOURCED until
      // the recruiter selects them and clicks "Get email" (Apollo Match).
      for (const c of candidates) {
        const meta = searchMeta.get(c.name.toLowerCase());
        if (!meta) continue;
        try {
          await candidateRepository.update(c.id, {
            location: meta.location ?? null,
            linkedinUrl: meta.linkedinUrl ?? null,
            apolloId: meta.apolloId ?? null,
          });
        } catch (err) {
          // A single row's metadata attach must never fail the whole source
          // run (e.g. a stray constraint). The candidate still exists.
          console.warn('[source] meta attach failed for', c.id, err instanceof Error ? err.message : err);
        }
      }
      // Re-read so the response reflects the attached fields
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
        source: searchHits.length > 0 ? 'apollo+reddit' : 'reddit',
        sources: {
          apollo: { count: searchMeta.size, error: apolloErrorMsg },
          reddit: { count: redditProfiles.length },
        },
        usage,
        pagination: searchResult ? {
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
        } : null,
      });
    } catch (err) {
      next(err);
    }
  },

  // POST /api/campaigns/:campaignId/candidates/rescore
  // Re-runs the Gemini fit score on EVERY candidate already on the campaign
  // and updates their matchScore/explanation/strengths/gaps in place. No
  // Apollo credits — purely a Gemini re-evaluation. Fixes legacy rows that
  // were saved with the old hardcoded 9.5 (re-sourcing can't touch them
  // because of the existing-name dedupe).
  async rescoreCandidates(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { campaignId } = req.params;
      const userId = req.user!.id;
      const campaign = await campaignRepository.findById(campaignId, userId);
      if (!campaign) return next(createError('Campaign not found.', 404));
      if (!geminiService.isAvailable()) {
        return next(createError('Gemini is not configured on the server.', 503));
      }

      const candidates = await candidateRepository.findAllByCampaign(campaignId);
      if (candidates.length === 0) {
        res.json({ success: true, rescored: 0 });
        return;
      }

      let rescored = 0;
      // Grounded scoring is slower (web research per candidate) so use a
      // smaller batch to stay under Gemini's rate limit.
      const BATCH = 4;
      for (let i = 0; i < candidates.length; i += BATCH) {
        const slice = candidates.slice(i, i + BATCH);
        await Promise.all(
          slice.map(async c => {
            // Deep score: Gemini researches the candidate's real profile on
            // the web, then applies the scoring.md rubric.
            const fit = await geminiService.scoreCandidateFitGrounded({
              candidateName: c.name,
              candidateTitle: c.currentTitle,
              candidateCompany: c.company,
              linkedinUrl: c.linkedinUrl ?? undefined,
              candidateBio: c.bio,
              jobTitle: campaign.jobTitle,
              jobKeywords: campaign.extractedKeywords,
              jobRequirements: campaign.requirements,
              alternateTitles: campaign.alternateTitles,
            }).catch(() => null);
            if (!fit) return;
            // Preserve any data-quality strengths/gaps that aren't fit-based.
            const keepStrengths = c.strengths.filter(s =>
              /confirmed by Apollo|verified via Google|email on file/i.test(s)
            );
            const keepGaps = c.gaps.filter(g => /Email reveal needed/i.test(g));
            await candidateRepository.updateScore(c.id, {
              matchScore: fit.score,
              matchExplanation: fit.reasoning,
              strengths: [...fit.strengths, ...keepStrengths].slice(0, 6),
              gaps: [...fit.gaps, ...keepGaps].slice(0, 4),
            });
            rescored++;
          })
        );
      }

      await campaignRepository.addLog(campaignId, {
        message: `Deep-scored ${rescored} candidate(s) with Gemini web research (scoring.md rubric).`,
        type: 'INFO',
      });
      const fresh = await candidateRepository.findAllByCampaign(campaignId);
      res.json({ success: true, rescored, candidates: fresh });
    } catch (err) {
      next(err);
    }
  },

  // POST /api/campaigns/:campaignId/candidates/enrich-selected
  // body: { candidateIds: string[] }
  // Spends Apollo Match credits ONLY on the selected candidates to reveal
  // their real name + email (and the data-freshness fields). This is the
  // on-demand enrichment step in the new flow: source cheaply, then the
  // recruiter picks who's worth a credit.
  async enrichSelected(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { campaignId } = req.params;
      const userId = req.user!.id;
      const { candidateIds } = req.body as { candidateIds?: string[] };
      if (!Array.isArray(candidateIds) || candidateIds.length === 0) {
        return next(createError('candidateIds (string[]) is required.', 400));
      }
      const campaign = await campaignRepository.findById(campaignId, userId);
      if (!campaign) return next(createError('Campaign not found.', 404));
      if (!apolloService.isAvailable()) {
        return next(createError('Apollo is not configured on the server.', 503));
      }
      await usageService.assertWithinLimit(userId);

      const all = await candidateRepository.findAllByCampaign(campaignId);
      const selected = all.filter(c => candidateIds.includes(c.id));

      let enriched = 0;
      let creditsExhausted = false;
      const skipped: Array<{ id: string; reason: string }> = [];

      for (const c of selected) {
        if (c.emailEnriched) { skipped.push({ id: c.id, reason: 'Already enriched.' }); continue; }
        if (!c.apolloId) { skipped.push({ id: c.id, reason: 'No Apollo id — cannot enrich.' }); continue; }
        try {
          const m = await apolloService.enrichById(c.apolloId);
          if (!m.found) { skipped.push({ id: c.id, reason: 'Apollo could not resolve.' }); continue; }
          await candidateRepository.update(c.id, {
            // Reveal the real full name (was masked at sourcing).
            name: m.name && m.name.trim() ? m.name.trim() : undefined,
            email: m.email ?? null,
            location: m.location ?? c.location ?? null,
            linkedinUrl: m.linkedinUrl ?? c.linkedinUrl ?? null,
            apolloUpdatedAt: m.apolloUpdatedAt ? new Date(m.apolloUpdatedAt) : null,
            currentRoleSince: m.currentRoleSince ? new Date(m.currentRoleSince) : null,
            isCurrentRole: !!m.isCurrentRole,
            emailEnriched: !!m.email,
            outreachStatus: 'ENRICHED',
          });
          enriched++;
        } catch (err) {
          const msg = err instanceof Error ? err.message : String(err);
          if (/insufficient credits|lead credits|upgrade your plan/i.test(msg)) {
            creditsExhausted = true;
            break;
          }
          skipped.push({ id: c.id, reason: msg });
        }
      }

      if (enriched > 0) await usageService.record(userId);
      const fresh = await candidateRepository.findAllByCampaign(campaignId);
      await campaignRepository.addLog(campaignId, {
        message: `Enriched ${enriched} selected candidate(s) via Apollo Match.` +
          (creditsExhausted ? ' Stopped early — Apollo credits exhausted.' : ''),
        type: 'ENRICH',
      });

      if (creditsExhausted && enriched === 0) {
        return next(createError(
          'Your Apollo lead credits are used up — could not reveal email. Credits reset on your Apollo billing cycle.',
          402
        ));
      }
      res.json({ success: true, enriched, creditsExhausted, skipped, candidates: fresh });
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
          apolloId: result.apolloId ?? null,
          apolloUpdatedAt: result.apolloUpdatedAt ? new Date(result.apolloUpdatedAt) : null,
          currentRoleSince: result.currentRoleSince ? new Date(result.currentRoleSince) : null,
          isCurrentRole: !!result.isCurrentRole,
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
