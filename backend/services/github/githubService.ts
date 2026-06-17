import { env } from '../../config/env.js';
import type { RawCandidateProfile } from '../../types/candidate.types.js';

/**
 * GitHub sourcing — finds real developers from public GitHub profiles.
 *
 * Approach:
 *   1. Build a query from the job title + extracted keywords (treated as
 *      languages/tech) and search GitHub users (GET /search/users).
 *   2. Hydrate each hit (GET /users/{login}) for name, bio, company,
 *      location, blog, PUBLIC email (only if the dev chose to expose it),
 *      and the `hireable` flag.
 *   3. Pull the dev's top repo languages as skills.
 *
 * Honesty / limits:
 *   - We only ever read PUBLIC data. Email is present only when the user
 *     made it public on their profile; otherwise contact stays empty and
 *     outreach happens via their GitHub profile.
 *   - No employment verification, but public code is strong signal — score
 *     is capped at 9.0.
 *   - Auth: a no-scope Personal Access Token (GITHUB_TOKEN) is optional but
 *     lifts the Search API limit from 10 → 30 req/min. Works without it.
 */

const GITHUB_API = 'https://api.github.com';

interface GitHubSearchUser {
  login: string;
  html_url: string;
  type: string;
}
interface GitHubSearchResponse {
  items?: GitHubSearchUser[];
  message?: string;
}
interface GitHubUser {
  login: string;
  name?: string | null;
  company?: string | null;
  blog?: string | null;
  location?: string | null;
  email?: string | null;
  bio?: string | null;
  hireable?: boolean | null;
  html_url: string;
  public_repos?: number;
  followers?: number;
}
interface GitHubRepo {
  fork: boolean;
  language: string | null;
  stargazers_count: number;
}

function headers(): Record<string, string> {
  const h: Record<string, string> = {
    Accept: 'application/vnd.github+json',
    'User-Agent': 'aries-sourcing/0.1',
    'X-GitHub-Api-Version': '2022-11-28',
  };
  if (env.GITHUB_TOKEN) h.Authorization = `Bearer ${env.GITHUB_TOKEN}`;
  return h;
}

