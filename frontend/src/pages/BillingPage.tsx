import { useEffect, useState, useCallback } from 'react';
import {
  Coins, Loader2, ArrowLeft, CheckCircle2, AlertCircle, Sparkles, Zap,
  CreditCard, RefreshCw, Settings, Trophy, Crown, Star, Check, Plus, Shield, Clock as ClockIcon
} from 'lucide-react';
import { paymentsApi, type CreditTransaction } from '../api/paymentsApi';
import { ApiError } from '../api/client';
import { useToast } from '../components/shared/Toast';
import { ConfirmModal } from '../components/shared/CenterModal';
import type { AuthUser } from '../hooks/useAuth';

interface BillingPageProps {
  user: AuthUser;
  onBack: () => void;
}

interface PlanDto {
  id: string;
  name: string;
  label: string;
  kind: string;
  credits: number;
  priceCents: number;
  currency: string;
  interval: string;
  trialDays: number;
  planType: string;
}

interface PackageDto {
  id: string;
  name: string;
  label: string;
  kind: string;
  credits: number;
  priceCents: number;
  currency: string;
  interval: string;
}

interface AddonState {
  active: boolean;
  status: string | null;
  currentPeriodEnd: string | null;
}

interface EligibleAddon {
  id: string;
  name: string;
  label: string;
  priceCents: number;
}

const money = (cents: number, currency = 'usd') =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: currency.toUpperCase() }).format(
    cents / 100
  );

