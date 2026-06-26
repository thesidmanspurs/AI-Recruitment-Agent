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
const PENDING_KEY = 'talentscanr_pending_checkout';
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

  // After a fresh password login/register, move into the app (workspace at
  // /home; admins get bounced to /admin by the effect below). When a purchase
  // is pending we leave navigation to the resume effect (→ Stripe).
  const handleLogin = useCallback(async (email: string, password: string) => {
    await login(email, password);
    if (!readPendingCheckout()) navigate('/home');
  }, [login, navigate]);
  const handleRegister = useCallback(async (name: string, email: string, password: string) => {
    await register(name, email, password);
    if (!readPendingCheckout()) navigate('/home');
  }, [register, navigate]);

  // Enforce sensible URLs once the user is known. NOTE: "/" is the PUBLIC
  // homepage (4 marketing tabs) for everyone — authed users are NOT bounced
  // off it (that's how the workspace logo returns home). The authed workspace
  // lives at /home; the admin console at /admin.
  useEffect(() => {
    if (!user) return;
    if (resumed.current || readPendingCheckout()) return;
    if (user.role === 'ADMIN' && (path === '/home' || path === '/login' || path === '/register')) {
      window.history.replaceState({}, '', '/admin');
      setPath('/admin');
    } else if (user.role !== 'ADMIN' && (path === '/login' || path === '/register' || path.startsWith('/admin'))) {
      window.history.replaceState({}, '', '/home');
      setPath('/home');
    }
  }, [user, path]);

  const handleLogout = useCallback(() => {
    logout();
    window.history.replaceState({}, '', '/');
    setPath('/');
  }, [logout]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-[#0a0c12] flex items-center justify-center">
        <Loader2 className="w-6 h-6 text-gray-400 animate-spin" />
      </div>
    );
  }

  // ── Public marketing homepage + tabs — ALWAYS, regardless of auth. "/" is
  //    the homepage (Overview); the workspace logo returns here. When signed
  //    in, the shell/console show "Open workspace" (session preserved — no
  //    re-login). ─────────────────────────────────────────────────────────
  const goWorkspace = () => navigate(user?.role === 'ADMIN' ? '/admin' : '/home');
  const mkt = { authed: !!user, onOpenWorkspace: goWorkspace };
  if (path === '/') return <LandingPage onLogin={handleLogin} onNavigate={navigate} {...mkt} />;
  if (path === '/engine-features') return <EngineFeaturesPage onNavigate={navigate} {...mkt} />;
  if (path === '/pricing') return <PricingPage onNavigate={navigate} onSelectPlan={handleSelectPlan} {...mkt} />;
  if (path === '/faq') return <FaqPage onNavigate={navigate} {...mkt} />;

  // ── Auth screens — shown when logged out. ─────────────────────────────────
  if (!user && (path === '/login' || path === '/register')) {
    const pendingPkg = readPendingCheckout();
    return (
      <AuthPage
        mode={path === '/register' ? 'register' : 'login'}
        onLogin={handleLogin}
        onRegister={handleRegister}
        onNavigate={navigate}
        pendingLabel={pendingPkg ? PACKAGE_LABELS[pendingPkg] ?? 'purchase' : null}
      />
    );
  }

  // ── Not authenticated on an app route → homepage. ─────────────────────────
  if (!user) {
    return <LandingPage onLogin={handleLogin} onNavigate={navigate} />;
  }

  // ── Authenticated app ─────────────────────────────────────────────────────
  if (path.startsWith('/admin') && user.role === 'ADMIN') {
    return <AdminPage currentUser={user} onLogout={handleLogout} onHome={() => navigate('/')} />;
  }
  if (path.startsWith('/billing')) {
    return <BillingPage user={user} onBack={() => navigate('/home')} />;
  }

  // /home (and any other authenticated path) → the workspace.
  return (
    <AppProvider>
      <DashboardPage
        user={user}
        onLogout={handleLogout}
        onOpenAdmin={user.role === 'ADMIN' ? () => navigate('/admin') : undefined}
        onOpenBilling={() => navigate('/billing')}
        onOpenHome={() => navigate('/')}
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
