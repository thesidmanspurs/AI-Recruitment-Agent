import type Stripe from 'stripe';
import { prisma } from '../../config/database.js';
import { creditService } from '../credits/creditService.js';
import { getPackage, CAMPAIGN_PASS_ID } from '../../config/creditPackages.js';
import { getStripe } from './stripeService.js';

/**
 * Stripe → credits reconciliation. Centralises the grant logic so both the
 * webhook AND the verify-session fallback funnel through the SAME idempotent
 * paths (keyed on Stripe session / invoice ids), making double-crediting
 * impossible regardless of which fires first or how often Stripe retries.
 *
 *   • Top-Up Pack (one_time)  → credited on checkout.session.completed,
 *                               idempotent by session id.
 *   • Start Tier (subscription) → credited on invoice paid (initial AND every
 *                               renewal), idempotent by invoice id. The
 *                               subscription carries {userId, packageId,
 *                               credits} in its metadata.
 */

function toDate(unixSeconds: number | null | undefined): Date | null {
  return typeof unixSeconds === 'number' ? new Date(unixSeconds * 1000) : null;
}

function invoiceSubscriptionId(invoice: Stripe.Invoice): string | undefined {
  const inv = invoice as unknown as {
    subscription?: string | { id: string } | null;
    parent?: { subscription_details?: { subscription?: string | { id: string } | null } | null } | null;
    lines?: { data?: Array<{ subscription?: string | { id: string } | null }> } | null;
  };
  const raw =
    inv.subscription ??
    inv.parent?.subscription_details?.subscription ??
    inv.lines?.data?.[0]?.subscription ??
    null;
  if (!raw) return undefined;
  return typeof raw === 'string' ? raw : raw.id;
}

function subscriptionPeriodEnd(sub: Stripe.Subscription): number | null {
  const s = sub as unknown as {
    current_period_end?: number;
    items?: { data?: Array<{ current_period_end?: number }> };
  };
  return s.current_period_end ?? s.items?.data?.[0]?.current_period_end ?? null;
}

// ── Plan-type map ─────────────────────────────────────────────────────────────
const PLAN_TYPE_MAP: Record<string, 'SOURCING' | 'RANKING' | 'PRO'> = {
  'sourcing-plan': 'SOURCING',
  'start-tier':    'SOURCING', // Legacy plan id — treated as SOURCING
  'ranking-plan':  'RANKING',
  'pro-plan':      'PRO',
};

