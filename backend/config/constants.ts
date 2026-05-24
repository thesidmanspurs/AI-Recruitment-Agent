// gemini-2.0-flash was retired for new users (Nov 2025). Use 2.5-flash.
// Alternatives: 'gemini-2.5-flash-lite' (cheaper), 'gemini-flash-latest'.
export const GEMINI_MODEL = 'gemini-2.5-flash';

// Lowered from 9.5 → 7.0 because the previous value was tuned for Gemini's
// inflated synthetic scoring; real Apollo candidates score 5-9 on the token-
// overlap scorer, so 9.5 left the Approved Queue permanently empty.
// Admins can override per-platform later via AppSetting if needed.
export const SUITABILITY_THRESHOLD = 7.0;

export const APOLLO_BASE_URL = 'https://api.apollo.io/v1';

export const OUTREACH_FOLLOW_UP_HOURS = 48;

export const PLATFORMS = ['LinkedIn', 'Upwork', 'Reddit'] as const;

export const OUTREACH_STATUSES = [
  'Sourced',
  'Enriched',
  'Outreach Sent',
  'Opened',
  'Replied',
  'No Response',
] as const;
