import { env } from '../../config/env.js';
import { APOLLO_BASE_URL, PLATFORMS } from '../../config/constants.js';
import { ApolloError } from './apolloService.js';
import type { RawCandidateProfile, Platform } from '../../types/candidate.types.js';

/**
 * Phase 2 — real candidate sourcing via Apollo's People Search.
 *
 * Endpoint: POST https://api.apollo.io/api/v1/mixed_people/search
 * Auth:     X-Api-Key header (separate scoped key, APOLLO_PEOPLE_SEARCH_KEY)
 * Docs:     https://docs.apollo.io/reference/people-search
 *
 * Apollo's search is filter-based, not semantic. So we translate the
 * Gemini-extracted spec into Apollo's filter vocabulary:
 *   - jobTitle + alternateTitles → person_titles (OR-joined)
 *   - extractedKeywords          → q_keywords (Apollo's full-text field)
 *   - preferredPlatforms         → just used for distribution after the fact
 *
 * Apollo doesn't expose a single "match score". We synthesise one from:
 *   - title overlap with the spec's title set (50%)
 *   - keyword presence in their headline / about (40%)
 *   - openToWork-like signals: "is_likely_to_engage" / "has_email" (10%)
 *
 * Apollo returns *real* LinkedIn-indexed people. Free tier strips
 * email/phone fields but search results themselves don't cost credits.
 */

interface ApolloSearchResponse {
  people?: Array<ApolloSearchPerson>;
  pagination?: {
    page: number;
    per_page: number;
    total_entries: number;
    total_pages: number;
  };
}

export interface ApolloSearchPerson {
  id: string;
  name?: string;
  first_name?: string;
  last_name?: string;
  last_name_obfuscated?: string;
  title?: string;
  headline?: string;
  organization?: { name?: string | null; primary_domain?: string | null } | null;
  city?: string | null;
  state?: string | null;
  country?: string | null;
  linkedin_url?: string | null;
  email?: string | null;
  email_status?: string;
  photo_url?: string | null;
  departments?: string[];
  seniority?: string;
}

export interface ApolloSourceParams {
  title: string;
  alternateTitles: string[];
  extractedKeywords: string[];
  preferredPlatforms?: string[];
  /** Results per page (Apollo max 100; we default to 25 for credit control). */
  limit?: number;
  /** 1-indexed page number (default 1). Apollo paginates server-side. */
  page?: number;
  /** Optional country filter (e.g. "United Kingdom"). */
  country?: string;
  /**
   * Optional list of locations to filter by (city, region, or country names
   * matched by Apollo's person_locations filter). When set, takes precedence
   * over `country` and is OR-joined inside Apollo.
   */
  locations?: string[];
}

export interface ApolloSearchPage {
  hits: ApolloSearchPerson[];
  page: number;
  perPage: number;
  totalEntries: number;
  totalPages: number;
}

