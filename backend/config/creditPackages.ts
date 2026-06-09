/**
 * Credit packages the user can buy. Server-side source of truth — the client
 * fetches these via GET /api/payments/packages, and create-checkout validates
 * the requested package id against this list (never trusts client-sent prices).
 *
 * Two products:
 *   • start-tier  — recurring monthly SUBSCRIPTION. $149/mo, grants 2000
 *                   credits on every successful invoice (initial + renewals).
 *   • topup-1000  — one-time PAYMENT. $65 for 1000 credits, no auto-rebill.
 *
 * Credits are consumed ONLY when revealing a candidate's email/phone via
 * Apollo (1 credit per reveal). AI sourcing / scoring / outreach are free.
 *
 * Prices are inline price_data at Checkout time (no pre-created Stripe Price
 * IDs needed), so this file is the single place to change pricing.
 */

export type PackageKind = 'subscription' | 'one_time';

export interface CreditPackage {
  id: string;
  name: string;
  /** Short marketing line shown under the title. */
  label: string;
  kind: PackageKind;
  credits: number;
  priceCents: number;
  currency: string;
  /** Only for subscriptions — Stripe recurring interval. */
  interval?: 'month' | 'year';
}

export const CREDIT_PACKAGES: CreditPackage[] = [
  {
    id: 'start-tier',
    name: 'Start Tier',
    label: '2,000 credits every month',
    kind: 'subscription',
    credits: 2000,
    priceCents: 14900, // $149.00
    currency: 'usd',
    interval: 'month',
  },
  {
    id: 'topup-1000',
    name: 'Top-Up Pack',
    label: '1,000 additional credits (one-time)',
    kind: 'one_time',
    credits: 1000,
    priceCents: 6500, // $65.00
    currency: 'usd',
  },
];

export function getPackage(id: string): CreditPackage | undefined {
  return CREDIT_PACKAGES.find(p => p.id === id);
}

/** Credits charged per Apollo contact reveal (email/phone). */
export const CREDITS_PER_REVEAL = 1;
