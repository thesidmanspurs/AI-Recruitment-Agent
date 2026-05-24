import type { RawCandidateProfile } from '../../types/candidate.types.js';
import { SUITABILITY_THRESHOLD } from '../../config/constants.js';

export type RejectionReason =
  | 'below_threshold'
  | 'invalid_score'
  | 'duplicate_lower_score';

export interface ScreenedCandidate {
  profile: RawCandidateProfile;
  approved: boolean;
  reason?: RejectionReason;
}

export interface ScreeningSummary {
  total: number;
  approved: number;
  rejected: number;
  belowThreshold: number;
  duplicatesMerged: number;
  invalidScores: number;
  threshold: number;
}

export interface ScreeningResult {
  /** Profiles that should be persisted (one row per real person). */
  persisted: RawCandidateProfile[];
  /** Per-profile audit trail covering everything that came in. */
  decisions: ScreenedCandidate[];
  summary: ScreeningSummary;
}

/**
 * Algorithmic screening (Phase 3).
 *
 * Takes the raw longlist returned by Gemini (or the fallback fixtures), applies
 * deterministic post-processing, and partitions into "persist" vs "reject" with
 * a reason on each rejection. The threshold itself is the last filter — dedupe
 * and validation run first so we never count the same person twice towards the
 * "approved" tally.
 *
 * Pipeline:
 *   1. Validate matchScore is a real 0–10 number (clamp + flag invalids)
 *   2. Dedupe by case-insensitive trimmed name; keep the highest-scoring entry,
 *      merge platforms onto strengths so we don't lose the signal
 *   3. Partition by SUITABILITY_THRESHOLD
 */
export function screenProfiles(profiles: RawCandidateProfile[]): ScreeningResult {
  const decisions: ScreenedCandidate[] = [];
  const invalidScores: ScreenedCandidate[] = [];
  const validProfiles: RawCandidateProfile[] = [];

  // ── 1. Validate scores ───────────────────────────────────────────────────
  for (const p of profiles) {
    const score = Number(p.matchScore);
    if (!Number.isFinite(score) || score < 0 || score > 10) {
      invalidScores.push({ profile: p, approved: false, reason: 'invalid_score' });
      continue;
    }
    validProfiles.push({ ...p, matchScore: score });
  }

  // ── 2. Dedupe by name (case-insensitive). Keep highest score, attach other
  //      platforms onto the survivor's strengths so the signal is retained. ──
  const byName = new Map<string, RawCandidateProfile>();
  const dupes: ScreenedCandidate[] = [];

  for (const p of validProfiles) {
    const key = p.name.trim().toLowerCase();
    const existing = byName.get(key);
    if (!existing) {
      byName.set(key, p);
      continue;
    }
    const [winner, loser] =
      p.matchScore >= existing.matchScore ? [p, existing] : [existing, p];

    // Preserve cross-platform signal on the survivor.
    if (!winner.strengths.some(s => s.toLowerCase().includes(loser.platform.toLowerCase()))) {
      winner.strengths = [...winner.strengths, `Also active on ${loser.platform}`];
    }
    byName.set(key, winner);

    dupes.push({ profile: loser, approved: false, reason: 'duplicate_lower_score' });
  }

  // ── 3. Threshold split ───────────────────────────────────────────────────
  const persisted: RawCandidateProfile[] = [];
  let belowThreshold = 0;

  for (const p of byName.values()) {
    if (p.matchScore >= SUITABILITY_THRESHOLD) {
      persisted.push(p);
      decisions.push({ profile: p, approved: true });
    } else {
      // Below-threshold candidates are STILL persisted (so the user can
      // see why they were screened out) but flagged as not approved.
      persisted.push(p);
      decisions.push({ profile: p, approved: false, reason: 'below_threshold' });
      belowThreshold += 1;
    }
  }

  decisions.push(...invalidScores, ...dupes);

  const approved = decisions.filter(d => d.approved).length;
  const summary: ScreeningSummary = {
    total: profiles.length,
    approved,
    rejected: decisions.length - approved,
    belowThreshold,
    duplicatesMerged: dupes.length,
    invalidScores: invalidScores.length,
    threshold: SUITABILITY_THRESHOLD,
  };

  return { persisted, decisions, summary };
}
