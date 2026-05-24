import { env } from '../../config/env.js';
import { APOLLO_BASE_URL } from '../../config/constants.js';
import type { EnrichmentRequest, ApolloEnrichmentResult } from '../../types/outreach.types.js';

/**
 * Apollo.io People Match integration (Phase 4 — Contact Enrichment).
 *
 * Auth: the API key MUST go in the `X-Api-Key` header. Apollo has deprecated
 * `?api_key=` URL params (notice shown in their dashboard, Nov 2025).
 *
 * Endpoint: POST /api/v1/people/match
 * Docs: https://docs.apollo.io/reference/people-enrichment
 *
 * Returns 200 with `person: {...}` on hit, 200 with `person: null` on miss,
 * 401 on bad key, 403 if the plan lacks API access (common on free tier).
 * The controller decides what to do with each; the service just normalises
 * the response and surfaces clean errors.
 */

interface ApolloPersonResponse {
  person?: {
    email?: string | null;
    phone_numbers?: Array<{ sanitized_number?: string; raw_number?: string }>;
    city?: string | null;
    state?: string | null;
    country?: string | null;
    linkedin_url?: string | null;
    organization?: { name?: string | null; primary_domain?: string | null } | null;
    title?: string | null;
  } | null;
}

export class ApolloError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = 'ApolloError';
  }
}

function splitName(full: string): { first: string; last: string } {
  const parts = full.trim().split(/\s+/);
  if (parts.length === 1) return { first: parts[0], last: '' };
  return { first: parts[0], last: parts.slice(1).join(' ') };
}

