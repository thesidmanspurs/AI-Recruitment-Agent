import { type ReactNode } from 'react';
import { Flame } from 'lucide-react';
import { ThemeToggle } from '../shared/ThemeToggle';

export type MarketingTab = 'home' | 'features' | 'pricing' | 'faq';

const NAV: { tab: MarketingTab; label: string; to: string }[] = [
  { tab: 'home', label: 'Overview', to: '/' },
  { tab: 'features', label: 'Engine Features', to: '/engine-features' },
  { tab: 'pricing', label: 'Pricing Calculator', to: '/pricing' },
  { tab: 'faq', label: 'Platform FAQs', to: '/faq' },
];

interface MarketingShellProps {
  current: MarketingTab;
  onNavigate: (to: string) => void;
  children: ReactNode;
  /** When the visitor is already signed in, show "Open workspace" instead of
   *  the sign-in CTA (their session/token is preserved — no re-login). */
  authed?: boolean;
  onOpenWorkspace?: () => void;
}

/**
 * Shared dark chrome for the four public marketing tabs (Overview, Engine
 * Features, Pricing Calculator, Platform FAQs). The nav pills NAVIGATE between
 * routes (separate pages) and highlight the active tab; "Recruiter Sign In"
 * goes to the Overview page which holds the sign-in console.
 */
export function MarketingShell({ current, onNavigate, children, authed, onOpenWorkspace }: MarketingShellProps) {
  return (
    <div className="min-h-screen flex flex-col w-full bg-slate-50 dark:bg-[#0B0F19] text-slate-900 dark:text-slate-100 font-sans selection:bg-indigo-500 selection:text-white relative transition-colors">
      {/* Decorative glow — fixed + clipped so it never adds a scroll axis. */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
        <div className="absolute top-[-10%] left-[-15%] w-[80%] h-[60%] bg-indigo-900/10 rounded-full blur-[140px]" />
        <div className="absolute top-[40%] right-[-10%] w-[60%] h-[70%] bg-violet-900/10 rounded-full blur-[160px]" />
      </div>

      {/* NAV */}
      <header className="sticky top-0 z-50 bg-white/90 dark:bg-[#0B0F19]/85 backdrop-blur-md border-b border-slate-200 dark:border-slate-900 px-6 py-4 transition-colors">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          <button onClick={() => onNavigate('/')} className="flex items-center gap-3">
            <div className="p-2.5 bg-gradient-to-tr from-indigo-600 to-violet-500 text-white rounded-xl shadow-lg shadow-indigo-500/20">
              <Flame className="w-5 h-5" />
            </div>
            <div className="text-left">
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-lg tracking-tight text-gray-900 dark:text-white uppercase">Aries</span>
                <span className="text-[9px] bg-indigo-500/20 text-indigo-300 font-extrabold px-1.5 py-0.5 rounded border border-indigo-500/30 font-mono tracking-wider">v4.2</span>
              </div>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">Autonomous Outbound Recruiting Match Engine</p>
            </div>
          </button>

          <nav className="hidden md:flex items-center gap-1 bg-gray-100 dark:bg-slate-950/60 p-1 rounded-xl border border-gray-200 dark:border-slate-800/80">
            {NAV.map(n => (
              <button
                key={n.tab}
                onClick={() => onNavigate(n.to)}
                className={`px-4 py-1.5 rounded-lg text-xs font-bold transition leading-none ${
                  current === n.tab ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-200 dark:hover:bg-white/5'
                }`}
              >
                {n.label}
              </button>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            <ThemeToggle />
            {authed ? (
              <button onClick={onOpenWorkspace}
                className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white rounded-xl text-xs font-bold transition shadow-md shadow-indigo-600/10 active:scale-[0.98]">
                Open workspace →
              </button>
            ) : (
              <>
                <button onClick={() => onNavigate('/')}
                  className="px-4 py-2 bg-gray-900 dark:bg-slate-900 hover:bg-gray-800 dark:hover:bg-slate-800 text-white rounded-xl text-xs font-bold border border-gray-700 dark:border-slate-800 hover:border-gray-600 dark:hover:border-slate-700 transition">
                  Recruiter Sign In
                </button>
                <button onClick={() => onNavigate('/pricing')}
                  className="hidden sm:block px-4 py-2 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white rounded-xl text-xs font-bold transition shadow-md shadow-indigo-600/10 active:scale-[0.98]">
                  Estimate Costings
                </button>
              </>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1 w-full max-w-7xl mx-auto px-6 py-12 relative z-10">{children}</main>

      <footer className="border-t border-gray-200 dark:border-slate-900 bg-gray-100/80 dark:bg-slate-950/80 px-6 py-10 text-slate-500 dark:text-slate-500 text-xs relative z-10 select-none transition-colors">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2">
            <Flame className="w-4 h-4 text-indigo-500" />
            <span className="font-bold text-gray-900 dark:text-white uppercase">Aries Recruiting</span>
            <span>• © 2026 Aries Outbound Inc.</span>
          </div>
          <div className="flex flex-wrap gap-6 text-[11px]">
            <button onClick={() => onNavigate('/engine-features')} className="hover:text-gray-700 dark:hover:text-slate-300">Features</button>
            <button onClick={() => onNavigate('/pricing')} className="hover:text-gray-700 dark:hover:text-slate-300">Pricing</button>
            <button onClick={() => onNavigate('/faq')} className="hover:text-gray-700 dark:hover:text-slate-300">FAQ</button>
            <span className="text-emerald-400/80 font-mono">SOC2 • GDPR-aligned</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

/* Shared bits reused across the marketing tabs. */
export function GoogleMark() {
  return (
    <svg className="w-4 h-4" viewBox="0 0 24 24" aria-hidden="true">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.27-4.74 3.27-8.1Z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23Z" />
      <path fill="#FBBC05" d="M5.84 14.1a6.6 6.6 0 0 1 0-4.2V7.06H2.18a11 11 0 0 0 0 9.88l3.66-2.84Z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38Z" />
    </svg>
  );
}

export function MarketingHeading({ eyebrow, title, subtitle }: { eyebrow: string; title: string; subtitle?: string }) {
  return (
    <div className="text-center max-w-2xl mx-auto space-y-3 mb-12">
      <span className="text-xs text-indigo-400 font-mono tracking-widest font-extrabold uppercase bg-indigo-500/5 px-3 py-1 rounded-full border border-indigo-500/10">{eyebrow}</span>
      <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight text-gray-900 dark:text-white">{title}</h2>
      {subtitle && <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">{subtitle}</p>}
    </div>
  );
}
