import type { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/database.js';
import { createError } from '../middleware/errorHandler.js';
import { env, isStripeConfigured } from '../config/env.js';
import { CREDIT_PACKAGES, getPackage } from '../config/creditPackages.js';
import { getStripe } from '../services/billing/stripeService.js';
import { billingService } from '../services/billing/billingService.js';
import { creditService } from '../services/credits/creditService.js';

/**
 * Credit purchase + balance endpoints.
 *
 * GET  /api/payments/packages          — buyable packages + publishable key
 * GET  /api/payments/balance           — current balance + subscription state
 * POST /api/payments/create-checkout    — start a Stripe Checkout session
 * GET  /api/payments/verify-session     — reconcile after redirect (fallback)
 * GET  /api/payments/history            — credit ledger (purchases + spends)
 * POST /api/payments/create-portal-session — Stripe billing portal (manage sub)
 *
 * Webhook lives in webhookController.stripe (raw body, mounted pre-JSON).
 */
export const paymentsController = {
  packages(_req: Request, res: Response): void {
    res.json({
      success: true,
      stripeEnabled: isStripeConfigured(),
      publishableKey: env.STRIPE_PUBLISHABLE_KEY || null,
      packages: CREDIT_PACKAGES.map(p => ({
        id: p.id,
        name: p.name,
        label: p.label,
        kind: p.kind,
        credits: p.credits,
        priceCents: p.priceCents,
        currency: p.currency,
        interval: p.interval ?? null,
      })),
    });
  },

  async balance(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const u = await prisma.user.findUnique({
        where: { id: req.user!.id },
        select: {
          creditBalance: true,
          subscriptionStatus: true,
          subscriptionPlan: true,
          subscriptionCurrentPeriodEnd: true,
          stripeCustomerId: true,
        },
      });
      if (!u) return next(createError('User not found.', 404));
      res.json({
        success: true,
        balance: u.creditBalance,
        subscription: {
          status: u.subscriptionStatus,
          plan: u.subscriptionPlan,
          currentPeriodEnd: u.subscriptionCurrentPeriodEnd,
          active: u.subscriptionStatus === 'active' || u.subscriptionStatus === 'trialing',
        },
        hasCustomer: !!u.stripeCustomerId,
      });
    } catch (err) {
      next(err);
    }
  },

  async createCheckout(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!isStripeConfigured()) {
        return next(createError('Payments are not configured on the server.', 503));
      }
      const { packageId } = req.body as { packageId?: string };
      if (!packageId) return next(createError('packageId is required.', 400));
      const pkg = getPackage(packageId);
      if (!pkg) return next(createError('Unknown package.', 404));

      const user = await prisma.user.findUnique({
        where: { id: req.user!.id },
        select: { id: true, email: true, name: true, stripeCustomerId: true, subscriptionStatus: true },
      });
      if (!user) return next(createError('User not found.', 404));

      // Block buying a second concurrent subscription.
      if (
        pkg.kind === 'subscription' &&
        (user.subscriptionStatus === 'active' || user.subscriptionStatus === 'trialing')
      ) {
        return next(
          createError('You already have an active subscription. Manage it from the Credits tab.', 409)
        );
      }

      const stripe = getStripe();

      // Reuse or lazily create the Stripe customer so portal + reuse work.
      let customerId = user.stripeCustomerId;
      if (!customerId) {
        const customer = await stripe.customers.create({
          email: user.email,
          name: user.name,
          metadata: { userId: user.id },
        });
        customerId = customer.id;
        await prisma.user.update({ where: { id: user.id }, data: { stripeCustomerId: customerId } });
      }

      const appUrl = env.APP_URL.replace(/\/$/, '');
      const metadata = {
        userId: user.id,
        packageId: pkg.id,
        credits: String(pkg.credits),
        kind: pkg.kind,
      };

      const session = await stripe.checkout.sessions.create({
        mode: pkg.kind === 'subscription' ? 'subscription' : 'payment',
        customer: customerId,
        line_items: [
          {
            quantity: 1,
            price_data: {
              currency: pkg.currency,
              unit_amount: pkg.priceCents,
              product_data: {
                name: pkg.name,
                description: `${pkg.credits} credits${pkg.kind === 'subscription' ? ' / month' : ''}`,
              },
              ...(pkg.kind === 'subscription'
                ? { recurring: { interval: pkg.interval ?? 'month' } }
                : {}),
            },
          },
        ],
        metadata,
        // Carry the same metadata onto the subscription so invoice.paid (incl.
        // renewals) can resolve user + package without our DB.
        ...(pkg.kind === 'subscription' ? { subscription_data: { metadata } } : {}),
        success_url: `${appUrl}/billing?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${appUrl}/billing?canceled=1`,
      });

      res.json({ success: true, checkoutUrl: session.url, sessionId: session.id });
    } catch (err) {
      console.error('[Payments] create-checkout failed:', err instanceof Error ? err.message : err);
      next(createError('Could not start checkout. Please try again.', 500));
    }
  },

  async verifySession(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!isStripeConfigured()) return next(createError('Payments are not configured.', 503));
      const sessionId = (req.query.session_id as string) || '';
      if (!sessionId) return next(createError('session_id is required.', 400));

      const stripe = getStripe();
      const session = await stripe.checkout.sessions.retrieve(sessionId);

      // Only reconcile sessions that belong to the calling user.
      if (session.metadata?.userId !== req.user!.id) {
        return next(createError('Session does not belong to this user.', 403));
      }

      const paid = session.payment_status === 'paid' || session.status === 'complete';
      if (paid) {
        // Idempotent — safe even if the webhook already processed it.
        await billingService.reconcileSession(session).catch(err =>
          console.error('[Payments] verify-session reconcile error:', err instanceof Error ? err.message : err)
        );
      }

      const balance = await creditService.getBalance(req.user!.id);
      res.json({
        success: true,
        paid,
        paymentStatus: session.payment_status,
        balance,
      });
    } catch (err) {
      next(err);
    }
  },

  async history(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const rows = await creditService.history(req.user!.id, 50);
      res.json({ success: true, transactions: rows });
    } catch (err) {
      next(err);
    }
  },

  async createPortalSession(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!isStripeConfigured()) return next(createError('Payments are not configured.', 503));
      const user = await prisma.user.findUnique({
        where: { id: req.user!.id },
        select: { stripeCustomerId: true },
      });
      if (!user?.stripeCustomerId) {
        return next(createError('No billing account yet — make a purchase first.', 400));
      }
      const appUrl = env.APP_URL.replace(/\/$/, '');
      const portal = await getStripe().billingPortal.sessions.create({
        customer: user.stripeCustomerId,
        return_url: `${appUrl}/billing`,
      });
      res.json({ success: true, url: portal.url });
    } catch (err) {
      console.error('[Payments] portal failed:', err instanceof Error ? err.message : err);
      next(createError('Could not open the billing portal.', 500));
    }
  },
};
