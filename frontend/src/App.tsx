import * as React from 'react';
import { useState, useEffect, useCallback, useRef } from 'react';
import { Loader2 } from 'lucide-react';
import { AppProvider } from './store/AppContext';
import { DashboardPage } from './pages/DashboardPage';
import { AuthPage } from './pages/AuthPage';
import { AdminPage } from './pages/AdminPage';
import { BillingPage } from './pages/BillingPage';
import { RankingPage } from './pages/RankingPage';
import { LandingPage } from './pages/marketing/LandingPage';
import { EngineFeaturesPage } from './pages/marketing/EngineFeaturesPage';
import { PricingPage } from './pages/marketing/PricingPage';
import { FaqPage } from './pages/marketing/FaqPage';
import { PolicyPage } from './pages/marketing/PolicyPage';
import { ToastProvider, useToast } from './components/shared/Toast';
import { OnboardingIntentModal } from './components/onboarding/OnboardingIntentModal';
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
 *   /policy           → privacy policy, terms & GDPR (Trust Centre)
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
  const toast = useToast();
  const [path, setPath] = useState<string>(() => window.location.pathname);

  // Detect OAuth error query param on page load (e.g., ?auth_error=...)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const authErr = params.get('auth_error');
    if (authErr) {
      toast.push({ title: 'Google Sign-in Failed', body: authErr, tone: 'error' });
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, [toast]);

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

  const [showOnboarding, setShowOnboarding] = useState<boolean>(false);

  // Check if newly registered or hasn't completed onboarding intent selection
  useEffect(() => {
    if (!user) return;
    const isJustReg = sessionStorage.getItem('show_onboarding_intent') === 'true';
    const isNotDone = !localStorage.getItem('onboarding_done_' + user.id);
    const isFreemium = !user.planType || user.planType === 'NONE';
    if ((isJustReg || (isNotDone && isFreemium)) && user.role !== 'ADMIN') {
      setShowOnboarding(true);
    }
  }, [user]);

  const handleSelectGoal = (goal: 'sourcing' | 'ranking' | 'both') => {
    if (user) localStorage.setItem('onboarding_done_' + user.id, 'true');
    sessionStorage.removeItem('show_onboarding_intent');
    setShowOnboarding(false);
    if (goal === 'ranking') {
      navigate('/ranking');
    } else {
      navigate('/home');
    }
  };

  // After a fresh password login/register, move into the app
  const handleLogin = useCallback(async (email: string, password: string) => {
    await login(email, password);
    if (!readPendingCheckout()) navigate('/home');
  }, [login, navigate]);

  const handleRegister = useCallback(async (name: string, email: string, password: string) => {
    await register(name, email, password);
    clearPendingCheckout();
    sessionStorage.setItem('show_onboarding_intent', 'true');
    navigate('/home');
  }, [register, navigate]);

  // Enforce sensible URLs once the user is known.
  useEffect(() => {
    if (!user) return;
    const isJustReg = sessionStorage.getItem('show_onboarding_intent') === 'true';
    if (isJustReg && path !== '/home') {
      window.history.replaceState({}, '', '/home');
      setPath('/home');
      return;
    }
    if (resumed.current || readPendingCheckout()) return;
    if (user.role === 'ADMIN' && (path === '/home' || path === '/login' || path === '/register')) {
      window.history.replaceState({}, '', '/admin');
      setPath('/admin');
    } else if (user.role !== 'ADMIN') {
      const isRankingUser = user.planType === 'RANKING' || Boolean(user.email?.toLowerCase().includes('ranking'));
      if (isRankingUser && !path.startsWith('/ranking') && !path.startsWith('/billing') && path !== '/') {
        window.history.replaceState({}, '', '/ranking');
        setPath('/ranking');
      } else if (path === '/login' || path === '/register' || path.startsWith('/admin')) {
        const dest = isRankingUser ? '/ranking' : '/home';
        window.history.replaceState({}, '', dest);
        setPath(dest);
      }
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
  const goRanking = () => navigate('/ranking');
  const mkt = { authed: !!user, onOpenWorkspace: goWorkspace, onOpenRanking: goRanking };
  if (path === '/') return <LandingPage onLogin={handleLogin} onNavigate={navigate} {...mkt} />;
  if (path === '/engine-features') return <EngineFeaturesPage onNavigate={navigate} {...mkt} />;
  if (path === '/pricing') return <PricingPage onNavigate={navigate} onSelectPlan={handleSelectPlan} {...mkt} />;
  if (path === '/faq') return <FaqPage onNavigate={navigate} {...mkt} />;
  if (path === '/policy') return <PolicyPage onNavigate={navigate} {...mkt} />;

  // ── Auth screens — shown when logged out. ─────────────────────────────────
  if (!user && (path === '/login' || path === '/register' || path === '/forgot-password' || path.startsWith('/reset-password'))) {
    const pendingPkg = readPendingCheckout();
    const mode = path === '/register' ? 'register' : path === '/forgot-password' ? 'forgot' : path.startsWith('/reset-password') ? 'reset' : 'login';
    return (
      <AuthPage
        mode={mode}
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
  return (
    <>
      <OnboardingIntentModal
        open={showOnboarding}
        userName={user.name}
        onSelectGoal={handleSelectGoal}
      />
      {path.startsWith('/admin') && user.role === 'ADMIN' ? (
        <AdminPage currentUser={user} onLogout={handleLogout} onHome={() => navigate('/')} />
      ) : path.startsWith('/billing') ? (
        <BillingPage user={user} onBack={() => navigate('/home')} />
      ) : path.startsWith('/ranking') ? (
        <RankingPage
          user={user}
          onLogout={handleLogout}
          onOpenAdmin={user?.role === 'ADMIN' ? () => navigate('/admin') : undefined}
          onOpenBilling={() => navigate('/billing')}
          onOpenHome={() => navigate('/home')}
        />
      ) : (
        <AppProvider>
          <DashboardPage
            user={user}
            onLogout={handleLogout}
            onOpenAdmin={user.role === 'ADMIN' ? () => navigate('/admin') : undefined}
            onOpenBilling={() => navigate('/billing')}
            onOpenRanking={() => navigate('/ranking')}
            onOpenHome={() => navigate('/')}
          />
        </AppProvider>
      )}
    </>
  );
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false, error: null };

  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('React Error Boundary caught error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gray-50 dark:bg-[#0a0c12] flex items-center justify-center p-6 text-center">
          <div className="max-w-md w-full bg-white dark:bg-[#10131c] p-8 rounded-3xl border border-gray-200 dark:border-white/10 shadow-2xl space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-red-500/10 text-red-500 flex items-center justify-center mx-auto text-xl font-bold">
              ⚠️
            </div>
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">Application Error</h2>
            <p className="text-xs text-red-900 dark:text-red-200 font-mono bg-red-50 dark:bg-red-500/10 p-3 rounded-xl border border-red-200 dark:border-red-500/20 text-left overflow-auto max-h-32">
              {this.state.error?.message ?? 'An unexpected error occurred.'}
            </p>
            <button
              onClick={() => {
                (this as any).setState({ hasError: false, error: null });
                window.location.reload();
              }}
              className="w-full py-2.5 rounded-xl bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-xs font-bold hover:opacity-90 transition-all"
            >
              Reload Page
            </button>
          </div>
        </div>
      );
    }
    return (this as any).props.children;
  }
}

export default function App() {
  return (
    <ErrorBoundary>
      <ToastProvider>
        <AuthGate />
      </ToastProvider>
    </ErrorBoundary>
  );
}
