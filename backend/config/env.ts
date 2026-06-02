import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Backend secrets live at the repo root (../../.env relative to this file).
// They MUST NOT be moved into frontend/ — Vite would otherwise have visibility
// of the file even if it does not auto-inline non-VITE_* keys.
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

function parseList(value: string | undefined): string[] {
  return (value ?? '')
    .split(',')
    .map(v => v.trim())
    .filter(Boolean);
}

export const env = {
  PORT: parseInt(process.env.PORT || '3000', 10),
  NODE_ENV: process.env.NODE_ENV || 'development',

  // Database
  DATABASE_URL: process.env.DATABASE_URL || '',

  // Auth
  JWT_SECRET: process.env.JWT_SECRET || 'change-me-in-production',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',
  // Comma-separated allowlist of emails that should always be ADMIN. Applied
  // on register (new accounts) and on login (self-heal for existing rows).
  ADMIN_EMAILS: parseList(process.env.ADMIN_EMAILS).map(e => e.toLowerCase()),

  // AI Brain
  GEMINI_API_KEY: process.env.GEMINI_API_KEY || '',

  // Contact Enrichment — Apollo has separate scoped keys per endpoint on
  // multi-key accounts. Each falls back to APOLLO_API_KEY so existing
  // deployments with a single key keep working.
  APOLLO_API_KEY: process.env.APOLLO_API_KEY || '',
  APOLLO_PEOPLE_SEARCH_KEY:
    process.env.APOLLO_PEOPLE_SEARCH_KEY || process.env.APOLLO_API_KEY || '',
  APOLLO_BULK_MATCH_KEY:
    process.env.APOLLO_BULK_MATCH_KEY || process.env.APOLLO_API_KEY || '',
  APOLLO_ORG_SEARCH_KEY:
    process.env.APOLLO_ORG_SEARCH_KEY || process.env.APOLLO_API_KEY || '',
  APOLLO_ORG_ENRICH_KEY:
    process.env.APOLLO_ORG_ENRICH_KEY || process.env.APOLLO_API_KEY || '',

  // Apollo async phone-reveal webhook. APP_BASE_URL is the public origin
  // (e.g. the Cloud Run URL); APOLLO_WEBHOOK_SECRET guards the endpoint via
  // a query-string token since Apollo Basic doesn't sign webhook payloads.
  APP_BASE_URL: process.env.APP_BASE_URL || '',
  APOLLO_WEBHOOK_SECRET: process.env.APOLLO_WEBHOOK_SECRET || '',

  // Reddit OAuth2 (client-credentials flow). Register at
  // https://www.reddit.com/prefs/apps → create "script" app. Used to source
  // candidates from public posts in hiring-relevant subreddits.
  REDDIT_CLIENT_ID: process.env.REDDIT_CLIENT_ID || '',
  REDDIT_CLIENT_SECRET: process.env.REDDIT_CLIENT_SECRET || '',
  REDDIT_USER_AGENT: process.env.REDDIT_USER_AGENT || 'aries-sourcing/0.1',

  // Email Outreach is now PER-USER (no shared mailbox). Each recruiter
  // configures their own Gmail App Password or Resend key, encrypted at
  // rest with ENCRYPTION_KEY. The legacy shared SMTP_* vars are gone.
  ENCRYPTION_KEY: process.env.ENCRYPTION_KEY || '',
  // Gmail SMTP host/port are fixed for the per-user Gmail provider.
  GMAIL_SMTP_HOST: 'smtp.gmail.com',
  GMAIL_SMTP_PORT: 465,
  GMAIL_IMAP_HOST: 'imap.gmail.com',

  // Tracking
  ALERT_THRESHOLD_HOURS: parseInt(process.env.ALERT_THRESHOLD_HOURS || '48', 10),

  // CORS
  CORS_ORIGIN: parseList(process.env.CORS_ORIGIN),
};
