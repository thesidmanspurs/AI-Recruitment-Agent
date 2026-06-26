import { type ReactNode, useRef, useState, useEffect, useCallback } from 'react';
import logoSrc from '../../public/logo.png';

export type MarketingTab = 'home' | 'features' | 'pricing' | 'faq';

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
    <div className="min-h-screen flex flex-col w-full bg-white dark:bg-[#0a0a0a] text-gray-900 dark:text-gray-100 transition-colors"
      style={{ fontFamily: "'Inter', sans-serif" }}>

      {/* NAV — iOS 26 / macOS 26 liquid glass */}
      <header className="sticky top-0 z-50 px-6 py-0 transition-colors"
        style={{
          background: 'rgba(255,255,255,0.55)',
          backdropFilter: 'blur(28px) saturate(200%) brightness(1.06)',
          WebkitBackdropFilter: 'blur(28px) saturate(200%) brightness(1.06)',
          borderBottom: '1px solid rgba(255,255,255,0.6)',
          boxShadow: '0 1px 0 rgba(0,0,0,0.06), 0 4px 24px rgba(0,0,0,0.05)',
        }}>
        <div className="max-w-6xl mx-auto flex items-center justify-between h-[74px] gap-4">
          <button onClick={() => onNavigate('/')} className="flex items-center gap-2.5">
            <img src={logoSrc} alt="TalentScanr" className="h-[52px] w-auto" />
          </button>

          {/* Glass pill nav with mouse-following indicator */}
          <nav
            ref={navElRef}
            onMouseLeave={() => movePill(current)}
            className="hidden md:flex items-center p-1 rounded-2xl gap-0.5 relative"
            style={{
              background: 'rgba(0,0,0,0.04)',
              border: '1px solid rgba(255,255,255,0.7)',
              boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.8), 0 1px 4px rgba(0,0,0,0.06)',
            }}>

            {/* Follower pill */}
            {pill.ready && (
              <div
                className="absolute top-1 bottom-1 rounded-xl pointer-events-none"
                style={{
                  left: pill.left,
                  width: pill.width,
                  background: 'rgba(255,255,255,0.52)',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.10), 0 1px 2px rgba(0,0,0,0.06), inset 0 1px 0 rgba(255,255,255,0.95)',
                  border: '1px solid rgba(0,0,0,0.07)',
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
                  current === n.tab ? 'text-gray-900' : 'text-gray-500 hover:text-gray-800'
                }`}
              >
                {n.label}
              </button>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            {authed ? (
              <button onClick={onOpenWorkspace}
                className="px-5 py-2 rounded-xl text-[15px] font-semibold text-white transition-all duration-200"
                style={{
                  background: 'rgba(0,0,0,0.85)',
                  backdropFilter: 'blur(12px)',
                  WebkitBackdropFilter: 'blur(12px)',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.12)',
                  border: '1px solid rgba(255,255,255,0.1)',
                }}>
                Open workspace
              </button>
            ) : (
              <>
                <button onClick={() => onNavigate('/login')}
                  className="px-5 py-2 rounded-xl text-[15px] font-medium text-gray-600 hover:text-gray-900 transition-colors">
                  Sign in
                </button>
                <button onClick={() => onNavigate('/register')}
                  className="px-5 py-2 rounded-xl text-[15px] font-semibold text-white transition-all duration-200"
                  style={{
                    background: 'rgba(0,0,0,0.85)',
                    backdropFilter: 'blur(12px)',
                    WebkitBackdropFilter: 'blur(12px)',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.12)',
                    border: '1px solid rgba(255,255,255,0.1)',
                  }}>
                  Get started
                </button>
              </>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1 w-full relative">{children}</main>

      <footer className="bg-black border-t border-gray-800 px-6 py-8">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2">
            <img src={logoSrc} alt="TalentScanr" className="h-6 w-auto brightness-0 invert" />
          </div>
          <div className="flex flex-wrap gap-6 text-[13px] text-gray-500">
            <button onClick={() => onNavigate('/engine-features')} className="hover:text-white transition-colors">Features</button>
            <button onClick={() => onNavigate('/pricing')} className="hover:text-white transition-colors">Pricing</button>
            <button onClick={() => onNavigate('/faq')} className="hover:text-white transition-colors">FAQ</button>
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