export const billingService = {
  /**
   * Handle a completed Checkout Session.
   * For one-time payments this grants credits / unlocks campaign.
   * For subscriptions: records customer/subscription; credits arrive via invoice.paid.
   */
  async handleCheckoutCompleted(session: Stripe.Checkout.Session): Promise<void> {
    const userId = session.metadata?.userId;
    const packageId = session.metadata?.packageId;
    if (!userId || !packageId) {
      console.error('[Billing] checkout.session.completed missing metadata', session.id);
      return;
    }

    // Persist Stripe customer id
    if (session.customer && typeof session.customer === 'string') {
      await prisma.user.update({
        where: { id: userId },
        data: { stripeCustomerId: session.customer },
      }).catch(() => {});
    }

    // ── Campaign Pass ────────────────────────────────────────────────────────
    if (packageId === CAMPAIGN_PASS_ID) {
      if (session.payment_status !== 'paid') return;
      const campaignId = session.metadata?.campaignId;
      if (!campaignId) {
        console.error('[Billing] campaign-pass session missing campaignId', session.id);
        return;
      }
      const result = await prisma.campaign.updateMany({
        where: { id: campaignId, userId, unlimited: false },
        data: { unlimited: true, unlimitedAt: new Date() },
      });
      if (result.count > 0) {
        console.log(`[Billing] ✅ Campaign Pass: campaign ${campaignId} unlocked (session ${session.id})`);
      }
      return;
    }

    // ── Legacy credit package (topup-1000) ────────────────────────────────────
    const legacyPkg = getPackage(packageId);
    if (legacyPkg?.kind === 'one_time') {
      if (session.payment_status !== 'paid') return;
      const credited = await creditService.addCredits({
        userId,
        credits: legacyPkg.credits,
        type: 'TOPUP_PURCHASE',
        amountCents: session.amount_total ?? legacyPkg.priceCents,
        currency: session.currency ?? legacyPkg.currency,
        reason: `${legacyPkg.name}: +${legacyPkg.credits} credits`,
        packageId: legacyPkg.id,
        stripeSessionId: session.id,
        stripePaymentIntentId:
          typeof session.payment_intent === 'string' ? session.payment_intent : undefined,
      });
      if (credited !== null) {
        console.log(`[Billing] ✅ Top-up: +${legacyPkg.credits} to user ${userId} (session ${session.id})`);
      }
      return;
    }

    // ── Subscription start (base plans + add-ons) ────────────────────────────
    // Just record the subscription id. Credits/flags arrive via invoice.paid.
    if (session.subscription && typeof session.subscription === 'string') {
      const isAddon = packageId === 'ranking-addon' || packageId === 'sourcing-addon';
      const planType = PLAN_TYPE_MAP[packageId];

      const data: Record<string, unknown> = {};
      if (isAddon) {
        // Add-on: set the relevant addon subscription id (flags set in invoice.paid)
        if (packageId === 'ranking-addon') {
          data.rankingAddonSubscriptionId = session.subscription;
        } else {
          data.sourcingAddonSubscriptionId = session.subscription;
        }
      } else {
        // Base plan
        data.stripeSubscriptionId = session.subscription;
        data.subscriptionPlan = packageId;
        data.subscriptionStatus = 'active';
        if (planType) data.planType = planType;
      }
      await prisma.user.update({ where: { id: userId }, data }).catch(() => {});
    }
  },

  /**
   * Handle a paid invoice — grants credits and activates plan/addon flags.
   * Fires on first payment AND every renewal. Idempotent by invoice id.
   */
  async handleInvoicePaid(invoice: Stripe.Invoice): Promise<void> {
    const subId = invoiceSubscriptionId(invoice);
    if (!subId) return;

    const sub = await getStripe().subscriptions.retrieve(subId);
    const userId = sub.metadata?.userId;
    const packageId = sub.metadata?.packageId;
    if (!userId || !packageId) {
      console.error('[Billing] invoice.paid — subscription missing metadata', subId);
      return;
    }

    const periodEnd = toDate(subscriptionPeriodEnd(sub));

    // ── Add-on subscriptions ─────────────────────────────────────────────────
    if (packageId === 'ranking-addon') {
      await prisma.user.update({
        where: { id: userId },
        data: {
          rankingAddonSubscriptionId: subId,
          rankingAddonActive: true,
          rankingAddonStatus: sub.status,
          rankingAddonCurrentPeriodEnd: periodEnd,
        },
      }).catch(() => {});
      console.log(`[Billing] ✅ Ranking Add-on activated for user ${userId} (invoice ${invoice.id})`);
      return;
    }

    if (packageId === 'sourcing-addon') {
      // Sourcing add-on also grants 2000 credits per the plan config
      const subPlan = getSubscriptionPlan(packageId);
      if (subPlan && subPlan.credits > 0) {
        await creditService.addCredits({
          userId,
          credits: subPlan.credits,
          type: 'SUBSCRIPTION_GRANT',
          amountCents: invoice.amount_paid ?? subPlan.priceCents,
          currency: invoice.currency ?? subPlan.currency,
          reason: `${subPlan.name}: +${subPlan.credits} credits`,
          packageId,
          stripeInvoiceId: invoice.id,
        });
      }
      await prisma.user.update({
        where: { id: userId },
        data: {
          sourcingAddonSubscriptionId: subId,
          sourcingAddonActive: true,
          sourcingAddonStatus: sub.status,
          sourcingAddonCurrentPeriodEnd: periodEnd,
        },
      }).catch(() => {});
      console.log(`[Billing] ✅ Sourcing Add-on activated for user ${userId} (invoice ${invoice.id})`);
      return;
    }

    // ── Base plan subscriptions ──────────────────────────────────────────────
    // Try new subscription plan config first; fall back to legacy credit package
    const subPlan = getSubscriptionPlan(packageId);
    const legacyPkg = !subPlan ? getPackage(packageId) : null;
    const credits = subPlan?.credits ?? legacyPkg?.credits ?? 0;
    const priceCents = subPlan?.priceCents ?? legacyPkg?.priceCents ?? 0;
    const planName = subPlan?.name ?? legacyPkg?.name ?? packageId;
    const planType = PLAN_TYPE_MAP[packageId];

    if (credits > 0) {
      await creditService.addCredits({
        userId,
        credits,
        type: 'SUBSCRIPTION_GRANT',
        amountCents: invoice.amount_paid ?? priceCents,
        currency: invoice.currency ?? 'usd',
        reason: `${planName} subscription: +${credits} credits`,
        packageId,
        stripeInvoiceId: invoice.id,
      });
    }

    const userUpdate: Record<string, unknown> = {
      stripeSubscriptionId: subId,
      subscriptionPlan: packageId,
      subscriptionStatus: sub.status,
      subscriptionCurrentPeriodEnd: periodEnd,
    };
    if (planType) userUpdate.planType = planType;

    await prisma.user.update({ where: { id: userId }, data: userUpdate }).catch(() => {});

    console.log(
      `[Billing] ✅ ${planName} (${packageId}): ${credits > 0 ? `+${credits} credits` : 'no credits'} ` +
      `to user ${userId} (invoice ${invoice.id})`,
    );
  },

  /** Sync subscription status changes (cancellation, past_due, renewal). */
  async handleSubscriptionUpdated(sub: Stripe.Subscription): Promise<void> {
    const userId = sub.metadata?.userId;
    const packageId = sub.metadata?.packageId;
    if (!userId) return;

    const periodEnd = toDate(subscriptionPeriodEnd(sub));
    const isCanceled = sub.status === 'canceled';

    // ── Add-on cancel/update ─────────────────────────────────────────────────
    if (packageId === 'ranking-addon') {
      await prisma.user.update({
        where: { id: userId },
        data: {
          rankingAddonStatus: sub.status,
          rankingAddonCurrentPeriodEnd: periodEnd,
          ...(isCanceled ? { rankingAddonActive: false, rankingAddonSubscriptionId: null } : {}),
        },
      }).catch(() => {});
      return;
    }

    if (packageId === 'sourcing-addon') {
      await prisma.user.update({
        where: { id: userId },
        data: {
          sourcingAddonStatus: sub.status,
          sourcingAddonCurrentPeriodEnd: periodEnd,
          ...(isCanceled ? { sourcingAddonActive: false, sourcingAddonSubscriptionId: null } : {}),
        },
      }).catch(() => {});
      return;
    }

    // ── Base plan cancel/update ──────────────────────────────────────────────
    await prisma.user.update({
      where: { id: userId },
      data: {
        subscriptionStatus: sub.status,
        subscriptionCurrentPeriodEnd: periodEnd,
        cancelAtPeriodEnd: sub.cancel_at_period_end ?? false,
        ...(isCanceled
          ? {
              stripeSubscriptionId: null,
              planType: 'NONE',
              cancelAtPeriodEnd: false,
            }
          : {}),
      },
    }).catch(() => {});
  },

  /**
   * verify-session fallback: reconcile a session when the browser lands on the
   * success page. Safe to call repeatedly — all grants are idempotent.
   */
  async reconcileSession(session: Stripe.Checkout.Session): Promise<void> {
    await this.handleCheckoutCompleted(session);
    if (session.mode === 'subscription' && session.subscription) {
      const subId =
        typeof session.subscription === 'string' ? session.subscription : session.subscription.id;
      const sub = await getStripe().subscriptions.retrieve(subId, { expand: ['latest_invoice'] });
      const latest = sub.latest_invoice;
      if (latest && typeof latest !== 'string' && latest.status === 'paid') {
        await this.handleInvoicePaid(latest);
      }
    }
  },
};
