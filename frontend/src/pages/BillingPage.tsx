import { useEffect, useState, useCallback } from 'react';
import {
  Coins, Loader2, ArrowLeft, CheckCircle2, AlertCircle, Sparkles, Zap,
  CreditCard, RefreshCw, Settings,
} from 'lucide-react';
import {
  paymentsApi,
  type CreditPackageDto,
  type SubscriptionState,
  type CreditTransaction,
} from '../api/paymentsApi';
import { ApiError } from '../api/client';
import { useToast } from '../components/shared/Toast';
import type { AuthUser } from '../hooks/useAuth';

interface BillingPageProps {
  user: AuthUser;
  onBack: () => void;
}

const money = (cents: number, currency = 'usd') =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: currency.toUpperCase() }).format(
    cents / 100
  );

export function BillingPage({ user, onBack }: BillingPageProps) {
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [stripeEnabled, setStripeEnabled] = useState(true);
  const [balance, setBalance] = useState(0);
  const [subscription, setSubscription] = useState<SubscriptionState | null>(null);
  const [packages, setPackages] = useState<CreditPackageDto[]>([]);
  const [history, setHistory] = useState<CreditTransaction[]>([]);
  const [buyingId, setBuyingId] = useState<string | null>(null);
  const [verifying, setVerifying] = useState(false);
  const [openingPortal, setOpeningPortal] = useState(false);

  const loadAll = useCallback(async () => {
    const [pkgRes, balRes, histRes] = await Promise.all([
      paymentsApi.packages(),
      paymentsApi.balance(),
      paymentsApi.history().catch(() => ({ transactions: [] as CreditTransaction[] })),
    ]);
    setStripeEnabled(pkgRes.stripeEnabled);
    setPackages(pkgRes.packages);
    setBalance(balRes.balance);
    setSubscription(balRes.subscription);
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
            toast.push({ title: 'Payment complete', body: `Your credits are ready. Balance: ${res.balance}.`, tone: 'success' });
          } else {
            toast.push({ title: 'Payment pending', body: `Status: ${res.paymentStatus}. Credits will appear once it clears.`, tone: 'warning' });
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

  async function buy(pkg: CreditPackageDto) {
    setBuyingId(pkg.id);
    try {
      const res = await paymentsApi.createCheckout(pkg.id);
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

  return (
    <div className="min-h-screen bg-white dark:bg-[#0a0a0a]">
      <header className="border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-[#0a0a0a] sticky top-0 z-10 transition-colors">
        <div className="max-w-[1100px] mx-auto px-6 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={onBack}
              className="flex items-center gap-1.5 text-sm font-medium px-3 py-1.5 rounded border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 bg-white dark:bg-transparent hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" /> Dashboard
            </button>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-black dark:bg-gray-800 flex items-center justify-center">
                <Coins className="w-4 h-4 text-white" />
              </div>
              <div>
                <h1 className="text-base font-bold text-gray-900 dark:text-white leading-none">Credits &amp; Billing</h1>
                <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">Credits are spent on Apollo email / phone reveals</p>
              </div>
            </div>
          </div>
          <div className="text-right">
            <p className="text-[10px] uppercase tracking-wider font-bold text-gray-400 dark:text-gray-500">Balance</p>
            <p className="text-2xl font-extrabold text-gray-900 dark:text-white tabular-nums leading-none">
              {loading ? '—' : balance.toLocaleString()}
              <span className="text-xs font-semibold text-gray-400 dark:text-gray-500 ml-1">credits</span>
            </p>
          </div>
        </div>
      </header>

      <main className="max-w-[1100px] mx-auto px-6 py-8 flex flex-col gap-8">
        {verifying && (
          <div className="flex items-center gap-2 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-4 py-3 text-sm text-gray-800 dark:text-gray-200">
            <Loader2 className="w-4 h-4 animate-spin" /> Verifying your payment…
          </div>
        )}

        {!loading && !stripeEnabled && (
          <div className="flex items-start gap-2 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/40 rounded-lg px-4 py-3 text-sm text-amber-800 dark:text-amber-300">
            <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
            <span>Payments are not configured on this server yet (missing Stripe keys). Buying is disabled.</span>
          </div>
        )}

        {/* Subscription status */}
        {!loading && subscription?.active && (
          <div className="flex items-center justify-between gap-4 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800/40 rounded-xl px-5 py-4">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <div>
                <p className="text-sm font-semibold text-emerald-900 dark:text-emerald-300">
                  Start Tier active — 2,000 credits / month
                </p>
                {subscription.currentPeriodEnd && (
                  <p className="text-xs text-emerald-700 dark:text-emerald-400 mt-0.5">
                    Renews {new Date(subscription.currentPeriodEnd).toLocaleDateString()}
                  </p>
                )}
              </div>
            </div>
            <button
              onClick={manageSubscription}
              disabled={openingPortal}
              className="flex items-center gap-1.5 text-xs font-medium px-3 py-2 rounded border border-emerald-300 dark:border-emerald-700 text-emerald-800 dark:text-emerald-300 bg-white dark:bg-transparent hover:bg-emerald-100 dark:hover:bg-emerald-900/20 transition-colors disabled:opacity-60"
            >
              {openingPortal ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Settings className="w-3.5 h-3.5" />}
              Manage
            </button>
          </div>
        )}

        {/* Packages */}
        <section>
          <h2 className="text-sm font-bold text-gray-900 dark:text-white mb-3">Buy credits</h2>
          {loading ? (
            <div className="py-12 flex justify-center"><Loader2 className="w-5 h-5 animate-spin text-gray-400" /></div>
          ) : (
            <div className="grid sm:grid-cols-2 gap-4">
              {packages.map(pkg => {
                const isSub = pkg.kind === 'subscription';
                const alreadySubscribed = isSub && subscription?.active;
                return (
                  <div
                    key={pkg.id}
                    className={`rounded-xl border p-6 flex flex-col ${
                      isSub
                        ? 'border-2 border-gray-900 dark:border-white bg-gray-50 dark:bg-gray-900/50'
                        : 'border border-gray-200 dark:border-gray-800 bg-white dark:bg-[#111111]'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      {isSub
                        ? <Sparkles className="w-4 h-4 text-gray-900 dark:text-white" />
                        : <Zap className="w-4 h-4 text-amber-500" />}
                      <h3 className="text-base font-bold text-gray-900 dark:text-white">{pkg.name}</h3>
                      {isSub && (
                        <span className="ml-auto text-[10px] font-bold uppercase tracking-wide bg-black dark:bg-white text-white dark:text-black px-2 py-0.5 rounded-full">
                          Subscription
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">{pkg.label}</p>
                    <div className="flex items-baseline gap-1 mb-1">
                      <span className="text-3xl font-extrabold text-gray-900 dark:text-white">{money(pkg.priceCents, pkg.currency)}</span>
                      {isSub && <span className="text-sm font-medium text-gray-500 dark:text-gray-400">/ {pkg.interval}</span>}
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-5">
                      {pkg.credits.toLocaleString()} credits{isSub ? ' every month' : ' one-time'}
                      {' · '}
                      {money(Math.round(pkg.priceCents / (pkg.credits / 1000)), pkg.currency)} / 1,000
                    </p>
                    <button
                      onClick={() => buy(pkg)}
                      disabled={!stripeEnabled || buyingId !== null || !!alreadySubscribed}
                      className={`mt-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded text-sm font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                        isSub
                          ? 'bg-black dark:bg-white hover:bg-gray-800 dark:hover:bg-gray-100 text-white dark:text-black'
                          : 'bg-gray-900 dark:bg-gray-100 hover:bg-gray-800 dark:hover:bg-white text-white dark:text-black'
                      }`}
                    >
                      {buyingId === pkg.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <CreditCard className="w-4 h-4" />
                      )}
                      {alreadySubscribed ? 'Current plan' : isSub ? 'Subscribe' : 'Buy now'}
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* History */}
        {!loading && (
          <section>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-bold text-gray-900 dark:text-white">Transaction history</h2>
              <button
                onClick={() => loadAll().catch(() => {})}
                className="flex items-center gap-1 text-xs font-medium text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-white transition-colors"
              >
                <RefreshCw className="w-3.5 h-3.5" /> Refresh
              </button>
            </div>
            {history.length === 0 ? (
              <p className="text-sm text-gray-400 dark:text-gray-500 py-6 text-center border border-dashed border-gray-200 dark:border-gray-700 rounded-lg">
                No transactions yet.
              </p>
            ) : (
              <div className="border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden bg-white dark:bg-[#111111]">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 dark:bg-gray-900/60 text-left text-[11px] uppercase tracking-wide text-gray-500 dark:text-gray-400">
                      <th className="px-4 py-2.5 font-semibold">Date</th>
                      <th className="px-4 py-2.5 font-semibold">Description</th>
                      <th className="px-4 py-2.5 font-semibold text-right">Credits</th>
                      <th className="px-4 py-2.5 font-semibold text-right">Balance</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                    {history.map(t => (
                      <tr key={t.id}>
                        <td className="px-4 py-2.5 text-gray-500 dark:text-gray-400 whitespace-nowrap">
                          {new Date(t.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-2.5 text-gray-800 dark:text-gray-200">{t.reason ?? labelForType(t.type)}</td>
                        <td className={`px-4 py-2.5 text-right font-semibold tabular-nums ${t.credits >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-gray-700 dark:text-gray-300'}`}>
                          {t.credits >= 0 ? `+${t.credits}` : t.credits}
                        </td>
                        <td className="px-4 py-2.5 text-right text-gray-500 dark:text-gray-400 tabular-nums">{t.balanceAfter ?? '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        )}

        <p className="text-[11px] text-gray-400 dark:text-gray-500 text-center">
          Signed in as {user.email}. Payments processed securely by Stripe.
        </p>
      </main>
    </div>
  );
}

function labelForType(t: CreditTransaction['type']): string {
  switch (t) {
    case 'SUBSCRIPTION_GRANT': return 'Subscription credits';
    case 'TOPUP_PURCHASE': return 'Top-up purchase';
    case 'SPEND': return 'Apollo contact reveal';
    case 'ADMIN_GRANT': return 'Admin adjustment';
    case 'REFUND': return 'Refund';
    default: return t;
  }
}
