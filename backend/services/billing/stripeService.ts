import Stripe from 'stripe';
import { env } from '../../config/env.js';

/**
 * Lazily-constructed singleton Stripe client. We don't pin `apiVersion` — the
 * installed SDK ships with its own pinned version and the TS types are bound to
 * it, so letting the SDK pick avoids a version/type mismatch.
 *
 * Throws if STRIPE_SECRET_KEY is missing so callers fail loudly rather than
 * making unauthenticated calls. Use isStripeConfigured() (env.ts) to guard.
 */
let client: Stripe | null = null;

export function getStripe(): Stripe {
  if (!env.STRIPE_SECRET_KEY) {
    throw new Error('STRIPE_SECRET_KEY is not configured.');
  }
  if (!client) {
    client = new Stripe(env.STRIPE_SECRET_KEY);
  }
  return client;
}
