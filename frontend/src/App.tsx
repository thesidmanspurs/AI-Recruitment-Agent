import { useState, useEffect, useCallback } from 'react';
import { Loader2 } from 'lucide-react';
import { AppProvider } from './store/AppContext';
import { DashboardPage } from './pages/DashboardPage';
import { RegisterPage } from './pages/RegisterPage';
import { AdminPage } from './pages/AdminPage';
import { BillingPage } from './pages/BillingPage';
import { LandingPage } from './pages/marketing/LandingPage';
import { EngineFeaturesPage } from './pages/marketing/EngineFeaturesPage';
import { PricingPage } from './pages/marketing/PricingPage';
import { FaqPage } from './pages/marketing/FaqPage';
import { ToastProvider } from './components/shared/Toast';
import { useAuth } from './hooks/useAuth';

/**
 * Minimal pathname router (no react-router).
 *
 * Public (no auth):
 *   /                 → landing page w/ embedded recruiter sign-in console
 *   /engine-features  → marketing
 *   /pricing          → marketing (pricing + estimate calculator)
 *   /faq              → marketing
 *   /register         → create account
 *
 * Authenticated:
 *   /        → workspace dashboard (admins are pushed to /admin)
 *   /admin   → admin console (ADMIN only)
 *   /billing → credits & billing
 *
 * Marketing sub-pages are viewable regardless of auth. The unauthenticated
 * landing IS the login screen (console card on the right of the hero).
 */
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

  // Once the user is known, enforce sensible landing URLs:
  //   - ADMIN on "/" → /admin
  //   - non-admin on /admin (URL paste / demotion) → /
  useEffect(() => {
    if (!user) return;
    if (user.role === 'ADMIN' && path === '/') {
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
  if (path === '/pricing') return <PricingPage onNavigate={navigate} />;
  if (path === '/faq') return <FaqPage onNavigate={navigate} />;

  // ── Unauthenticated ──────────────────────────────────────────────────────
  if (!user) {
    if (path === '/register') {
      return <RegisterPage onRegister={register} onSwitchToLogin={() => navigate('/')} />;
    }
    // "/" and any protected/unknown path → landing (with sign-in console).
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