export const apolloSourcingService = {
  isAvailable(): boolean {
    return !!env.APOLLO_PEOPLE_SEARCH_KEY;
  },

  /**
   * Raw search hits including Apollo's internal `id`. Callers can feed each
   * id into people/match to retrieve the full verified record on Basic tier
   * (Search alone returns first_name + obfuscated last_name only).
   *
   * Paginated: `params.page` (1-indexed) selects the Apollo page;
   * `params.limit` controls per_page (max 100, default 25).
   */
  async searchRaw(params: ApolloSourceParams): Promise<ApolloSearchPage> {
    if (!env.APOLLO_PEOPLE_SEARCH_KEY) {
      throw new ApolloError(401, 'APOLLO_PEOPLE_SEARCH_KEY not configured.');
    }
    const perPage = Math.min(100, Math.max(1, params.limit ?? 25));
    const page = Math.max(1, params.page ?? 1);
    const titles = [params.title, ...params.alternateTitles]
      .map(t => (t ?? '').replace(/\s*\(.*?\)\s*/g, ' ').replace(/\s+/g, ' ').trim())
      .filter(Boolean)
      .slice(0, 5);
    const body: Record<string, unknown> = {
      page,
      per_page: perPage,
      person_titles: titles,
    };
    // Multi-location filter takes precedence over the single-country slot.
    const locs = (params.locations ?? []).map(s => s.trim()).filter(Boolean);
    if (locs.length > 0) body.person_locations = locs;
    else if (params.country) body.person_locations = [params.country];

    const res = await fetch(`${APOLLO_BASE_URL}/mixed_people/api_search`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache',
        'X-Api-Key': env.APOLLO_PEOPLE_SEARCH_KEY,
      },
      body: JSON.stringify(body),
    }).catch(err => {
      throw new ApolloError(
        0,
        `Network error reaching Apollo Search: ${err instanceof Error ? err.message : String(err)}`
      );
    });
    const text = await res.text();
    let json: ApolloSearchResponse & { error?: string };
    try {
      json = text ? JSON.parse(text) : {};
    } catch {
      throw new ApolloError(res.status, `Apollo returned non-JSON: ${text.slice(0, 200)}`);
    }
    if (!res.ok) {
      throw new ApolloError(res.status, `Apollo Search: ${json.error || `HTTP ${res.status}`}`);
    }
    // Apollo Basic returns an empty `pagination` object — total_entries and
    // total_pages are not exposed. We infer "more available" by whether
    // Apollo filled the page: a full per_page → more likely exist; fewer →
    // we're at the tail. We also report a conservative totalEntries as the
    // minimum we've seen so far.
    const hits = json.people ?? [];
    const apoliloTotal = Number(json.pagination?.total_entries) || 0;
    const apolloPages = Number(json.pagination?.total_pages) || 0;
    const minSeen = (page - 1) * perPage + hits.length;
    return {
      hits,
      page: Number(json.pagination?.page) || page,
      perPage: Number(json.pagination?.per_page) || perPage,
      // If Apollo gave us a number, trust it; otherwise report at-least value
      totalEntries: apoliloTotal > 0 ? apoliloTotal : minSeen,
      totalPages:
        apolloPages > 0
          ? apolloPages
          : hits.length === perPage
            ? page + 1 // inferred: there is at least one more page
            : page,
    };
  },

  /**
   * Search Apollo for real candidates matching the campaign's spec.
   * Returns RawCandidateProfile[] so the controller can hand it to the same
   * screening + persistence pipeline Gemini's path uses.
   */
  async source(params: ApolloSourceParams): Promise<RawCandidateProfile[]> {
    if (!env.APOLLO_PEOPLE_SEARCH_KEY) {
      throw new ApolloError(401, 'APOLLO_PEOPLE_SEARCH_KEY not configured.');
    }

    const limit = Math.min(100, Math.max(1, params.limit ?? 25));
    // Search-side filter strategy:
    //   - person_titles is the only reliable filter on Apollo's side. Multi-
    //     value works as OR — more titles = more results.
    //   - q_keywords is treated as AND with person_titles and breaks easily
    //     on parenthesised tokens / long phrases. Empirically: adding 2+
    //     keywords on top of a title filter often returns 0 matches.
    //   - We rely on our own computeMatchScore (token-overlap) to surface
    //     the best keyword-matched candidates from Apollo's title-broad pool.
    //
    // Titles are also normalised: strip parenthetical text + multi-spaces.
    const titles = [params.title, ...params.alternateTitles]
      .map(t => (t ?? '').replace(/\s*\(.*?\)\s*/g, ' ').replace(/\s+/g, ' ').trim())
      .filter(Boolean)
      .slice(0, 5);

    const body: Record<string, unknown> = {
      page: 1,
      per_page: limit,
      person_titles: titles,
    };
    // Multi-location filter takes precedence over the single-country slot.
    const locs = (params.locations ?? []).map(s => s.trim()).filter(Boolean);
    if (locs.length > 0) body.person_locations = locs;
    else if (params.country) body.person_locations = [params.country];

    let res: Response;
    try {
      // Apollo's actual endpoint is /mixed_people/api_search — their public
      // docs call it /mixed_people/search but the live service rejects that
      // path with 403. The Search call itself does NOT consume credits;
      // credits are only spent when emails/phones are revealed via match.
      res = await fetch(`${APOLLO_BASE_URL}/mixed_people/api_search`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache',
          'X-Api-Key': env.APOLLO_PEOPLE_SEARCH_KEY,
        },
        body: JSON.stringify(body),
      });
    } catch (err) {
      throw new ApolloError(
        0,
        `Network error reaching Apollo Search: ${err instanceof Error ? err.message : String(err)}`
      );
    }

    const text = await res.text();
    let json: ApolloSearchResponse & { error?: string; message?: string };
    try {
      json = text ? JSON.parse(text) : {};
    } catch {
      throw new ApolloError(res.status, `Apollo returned non-JSON: ${text.slice(0, 200)}`);
    }
    if (!res.ok) {
      const reason = json.error || json.message || `HTTP ${res.status}`;
      throw new ApolloError(res.status, `Apollo Search: ${reason}`);
    }

    const people = json.people ?? [];
    return people.map(p => toRawProfile(p, params));
  },
};

// ─── helpers ──────────────────────────────────────────────────────────────────

