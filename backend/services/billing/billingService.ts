import type Stripe from 'stripe';
import { prisma } from '../../config/database.js';
import { creditService } from '../credits/creditService.js';
import { getPackage } from '../../config/creditPackages.js';
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

/**
 * Resolve the subscription id from an invoice. Stripe moved this field between
 * API versions (top-level `subscription` → `parent.subscription_details` →
 * per-line `subscription`), so we read defensively across all known shapes.
 */
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

/**
 * Current period end moved from the Subscription to the subscription item in
 * recent API versions. Check both.
 */
function subscriptionPeriodEnd(sub: Stripe.Subscription): number | null {
  const s = sub as unknown as {
    current_period_end?: number;
    items?: { data?: Array<{ current_period_end?: number }> };
  };
  return s.current_period_end ?? s.items?.data?.[0]?.current_period_end ?? null;
}

export const billingService = {
  /**
   * Handle a completed Checkout Session. For one-time payments this grants the
   * top-up credits. For subscriptions it records the customer/subscription on
   * the user (the credits themselves arrive via the invoice.paid event).
   */
  async handleCheckoutCompleted(session: Stripe.Checkout.Session): Promise<void> {
    const userId = session.metadata?.userId;
    const packageId = session.metadata?.packageId;
    if (!userId || !packageId) {
      console.error('[Billing] checkout.session.completed missing metadata', session.id);
      return;
    }
    const pkg = getPackage(packageId);
    if (!pkg) {
      console.error('[Billing] unknown packageId on session', packageId, session.id);
      return;
    }

    // Persist the Stripe customer id for portal access + customer reuse.
    if (session.customer && typeof session.customer === 'string') {
      await prisma.user.update({
        where: { id: userId },
        data: { stripeCustomerId: session.customer },
      }).catch(() => {/* customer id may already be set; ignore */});
    }

    if (pkg.kind === 'one_time') {
      if (session.payment_status !== 'paid') return;
      const credited = await creditService.addCredits({
        userId,
        credits: pkg.credits,
        type: 'TOPUP_PURCHASE',
        amountCents: session.amount_total ?? pkg.priceCents,
        currency: session.currency ?? pkg.currency,
        reason: `${pkg.name}: +${pkg.credits} credits`,
        packageId: pkg.id,
        stripeSessionId: session.id,
        stripePaymentIntentId:
          typeof session.payment_intent === 'string' ? session.payment_intent : undefined,
      });
      if (credited !== null) {
        console.log(`[Billing] ✅ Top-up: +${pkg.credits} to user ${userId} (session ${session.id})`);
      }
    } else {
      // Subscription: record the subscription id; invoice.paid does the grant.
      if (session.subscription && typeof session.subscription === 'string') {
        await prisma.user.update({
          where: { id: userId },
          data: {
            stripeSubscriptionId: session.subscription,
            subscriptionPlan: pkg.id,
            subscriptionStatus: 'active',
          },
        }).catch(() => {});
      }
    }
  },

  /**
   * Handle a paid invoice — the canonical credit grant for subscriptions.
   * Fires for the first payment and every renewal. Idempotent by invoice id.
   */
  async handleInvoicePaid(invoice: Stripe.Invoice): Promise<void> {
    // Only subscription invoices grant recurring credits.
    const subId = invoiceSubscriptionId(invoice);
    if (!subId) return;

    const sub = await getStripe().subscriptions.retrieve(subId);
    const userId = sub.metadata?.userId;
    const packageId = sub.metadata?.packageId;
    if (!userId || !packageId) {
      console.error('[Billing] invoice.paid — subscription missing metadata', subId);
      return;
    }
    const pkg = getPackage(packageId);
    if (!pkg) return;

    const credited = await creditService.addCredits({
      userId,
      credits: pkg.credits,
      type: 'SUBSCRIPTION_GRANT',
      amountCents: invoice.amount_paid ?? pkg.priceCents,
      currency: invoice.currency ?? pkg.currency,
      reason: `${pkg.name} subscription: +${pkg.credits} credits`,
      packageId: pkg.id,
      stripeInvoiceId: invoice.id,
    });

    await prisma.user.update({
      where: { id: userId },
      data: {
        stripeSubscriptionId: subId,
        subscriptionPlan: pkg.id,
        subscriptionStatus: sub.status,
        subscriptionCurrentPeriodEnd: toDate(subscriptionPeriodEnd(sub)),
      },
    }).catch(() => {});

    if (credited !== null) {
      console.log(`[Billing] ✅ Subscription grant: +${pkg.credits} to user ${userId} (invoice ${invoice.id})`);
    }
  },

  /** Sync subscription status changes (cancellation, past_due, renewal dates). */
  async handleSubscriptionUpdated(sub: Stripe.Subscription): Promise<void> {
    const userId = sub.metadata?.userId;
    if (!userId) return;
    await prisma.user.update({
      where: { id: userId },
      data: {
        subscriptionStatus: sub.status,
        subscriptionCurrentPeriodEnd: toDate(subscriptionPeriodEnd(sub)),
        // Clear the live id when the subscription is gone for good.
        ...(sub.status === 'canceled' ? { stripeSubscriptionId: null } : {}),
      },
    }).catch(() => {});
  },

  /**
   * verify-session fallback: reconcile a session directly when the browser
   * lands on the success page (covers local dev where the webhook may not be
   * wired). Safe to call repeatedly — all grants are idempotent.
   */
  async reconcileSession(session: Stripe.Checkout.Session): Promise<void> {
    await this.handleCheckoutCompleted(session);
    // For subscriptions, also try to grant the first invoice immediately so the
    // balance reflects the purchase without waiting on the webhook.
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
