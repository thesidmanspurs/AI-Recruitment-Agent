import { env } from '../../config/env.js';
import type { RawCandidateProfile } from '../../types/candidate.types.js';

/**
 * Reddit sourcing — finds real people who are publicly looking for work
 * or actively posting in role-relevant subreddits.
 *
 * Approach:
 *   1. Authenticate via Reddit OAuth2 "client credentials" (script-app
 *      style, no user grant needed — Reddit issues a 1-hour app token).
 *   2. Search a curated set of hiring/role subreddits for recent posts
 *      whose body matches the campaign's keywords.
 *   3. Distinct authors become candidate rows. We never invent users —
 *      every row corresponds to a real Reddit account that posted in
 *      public within the lookback window.
 *
 * Limits / honesty:
 *   - Reddit gives us username + post text + karma. We do NOT get real
 *     name, email, or phone unless the user typed them in their profile
 *     or post. Those candidates land in the table with platform=Reddit
 *     and contact fields empty — outreach happens via Reddit DM.
 *   - Match score is capped at 8.5 because we can't verify employment
 *     history the way Apollo can.
 *   - Cold-start latency: ~300ms to fetch the OAuth token (cached for
 *     50 minutes); ~200-500ms per subreddit search call.
 *
 * Auth: register an OAuth "script" app at https://www.reddit.com/prefs/apps
 * — record the client_id + client_secret as REDDIT_CLIENT_ID /
 * REDDIT_CLIENT_SECRET secrets. REDDIT_USER_AGENT is required by Reddit
 * and should be a descriptive string like "talentscanr-sourcing/1.0 by <user>".
 */

const REDDIT_OAUTH_BASE = 'https://oauth.reddit.com';
const REDDIT_AUTH_URL = 'https://www.reddit.com/api/v1/access_token';

// Where we look. We OR-search across these and dedupe by author. Generic
// hiring boards come first (highest signal that the user is open to work),
// followed by role-specific tech subreddits the campaign can extend.
const DEFAULT_SUBREDDITS = [
  'forhire',
  'jobbit',
  'remotejs',
  'cscareerquestions',
  'jobsearch',
];

// Cached OAuth token. Reddit tokens last an hour; we refresh after 50min.
let tokenCache: { token: string; expiresAt: number } | null = null;

interface RedditAuthResponse {
  access_token?: string;
  token_type?: string;
  expires_in?: number;
  error?: string;
}

interface RedditPost {
  data: {
    id: string;
    title: string;
    selftext: string;
    author: string;
    subreddit: string;
    permalink: string;
    created_utc: number;
    score: number;
    over_18: boolean;
    author_flair_text: string | null;
  };
}

interface RedditUser {
  data?: {
    name?: string;
    total_karma?: number;
    created_utc?: number;
    subreddit?: { public_description?: string; title?: string } | null;
  };
}

interface RedditListing {
  data?: { children?: RedditPost[] };
}

