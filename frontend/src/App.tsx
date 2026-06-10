import { useState, useEffect, useCallback, useRef } from 'react';
import { Loader2 } from 'lucide-react';
import { AppProvider } from './store/AppContext';
import { DashboardPage } from './pages/DashboardPage';
import { AuthPage } from './pages/AuthPage';
import { AdminPage } from './pages/AdminPage';
import { BillingPage } from './pages/BillingPage';
import { LandingPage } from './pages/marketing/LandingPage';
import { EngineFeaturesPage } from './pages/marketing/EngineFeaturesPage';
import { PricingPage } from './pages/marketing/PricingPage';
import { FaqPage } from './pages/marketing/FaqPage';
import { ToastProvider } from './components/shared/Toast';
import { useAuth } from './hooks/useAuth';
import { paymentsApi } from './api/paymentsApi';

/**
 * Minimal pathname router (no react-router).
 *
 * Public (no auth):
 *   /                 → landing page w/ embedded recruiter sign-in console
 *   /engine-features  → marketing
 *   /pricing          → marketing (pricing + estimate calculator)
 *   /faq              → marketing
 *   /login, /register → focused auth screen
 *
 * Authenticated:
 *   /        → workspace dashboard (admins are pushed to /admin)
 *   /admin   → admin console (ADMIN only)
 *   /billing → credits & billing
 *
 * Purchase intent hand-off: clicking a plan on /pricing while logged OUT stores
 * the package id, sends the user to /login, then resumes straight into Stripe
 * checkout once they authenticate (works for password OR Google OAuth, since
 * the intent lives in localStorage and survives the OAuth redirect).
 */
const PENDING_KEY = 'aries_pending_checkout';
const PENDING_TTL_MS = 30 * 60 * 1000; // 30 min
const PACKAGE_LABELS: Record<string, string> = {
  'start-tier': 'Start Tier subscription',
  'topup-1000': 'Top-Up Pack',
};

function setPendingCheckout(packageId: string): void {
  try { localStorage.setItem(PENDING_KEY, JSON.stringify({ packageId, ts: Date.now() })); } catch { /* ignore */ }
}
function readPendingCheckout(): string | null {
  try {
    const raw = localStorage.getItem(PENDING_KEY);
    if (!raw) return null;
    const { packageId, ts } = JSON.parse(raw) as { packageId?: string; ts?: number };
    if (!packageId || !ts || Date.now() - ts > PENDING_TTL_MS) return null;
    return packageId;
  } catch { return null; }
}
function clearPendingCheckout(): void {
  try { localStorage.removeItem(PENDING_KEY); } catch { /* ignore */ }
}

function AuthGate() {
  const { user, loading, login, register, logout } = useAuth();
  const [path, setPath] = useState<string>(() => window.location.pathname);

  // Sync with browser back/forward.
  useEffect(() => {
    const onPop = () => setPath(window.location.pathname);
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  const navigate = useCallback((to: string) => {
    if (window.location.pathname !== to) window.history.pushState({}, '', to);
    setPath(to);
    window.scrollTo(0, 0);
  }, []);

  // Kick off a Stripe Checkout session and redirect to it. Falls back to the
  // billing page on error (e.g. already-subscribed 409).
  const startCheckout = useCallback(async (packageId: string) => {
    try {
      const res = await paymentsApi.createCheckout(packageId);
      window.location.href = res.checkoutUrl;
    } catch {
      navigate('/billing');
    }
  }, [navigate]);

  // Plan picked from the public pricing page.
  const handleSelectPlan = useCallback((packageId: string) => {
    if (user) {
      void startCheckout(packageId);
    } else {
      setPendingCheckout(packageId);
      navigate('/login');
    }
  }, [user, startCheckout, navigate]);

  // After authentication (password OR Google redirect), resume a pending
  // purchase exactly once.
  const resumed = useRef(false);
  useEffect(() => {
    if (!user || resumed.current) return;
    const packageId = readPendingCheckout();
    if (packageId) {
      resumed.current = true;
      clearPendingCheckout();
      void startCheckout(packageId);
    }
  }, [user, startCheckout]);

  // Enforce sensible URLs once the user is known.
  useEffect(() => {
    if (!user) return;
    // Don't bounce while a pending checkout is about to redirect off-site
    // (the resume effect runs first, sets this ref, and navigates to Stripe).
    if (resumed.current || readPendingCheckout()) return;
    if (path === '/login' || path === '/register') {
      const to = user.role === 'ADMIN' ? '/admin' : '/';
      window.history.replaceState({}, '', to);
      setPath(to);
    } else if (user.role === 'ADMIN' && path === '/') {
      window.history.replaceState({}, '', '/admin');
      setPath('/admin');
    } else if (user.role !== 'ADMIN' && path.startsWith('/admin')) {
      window.history.replaceState({}, '', '/');
      setPath('/');
    }
  }, [user, path]);

  const handleLogout = useCallback(() => {
    logout();
    window.history.replaceState({}, '', '/');
    setPath('/');
  }, [logout]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0c12] flex items-center justify-center">
        <Loader2 className="w-6 h-6 text-indigo-400 animate-spin" />
      </div>
    );
  }

  // ── Public marketing sub-pages (regardless of auth) ──────────────────────
  if (path === '/engine-features') return <EngineFeaturesPage onNavigate={navigate} />;
  if (path === '/pricing') return <PricingPage onNavigate={navigate} onSelectPlan={handleSelectPlan} />;
  if (path === '/faq') return <FaqPage onNavigate={navigate} />;

  // ── Auth screens — shown when logged out; logged-in users are redirected by
  //    the effect above (or resumed into checkout). ──────────────────────────
  if (!user && (path === '/login' || path === '/register')) {
    const pendingPkg = readPendingCheckout();
    return (
      <AuthPage
        mode={path === '/register' ? 'register' : 'login'}
        onLogin={login}
        onRegister={register}
        onNavigate={navigate}
        pendingLabel={pendingPkg ? PACKAGE_LABELS[pendingPkg] ?? 'purchase' : null}
      />
    );
  }

  // ── Unauthenticated landing (has its own sign-in console) ─────────────────
  if (!user) {
    return <LandingPage onLogin={login} onNavigate={navigate} />;
  }

  // ── Authenticated ─────────────────────────────────────────────────────────
  if (path.startsWith('/admin') && user.role === 'ADMIN') {
    return <AdminPage currentUser={user} onLogout={handleLogout} />;
  }
  if (path.startsWith('/billing')) {
    return <BillingPage user={user} onBack={() => navigate('/')} />;
  }

  return (
    <AppProvider>
      <DashboardPage
        user={user}
        onLogout={handleLogout}
        onOpenAdmin={user.role === 'ADMIN' ? () => navigate('/admin') : undefined}
        onOpenBilling={() => navigate('/billing')}
      />
    </AppProvider>
  );
}

export default function App() {
  return (
    <ToastProvider>
      <AuthGate />
    </ToastProvider>
  );
}
