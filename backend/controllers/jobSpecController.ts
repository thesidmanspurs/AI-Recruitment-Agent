import type { Request, Response, NextFunction } from 'express';
import { geminiService } from '../services/ai/geminiService.js';
import { campaignRepository } from '../repositories/campaignRepository.js';
import { fallbackAnalyses, detectCategory } from '../services/ai/fallbackData.js';
import { formatGeminiError } from '../services/ai/geminiErrors.js';
import { createError } from '../middleware/errorHandler.js';
import { createHash } from 'crypto';
import type { JobAnalysis } from '../types/jobSpec.types.js';

// Tiny in-memory cache: identical JD text → identical analysis. Keeps the user
// from burning Gemini quota when they re-create or edit a campaign with the
// same JD. TTL 1h to bound staleness without making the cache useless.
const ANALYSIS_CACHE = new Map<string, { value: JobAnalysis; expiresAt: number }>();
const ANALYSIS_TTL_MS = 60 * 60 * 1000;

function getCachedAnalysis(jobText: string): JobAnalysis | null {
  const key = createHash('sha256').update(jobText).digest('hex');
  const hit = ANALYSIS_CACHE.get(key);
  if (!hit) return null;
  if (hit.expiresAt < Date.now()) {
    ANALYSIS_CACHE.delete(key);
    return null;
  }
  return hit.value;
}

function setCachedAnalysis(jobText: string, value: JobAnalysis): void {
  const key = createHash('sha256').update(jobText).digest('hex');
  ANALYSIS_CACHE.set(key, { value, expiresAt: Date.now() + ANALYSIS_TTL_MS });
}

