import type { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/database.js';
import { createError } from '../middleware/errorHandler.js';
import { env, isStripeConfigured } from '../config/env.js';
import { CREDIT_PACKAGES, getPackage, CAMPAIGN_PASS_ID } from '../config/creditPackages.js';
import { SUBSCRIPTION_PLANS, getSubscriptionPlan, getPublicPlans, getEligibleAddons } from '../config/subscriptionPlans.js';
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
      // Subscription plans (3 base plans shown publicly)
      plans: getPublicPlans().map(p => ({
        id: p.id,
        name: p.name,
        label: p.label,
        kind: p.kind,
        credits: p.credits,
        priceCents: p.priceCents,
        currency: p.currency,
        interval: p.interval,
        trialDays: p.trialDays,
        planType: p.planType,
      })),
      // Legacy one-time credit packages (topup-1000 etc., excluding campaign-pass)
      packages: CREDIT_PACKAGES.filter(p => p.id !== CAMPAIGN_PASS_ID && p.kind === 'one_time').map(p => ({
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
          role: true,
          email: true,
          creditBalance: true,
          planType: true,
          subscriptionStatus: true,
          subscriptionPlan: true,
          subscriptionCurrentPeriodEnd: true,
          cancelAtPeriodEnd: true,
          stripeCustomerId: true,
          rankingAddonActive: true,
          rankingAddonStatus: true,
          rankingAddonCurrentPeriodEnd: true,
          sourcingAddonActive: true,
          sourcingAddonStatus: true,
          sourcingAddonCurrentPeriodEnd: true,
        },
      });
      if (!u) return next(createError('User not found.', 404));

      const { hasSourceAccess, hasRankingAccess } = deriveAccess(u);
      const isBaseSubCanceled =
        u.subscriptionStatus === 'canceled' || u.subscriptionStatus === 'unpaid';
      const isPaidPlan =
        u.planType === 'PRO' || u.planType === 'SOURCING' || u.planType === 'RANKING';
      const basePlanActive =
        u.subscriptionStatus === 'active' ||
        u.subscriptionStatus === 'trialing' ||
        (isPaidPlan && !isBaseSubCanceled);

      // Eligible add-ons for this user's current plan
      const eligibleAddons = getEligibleAddons(u.subscriptionPlan);

      res.json({
        success: true,
        balance: u.creditBalance,
        planType: u.planType,
        hasSourceAccess,
        hasRankingAccess,
        subscription: {
          status: u.subscriptionStatus,
          plan: u.subscriptionPlan,
          currentPeriodEnd: u.subscriptionCurrentPeriodEnd,
          cancelAtPeriodEnd: u.cancelAtPeriodEnd ?? false,
          active: basePlanActive,
        },
        addons: {
          ranking: {
            active: u.rankingAddonActive,
            status: u.rankingAddonStatus,
            currentPeriodEnd: u.rankingAddonCurrentPeriodEnd,
          },
          sourcing: {
            active: u.sourcingAddonActive,
            status: u.sourcingAddonStatus,
            currentPeriodEnd: u.sourcingAddonCurrentPeriodEnd,
          },
        },
        eligibleAddons: eligibleAddons.map(p => ({
          id: p.id, name: p.name, label: p.label, priceCents: p.priceCents,
        })),
        hasCustomer: !!u.stripeCustomerId,
      });
    } catch (err) {
      next(err);
    }
  },

  async createCheckout(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { packageId, campaignId } = req.body as { packageId?: string; campaignId?: string };
      if (!packageId) return next(createError('packageId is required.', 400));

      // Resolve package — check new subscription plans first, then legacy credit packages
      const subPlan = getSubscriptionPlan(packageId);
      const legacyPkg = !subPlan ? getPackage(packageId) : null;
      if (!subPlan && !legacyPkg) return next(createError('Unknown package.', 404));

      if (!isStripeConfigured()) {
        // Dev / Mock Mode: Simulate instant purchase and grant plan / add-on / credits immediately!
        const userId = req.user!.id;
        const periodEnd = new Date(Date.now() + 30 * 86400 * 1000);

        if (subPlan) {
          if (subPlan.addOnFor === 'sourcing-plan') {
            await prisma.user.update({
              where: { id: userId },
              data: {
                sourcingAddonActive: true,
                sourcingAddonStatus: 'active',
                sourcingAddonPeriodEnd: periodEnd,
              },
            });
            if (subPlan.credits > 0) {
              await creditService.addCredits({
                userId,
                amount: subPlan.credits,
                type: 'SUBSCRIPTION_GRANT',
                notes: `Mock Dev Purchase: ${subPlan.name}`,
                idempotencyKey: `mock_addon_${userId}_${Date.now()}`,
              });
            }
          } else if (subPlan.addOnFor === 'ranking-plan') {
            await prisma.user.update({
              where: { id: userId },
              data: {
                rankingAddonActive: true,
                rankingAddonStatus: 'active',
                rankingAddonPeriodEnd: periodEnd,
              },
            });
          } else {
            await prisma.user.update({
              where: { id: userId },
              data: {
                planType: subPlan.planType,
                subscriptionStatus: 'active',
                subscriptionPlan: subPlan.id,
                currentPeriodEnd: periodEnd,
              },
            });
            if (subPlan.credits > 0) {
              await creditService.addCredits({
                userId,
                amount: subPlan.credits,
                type: 'SUBSCRIPTION_GRANT',
                notes: `Mock Dev Purchase: ${subPlan.name}`,
                idempotencyKey: `mock_plan_${userId}_${Date.now()}`,
              });
            }
          }
        } else if (legacyPkg && legacyPkg.credits > 0) {
          await creditService.addCredits({
            userId,
            amount: legacyPkg.credits,
            type: 'TOPUP_PURCHASE',
            notes: `Mock Dev Purchase: ${legacyPkg.name}`,
            idempotencyKey: `mock_topup_${userId}_${Date.now()}`,
          });
        }

        return res.json({
          success: true,
          checkoutUrl: '/billing?session_id=mock_dev_completed',
          mock: true,
        });
      }

      const user = await prisma.user.findUnique({
        where: { id: req.user!.id },
        select: {
          id: true, email: true, name: true,
          stripeCustomerId: true,
          subscriptionStatus: true,
          subscriptionPlan: true,
          rankingAddonActive: true,
          rankingAddonSubscriptionId: true,
          sourcingAddonActive: true,
          sourcingAddonSubscriptionId: true,
        },
      });
      if (!user) return next(createError('User not found.', 404));

      // ── Campaign Pass ─────────────────────────────────────────────────────
      if (packageId === CAMPAIGN_PASS_ID) {
        if (!campaignId) return next(createError('campaignId is required for the Campaign Pass.', 400));
        const campaign = await prisma.campaign.findFirst({
          where: { id: campaignId, userId: user.id },
          select: { id: true, name: true, unlimited: true },
        });
        if (!campaign) return next(createError('Campaign not found.', 404));
        if (campaign.unlimited) {
          return next(createError('This campaign already has unlimited reveals.', 409));
        }
      }

      // ── Subscription: block duplicate base plans ───────────────────────────
      if (subPlan && !subPlan.addOnFor) {
        // Base plan — user must not already have an active base plan
        const alreadyActive =
          user.subscriptionStatus === 'active' || user.subscriptionStatus === 'trialing';
        if (alreadyActive) {
          return next(
            createError('You already have an active plan. Manage it from the Billing tab.', 409),
          );
        }
      }

      // ── Add-on: validate base plan eligibility ────────────────────────────
      if (subPlan?.addOnFor) {
        if (user.subscriptionPlan !== subPlan.addOnFor) {
          return next(
            createError(
              `This add-on requires an active ${subPlan.addOnFor} subscription.`,
              409,
            ),
          );
        }
        // Block duplicate add-on
        if (packageId === 'ranking-addon' && user.rankingAddonActive) {
          return next(createError('Ranking add-on is already active.', 409));
        }
        if (packageId === 'sourcing-addon' && user.sourcingAddonActive) {
          return next(createError('Sourcing add-on is already active.', 409));
        }
      }

      // ── Legacy one-time: block if already subscribed (topup is always OK) ─
      if (legacyPkg?.kind === 'subscription') {
        const alreadyActive =
          user.subscriptionStatus === 'active' || user.subscriptionStatus === 'trialing';
        if (alreadyActive) {
          return next(
            createError('You already have an active subscription. Manage it from the Billing tab.', 409),
          );
        }
      }

      const stripe = getStripe();

      // Reuse or lazily create the Stripe customer
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
      const isPass = packageId === CAMPAIGN_PASS_ID;
      const pkg = subPlan ?? legacyPkg!;
      const metadata: Record<string, string> = {
        userId: user.id,
        packageId,
        credits: String(pkg.credits),
        kind: pkg.kind,
        ...(isPass && campaignId ? { campaignId } : {}),
      };

      const isSubscription = pkg.kind === 'subscription';
      const trialDays = subPlan?.trialDays ?? 0;

      const session = await stripe.checkout.sessions.create({
        mode: isSubscription ? 'subscription' : 'payment',
        customer: customerId,
        line_items: [
          {
            quantity: 1,
            price_data: {
              currency: pkg.currency,
              unit_amount: pkg.priceCents,
              product_data: {
                name: pkg.name,
                description: isPass
                  ? 'Unlimited Apollo email/phone reveals for one campaign'
                  : pkg.credits > 0
                    ? `${pkg.credits} credits${isSubscription ? ' / month' : ''}`
                    : (pkg as typeof subPlan)?.label ?? pkg.name,
              },
              ...(isSubscription ? { recurring: { interval: 'month' } } : {}),
            },
          },
        ],
        metadata,
        ...(isSubscription
          ? {
              subscription_data: {
                metadata,
                ...(trialDays > 0 ? { trial_period_days: trialDays } : {}),
              },
            }
          : {}),
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
      const sessionId = (req.query.session_id as string) || '';
      if (!sessionId) return next(createError('session_id is required.', 400));

      if (sessionId === 'mock_dev_completed' || !isStripeConfigured()) {
        const balance = await creditService.getBalance(req.user!.id);
        return res.json({
          success: true,
          paid: true,
          paymentStatus: 'paid',
          balance,
        });
      }

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
        packageId: session.metadata?.packageId ?? null,
        campaignId: session.metadata?.campaignId ?? null,
        isCampaignPass: session.metadata?.packageId === CAMPAIGN_PASS_ID,
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

  /**
   * Schedule cancellation of an active subscription at period end.
   */
  async cancelSubscription(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = await prisma.user.findUnique({
        where: { id: req.user!.id },
        select: {
          id: true,
          stripeSubscriptionId: true,
          rankingAddonSubscriptionId: true,
          sourcingAddonSubscriptionId: true,
          subscriptionCurrentPeriodEnd: true,
        },
      });
      if (!user) return next(createError('User not found.', 404));

      const { target } = (req.body ?? {}) as { target?: 'base' | 'rankingAddon' | 'sourcingAddon' };
      const subId =
        target === 'rankingAddon' ? user.rankingAddonSubscriptionId :
        target === 'sourcingAddon' ? user.sourcingAddonSubscriptionId :
        user.stripeSubscriptionId;

      if (isStripeConfigured() && subId) {
        const stripe = getStripe();
        const updatedSub = await stripe.subscriptions.update(subId, {
          cancel_at_period_end: true,
        });
        await billingService.handleSubscriptionUpdated(updatedSub);
      } else {
        await prisma.user.update({
          where: { id: user.id },
          data: { cancelAtPeriodEnd: true },
        });
      }

      res.json({
        success: true,
        message: 'Subscription cancellation scheduled at end of billing cycle. You will not be billed next month, and all your current plan benefits and credits remain fully active until the period ends.',
        cancelAtPeriodEnd: true,
      });
    } catch (err) {
      console.error('[Payments] cancelSubscription error:', err instanceof Error ? err.message : err);
      next(createError('Could not cancel subscription. Please try again.', 500));
    }
  },

  /**
   * Reactivate auto-renewal before current period end.
   */
  async resumeSubscription(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = await prisma.user.findUnique({
        where: { id: req.user!.id },
        select: {
          id: true,
          stripeSubscriptionId: true,
          rankingAddonSubscriptionId: true,
          sourcingAddonSubscriptionId: true,
        },
      });
      if (!user) return next(createError('User not found.', 404));

      const { target } = (req.body ?? {}) as { target?: 'base' | 'rankingAddon' | 'sourcingAddon' };
      const subId =
        target === 'rankingAddon' ? user.rankingAddonSubscriptionId :
        target === 'sourcingAddon' ? user.sourcingAddonSubscriptionId :
        user.stripeSubscriptionId;

      if (isStripeConfigured() && subId) {
        const stripe = getStripe();
        const updatedSub = await stripe.subscriptions.update(subId, {
          cancel_at_period_end: false,
        });
        await billingService.handleSubscriptionUpdated(updatedSub);
      } else {
        await prisma.user.update({
          where: { id: user.id },
          data: { cancelAtPeriodEnd: false },
        });
      }

      res.json({
        success: true,
        message: 'Subscription auto-renewal reactivated successfully.',
        cancelAtPeriodEnd: false,
      });
    } catch (err) {
      console.error('[Payments] resumeSubscription error:', err instanceof Error ? err.message : err);
      next(createError('Could not resume subscription. Please try again.', 500));
    }
  },
};

