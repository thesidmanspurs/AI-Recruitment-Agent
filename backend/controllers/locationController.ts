import type { Request, Response, NextFunction } from 'express';
import { createError } from '../middleware/errorHandler.js';

/**
 * Live location autocomplete via OpenStreetMap Nominatim.
 *
 * Why proxy instead of calling Nominatim from the browser:
 *   1. Nominatim's usage policy requires a descriptive User-Agent. Browsers
 *      can't set it; we have to do it server-side.
 *   2. CORS — Nominatim's headers are permissive in practice but a server
 *      proxy guarantees consistent behaviour.
 *   3. Lets us cache + rate-limit centrally if needed later.
 *
 * Endpoint: GET /api/locations/search?q=<query>
 * Response: { success, results: [{ name, country, displayName }] }
 *
 * Rate limit: Nominatim's policy is 1 request per second. We don't enforce
 * a global limiter here; instead the frontend debounces typing (~300 ms)
 * which keeps us well under the cap for normal recruiter use.
 */

const NOMINATIM_URL = 'https://nominatim.openstreetmap.org/search';
const USER_AGENT = 'talentscanr/1.0 (admin@talentscanr.com)';

interface NominatimResult {
  display_name?: string;
  name?: string;
  address?: {
    country?: string;
    state?: string;
    city?: string;
    town?: string;
  };
  type?: string;
  class?: string;
}

interface LocationHit {
  name: string;        // short, candidate-friendly label (e.g. "London, England, UK")
  displayName: string; // full Nominatim path for disambiguation
  country?: string;
}

// In-memory cache keyed by lowercased query. 10-min TTL keeps lookup latency
// near-zero for repeated queries during a sourcing session without growing
// unbounded.
const cache = new Map<string, { at: number; hits: LocationHit[] }>();
const TTL_MS = 10 * 60 * 1000;

function shortenName(r: NominatimResult): string {
  const a = r.address ?? {};
  const city = a.city || a.town;
  const parts = [city, a.state, a.country].filter(Boolean) as string[];
  const dn = r.display_name ?? r.name ?? '';

  // If the address-built form is too vague (just a country), fall back to
  // the first 2 segments of display_name which usually carry the place + country.
  // Otherwise prefer the cleaner structured form.
  if (parts.length >= 2) return parts.join(', ');
  if (dn) {
    const seg = dn.split(',').slice(0, 2).map(s => s.trim()).join(', ');
    if (seg) return seg;
  }
  return parts.join(', ') || dn;
}

export const locationController = {
  async search(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const q = String(req.query.q ?? '').trim();
      if (q.length < 2) {
        res.json({ success: true, results: [] });
        return;
      }
      const cacheKey = q.toLowerCase();
      const cached = cache.get(cacheKey);
      if (cached && Date.now() - cached.at < TTL_MS) {
        res.json({ success: true, results: cached.hits, cached: true });
        return;
      }

      const params = new URLSearchParams({
        q,
        format: 'json',
        addressdetails: '1',
        limit: '8',
        'accept-language': 'en',
      });
      const url = `${NOMINATIM_URL}?${params.toString()}`;
      const r = await fetch(url, {
        headers: { 'User-Agent': USER_AGENT, Accept: 'application/json' },
      }).catch(err => {
        throw createError(
          `Location lookup failed: ${err instanceof Error ? err.message : String(err)}`,
          502
        );
      });
      if (!r.ok) {
        return next(createError(`Location service returned HTTP ${r.status}`, 502));
      }
      const raw = (await r.json()) as NominatimResult[];

      // De-dup by short name; keep insertion order so Nominatim's relevance
      // ranking is preserved.
      const seen = new Set<string>();
      const hits: LocationHit[] = [];
      for (const item of raw) {
        const name = shortenName(item);
        if (!name || seen.has(name.toLowerCase())) continue;
        seen.add(name.toLowerCase());
        hits.push({
          name,
          displayName: item.display_name ?? name,
          country: item.address?.country,
        });
      }
      cache.set(cacheKey, { at: Date.now(), hits });
      res.json({ success: true, results: hits });
    } catch (err) {
      next(err);
    }
  },
};