function toRawProfile(
  p: NonNullable<ApolloSearchResponse['people']>[number],
  spec: ApolloSourceParams
): RawCandidateProfile {
  // Apollo's Search response on Basic tier returns first_name only and
  // redacts last_name. As a last resort, try to reconstruct from the
  // linkedin_url slug (e.g. /in/mario-rossi-93k → "Mario Rossi") so the
  // recruiter sees a proper name instead of a lone first name.
  let name =
    p.name?.trim() ||
    `${p.first_name ?? ''} ${p.last_name ?? ''}`.trim() ||
    nameFromLinkedIn(p.linkedin_url) ||
    p.first_name?.trim() ||
    'Unknown';
  name = name.replace(/\s+/g, ' ');

  const title = p.title?.trim() || p.headline?.trim() || 'Unknown';
  const company = p.organization?.name?.trim() || 'Independent';
  const bio = (p.headline ?? `${title} at ${company}`).slice(0, 280);

  const score = computeMatchScore(p, spec);
  const matchExplanation = explainScore(p, spec, score);
  const skills = extractSkills(p, spec);
  const strengths = buildStrengths(p, spec);
  const gaps = buildGaps(p);

  return {
    name,
    currentTitle: title,
    company,
    bio,
    openToWork: !!p.email_status && p.email_status !== 'unavailable',
    platform: derivePlatform(p),
    matchScore: score,
    matchExplanation,
    skills,
    strengths,
    gaps,
  };
}

/**
 * Translate Apollo's structured filter response into a 0-10 match score.
 *
 * Apollo doesn't expose a "fit score" — we synthesise one. The previous
 * algorithm required exact substring title matches which essentially never
 * fire on Apollo's rich pipe-delimited headlines (e.g. "Backend Software
 * Engineer | Node.js | TypeScript | REST APIs"). Result: real Apollo
 * candidates scored 4-6 and never crossed the 9.5 Approved Queue threshold.
 *
 * New approach — TOKEN OVERLAP across three signal groups, each contributing
 * proportional fractional points so realistic Apollo profiles can score 7-10:
 *
 *   • Title token overlap        — 4.0 pts max  (matched_words / total_words)
 *   • Keyword overlap            — 4.0 pts max  (matched_kw    / max(3, total))
 *   • Apollo data quality signal — 2.0 pts max  (org + linkedin + email)
 *
 * Total: 10.0. Capped, rounded to 1dp.
 */

const TITLE_STOPWORDS = new Set([
  'a', 'an', 'and', 'at', 'by', 'for', 'in', 'of', 'on', 'or', 'the', 'to', 'with',
]);

function tokens(s: string): string[] {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9.+\-#\s]/g, ' ') // keep tech-name chars like c++, .net, node.js
    .split(/\s+/)
    .filter(t => t.length > 1 && !TITLE_STOPWORDS.has(t));
}

function computeMatchScore(
  p: NonNullable<ApolloSearchResponse['people']>[number],
  spec: ApolloSourceParams
): number {
  const hayText = `${p.title ?? ''} ${p.headline ?? ''} ${p.organization?.name ?? ''}`;
  const hay = new Set(tokens(hayText));

  // Weights tuned for Apollo's Search payload, which exposes only the
  // candidate's title + headline + organization. Keywords from a JD (e.g.
  // "Terraform", "AKS") rarely appear in those fields, so we weight title
  // overlap heavily and treat keywords + data quality as bonus signals.

  // ── 1. Title token overlap (max 6.5) ─────────────────────────────────
  // Score the BEST match across the primary title AND every alternate.
  // Apollo's title pool often surfaces candidates whose title is closer to
  // an alternate than the primary (e.g. JD primary "Lead Azure Infra
  // Engineer" → Apollo returns "Azure Cloud Architect" which better matches
  // the alternate "Azure Cloud Solution Architect"). Scoring against the
  // primary alone unfairly punishes those.
  const allTitles = [spec.title, ...spec.alternateTitles].filter(Boolean);
  let bestTitleRatio = 0;
  for (const t of allTitles) {
    const titleTokens = tokens(t);
    if (titleTokens.length === 0) continue;
    const hits = titleTokens.filter(tok => hay.has(tok)).length;
    const ratio = hits / titleTokens.length;
    if (ratio > bestTitleRatio) bestTitleRatio = ratio;
  }
  const titleScore = 6.5 * bestTitleRatio;

  // ── 2. Keyword overlap bonus (max 2.0) ───────────────────────────────
  // Each JD keyword is a single token or multi-token phrase. Treat phrases
  // like "Azure DevOps" as a substring search; single tokens as token match.
  // Capped low because keywords usually live in skills/experience fields
  // we don't get from Apollo Search.
  const keywords = spec.extractedKeywords;
  const haystackLower = hayText.toLowerCase();
  let kwHits = 0;
  for (const kw of keywords) {
    const kwLower = kw.toLowerCase();
    if (kwLower.includes(' ')) {
      if (haystackLower.includes(kwLower)) kwHits += 1;
    } else if (hay.has(kwLower)) {
      kwHits += 1;
    }
  }
  // 1 keyword hit = full 2pts (since keywords rarely surface in title/org)
  const kwScore = keywords.length > 0 && kwHits > 0 ? 2 : 0;

  // ── 3. Apollo data quality signal (max 1.5) ──────────────────────────
  // Cheap signal that the row is a real, verified profile worth contacting.
  let dataScore = 0;
  if (p.organization?.primary_domain || p.organization?.name) dataScore += 0.5;
  if (p.linkedin_url) dataScore += 0.5;
  if (p.email) dataScore += 0.5;
  else if (p.email_status === 'verified') dataScore += 0.3;
  dataScore = Math.min(1.5, dataScore);

  const total = titleScore + kwScore + dataScore;
  return Math.max(0, Math.min(10, Number(total.toFixed(1))));
}