async function getAppToken(): Promise<string> {
  if (tokenCache && tokenCache.expiresAt > Date.now()) return tokenCache.token;
  if (!env.REDDIT_CLIENT_ID || !env.REDDIT_CLIENT_SECRET) {
    throw new Error('Reddit OAuth is not configured (REDDIT_CLIENT_ID / REDDIT_CLIENT_SECRET).');
  }
  const basic = Buffer.from(`${env.REDDIT_CLIENT_ID}:${env.REDDIT_CLIENT_SECRET}`).toString('base64');
  const res = await fetch(REDDIT_AUTH_URL, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${basic}`,
      'Content-Type': 'application/x-www-form-urlencoded',
      'User-Agent': env.REDDIT_USER_AGENT,
    },
    body: 'grant_type=client_credentials',
  });
  const json = (await res.json()) as RedditAuthResponse;
  if (!res.ok || !json.access_token) {
    throw new Error(`Reddit OAuth failed: HTTP ${res.status} ${json.error ?? ''}`);
  }
  tokenCache = {
    token: json.access_token,
    expiresAt: Date.now() + Math.min((json.expires_in ?? 3600) - 600, 3000) * 1000,
  };
  return json.access_token;
}

async function searchSubreddit(
  subreddit: string,
  query: string,
  token: string
): Promise<RedditPost[]> {
  const params = new URLSearchParams({
    q: query,
    restrict_sr: 'on',
    sort: 'new',
    t: 'month',
    limit: '25',
  });
  const url = `${REDDIT_OAUTH_BASE}/r/${encodeURIComponent(subreddit)}/search?${params}`;
  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
      'User-Agent': env.REDDIT_USER_AGENT,
    },
  });
  if (!res.ok) {
    // Per-subreddit failure shouldn't kill the whole sourcing run.
    console.warn(`[Reddit] /r/${subreddit} search returned HTTP ${res.status}`);
    return [];
  }
  const json = (await res.json()) as RedditListing;
  return json.data?.children ?? [];
}

async function fetchUser(username: string, token: string): Promise<RedditUser> {
  const res = await fetch(`${REDDIT_OAUTH_BASE}/user/${encodeURIComponent(username)}/about`, {
    headers: {
      Authorization: `Bearer ${token}`,
      'User-Agent': env.REDDIT_USER_AGENT,
    },
  });
  if (!res.ok) return {};
  return (await res.json()) as RedditUser;
}

function buildSearchQuery(jobTitle: string, keywords: string[]): string {
  // Reddit search is OR by default; we narrow with the job title and the
  // two strongest keywords. More terms = fewer hits.
  const top = keywords.slice(0, 2).join(' ');
  return [jobTitle, top].filter(Boolean).join(' ').trim();
}

export const redditService = {
  isAvailable(): boolean {
    // Treat the literal "PLACEHOLDER" the same as empty so the deploy can
    // ship before real Reddit credentials are provisioned.
    const real = (v: string) => !!v && v !== 'PLACEHOLDER';
    return real(env.REDDIT_CLIENT_ID) && real(env.REDDIT_CLIENT_SECRET) && !!env.REDDIT_USER_AGENT;
  },

  /**
   * Find candidates posting in hiring-relevant subreddits within the last
   * month. Returns one RawCandidateProfile per distinct author whose post
   * matches the search. Posts marked NSFW or by deleted users are skipped.
   */
  async sourceCandidates(input: {
    jobTitle: string;
    extractedKeywords: string[];
    subreddits?: string[];
    limit?: number;
  }): Promise<RawCandidateProfile[]> {
    if (!this.isAvailable()) return [];
    const token = await getAppToken();
    const query = buildSearchQuery(input.jobTitle, input.extractedKeywords);
    const subs = input.subreddits?.length ? input.subreddits : DEFAULT_SUBREDDITS;
    const limit = Math.max(1, Math.min(50, input.limit ?? 25));

    // Parallel search across subreddits; failures inside one sub don't
    // affect the others.
    const postsBySub = await Promise.all(subs.map(s => searchSubreddit(s, query, token)));
    const allPosts = postsBySub.flat();

    // Dedupe by author — one candidate per Reddit user, picking their
    // best-scoring post as the representative bio.
    const byAuthor = new Map<string, RedditPost>();
    for (const post of allPosts) {
      if (!post.data || !post.data.author || post.data.author === '[deleted]') continue;
      if (post.data.over_18) continue;
      const cur = byAuthor.get(post.data.author);
      if (!cur || cur.data.score < post.data.score) {
        byAuthor.set(post.data.author, post);
      }
    }

    const authors = [...byAuthor.entries()].slice(0, limit);

    // Hydrate each author with their /about endpoint so we can show
    // karma + account-age signals (also used for scoring).
    const enriched = await Promise.all(
      authors.map(async ([author, post]) => {
        const userInfo = await fetchUser(author, token).catch(() => ({}) as RedditUser);
        const karma = userInfo.data?.total_karma ?? 0;
        const ageDays = userInfo.data?.created_utc
          ? Math.floor((Date.now() / 1000 - userInfo.data.created_utc) / 86400)
          : 0;
        const profileBlurb = userInfo.data?.subreddit?.public_description ?? '';

        const title = post.data.author_flair_text || post.data.title.slice(0, 80) || 'Reddit candidate';
        const bio = [profileBlurb, post.data.selftext.slice(0, 400)]
          .filter(Boolean)
          .join('\n\n')
          .trim() || `Posted in r/${post.data.subreddit}: ${post.data.title}`;

        // Scoring rationale:
        //   base 7.0 — Reddit post = open-to-discussion signal but no
        //              employment verification.
        //   +0.5    — karma > 500 (sustained community member, not throwaway)
        //   +0.5    — account age > 365 days
        //   +0.5    — posted in r/forhire or r/jobbit (explicit hire intent)
        let score = 7.0;
        if (karma > 500) score += 0.5;
        if (ageDays > 365) score += 0.5;
        if (['forhire', 'jobbit'].includes(post.data.subreddit.toLowerCase())) score += 0.5;
        score = Math.min(score, 8.5);

        const strengths: string[] = [];
        if (karma > 0) strengths.push(`${karma.toLocaleString()} Reddit karma`);
        if (ageDays > 0) strengths.push(`${Math.floor(ageDays / 30)} months on Reddit`);
        strengths.push(`Active in r/${post.data.subreddit}`);

        return {
          name: `u/${author}`,
          currentTitle: title,
          company: `Reddit / r/${post.data.subreddit}`,
          bio,
          openToWork: ['forhire', 'jobbit'].includes(post.data.subreddit.toLowerCase()),
          platform: 'Reddit' as const,
          matchScore: score,
          matchExplanation:
            `Found via Reddit search in r/${post.data.subreddit}. ` +
            `Post score ${post.data.score}, author karma ${karma}, account age ${ageDays}d. ` +
            `Outreach via Reddit DM.`,
          skills: [],
          strengths,
          gaps: ['No verified email/phone — Reddit DM is the outreach channel'],
        } satisfies RawCandidateProfile;
      })
    );

    return enriched;
  },
};