export function BillingPage({ user, onBack }: BillingPageProps) {
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [stripeEnabled, setStripeEnabled] = useState(true);
  
  // New state for updated payload
  const [balance, setBalance] = useState(0);
  const [planType, setPlanType] = useState<string | null>(null);
  const [hasSourceAccess, setHasSourceAccess] = useState(false);
  const [hasRankingAccess, setHasRankingAccess] = useState(false);
  const [subscription, setSubscription] = useState<any>(null);
  const [addons, setAddons] = useState<{ ranking?: AddonState; sourcing?: AddonState }>({});
  const [eligibleAddons, setEligibleAddons] = useState<EligibleAddon[]>([]);
  const [hasCustomer, setHasCustomer] = useState(false);

  const [plans, setPlans] = useState<PlanDto[]>([]);
  const [packages, setPackages] = useState<PackageDto[]>([]);
  
  const [history, setHistory] = useState<CreditTransaction[]>([]);
  const [buyingId, setBuyingId] = useState<string | null>(null);
  const [verifying, setVerifying] = useState(false);
  const [openingPortal, setOpeningPortal] = useState(false);
  const [cancelTarget, setCancelTarget] = useState<'base' | 'rankingAddon' | 'sourcingAddon' | null>(null);

  const loadAll = useCallback(async () => {
    const [pkgRes, balRes, histRes] = await Promise.all([
      paymentsApi.packages() as Promise<any>,
      paymentsApi.balance() as Promise<any>,
      paymentsApi.history().catch(() => ({ transactions: [] as CreditTransaction[] })),
    ]);

    setStripeEnabled(pkgRes.stripeEnabled);
    setPlans(pkgRes.plans || []);
    setPackages(pkgRes.packages || []);

    setBalance(balRes.balance || 0);
    setPlanType(balRes.planType || null);
    setHasSourceAccess(!!balRes.hasSourceAccess);
    setHasRankingAccess(!!balRes.hasRankingAccess);
    setSubscription(balRes.subscription || null);
    setAddons(balRes.addons || {});
    setEligibleAddons(balRes.eligibleAddons || []);
    setHasCustomer(!!balRes.hasCustomer);

    setHistory(histRes.transactions ?? []);
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const sessionId = params.get('session_id');
    const canceled = params.get('canceled');

    async function init() {
      try {
        if (sessionId) {
          setVerifying(true);
          const res = await paymentsApi.verifySession(sessionId);
          if (res.paid) {
            toast.push({ title: 'Payment complete', body: `Your account is updated.`, tone: 'success' });
          } else {
            toast.push({ title: 'Payment pending', body: `Status: ${res.paymentStatus}. Will appear once it clears.`, tone: 'warning' });
          }
        } else if (canceled) {
          toast.push({ title: 'Checkout canceled', body: 'No charge was made.', tone: 'info' });
        }
      } catch (err) {
        toast.push({ title: 'Could not verify payment', body: err instanceof ApiError ? err.message : 'Try refreshing.', tone: 'error' });
      } finally {
        setVerifying(false);
        if (sessionId || canceled) window.history.replaceState({}, '', '/billing');
      }
      try {
        await loadAll();
      } catch {
        toast.push({ title: 'Could not load billing', body: 'Please refresh the page.', tone: 'error' });
      } finally {
        setLoading(false);
      }
    }
    void init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function buy(packageId: string) {
    setBuyingId(packageId);
    try {
      const res = await paymentsApi.createCheckout(packageId);
      window.location.href = res.checkoutUrl;
    } catch (err) {
      toast.push({ title: 'Could not start checkout', body: err instanceof ApiError ? err.message : 'Try again.', tone: 'error' });
      setBuyingId(null);
    }
  }

  async function manageSubscription() {
    setOpeningPortal(true);
    try {
      const res = await paymentsApi.createPortalSession();
      window.location.href = res.url;
    } catch (err) {
      toast.push({ title: 'Could not open billing portal', body: err instanceof ApiError ? err.message : 'Try again.', tone: 'error' });
      setOpeningPortal(false);
    }
  }

  async function resumeSub(target: 'base' | 'rankingAddon' | 'sourcingAddon' = 'base') {
    try {
      const res = await paymentsApi.resumeSubscription(target);
      toast.push({ title: 'Auto-Renew Reactivated', body: res.message, tone: 'success' });
      await loadAll();
    } catch (err) {
      toast.push({ title: 'Could not resume subscription', body: err instanceof ApiError ? err.message : 'Try again.', tone: 'error' });
    }
  }

  function cancelSub(target: 'base' | 'rankingAddon' | 'sourcingAddon' = 'base') {
    setCancelTarget(target);
  }

  async function handleConfirmCancelSub() {
    if (!cancelTarget) return;
    try {
      const res = await paymentsApi.cancelSubscription(cancelTarget);
      toast.push({
        title: 'Auto-Renewal Canceled',
        body: res.message,
        tone: 'info',
      });
      await loadAll();
    } catch (err) {
      toast.push({ title: 'Could not cancel subscription', body: err instanceof ApiError ? err.message : 'Try again.', tone: 'error' });
    } finally {
      setCancelTarget(null);
    }
  }

  // Pre-sort plans just in case, or map by planType
  const sourcingPlan = plans.find(p => p.planType === 'sourcing');
  const rankingPlan = plans.find(p => p.planType === 'ranking');
  const proPlan = plans.find(p => p.planType === 'pro');

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#0a0c12] text-gray-900 dark:text-gray-100 transition-colors">

      <header className="border-b border-gray-200 dark:border-white/10 bg-white/80 dark:bg-[#0a0a0a]/80 backdrop-blur-md sticky top-0 z-10">
        <div className="max-w-[1200px] mx-auto px-6 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={onBack}
              className="flex items-center gap-1.5 text-sm font-medium px-3 py-1.5 rounded-lg border border-gray-200 dark:border-white/10 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/5 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" /> Dashboard
            </button>
            <div className="flex items-center gap-3 ml-2">
              <div className="w-9 h-9 rounded-xl bg-indigo-100 dark:bg-indigo-500/20 border border-indigo-200 dark:border-indigo-500/30 flex items-center justify-center">
                <CreditCard className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-gray-900 dark:text-white leading-none">Billing &amp; Plans</h1>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Manage your subscription and credits</p>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {subscription?.active && !subscription?.cancelAtPeriodEnd && (
              <button
                onClick={() => cancelSub('base')}
                className="flex items-center gap-1.5 text-xs font-medium px-3 py-2 rounded-lg border border-red-200 dark:border-red-500/30 bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-300 hover:bg-red-100 dark:hover:bg-red-500/20 transition-colors"
              >
                Cancel Subscription
              </button>
            )}
            {subscription?.active && subscription?.cancelAtPeriodEnd && (
              <button
                onClick={() => resumeSub('base')}
                className="flex items-center gap-1.5 text-xs font-medium px-3 py-2 rounded-lg border border-amber-200 dark:border-amber-500/30 bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-500/20 transition-colors"
              >
                Keep Auto-Renew
              </button>
            )}
            {hasCustomer && (
              <button
                onClick={manageSubscription}
                disabled={openingPortal}
                className="flex items-center gap-2 text-sm font-medium px-4 py-2 rounded-lg border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 hover:bg-gray-50 dark:hover:bg-white/10 text-gray-700 dark:text-white transition-colors disabled:opacity-60"
              >
                {openingPortal ? <Loader2 className="w-4 h-4 animate-spin" /> : <Settings className="w-4 h-4" />}
                Manage Billing
              </button>
            )}
          </div>
        </div>
      </header>


      <main className="max-w-[1200px] mx-auto px-6 py-8 flex flex-col gap-10">
        {verifying && (
          <div className="flex items-center gap-2 bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-200 dark:border-indigo-500/20 rounded-xl px-4 py-3 text-sm text-indigo-700 dark:text-indigo-200">
            <Loader2 className="w-4 h-4 animate-spin" /> Verifying your payment…
          </div>
        )}

        {!loading && !stripeEnabled && (
          <div className="flex items-start gap-2 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 rounded-xl px-4 py-3 text-sm text-amber-700 dark:text-amber-200">
            <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
            <span>Payments are not configured on this server yet (missing Stripe keys). Buying is disabled.</span>
          </div>
        )}

        {/* ── Welcome Banner: New user with no plan ── */}
        {!loading && (!planType || planType === 'NONE') && (
          <div className="flex items-center gap-5 rounded-2xl border border-indigo-200 dark:border-indigo-500/30 bg-indigo-50 dark:bg-indigo-500/10 px-6 py-5">
            <div className="w-12 h-12 rounded-2xl bg-indigo-600 dark:bg-indigo-500 flex items-center justify-center shrink-0">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-base font-bold text-gray-900 dark:text-white leading-tight">
                Welcome to TalentScanr! 🎉 Pick your plan to get started.
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                Choose a plan below. Sourcing is free to browse — you only pay credits when revealing contact details.
              </p>
            </div>
            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white dark:bg-white/10 border border-gray-200 dark:border-white/20 text-xs font-semibold text-gray-600 dark:text-white shrink-0">
              <Zap className="w-3 h-3 text-yellow-500" />
              Free to explore
            </div>
          </div>
        )}

        {/* Current Status Banner — Cancellation Scheduled */}
        {!loading && subscription?.active && subscription?.cancelAtPeriodEnd && (
          <div className="flex items-center justify-between gap-4 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/30 rounded-2xl px-6 py-5">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-500/20 flex items-center justify-center shrink-0">
                <ClockIcon className="w-6 h-6 text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <p className="text-base font-semibold text-amber-800 dark:text-amber-300">
                  {planType ? planType.charAt(0).toUpperCase() + planType.slice(1) : 'Pro'} Plan — Cancels on {subscription.currentPeriodEnd ? new Date(subscription.currentPeriodEnd).toLocaleDateString() : 'period end'}
                </p>
                <p className="text-xs text-amber-600 dark:text-amber-400/80 mt-0.5">
                  🛡️ All features & credits remain 100% active until then. You will NOT be billed next month.
                </p>
              </div>
            </div>
            <button
              onClick={() => resumeSub('base')}
              className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-white font-bold text-xs shadow-sm transition-all shrink-0"
            >
              Resume Auto-Renew
            </button>
          </div>
        )}

        {/* Current Status Banner — Normal Active */}
        {!loading && subscription?.active && !subscription?.cancelAtPeriodEnd && (
          <div className="flex items-center justify-between gap-4 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 rounded-2xl px-6 py-5">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-500/20 flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <p className="text-base font-semibold text-emerald-800 dark:text-emerald-300">
                  {planType ? planType.charAt(0).toUpperCase() + planType.slice(1) : 'Pro'} Plan Active
                </p>
                {subscription.currentPeriodEnd && (
                  <p className="text-sm text-emerald-600 dark:text-emerald-400/80 mt-0.5">
                    Renews {new Date(subscription.currentPeriodEnd).toLocaleDateString()}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Subscription Plans */}
        <section>
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Choose your plan</h2>
            <p className="text-gray-500 dark:text-gray-400">Scale your talent acquisition with our flexible plans</p>
          </div>

          {loading ? (
            <div className="py-12 flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-gray-400" /></div>
          ) : (
            <div className="grid md:grid-cols-3 gap-6">
              {/* Sourcing Plan */}
              {sourcingPlan && (
                <div className={`relative flex flex-col rounded-3xl p-6 transition-all duration-300 ${
                  planType === 'sourcing' || planType === 'pro' 
                    ? 'bg-white dark:bg-white/5 border-2 border-blue-400 dark:border-white/20 shadow-md' 
                    : 'bg-white dark:bg-white/[0.02] border border-gray-200 dark:border-white/10 hover:shadow-md hover:border-gray-300 dark:hover:bg-white/5'
                }`}>
                  {(planType === 'sourcing') && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-emerald-500 text-white text-xs font-bold uppercase tracking-wider rounded-full flex items-center gap-1">
                      <Check className="w-3 h-3" /> Current Plan
                    </div>
                  )}
                  
                  <div className="mb-4">
                    <div className="w-12 h-12 rounded-2xl bg-blue-100 dark:bg-blue-500/20 border border-blue-200 dark:border-blue-500/30 flex items-center justify-center mb-4">
                      <Zap className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white">{sourcingPlan.name}</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 h-10">{sourcingPlan.label}</p>
                  </div>
                  
                  <div className="mb-6 flex items-baseline gap-1">
                    <span className="text-4xl font-extrabold text-gray-900 dark:text-white">{money(sourcingPlan.priceCents)}</span>
                    <span className="text-gray-400 font-medium">/mo</span>
                  </div>

                  <ul className="flex-1 space-y-3 mb-8 text-sm text-gray-600 dark:text-gray-300">
                    <li className="flex gap-3 items-start"><Check className="w-5 h-5 text-blue-500 shrink-0" /> Full Candidate Sourcing</li>
                    <li className="flex gap-3 items-start"><Check className="w-5 h-5 text-blue-500 shrink-0" /> {sourcingPlan.credits.toLocaleString()} Credits / month</li>
                    <li className="flex gap-3 items-start"><Check className="w-5 h-5 text-blue-500 shrink-0" /> Credit Top-ups enabled</li>
                  </ul>

                  <button
                    onClick={() => buy(sourcingPlan.id)}
                    disabled={buyingId !== null || planType === 'sourcing' || planType === 'pro'}
                    className={`w-full py-3 px-4 rounded-xl font-semibold transition-all ${
                      planType === 'sourcing' || planType === 'pro'
                        ? 'bg-gray-100 dark:bg-white/10 text-gray-400 dark:text-white/50 cursor-not-allowed'
                        : 'bg-blue-600 hover:bg-blue-500 text-white'
                    }`}
                  >
                    {buyingId === sourcingPlan.id ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : 
                     (planType === 'sourcing' || planType === 'pro') ? 'Included' : 'Subscribe'}
                  </button>
                </div>
              )}

              {/* Ranking Plan */}
              {rankingPlan && (
                <div className={`relative flex flex-col rounded-3xl p-6 transition-all duration-300 ${
                  planType === 'ranking' || planType === 'pro'
                    ? 'bg-white dark:bg-white/5 border-2 border-purple-400 dark:border-white/20 shadow-md'
                    : 'bg-white dark:bg-white/[0.02] border border-gray-200 dark:border-white/10 hover:shadow-md hover:border-gray-300 dark:hover:bg-white/5'
                }`}>
                  {(planType === 'ranking') && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-emerald-500 text-white text-xs font-bold uppercase tracking-wider rounded-full flex items-center gap-1">
                      <Check className="w-3 h-3" /> Current Plan
                    </div>
                  )}
                  {(!planType && rankingPlan.trialDays > 0) && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-purple-500 text-white text-xs font-bold uppercase tracking-wider rounded-full flex items-center gap-1">
                      <ClockIcon className="w-3 h-3" /> {rankingPlan.trialDays}-Day Trial
                    </div>
                  )}

                  <div className="mb-4">
                    <div className="w-12 h-12 rounded-2xl bg-purple-100 dark:bg-purple-500/20 border border-purple-200 dark:border-purple-500/30 flex items-center justify-center mb-4">
                      <Trophy className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white">{rankingPlan.name}</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 h-10">{rankingPlan.label}</p>
                  </div>
                  
                  <div className="mb-6 flex items-baseline gap-1">
                    <span className="text-4xl font-extrabold text-gray-900 dark:text-white">{money(rankingPlan.priceCents)}</span>
                    <span className="text-gray-400 font-medium">/mo</span>
                  </div>

                  <ul className="flex-1 space-y-3 mb-8 text-sm text-gray-600 dark:text-gray-300">
                    <li className="flex gap-3 items-start"><Check className="w-5 h-5 text-purple-500 shrink-0" /> AI Resume Ranking</li>
                    <li className="flex gap-3 items-start"><Check className="w-5 h-5 text-purple-500 shrink-0" /> Unlimited Jobs</li>
                    <li className="flex gap-3 items-start"><Check className="w-5 h-5 text-purple-500 shrink-0" /> ATS Integrations</li>
                  </ul>

                  <button
                    onClick={() => buy(rankingPlan.id)}
                    disabled={buyingId !== null || planType === 'ranking' || planType === 'pro'}
                    className={`w-full py-3 px-4 rounded-xl font-semibold transition-all ${
                      planType === 'ranking' || planType === 'pro'
                        ? 'bg-gray-100 dark:bg-white/10 text-gray-400 dark:text-white/50 cursor-not-allowed'
                        : 'bg-purple-600 hover:bg-purple-500 text-white'
                    }`}
                  >
                    {buyingId === rankingPlan.id ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : 
                     (planType === 'ranking' || planType === 'pro') ? 'Included' : 'Subscribe'}
                  </button>
                </div>
              )}

              {/* Pro Plan */}
              {proPlan && (
                <div className={`relative flex flex-col rounded-3xl p-6 transition-all duration-300 overflow-hidden ${
                  planType === 'pro'
                    ? 'bg-white dark:bg-white/5 border-2 border-amber-400 dark:border-indigo-500/50 shadow-md'
                    : 'bg-white dark:bg-white/[0.02] border border-gray-200 dark:border-white/10 hover:shadow-md hover:border-amber-300 dark:hover:bg-white/5'
                }`}>
                  {(planType === 'pro') ? (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-emerald-500 text-white text-xs font-bold uppercase tracking-wider rounded-full flex items-center gap-1">
                      <Check className="w-3 h-3" /> Current Plan
                    </div>
                  ) : (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-gradient-to-r from-amber-500 to-orange-500 text-white text-xs font-bold uppercase tracking-wider rounded-full flex items-center gap-1 shadow-lg shadow-amber-500/20">
                      <Star className="w-3 h-3 fill-white" /> Best Value
                    </div>
                  )}

                  <div className="mb-4">
                    <div className="w-12 h-12 rounded-2xl bg-amber-100 dark:bg-amber-500/20 border border-amber-200 dark:border-amber-500/30 flex items-center justify-center mb-4">
                      <Crown className="w-6 h-6 text-amber-600 dark:text-amber-400" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white">{proPlan.name}</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 h-10">{proPlan.label}</p>
                  </div>
                  
                  <div className="mb-6 flex items-baseline gap-1">
                    <span className="text-4xl font-extrabold text-amber-600 dark:text-amber-300">{money(proPlan.priceCents)}</span>
                    <span className="text-gray-400 font-medium">/mo</span>
                  </div>

                  <ul className="flex-1 space-y-3 mb-8 text-sm text-gray-600 dark:text-gray-300">
                    <li className="flex gap-3 items-start"><Check className="w-5 h-5 text-amber-500 shrink-0" /> Includes Sourcing Plan</li>
                    <li className="flex gap-3 items-start"><Check className="w-5 h-5 text-amber-500 shrink-0" /> Includes Ranking Plan</li>
                    <li className="flex gap-3 items-start"><Check className="w-5 h-5 text-amber-500 shrink-0" /> Priority Support</li>
                  </ul>

                  <button
                    onClick={() => buy(proPlan.id)}
                    disabled={buyingId !== null || planType === 'pro'}
                    className={`w-full py-3 px-4 rounded-xl font-semibold transition-all ${
                      planType === 'pro'
                        ? 'bg-gray-100 dark:bg-white/10 text-gray-400 dark:text-white/50 cursor-not-allowed'
                        : 'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-white shadow-lg shadow-orange-500/20'
                    }`}
                  >
                    {buyingId === proPlan.id ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : 
                     (planType === 'pro') ? 'Included' : 'Upgrade to Pro'}
                  </button>
                </div>
              )}
            </div>
          )}
        </section>

        {/* Eligible Add-ons */}
        {!loading && eligibleAddons.length > 0 && (
          <section>
            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Available Add-ons</h2>
            <div className="grid sm:grid-cols-2 gap-4">
              {eligibleAddons.map(addon => (
                <div key={addon.id} className="flex items-center justify-between p-5 rounded-2xl bg-white dark:bg-white/[0.02] border border-gray-200 dark:border-white/10 hover:shadow-sm hover:border-gray-300 dark:hover:bg-white/5 transition-all">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-500/20 flex items-center justify-center shrink-0">
                      <Plus className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-900 dark:text-white">{addon.name}</h4>
                      <p className="text-sm text-gray-500 dark:text-gray-400">{addon.label}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="font-bold text-gray-900 dark:text-white">{money(addon.priceCents)}<span className="text-xs text-gray-400 font-normal">/mo</span></span>
                    <button
                      onClick={() => buy(addon.id)}
                      disabled={buyingId !== null}
                      className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-sm font-semibold transition-colors disabled:opacity-60"
                    >
                      {buyingId === addon.id ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Add'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Credits & Top-up */}
        {!loading && hasSourceAccess && (
          <section className="bg-white dark:bg-white/[0.02] border border-gray-200 dark:border-white/10 rounded-3xl p-8">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
              <div>
                <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-1">Credit Balance</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">Used for sourcing candidate contacts</p>
                <div className="mt-4 flex items-baseline gap-2">
                  <span className="text-4xl font-extrabold text-gray-900 dark:text-white">{balance.toLocaleString()}</span>
                  <span className="text-gray-400">credits</span>
                </div>
              </div>

              {packages.filter(p => p.kind === 'one_time').length > 0 && (
                <div className="w-full md:w-auto p-5 rounded-2xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10">
                  <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-blue-500" /> Top-up Credits
                  </h3>
                  <div className="flex flex-col gap-3">
                    {packages.filter(p => p.kind === 'one_time').map(pkg => (
                      <div key={pkg.id} className="flex items-center justify-between gap-4">
                        <div>
                          <p className="text-sm text-gray-900 dark:text-white font-medium">{pkg.credits.toLocaleString()} Credits</p>
                          <p className="text-xs text-gray-400">{money(pkg.priceCents)} one-time</p>
                        </div>
                        <button
                          onClick={() => buy(pkg.id)}
                          disabled={buyingId !== null}
                          className="px-4 py-2 bg-gray-100 dark:bg-white/10 hover:bg-gray-200 dark:hover:bg-white/20 text-gray-700 dark:text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-60"
                        >
                          {buyingId === pkg.id ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Buy'}
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </section>
        )}

        {/* History */}
        {!loading && (
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">Transaction history</h2>
              <button
                onClick={() => loadAll().catch(() => {})}
                className="flex items-center gap-1.5 text-xs font-medium text-gray-400 hover:text-gray-700 dark:hover:text-white transition-colors"
              >
                <RefreshCw className="w-3.5 h-3.5" /> Refresh
              </button>
            </div>
            {history.length === 0 ? (
              <p className="text-sm text-gray-400 py-8 text-center border border-dashed border-gray-200 dark:border-white/10 rounded-2xl bg-gray-50 dark:bg-white/[0.01]">
                No transactions yet.
              </p>
            ) : (
              <div className="border border-gray-200 dark:border-white/10 rounded-2xl overflow-hidden bg-white dark:bg-white/[0.02]">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-white/5 text-left text-xs uppercase tracking-wider text-gray-400">
                        <th className="px-5 py-3 font-semibold">Date</th>
                        <th className="px-5 py-3 font-semibold">Description</th>
                        <th className="px-5 py-3 font-semibold text-right">Credits</th>
                        <th className="px-5 py-3 font-semibold text-right">Balance</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {history.map(t => (
                        <tr key={t.id} className="hover:bg-white/5 transition-colors">
                          <td className="px-5 py-3.5 text-gray-400 whitespace-nowrap">
                            {new Date(t.createdAt).toLocaleDateString()}
                          </td>
                          <td className="px-5 py-3.5 text-gray-200">{t.reason ?? labelForType(t.type)}</td>
                          <td className={`px-5 py-3.5 text-right font-medium tabular-nums ${t.credits >= 0 ? 'text-emerald-400' : 'text-gray-300'}`}>
                            {t.credits >= 0 ? `+${t.credits}` : t.credits}
                          </td>
                          <td className="px-5 py-3.5 text-right text-gray-500 tabular-nums">{t.balanceAfter ?? '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </section>
        )}

        <div className="text-center pb-8 flex items-center justify-center gap-2 text-xs text-gray-500">
          <Shield className="w-4 h-4" /> Secure payments processed by Stripe. Signed in as <span className="text-gray-400">{user.email}</span>.
        </div>
      </main>

      <ConfirmModal
        open={cancelTarget !== null}
        onClose={() => setCancelTarget(null)}
        onConfirm={handleConfirmCancelSub}
        title="Cancel Subscription Auto-Renewal"
        tone="danger"
        confirmLabel="Confirm Cancellation"
        cancelLabel="Keep Auto-Renew"
        message={
          <div className="space-y-3">
            <p className="font-semibold text-gray-900 dark:text-white">
              Are you sure you want to cancel automatic subscription renewal?
            </p>
            <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 text-xs text-amber-900 dark:text-amber-200 space-y-2 leading-relaxed font-medium">
              <p>• Your subscription features and remaining credits will remain <strong>FULLY ACTIVE &amp; ACCESSIBLE</strong> until the end of your billing cycle on {subscription?.currentPeriodEnd ? new Date(subscription.currentPeriodEnd).toLocaleDateString() : 'the end of your current period'}.</p>
              <p>• Your card will <strong>NOT</strong> be charged for the next monthly renewal.</p>
              <p>• You can reactivate automatic renewal at any time with a single click.</p>
            </div>
          </div>
        }
      />
    </div>
  );
}

function labelForType(t: CreditTransaction['type']): string {
  switch (t) {
    case 'SUBSCRIPTION_GRANT': return 'Subscription credits';
    case 'TOPUP_PURCHASE': return 'Top-up purchase';
    case 'SPEND': return 'Contact reveal';
    case 'ADMIN_GRANT': return 'Admin adjustment';
    case 'REFUND': return 'Refund';
    default: return t;
  }
}
