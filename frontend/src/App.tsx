import { useState, useEffect, useCallback } from 'react';
import { Loader2 } from 'lucide-react';
import { AppProvider } from './store/AppContext';
import { DashboardPage } from './pages/DashboardPage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { AdminPage } from './pages/AdminPage';
import { BillingPage } from './pages/BillingPage';
import { ToastProvider } from './components/shared/Toast';
import { useAuth, type AuthView } from './hooks/useAuth';

type AuthedView = 'dashboard' | 'admin' | 'billing';

/**
 * Minimal URL-state sync without pulling in react-router.
 *   /admin   → admin console
 *   /billing → credits / billing
 *   /        → user dashboard
 *
 * Reads window.location.pathname on mount and on popstate (back/forward),
 * pushes a new history entry when navigating programmatically. Gating is
 * still enforced by the component check below (`role === 'ADMIN'`) so a
 * non-admin who pastes /admin gets bounced.
 */
function pathToView(pathname: string): AuthedView {
  if (pathname.startsWith('/admin')) return 'admin';
  if (pathname.startsWith('/billing')) return 'billing';
  return 'dashboard';
}

function viewToPath(view: AuthedView): string {
  if (view === 'admin') return '/admin';
  if (view === 'billing') return '/billing';
  return '/';
}

function AuthGate() {
  const { user, loading, login, register, logout } = useAuth();
  const [view, setView] = useState<AuthView>('login');
  const [authedView, setAuthedView] = useState<AuthedView>(() =>
    pathToView(window.location.pathname)
  );

  // Keep authedView in sync with browser back/forward
  useEffect(() => {
    function onPop() {
      setAuthedView(pathToView(window.location.pathname));
    }
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  // Once the user is known, enforce the right landing URL:
  //   - ADMIN logging in on `/` → push to `/admin`
  //   - USER landing on `/admin` (URL paste / role demotion) → push to `/`
  useEffect(() => {
    if (!user) return;
    const current = window.location.pathname;
    if (user.role === 'ADMIN' && current === '/') {
      window.history.replaceState({}, '', '/admin');
      setAuthedView('admin');
    } else if (user.role !== 'ADMIN' && current.startsWith('/admin')) {
      window.history.replaceState({}, '', '/');
      setAuthedView('dashboard');
    }
  }, [user]);

  const navigate = useCallback((next: AuthedView) => {
    const path = viewToPath(next);
    if (window.location.pathname !== path) {
      window.history.pushState({}, '', path);
    }
    setAuthedView(next);
  }, []);

  const handleLogout = useCallback(() => {
    logout();
    if (window.location.pathname !== '/') {
      window.history.replaceState({}, '', '/');
    }
    setAuthedView('dashboard');
  }, [logout]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0d1117] flex items-center justify-center">
        <Loader2 className="w-6 h-6 text-indigo-400 animate-spin" />
      </div>
    );
  }

  if (!user) {
    if (view === 'register') {
      return <RegisterPage onRegister={register} onSwitchToLogin={() => setView('login')} />;
    }
    return <LoginPage onLogin={login} onSwitchToRegister={() => setView('register')} />;
  }

  if (authedView === 'admin' && user.role === 'ADMIN') {
    return <AdminPage currentUser={user} onLogout={handleLogout} />;
  }

  if (authedView === 'billing') {
    return <BillingPage user={user} onBack={() => navigate('dashboard')} />;
  }

  return (
    <AppProvider>
      <DashboardPage
        user={user}
        onLogout={handleLogout}
        onOpenAdmin={user.role === 'ADMIN' ? () => navigate('admin') : undefined}
        onOpenBilling={() => navigate('billing')}
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