export const apolloService = {
  isAvailable(): boolean {
    return !!env.APOLLO_API_KEY;
  },

  /**
   * Look up one person on Apollo. On Apollo Basic, the single most reliable
   * way to get a full match (with verified email) is to pass `linkedin_url`
   * — Apollo can then return the exact person from their DB. Passing only
   * first_name + company on Basic frequently returns an empty redacted
   * record because Apollo can't disambiguate without the URL.
   *
   * The richer record this endpoint returns (name, title, company, email,
   * linkedin_url, location) is also what powers the "paste-LinkedIn-URL"
   * sourcing path: we call this with just a URL and persist the result as
   * a brand-new candidate.
   */
  async enrichByLinkedInUrl(linkedinUrl: string): Promise<{
    found: boolean;
    name?: string;
    firstName?: string;
    lastName?: string;
    title?: string;
    company?: string;
    companyDomain?: string;
    email?: string;
    phone?: string;
    location?: string;
    linkedinUrl?: string;
    photoUrl?: string;
  }> {
    if (!env.APOLLO_API_KEY) {
      throw new ApolloError(401, 'APOLLO_API_KEY is not configured on the server.');
    }
    const body = { linkedin_url: linkedinUrl, reveal_phone_number: false };
    const res = await fetch(`${APOLLO_BASE_URL}/people/match`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache',
        'X-Api-Key': env.APOLLO_API_KEY,
      },
      body: JSON.stringify(body),
    }).catch(err => {
      throw new ApolloError(
        0,
        `Network error reaching Apollo: ${err instanceof Error ? err.message : String(err)}`
      );
    });
    const text = await res.text();
    let json: ApolloPersonResponse & { error?: string; message?: string };
    try {
      json = text ? JSON.parse(text) : {};
    } catch {
      throw new ApolloError(res.status, `Apollo returned non-JSON: ${text.slice(0, 200)}`);
    }
    if (!res.ok) {
      throw new ApolloError(
        res.status,
        `Apollo: ${json.error || json.message || `HTTP ${res.status}`}`
      );
    }
    const p = json.person;
    if (!p) return { found: false };

    const first = (p as { first_name?: string }).first_name?.trim();
    const last = (p as { last_name?: string }).last_name?.trim();
    const fullName = [first, last].filter(Boolean).join(' ');
    const phone = p.phone_numbers?.[0]?.sanitized_number ?? p.phone_numbers?.[0]?.raw_number;
    const location = [p.city, p.state, p.country].filter(Boolean).join(', ') || undefined;
    return {
      found: true,
      name: fullName || undefined,
      firstName: first,
      lastName: last,
      title: p.title ?? undefined,
      company: p.organization?.name ?? undefined,
      companyDomain: p.organization?.primary_domain ?? undefined,
      email: p.email ?? undefined,
      phone,
      location,
      linkedinUrl: p.linkedin_url ?? undefined,
      photoUrl: (p as { photo_url?: string }).photo_url ?? undefined,
    };
  },

  /**
   * Look up by Apollo's internal person id (returned in Search responses).
   * This is the unlock on Basic tier: Search gives us first_name +
   * obfuscated last name + an `id`. Match-by-id returns the full record
   * including verified email. Costs 1 credit per call when a match exists.
   */
  async enrichById(id: string): Promise<{
    found: boolean;
    name?: string;
    firstName?: string;
    lastName?: string;
    title?: string;
    company?: string;
    companyDomain?: string;
    email?: string;
    phone?: string;
    location?: string;
    linkedinUrl?: string;
    photoUrl?: string;
  }> {
    if (!env.APOLLO_API_KEY) {
      throw new ApolloError(401, 'APOLLO_API_KEY is not configured.');
    }
    const body = { id, reveal_phone_number: false };
    const res = await fetch(`${APOLLO_BASE_URL}/people/match`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache',
        'X-Api-Key': env.APOLLO_API_KEY,
      },
      body: JSON.stringify(body),
    }).catch(err => {
      throw new ApolloError(
        0,
        `Network error reaching Apollo: ${err instanceof Error ? err.message : String(err)}`
      );
    });
    const text = await res.text();
    let json: ApolloPersonResponse & { error?: string };
    try {
      json = text ? JSON.parse(text) : {};
    } catch {
      throw new ApolloError(res.status, `Apollo non-JSON: ${text.slice(0, 200)}`);
    }
    if (!res.ok) {
      throw new ApolloError(res.status, `Apollo: ${json.error || `HTTP ${res.status}`}`);
    }
    const p = json.person;
    if (!p) return { found: false };
    const first = (p as { first_name?: string }).first_name?.trim();
    const last = (p as { last_name?: string }).last_name?.trim();
    const fullName = [first, last].filter(Boolean).join(' ');
    const phone = p.phone_numbers?.[0]?.sanitized_number ?? p.phone_numbers?.[0]?.raw_number;
    const location = [p.city, p.state, p.country].filter(Boolean).join(', ') || undefined;
    return {
      found: true,
      name: fullName || undefined,
      firstName: first,
      lastName: last,
      title: p.title ?? undefined,
      company: p.organization?.name ?? undefined,
      companyDomain: p.organization?.primary_domain ?? undefined,
      email: p.email ?? undefined,
      phone,
      location,
      linkedinUrl: p.linkedin_url ?? undefined,
      photoUrl: (p as { photo_url?: string }).photo_url ?? undefined,
    };
  },

  /**
   * Look up one person on Apollo. Returns `{ found: false }` if Apollo has
   * the request but no match in their DB; throws ApolloError for transport
   * issues (auth, plan, rate limit, network).
   */
  async enrichContact(request: EnrichmentRequest): Promise<ApolloEnrichmentResult> {
    if (!env.APOLLO_API_KEY) {
      throw new ApolloError(401, 'APOLLO_API_KEY is not configured on the server.');
    }

    const { first, last } = splitName(request.name);
    const body: Record<string, unknown> = {
      first_name: first,
      last_name: last,
      organization_name: request.company || undefined,
      linkedin_url: request.linkedinUrl || undefined,
      // Phone reveal is a paid feature on Apollo; this hint costs nothing if
      // unsupported and unlocks the phone field when it is.
      reveal_phone_number: false,
    };

    let res: Response;
    try {
      res = await fetch(`${APOLLO_BASE_URL}/people/match`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache',
          'X-Api-Key': env.APOLLO_API_KEY,
        },
        body: JSON.stringify(body),
      });
    } catch (err) {
      throw new ApolloError(
        0,
        `Network error reaching Apollo: ${err instanceof Error ? err.message : String(err)}`
      );
    }

    const text = await res.text();
    let json: ApolloPersonResponse & { error?: string; message?: string };
    try {
      json = text ? JSON.parse(text) : {};
    } catch {
      throw new ApolloError(res.status, `Apollo returned non-JSON: ${text.slice(0, 200)}`);
    }

    if (!res.ok) {
      const reason = json.error || json.message || `HTTP ${res.status}`;
      throw new ApolloError(res.status, `Apollo: ${reason}`);
    }

    const person = json.person;
    if (!person) return { found: false };

    const phone =
      person.phone_numbers?.[0]?.sanitized_number ??
      person.phone_numbers?.[0]?.raw_number ??
      undefined;
    const location = [person.city, person.state, person.country].filter(Boolean).join(', ') || undefined;

    return {
      found: true,
      email: person.email ?? undefined,
      phone,
      location,
    };
  },
};