function explainScore(
  p: NonNullable<ApolloSearchResponse['people']>[number],
  spec: ApolloSourceParams,
  score: number
): string {
  const parts: string[] = [];
  const theirTitle = (p.title ?? p.headline ?? '').toLowerCase();
  if (spec.title && theirTitle.includes(spec.title.toLowerCase())) {
    parts.push(`Direct title match for "${spec.title}"`);
  } else if (spec.alternateTitles.some(t => theirTitle.includes(t.toLowerCase()))) {
    parts.push(`Alternate-title match`);
  }
  const hay = `${p.title ?? ''} ${p.headline ?? ''}`.toLowerCase();
  const matched = spec.extractedKeywords.filter(k => hay.includes(k.toLowerCase()));
  if (matched.length) parts.push(`Headline mentions ${matched.length}/${spec.extractedKeywords.length} keywords (${matched.slice(0, 3).join(', ')})`);
  if (p.linkedin_url) parts.push('LinkedIn profile on file');
  if (parts.length === 0) parts.push('Apollo flagged via fuzzy match');
  return `${parts.join('. ')}. Computed score ${score.toFixed(1)}/10.`;
}

function extractSkills(
  p: NonNullable<ApolloSearchResponse['people']>[number],
  spec: ApolloSourceParams
): string[] {
  // Apollo doesn't return a skills field in search results — we surface the
  // JD keywords that actually appear in the candidate's title/headline.
  const hay = `${p.title ?? ''} ${p.headline ?? ''}`.toLowerCase();
  return spec.extractedKeywords.filter(k => hay.includes(k.toLowerCase())).slice(0, 8);
}

function buildStrengths(
  p: NonNullable<ApolloSearchResponse['people']>[number],
  spec: ApolloSourceParams
): string[] {
  const out: string[] = [];
  if (p.seniority) out.push(`${p.seniority.replace(/_/g, ' ')} seniority on Apollo`);
  if (p.organization?.name) out.push(`Current role at ${p.organization.name}`);
  if (p.linkedin_url) out.push('Active LinkedIn profile');
  const loc = [p.city, p.country].filter(Boolean).join(', ');
  if (loc) out.push(`Based in ${loc}`);
  void spec;
  return out;
}

function buildGaps(p: NonNullable<ApolloSearchResponse['people']>[number]): string[] {
  const out: string[] = [];
  if (!p.email) out.push('Email not yet revealed (enrich to fetch)');
  if (!p.linkedin_url) out.push('LinkedIn URL missing');
  return out;
}

/**
 * Reconstruct "First Last" from a LinkedIn vanity slug.
 *   http://linkedin.com/in/mario-rossi-93k → "Mario Rossi"
 * Drops the trailing numeric/short token Apollo often appends.
 */
function nameFromLinkedIn(url: string | null | undefined): string {
  if (!url) return '';
  const slug = url.match(/\/in\/([^/?#]+)/)?.[1];
  if (!slug) return '';
  const parts = slug.split('-').filter(p => p.length > 1 && /[a-z]/i.test(p));
  // Drop a trailing 2-3 char alnum tag (Apollo's slug noise) if present
  const last = parts[parts.length - 1];
  if (parts.length > 2 && last && last.length <= 3) parts.pop();
  return parts
    .map(p => p.charAt(0).toUpperCase() + p.slice(1).toLowerCase())
    .join(' ');
}

function derivePlatform(p: NonNullable<ApolloSearchResponse['people']>[number]): Platform {
  // Apollo's data is largely LinkedIn-sourced; we don't get a true platform
  // field from search. Default to LinkedIn unless the linkedin_url is absent
  // (rare — Apollo's primary keying is LinkedIn-based).
  if (p.linkedin_url) return 'LinkedIn';
  // Future: cross-check organization.name against a freelance-platform list.
  void PLATFORMS;
  return 'LinkedIn';
}
