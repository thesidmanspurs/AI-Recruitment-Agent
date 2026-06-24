import { type ReactNode } from 'react';
import { Flame } from 'lucide-react';

/** Marketing route ids — kept in sync with App.tsx pathToView. */
export type MarketingRoute = '/' | '/engine-features' | '/pricing' | '/faq';

const NAV_LINKS: { label: string; to: MarketingRoute }[] = [
  { label: 'Overview', to: '/' },
  { label: 'Engine Features', to: '/engine-features' },
  { label: 'Pricing Calculator', to: '/pricing' },
  { label: 'Platform FAQs', to: '/faq' },
];

interface MarketingLayoutProps {
  current: MarketingRoute;
  onNavigate: (to: string) => void;
  onSignIn: () => void;
  children: ReactNode;
}

/**
 * Shared chrome for all public marketing pages: dark gradient background, top
 * nav, and footer. The marketing site is dark by design (it matches the
 * product's brand) and does not follow the workspace light/dark toggle.
 */
export function MarketingLayout({ current, onNavigate, onSignIn, children }: MarketingLayoutProps) {
  return (
    <div className="min-h-screen bg-[#0a0c12] text-gray-200 font-sans antialiased relative overflow-x-hidden">
      {/* Ambient glow */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[520px] bg-[radial-gradient(ellipse_60%_60%_at_50%_-10%,rgba(99,91,255,0.18),transparent)]" />

      <nav className="relative z-20 border-b border-white/5">
        <div className="max-w-[1280px] mx-auto px-6 h-16 flex items-center justify-between gap-4">
          <button onClick={() => onNavigate('/')} className="flex items-center gap-3 shrink-0">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-lg">
              <Flame className="w-4.5 h-4.5 text-white" />
            </div>
            <div className="text-left leading-tight">
              <div className="flex items-center gap-2">
                <span className="text-white font-extrabold tracking-tight text-[15px]">TalentScanr</span>
                <span className="text-[9px] font-bold text-indigo-300 bg-indigo-500/15 border border-indigo-400/20 rounded px-1.5 py-0.5">v4.2</span>
              </div>
              <p className="text-[9px] font-medium tracking-[0.12em] text-gray-500 uppercase">
                AI Talent Sourcing Platform
              </p>
            </div>
          </button>

          <div className="hidden lg:flex items-center gap-1 bg-white/[0.03] border border-white/5 rounded-full p-1">
            {NAV_LINKS.map(link => {
              const active = current === link.to;
              return (
                <button
                  key={link.to}
                  onClick={() => onNavigate(link.to)}
                  className={`text-[13px] font-medium px-3.5 py-1.5 rounded-full transition-colors ${
                    active
                      ? 'bg-indigo-600 text-white shadow'
                      : 'text-gray-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  {link.label}
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={onSignIn}
              className="text-[13px] font-medium px-3.5 py-2 rounded-lg border border-white/10 text-gray-200 hover:bg-white/5 transition-colors"
            >
              Recruiter Sign In
            </button>
            <button
              onClick={() => onNavigate('/pricing')}
              className="text-[13px] font-semibold px-3.5 py-2 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 text-white hover:from-indigo-400 hover:to-violet-500 transition-colors shadow-lg"
            >
              Estimate Costings
            </button>
          </div>
        </div>
      </nav>

      <div className="relative z-10">{children}</div>

      <footer className="relative z-10 border-t border-white/5 mt-20">
        <div className="max-w-[1280px] mx-auto px-6 py-8 flex flex-col sm:flex-row items-center justify-between gap-3 text-[12px] text-gray-500">
          <span>© {2026} TalentScanr — AI Talent Sourcing Platform.</span>
          <div className="flex items-center gap-5">
            <button onClick={() => onNavigate('/engine-features')} className="hover:text-gray-300">Features</button>
            <button onClick={() => onNavigate('/pricing')} className="hover:text-gray-300">Pricing</button>
            <button onClick={() => onNavigate('/faq')} className="hover:text-gray-300">FAQ</button>
            <span className="text-emerald-400/80 font-mono text-[10px] uppercase tracking-wider">SOC2 Compliant</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

/** Small mono uppercase pill used across the marketing pages. */
export function Pill({ children, tone = 'indigo' }: { children: ReactNode; tone?: 'indigo' | 'emerald' | 'gray' }) {
  const tones = {
    indigo: 'text-indigo-300 bg-indigo-500/10 border-indigo-400/20',
    emerald: 'text-emerald-300 bg-emerald-500/10 border-emerald-400/20',
    gray: 'text-gray-400 bg-white/5 border-white/10',
  }[tone];
  return (
    <span className={`inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.1em] border rounded-full px-2.5 py-1 ${tones}`}>
      {children}
    </span>
  );
}

/** Section heading helper. */
export function SectionHeading({ eyebrow, title, subtitle }: { eyebrow?: string; title: string; subtitle?: string }) {
  return (
    <div className="text-center max-w-2xl mx-auto mb-12">
      {eyebrow && <div className="flex justify-center mb-4"><Pill>{eyebrow}</Pill></div>}
      <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">{title}</h2>
      {subtitle && <p className="mt-4 text-gray-400 leading-relaxed">{subtitle}</p>}
    </div>
  );
}