export const jobSpecController = {
  // POST /api/campaigns — create campaign + analyze job spec
  async createCampaign(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id;
      const { name, jobText, location, jobType, department } = req.body;

      if (!name || !jobText) {
        return next(createError('name and jobText are required.', 400));
      }

      let analysis: JobAnalysis;
      let isSimulated = false;
      let simulationReason: string | undefined;

      const cached = getCachedAnalysis(jobText);
      if (cached) {
        analysis = cached;
      } else if (geminiService.isAvailable()) {
        try {
          analysis = await geminiService.analyzeJobSpec(jobText);
          setCachedAnalysis(jobText, analysis);
        } catch (err) {
          // Fall back to fixture data so the UX continues instead of 500ing.
          // Common cause: free-tier 429 / billing not enabled.
          const category = detectCategory(jobText);
          analysis = fallbackAnalyses[category];
          isSimulated = true;
          simulationReason = formatGeminiError(err);
          console.warn('[Gemini] analyzeJobSpec failed, using fallback:', simulationReason);
        }
      } else {
        const category = detectCategory(jobText);
        analysis = fallbackAnalyses[category];
        isSimulated = true;
        simulationReason = 'GEMINI_API_KEY not configured on the server.';
      }

      const campaign = await campaignRepository.create({
        userId,
        name,
        jobTitle: analysis.title,
        rawJobText: jobText,
        location,
        jobType,
        department,
        alternateTitles: analysis.alternateTitles,
        extractedKeywords: analysis.extractedKeywords,
        requirements: analysis.requirements,
        preferredPlatforms: analysis.preferredPlatforms,
        status: 'DRAFT',
        analyzedAt: new Date(),
      });

      await campaignRepository.addLog(campaign.id, {
        message: `Campaign created and job spec analyzed: "${analysis.title}"`,
        type: 'INFO',
      });

      res.status(201).json({ success: true, campaign, analysis, isSimulated, simulationReason });
    } catch (err) {
      next(err);
    }
  },

  // GET /api/campaigns
  async listCampaigns(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const campaigns = await campaignRepository.findAll(req.user!.id);
      res.json({ success: true, data: campaigns });
    } catch (err) {
      next(err);
    }
  },

  // GET /api/campaigns/:id
  async getCampaign(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const campaign = await campaignRepository.findById(req.params.id, req.user!.id);
      if (!campaign) return next(createError('Campaign not found.', 404));
      res.json({ success: true, data: campaign });
    } catch (err) {
      next(err);
    }
  },

  // PUT /api/campaigns/:id
  // Accepts: name, location, jobType, department, status, jobText.
  // If jobText is included AND differs from the stored value, we re-run the
  // Gemini analysis so title/keywords/requirements stay in sync.
  async updateCampaign(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const {
        name, location, jobType, department, status, jobText, outreachTemplate,
        jobTitle, alternateTitles, extractedKeywords, requirements,
      } = req.body as {
        name?: string;
        location?: string;
        jobType?: string;
        department?: string;
        status?: 'DRAFT' | 'RUNNING' | 'PAUSED' | 'COMPLETED';
        jobText?: string;
        outreachTemplate?: string | null;
        // Direct spec edits from the review popup ("repair"). Applied verbatim
        // (they win over re-analysis) when no new jobText is supplied.
        jobTitle?: string;
        alternateTitles?: string[];
        extractedKeywords?: string[];
        requirements?: string[];
      };

      const existing = await campaignRepository.findById(req.params.id, req.user!.id);
      if (!existing) return next(createError('Campaign not found.', 404));

      const update: Record<string, unknown> = { name, location, jobType, department, status };
      if (outreachTemplate !== undefined) {
        update.outreachTemplate = outreachTemplate?.trim() ? outreachTemplate.trim() : null;
      }
      let isSimulated = false;
      let simulationReason: string | undefined;

      // Re-analyse only when the JD actually changed
      if (jobText && jobText.trim() !== existing.rawJobText.trim()) {
        update.rawJobText = jobText;
        let analysis: JobAnalysis;
        if (geminiService.isAvailable()) {
          try {
            analysis = await geminiService.analyzeJobSpec(jobText);
            setCachedAnalysis(jobText, analysis);
          } catch (err) {
            const category = detectCategory(jobText);
            analysis = fallbackAnalyses[category];
            isSimulated = true;
            simulationReason = formatGeminiError(err);
          }
        } else {
          const category = detectCategory(jobText);
          analysis = fallbackAnalyses[category];
          isSimulated = true;
          simulationReason = 'GEMINI_API_KEY not configured on the server.';
        }
        update.jobTitle = analysis.title;
        update.alternateTitles = analysis.alternateTitles;
        update.extractedKeywords = analysis.extractedKeywords;
        update.requirements = analysis.requirements;
        update.preferredPlatforms = analysis.preferredPlatforms;
        update.analyzedAt = new Date();
        await campaignRepository.addLog(existing.id, {
          message: `Job spec re-analyzed: "${analysis.title}"`,
          type: 'INFO',
        });
      }

      // Direct spec edits (from the review popup) — applied verbatim. These win
      // over any re-analysis above, so a "repair" is never silently overwritten.
      if (typeof jobTitle === 'string' && jobTitle.trim()) update.jobTitle = jobTitle.trim();
      if (Array.isArray(alternateTitles)) update.alternateTitles = alternateTitles;
      if (Array.isArray(extractedKeywords)) {
        update.extractedKeywords = extractedKeywords.map(s => String(s).trim()).filter(Boolean);
      }
      if (Array.isArray(requirements)) {
        update.requirements = requirements.map(s => String(s).trim()).filter(Boolean);
      }

      const campaign = await campaignRepository.update(req.params.id, req.user!.id, update);
      res.json({ success: true, data: campaign, isSimulated, simulationReason });
    } catch (err) {
      next(err);
    }
  },

  // POST /api/campaigns/draft-jd
  // Draft a job description from the header fields (empty box) or enhance the
  // text the recruiter already typed. Pre-creation helper for the "AI" button.
  async draftJobDescription(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { name, jobTitle, location, jobType, department, jobText } = req.body as {
        name?: string; jobTitle?: string; location?: string; jobType?: string;
        department?: string; jobText?: string;
      };
      if (!geminiService.isAvailable()) {
        return next(createError('AI drafting is unavailable — GEMINI_API_KEY is not configured.', 503));
      }
      const text = await geminiService.generateJobDescription({
        jobTitle: (jobTitle || name || '').trim() || undefined,
        location, jobType, department,
        existingText: jobText,
      });
      res.json({ success: true, text });
    } catch (err) {
      next(err);
    }
  },

  // POST /api/campaigns/:id/reanalyze  — "Try again": re-extract the spec from
  // the stored job text (cache bypassed so a fresh pass can differ).
  async reanalyzeCampaign(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const existing = await campaignRepository.findById(req.params.id, req.user!.id);
      if (!existing) return next(createError('Campaign not found.', 404));
      if (!geminiService.isAvailable()) {
        return next(createError('AI analysis is unavailable — GEMINI_API_KEY is not configured.', 503));
      }
      const analysis = await geminiService.analyzeJobSpec(existing.rawJobText);
      setCachedAnalysis(existing.rawJobText, analysis);
      const campaign = await campaignRepository.update(req.params.id, req.user!.id, {
        jobTitle: analysis.title,
        alternateTitles: analysis.alternateTitles,
        extractedKeywords: analysis.extractedKeywords,
        requirements: analysis.requirements,
        preferredPlatforms: analysis.preferredPlatforms,
        analyzedAt: new Date(),
      });
      res.json({ success: true, data: campaign });
    } catch (err) {
      next(err);
    }
  },

  // POST /api/campaigns/:id/enhance-spec  — "Enhance with AI": strengthen the
  // extracted title/keywords/requirements, grounded in the stored job text.
  async enhanceCampaignSpec(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const existing = await campaignRepository.findById(req.params.id, req.user!.id);
      if (!existing) return next(createError('Campaign not found.', 404));
      if (!geminiService.isAvailable()) {
        return next(createError('AI enhancement is unavailable — GEMINI_API_KEY is not configured.', 503));
      }
      const analysis = await geminiService.enhanceJobSpec({
        rawJobText: existing.rawJobText,
        jobTitle: existing.jobTitle,
        extractedKeywords: existing.extractedKeywords,
        requirements: existing.requirements,
      });
      const campaign = await campaignRepository.update(req.params.id, req.user!.id, {
        jobTitle: analysis.title,
        alternateTitles: analysis.alternateTitles,
        extractedKeywords: analysis.extractedKeywords,
        requirements: analysis.requirements,
        preferredPlatforms: analysis.preferredPlatforms,
        analyzedAt: new Date(),
      });
      res.json({ success: true, data: campaign });
    } catch (err) {
      next(err);
    }
  },

  // DELETE /api/campaigns/:id
  async deleteCampaign(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await campaignRepository.delete(req.params.id, req.user!.id);
      res.json({ success: true });
    } catch (err) {
      next(err);
    }
  },
};
