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

  // Email Outreach
  SMTP_HOST: process.env.SMTP_HOST || '',
  SMTP_PORT: parseInt(process.env.SMTP_PORT || '587', 10),
  SMTP_USER: process.env.SMTP_USER || '',
  SMTP_PASS: process.env.SMTP_PASS || '',
  SMTP_FROM: process.env.SMTP_FROM || 'recruiter@agent.local',

  // Tracking
  ALERT_THRESHOLD_HOURS: parseInt(process.env.ALERT_THRESHOLD_HOURS || '48', 10),

  // CORS
  CORS_ORIGIN: parseList(process.env.CORS_ORIGIN),
};
