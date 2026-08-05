import { type ReactNode, useRef, useState, useEffect, useCallback } from 'react';
import { ThemeToggle } from '../shared/ThemeToggle';
const logoSrc = '/logo.png'; // served from frontend/public/logo.png

export type MarketingTab = 'home' | 'features' | 'pricing' | 'faq' | 'policy';

const NAV: { tab: MarketingTab; label: string; to: string }[] = [
  { tab: 'home',     label: 'Overview', to: '/' },
  { tab: 'features', label: 'Features',  to: '/engine-features' },
  { tab: 'pricing',  label: 'Pricing',   to: '/pricing' },
  { tab: 'faq',      label: 'FAQ',       to: '/faq' },
];

interface MarketingShellProps {
  current: MarketingTab;
  onNavigate: (to: string) => void;
  children: ReactNode;
  authed?: boolean;
  onOpenWorkspace?: () => void;
}

export function MarketingShell({ current, onNavigate, children, authed, onOpenWorkspace }: MarketingShellProps) {
  const navElRef = useRef<HTMLElement>(null);
  const btnRefs = useRef<Partial<Record<MarketingTab, HTMLButtonElement>>>({});
  const [pill, setPill] = useState({ left: 0, width: 0, ready: false });

  const movePill = useCallback((tab: MarketingTab) => {
    const btn = btnRefs.current[tab];
    const nav = navElRef.current;
    if (!btn || !nav) return;
    const nb = nav.getBoundingClientRect();
    const bb = btn.getBoundingClientRect();
    setPill({ left: bb.left - nb.left, width: bb.width, ready: true });
  }, []);

  useEffect(() => {
    const t = setTimeout(() => movePill(current), 60);
    return () => clearTimeout(t);
  }, [current, movePill]);

  return (
    <div className="min-h-screen flex flex-col w-full bg-[#f9fafb] dark:bg-[#0a0a0a] text-gray-900 dark:text-gray-100 transition-colors"
      style={{ fontFamily: "'Inter', sans-serif" }}>

      {/* NAV — Liquid glass header with dark mode support */}
      <header className="sticky top-0 z-50 px-6 py-0 transition-colors bg-white/70 dark:bg-[#0a0a0a]/80 backdrop-blur-xl border-b border-gray-200/80 dark:border-white/10 shadow-xs">
        <div className="max-w-6xl mx-auto flex items-center justify-between h-[74px] gap-4">
          <button onClick={() => onNavigate('/')} className="flex items-center gap-2.5" aria-label="TalentScanr home">
            <span
              aria-hidden
              className="block shrink-0"
              style={{
                width: '42px',
                height: '40px',
                backgroundImage: `url(${logoSrc})`,
                backgroundRepeat: 'no-repeat',
                backgroundSize: '160px 97px',
                backgroundPosition: '-55px -16px',
              }}
            />
            <span className="text-[23px] font-extrabold tracking-tight text-gray-900 dark:text-white leading-none">
              TalentScanr
            </span>
          </button>

          {/* Glass pill nav with mouse-following indicator */}
          <nav
            ref={navElRef}
            onMouseLeave={() => movePill(current)}
            className="hidden md:flex items-center p-1 rounded-2xl gap-0.5 relative bg-gray-100/80 dark:bg-white/5 border border-gray-200 dark:border-white/10">

            {/* Follower pill */}
            {pill.ready && (
              <div
                className="absolute top-1 bottom-1 rounded-xl pointer-events-none bg-white dark:bg-white/15 border border-gray-200/60 dark:border-white/10 shadow-sm"
                style={{
                  left: pill.left,
                  width: pill.width,
                  transition: 'left 0.18s cubic-bezier(0.34,1.2,0.64,1), width 0.18s cubic-bezier(0.34,1.2,0.64,1)',
                }}
              />
            )}

            {NAV.map(n => (
              <button
                key={n.tab}
                ref={el => { btnRefs.current[n.tab] = el ?? undefined; }}
                onMouseEnter={() => movePill(n.tab)}
                onClick={() => onNavigate(n.to)}
                className={`relative z-10 px-5 py-2 rounded-xl text-[15px] font-medium transition-colors duration-150 ${
                  current === n.tab ? 'text-gray-900 dark:text-white font-bold' : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
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
                className="px-5 py-2 rounded-xl text-[15px] font-semibold text-white bg-gray-900 hover:bg-gray-800 dark:bg-white dark:text-gray-900 dark:hover:bg-gray-100 transition-colors shadow-xs">
                Open workspace
              </button>
            ) : (
              <>
                <button onClick={() => onNavigate('/login')}
                  className="px-4 py-2 rounded-xl text-[15px] font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors">
                  Sign in
                </button>
                <button onClick={() => onNavigate('/register')}
                  className="px-5 py-2 rounded-xl text-[15px] font-semibold text-white bg-gray-900 hover:bg-gray-800 dark:bg-white dark:text-gray-900 dark:hover:bg-gray-100 transition-colors shadow-xs">
                  Get started
                </button>
              </>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1 w-full relative">{children}</main>

      <footer className="bg-gray-950 border-t border-gray-800 px-6 py-8">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2">
            <img src={logoSrc} alt="TalentScanr" className="h-6 w-auto brightness-0 invert" />
          </div>
          <div className="flex flex-wrap gap-6 text-[13px] text-gray-400">
            <button onClick={() => onNavigate('/engine-features')} className="hover:text-white transition-colors">Features</button>
            <button onClick={() => onNavigate('/pricing')} className="hover:text-white transition-colors">Pricing</button>
            <button onClick={() => onNavigate('/faq')} className="hover:text-white transition-colors">FAQ</button>
            <button onClick={() => onNavigate('/policy')} className="hover:text-white transition-colors">Privacy &amp; Terms</button>
            <span className="text-gray-600">© 2026 TalentScanr</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

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
    <div className="max-w-2xl space-y-3 mb-12">
      <span className="text-[11px] font-mono tracking-widest font-semibold uppercase text-gray-400 dark:text-gray-500">{eyebrow}</span>
      <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-gray-900 dark:text-white"
        style={{ fontFamily: "'DM Serif Display', serif" }}>{title}</h2>
      {subtitle && <p className="text-base text-gray-500 dark:text-gray-400 leading-relaxed">{subtitle}</p>}
    </div>
  );
}
