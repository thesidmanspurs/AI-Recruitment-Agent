/**
 * Subscription Plans — server-side source of truth for ALL plan pricing.
 *
 * Architecture:
 *   3 base plans:
 *     sourcing-plan   $149/mo  → sets planType = SOURCING
 *     ranking-plan    $99/mo   → sets planType = RANKING
 *     pro-plan        $229/mo  → sets planType = PRO
 *
 *   2 add-ons (purchased on top of an existing base plan):
 *     ranking-addon   $109/mo  → sets rankingAddonActive = true  (for SOURCING users)
 *     sourcing-addon  $159/mo  → sets sourcingAddonActive = true (for RANKING  users)
 *
 * Feature access is derived at runtime:
 *   hasSourceAccess  = planType IN (SOURCING, PRO) OR sourcingAddonActive
 *   hasRankingAccess = planType IN (RANKING, PRO)  OR rankingAddonActive
 *
 * Prices are inline price_data at Checkout time (no pre-created Stripe Price
 * IDs needed) — change pricing here and it takes effect on next checkout.
 */

export type PlanKind = 'subscription' | 'one_time';

export interface SubscriptionPlan {
  id: string;
  name: string;
  /** Short marketing copy shown under the plan title. */
  label: string;
  kind: PlanKind;
  priceCents: number;
  currency: string;
  interval: 'month' | 'year';
  /** Credits granted every billing period (0 for ranking-only plans). */
  credits: number;
  /**
   * Free trial duration in days. 0 = no trial.
   * Applied to Stripe Checkout as `subscription_data.trial_period_days`.
   */
  trialDays: number;
  /**
   * The planType value set on the User when this plan's subscription is active.
   * null for add-ons (they only flip a boolean flag, not planType).
   */
  planType: 'SOURCING' | 'RANKING' | 'PRO' | null;
  /**
   * For add-ons only — which base plan this add-on is compatible with.
   * The checkout endpoint validates that the user owns this base plan first.
   */
  addOnFor?: 'sourcing-plan' | 'ranking-plan';
  /**
   * Which feature flags this plan/add-on activates on the User row.
   * Processed by billingService when the subscription becomes active.
   */
  grants: Array<'sourcingAddon' | 'rankingAddon'>;
}

export const SUBSCRIPTION_PLANS: SubscriptionPlan[] = [
  // ── Base plans ──────────────────────────────────────────────────────────
  {
    id: 'sourcing-plan',
    name: 'Sourcing Plan',
    label: 'AI sourcing, enrichment & outreach · 2,000 credits/month',
    kind: 'subscription',
    priceCents: 14900, // $149.00
    currency: 'usd',
    interval: 'month',
    credits: 2000,
    trialDays: 0,
    planType: 'SOURCING',
    grants: [],
  },
  {
    id: 'ranking-plan',
    name: 'Ranking Plan',
    label: 'Upload CVs and rank candidates with AI',
    kind: 'subscription',
    priceCents: 9900, // $99.00
    currency: 'usd',
    interval: 'month',
    credits: 0,
    trialDays: 7, // 7-day free trial
    planType: 'RANKING',
    grants: [],
  },
  {
    id: 'pro-plan',
    name: 'Pro Plan',
    label: 'Full sourcing + CV ranking · 2,000 credits/month · Best value',
    kind: 'subscription',
    priceCents: 22900, // $229.00
    currency: 'usd',
    interval: 'month',
    credits: 2000,
    trialDays: 7, // 7-day free trial
    planType: 'PRO',
    grants: [],
  },

  // ── Add-ons ─────────────────────────────────────────────────────────────
  {
    id: 'ranking-addon',
    name: 'CV Ranking Add-on',
    label: 'Add CV ranking to your Sourcing Plan · +$109/month',
    kind: 'subscription',
    priceCents: 10900, // $109.00
    currency: 'usd',
    interval: 'month',
    credits: 0,
    trialDays: 0,
    planType: null, // Does not change planType; only flips rankingAddonActive
    addOnFor: 'sourcing-plan',
    grants: ['rankingAddon'],
  },
  {
    id: 'sourcing-addon',
    name: 'AI Sourcing Add-on',
    label: 'Add AI sourcing to your Ranking Plan · +$159/month · 2,000 credits/month',
    kind: 'subscription',
    priceCents: 15900, // $159.00
    currency: 'usd',
    interval: 'month',
    credits: 2000,
    trialDays: 0,
    planType: null, // Does not change planType; only flips sourcingAddonActive
    addOnFor: 'ranking-plan',
    grants: ['sourcingAddon'],
  },
];

/** Look up a plan by id. */
export function getSubscriptionPlan(id: string): SubscriptionPlan | undefined {
  return SUBSCRIPTION_PLANS.find(p => p.id === id);
}

/**
 * Plans shown in the public /api/payments/plans response.
 * Add-ons are filtered out; they are shown conditionally in the UI based on
 * the user's current planType.
 */
export function getPublicPlans(): SubscriptionPlan[] {
  return SUBSCRIPTION_PLANS.filter(p => !p.addOnFor);
}

/**
 * Add-on plans the user is eligible to purchase based on their current plan.
 * Returns [] when the user already has Pro (nothing left to add).
 */
export function getEligibleAddons(currentPlanId: string | null | undefined): SubscriptionPlan[] {
  if (!currentPlanId) return [];
  return SUBSCRIPTION_PLANS.filter(p => p.addOnFor === currentPlanId);
}

/**
 * Derive feature access flags from a user's plan state.
 * Called by middleware and the balance endpoint.
 *
 * Access rules:
 *   - NONE/null plan: hasSourceAccess = true (freemium sourcing — UI is open,
 *     contact reveal costs credits as always). hasRankingAccess = false.
 *   - SOURCING active sub: hasSourceAccess = true.
 *   - RANKING active sub: hasRankingAccess = true.
 *   - PRO active sub: both true.
 *   - Add-ons supplement the base plan.
 */
export function deriveAccess(user: {
  planType: string | null;
  sourcingAddonActive: boolean;
  rankingAddonActive: boolean;
  subscriptionStatus?: string | null;
  sourcingAddonStatus?: string | null;
  rankingAddonStatus?: string | null;
}): { hasSourceAccess: boolean; hasRankingAccess: boolean } {
  const basePlanActive =
    user.subscriptionStatus === 'active' || user.subscriptionStatus === 'trialing';
  const sourcingAddonLive =
    user.sourcingAddonActive &&
    (user.sourcingAddonStatus === 'active' || user.sourcingAddonStatus === 'trialing');
  const rankingAddonLive =
    user.rankingAddonActive &&
    (user.rankingAddonStatus === 'active' || user.rankingAddonStatus === 'trialing');

  // Freemium sourcing: NONE or null plan users get the sourcing UI for free.
  // They can search and see candidates — they only spend credits to reveal contacts.
  const isFreemiumOrNoSub =
    !user.planType || user.planType === 'NONE' || user.planType === 'null';

  const hasSourceAccess =
    isFreemiumOrNoSub ||
    (basePlanActive && (user.planType === 'SOURCING' || user.planType === 'PRO')) ||
    sourcingAddonLive;

  const hasRankingAccess =
    (basePlanActive && (user.planType === 'RANKING' || user.planType === 'PRO')) ||
    rankingAddonLive;

  return { hasSourceAccess, hasRankingAccess };
}