/** GitHub user search qualifiers: title words + keywords, plus location. */
function buildQuery(jobTitle: string, keywords: string[], location?: string): string {
  // Free-text terms match name/bio/login; `language:` narrows by primary repo
  // language. Use the two strongest keywords as language filters.
  const terms = [jobTitle, ...keywords.slice(0, 2)]
    .map(t => (t ?? '').replace(/[^a-zA-Z0-9+#. ]/g, ' ').trim())
    .filter(Boolean);
  const langs = keywords
    .slice(0, 2)
    .map(k => k.trim())
    .filter(k => /^[a-zA-Z0-9+#.]+$/.test(k)) // single-token langs only
    .map(k => `language:${k}`);
  const loc = location?.trim() ? ` location:"${location.trim()}"` : '';
  return `${terms.join(' ')} ${langs.join(' ')}${loc} type:user`.trim();
}

async function fetchTopLanguages(login: string): Promise<string[]> {
  const res = await fetch(
    `${GITHUB_API}/users/${encodeURIComponent(login)}/repos?per_page=100&sort=pushed`,
    { headers: headers() }
  ).catch(() => null);
  if (!res || !res.ok) return [];
  const repos = (await res.json()) as GitHubRepo[];
  const counts = new Map<string, number>();
  for (const r of repos) {
    if (r.fork || !r.language) continue;
    counts.set(r.language, (counts.get(r.language) ?? 0) + 1 + Math.min(r.stargazers_count, 5));
  }
  return [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8).map(([lang]) => lang);
}

export const githubService = {
  // Always available — works unauthenticated (just lower rate limits). The
  // token, when present, is used automatically in headers().
  isAvailable(): boolean {
    return true;
  },

  async sourceCandidates(input: {
    jobTitle: string;
    extractedKeywords: string[];
    location?: string;
    limit?: number;
  }): Promise<RawCandidateProfile[]> {
    const limit = Math.max(1, Math.min(30, input.limit ?? 15));
    const q = buildQuery(input.jobTitle, input.extractedKeywords, input.location);

    const searchUrl = `${GITHUB_API}/search/users?q=${encodeURIComponent(q)}&per_page=${limit}`;
    const searchRes = await fetch(searchUrl, { headers: headers() }).catch(err => {
      throw new Error(`GitHub search network error: ${err instanceof Error ? err.message : String(err)}`);
    });
    if (!searchRes.ok) {
      const body = (await searchRes.json().catch(() => ({}))) as GitHubSearchResponse;
      throw new Error(`GitHub search failed: HTTP ${searchRes.status} ${body.message ?? ''}`.trim());
    }
    const items = ((await searchRes.json()) as GitHubSearchResponse).items ?? [];
    const logins = items.filter(u => u.type === 'User').map(u => u.login).slice(0, limit);

    const kwLower = input.extractedKeywords.map(k => k.toLowerCase());

    // Hydrate profiles (and languages) in parallel; a single failure drops
    // just that candidate, never the whole run.
    const profiles = await Promise.all(
      logins.map(async login => {
        const uRes = await fetch(`${GITHUB_API}/users/${encodeURIComponent(login)}`, {
          headers: headers(),
        }).catch(() => null);
        if (!uRes || !uRes.ok) return null;
        const u = (await uRes.json()) as GitHubUser;

        const languages = await fetchTopLanguages(login).catch(() => []);
        const skills = languages.length
          ? languages
          : kwLower.filter(k => `${u.bio ?? ''}`.toLowerCase().includes(k));

        const name = u.name?.trim() || u.login;
        const title = u.bio?.split(/[.\n]/)[0]?.trim().slice(0, 80) || 'Software Developer';
        const company = u.company?.trim() || 'GitHub (independent)';
        const bioParts = [
          u.bio?.trim(),
          languages.length ? `Top languages: ${languages.slice(0, 5).join(', ')}.` : '',
          typeof u.followers === 'number' ? `${u.followers} followers · ${u.public_repos ?? 0} public repos.` : '',
        ].filter(Boolean);
        const bio = bioParts.join(' ').trim() || `GitHub developer @${u.login}.`;

        // Score: base 7.0 for a real public dev profile; bonuses for skill
        // overlap, an open-to-work signal, and an active presence. Capped 9.0.
        const matchedKw = languages.filter(l => kwLower.includes(l.toLowerCase())).length
          + kwLower.filter(k => `${u.bio ?? ''}`.toLowerCase().includes(k)).length;
        let score = 7.0;
        if (matchedKw >= 1) score += 0.6;
        if (matchedKw >= 3) score += 0.5;
        if (u.hireable) score += 0.5;
        if ((u.followers ?? 0) > 50 || (u.public_repos ?? 0) > 20) score += 0.4;
        score = Math.min(9.0, Number(score.toFixed(1)));

        const strengths: string[] = [];
        if (languages.length) strengths.push(`Active in ${languages.slice(0, 3).join(', ')}`);
        if (typeof u.followers === 'number') strengths.push(`${u.followers} GitHub followers`);
        if (u.public_repos) strengths.push(`${u.public_repos} public repositories`);
        if (u.location) strengths.push(`Based in ${u.location}`);

        const gaps: string[] = [];
        if (!u.email) gaps.push('No public email — reach out via their GitHub profile');

        return {
          name,
          currentTitle: title,
          company,
          bio,
          openToWork: !!u.hireable,
          platform: 'GitHub' as const,
          matchScore: score,
          matchExplanation:
            `Sourced from GitHub (@${u.login}). ` +
            (languages.length ? `Builds with ${languages.slice(0, 4).join(', ')}. ` : '') +
            (u.hireable ? 'Profile marked available for hire. ' : '') +
            (u.email ? 'Public email on file.' : 'Outreach via GitHub profile.'),
          skills: skills.slice(0, 10),
          strengths,
          gaps,
          // Contact fields the controller can attach (public email + profile).
          email: u.email ?? undefined,
          githubUrl: u.html_url,
          location: u.location ?? undefined,
        } as RawCandidateProfile & { email?: string; githubUrl?: string; location?: string };
      })
    );

    return profiles.filter((p): p is NonNullable<typeof p> => p !== null);
  },
};
