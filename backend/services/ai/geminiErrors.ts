/**
 * Gemini error normaliser.
 *
 * The Google GenAI SDK throws errors whose `.message` is a stringified JSON
 * envelope from the upstream API:
 *   {"error":{"code":429,"message":"...","status":"RESOURCE_EXHAUSTED","details":[...]}}
 *
 * Surfaced verbatim, this looks awful in a UI banner. This helper extracts the
 * useful bits — code, status, retry hint — and returns a short human sentence
 * we can attach to `simulationReason`.
 */

interface ParsedGeminiError {
  code?: number;
  status?: string;
  message?: string;
  retrySeconds?: number;
  quotaScope?: 'minute' | 'day' | 'tokens' | 'unknown';
}

function parseGeminiError(raw: unknown): ParsedGeminiError {
  if (!(raw instanceof Error)) return {};

  // Try to find a JSON blob inside the message.
  const match = raw.message.match(/\{[\s\S]*\}/);
  if (!match) return { message: raw.message.slice(0, 200) };

  try {
    const payload = JSON.parse(match[0]) as {
      error?: {
        code?: number;
        status?: string;
        message?: string;
        details?: Array<{
          '@type'?: string;
          retryDelay?: string;
          violations?: Array<{ quotaId?: string }>;
        }>;
      };
    };
    const err = payload.error ?? {};
    const details = err.details ?? [];

    let retrySeconds: number | undefined;
    let quotaScope: ParsedGeminiError['quotaScope'] = 'unknown';

    for (const d of details) {
      if (d['@type']?.includes('RetryInfo') && d.retryDelay) {
        const n = parseInt(d.retryDelay, 10);
        if (Number.isFinite(n)) retrySeconds = n;
      }
      if (d['@type']?.includes('QuotaFailure') && d.violations) {
        for (const v of d.violations) {
          const id = v.quotaId ?? '';
          if (/PerDay/i.test(id)) quotaScope = 'day';
          else if (/PerMinute/i.test(id) && quotaScope === 'unknown') quotaScope = 'minute';
          else if (/Token/i.test(id) && quotaScope === 'unknown') quotaScope = 'tokens';
        }
      }
    }

    return {
      code: err.code,
      status: err.status,
      message: err.message,
      retrySeconds,
      quotaScope,
    };
  } catch {
    return { message: raw.message.slice(0, 200) };
  }
}

/**
 * Turn any Gemini error into a one-line, user-facing explanation.
 * Examples:
 *   "Gemini free-tier daily quota exhausted — using fallback data."
 *   "Gemini rate-limited (try again in ~28s) — using fallback data."
 *   "Gemini call failed (404 NOT_FOUND) — using fallback data."
 */
export function formatGeminiError(err: unknown): string {
  const parsed = parseGeminiError(err);

  if (parsed.code === 429) {
    if (parsed.quotaScope === 'day') {
      return 'Gemini free-tier daily quota exhausted — using fallback data. Upgrade billing or wait for the daily reset.';
    }
    const retry = parsed.retrySeconds ? ` (retry in ~${parsed.retrySeconds}s)` : '';
    return `Gemini rate-limited${retry} — using fallback data.`;
  }

  if (parsed.code) {
    return `Gemini call failed (${parsed.code} ${parsed.status ?? ''}) — using fallback data.`;
  }

  return parsed.message
    ? `Gemini call failed: ${parsed.message} — using fallback data.`
    : 'Gemini call failed — using fallback data.';
}
