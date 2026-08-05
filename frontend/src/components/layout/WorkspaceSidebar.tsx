import { Database, Plus, ShieldCheck, X, Search, Trophy, UserCheck, FileText, LogOut, Lock, CreditCard } from 'lucide-react';
import type { CampaignDto } from '../../api/campaignApi';
const logoSrc = '/logo.png'; // served from frontend/public/logo.png

export interface RankingSessionDto {
  id: string;
  name: string;
  jobTitle: string;
  totalUploaded: number;
  totalSaved: number;
  status: string;
}

/**
 * Shared Workspace sidebar used across both Sourcing and Ranking modes.
 * Renders a fixed left rail on desktop (lg+) and a slide-in drawer on mobile.
 */
interface WorkspaceSidebarProps {
  campaigns?: CampaignDto[];
  rankingSessions?: RankingSessionDto[];
  activeId: string | null;
  onSelect: (id: string) => void;
  onNew: () => void;
  creditBalance: number | null;
  onOpenBilling?: () => void;
  onOpenRanking?: () => void;
  onOpenSwitchAccount?: () => void;
  onHome?: () => void;
  activeCampaignName?: string;
  candidateCount: number;
  currentMode?: 'sourcing' | 'ranking';
  user?: { planType?: 'SOURCING' | 'RANKING' | 'PRO'; role?: string; email?: string };
  onLogout?: () => void;
  onPaywallClick?: (feature: 'sourcing' | 'ranking') => void;
  /** Mobile drawer state (ignored on desktop). */
  mobileOpen?: boolean;
  onCloseMobile?: () => void;
}

const STATUS_BADGE: Record<string, string> = {
  RUNNING: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400',
  COMPLETED: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400',
  PAUSED: 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400',
  PROCESSING: 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400',
  DRAFT: 'bg-slate-100 text-slate-500 dark:bg-slate-600/40 dark:text-slate-400',
};

const STATUS_ICON_COLOR: Record<string, string> = {
  RUNNING: 'text-emerald-600 dark:text-emerald-400',
  COMPLETED: 'text-emerald-600 dark:text-emerald-400',
  PAUSED: 'text-amber-600 dark:text-amber-400',
  PROCESSING: 'text-amber-600 dark:text-amber-400',
  DRAFT: 'text-slate-400 dark:text-slate-500',
};

export function WorkspaceSidebar(props: WorkspaceSidebarProps) {
  const { mobileOpen, onCloseMobile } = props;
  return (
    <>
      {/* Desktop rail */}
      <aside className="hidden lg:flex w-[280px] shrink-0 bg-gray-50 dark:bg-[#111625] text-gray-700 dark:text-slate-300 flex-col border-r border-gray-200 dark:border-[#1E293B]/60 sticky top-0 h-screen z-20">
        <SidebarInner {...props} />
      </aside>

      {/* Mobile drawer */}
      <div className={`lg:hidden fixed inset-0 z-40 ${mobileOpen ? '' : 'pointer-events-none'}`} aria-hidden={!mobileOpen}>
        <div
          className={`absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity duration-300 ${mobileOpen ? 'opacity-100' : 'opacity-0'}`}
          onClick={onCloseMobile}
        />
        <aside
          className={`absolute left-0 top-0 h-full w-[86%] max-w-[300px] bg-gray-50 dark:bg-[#111625] text-gray-700 dark:text-slate-300 flex flex-col border-r border-gray-200 dark:border-[#1E293B]/60 shadow-2xl transition-transform duration-300 ease-out ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}`}
        >
          <button
            type="button"
            onClick={onCloseMobile}
            aria-label="Close menu"
            className="absolute top-4 right-3 z-10 w-8 h-8 rounded-md flex items-center justify-center text-gray-500 dark:text-slate-400 bg-white/70 dark:bg-white/5 hover:bg-gray-100 dark:hover:bg-white/10 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
          <SidebarInner {...props} afterAction={onCloseMobile} />
        </aside>
      </div>
    </>
  );
}

/** Shared sidebar body used by both desktop rail and mobile drawer. */
function SidebarInner({
  campaigns = [],
  rankingSessions = [],
  activeId,
  onSelect,
  onNew,
  creditBalance,
  onOpenBilling,
  onOpenRanking,
  onOpenSwitchAccount,
  onHome,
  activeCampaignName,
  candidateCount,
  currentMode = 'sourcing',
  user,
  onLogout,
  onPaywallClick,
  afterAction,
}: WorkspaceSidebarProps & { afterAction?: () => void }) {
  const creditPct = Math.min(100, ((creditBalance ?? 0) / 2000) * 100);
  const after = () => afterAction?.();

  const terminalLines = currentMode === 'sourcing' ? [
    'Apollo + Gemini engines connected.',
    `Workspace target: ${activeCampaignName ?? 'no campaign selected'}.`,
    `${candidateCount} candidate${candidateCount === 1 ? '' : 's'} loaded in active pool.`,
    `${creditBalance ?? 0} enrichment credits available.`,
  ] : [
    'Gemini CV Ranking engine connected.',
    `Active session: ${activeCampaignName ?? 'no session selected'}.`,
    `${candidateCount} candidates evaluated against JD.`,
    'Transient CV parser active (0% disk storage).',
  ];

  return (
    <>
      {/* Logo → home */}
      <button
        type="button"
        onClick={() => { onHome?.(); after(); }}
        title="Go to homepage"
        className="p-5 flex items-center gap-3 border-b border-gray-200 dark:border-[#1E293B]/80 bg-white dark:bg-[#0B0F19] w-full text-left hover:bg-gray-50 dark:hover:bg-[#0e1320] transition-colors shrink-0"
      >
        <img src={logoSrc} alt="TalentScanr" className="h-10 w-auto shrink-0 dark:brightness-0 dark:invert" />
        <div>
          <h1 className="text-gray-900 dark:text-white font-extrabold text-sm tracking-wider leading-none">TalentScanr</h1>
          <p className="text-[9px] text-gray-400 dark:text-slate-500 font-mono font-bold uppercase mt-1 tracking-widest">
            AI Talent Scanner
          </p>
        </div>
      </button>

      {/* ── Mode Switcher Pill (AI Sourcing ↔ CV Ranking) ── */}
      {(() => {
        const isRankingOnly =
          user?.role !== 'ADMIN' &&
          (user?.planType === 'RANKING' || Boolean(user?.email?.toLowerCase().includes('ranking')));

        const isSourcingOnly =
          user?.role !== 'ADMIN' &&
          (user?.planType === 'SOURCING' || Boolean(user?.email?.toLowerCase().includes('sourcing')));

        return (
          <div className="px-3 pt-3 pb-2 border-b border-gray-200 dark:border-[#1E293B]/60 bg-white/50 dark:bg-[#0B0F19]/60 shrink-0">
            <div className="bg-gray-200/70 dark:bg-[#0B0F19] p-1 rounded-xl flex items-center border border-gray-300/60 dark:border-slate-800">
              <button
                type="button"
                onClick={() => {
                  if (isRankingOnly) {
                    onPaywallClick?.('sourcing');
                  } else {
                    onHome?.();
                  }
                  after();
                }}
                className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg text-xs font-bold transition-all ${
                  currentMode === 'sourcing'
                    ? 'bg-white dark:bg-[#1E293B] text-gray-900 dark:text-white shadow-xs'
                    : 'text-gray-500 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                <Search className="w-3.5 h-3.5" />
                <span>Sourcing</span>
                {isRankingOnly && <Lock className="w-3 h-3 text-amber-500 ml-0.5" />}
              </button>

              <button
                type="button"
                onClick={() => {
                  if (isSourcingOnly) {
                    onPaywallClick?.('ranking');
                  } else {
                    onOpenRanking?.();
                  }
                  after();
                }}
                className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg text-xs font-bold transition-all ${
                  currentMode === 'ranking'
                    ? 'bg-white dark:bg-[#1E293B] text-gray-900 dark:text-white shadow-xs'
                    : 'text-gray-500 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                <Trophy className="w-3.5 h-3.5 text-amber-500" />
                <span>Ranking</span>
                {isSourcingOnly && <Lock className="w-3 h-3 text-amber-500 ml-0.5" />}
              </button>
            </div>
          </div>
        );
      })()}

      <div className="p-4 flex-1 space-y-5 overflow-y-auto">
        {/* Sourcing Campaigns OR Ranking Sessions */}
        {currentMode === 'sourcing' ? (
          <div>
            <div className="flex items-center justify-between px-2 py-1">
              <span className="text-gray-400 dark:text-slate-500 text-[9.5px] font-mono tracking-widest font-extrabold uppercase">
                Active Campaigns
              </span>
              <button
                onClick={() => { onNew(); after(); }}
                className="flex items-center gap-1 text-[10px] font-bold text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition"
              >
                <Plus className="w-3 h-3" /> New
              </button>
            </div>

            <nav className="mt-2 space-y-1">
              {campaigns.length === 0 ? (
                <p className="text-[11px] text-gray-400 dark:text-slate-500 px-3 py-2">No campaigns yet — create one.</p>
              ) : (
                campaigns.map(c => {
                  const active = c.id === activeId;
                  return (
                    <button
                      key={c.id}
                      onClick={() => { onSelect(c.id); after(); }}
                      className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold text-left transition duration-150 ${
                        active
                          ? 'bg-gray-100 text-gray-900 border-l-2 border-gray-900 dark:bg-gray-800 dark:text-white dark:border-white'
                          : 'text-gray-500 dark:text-slate-400 hover:text-gray-900 dark:hover:text-slate-200 hover:bg-gray-100 dark:hover:bg-[#1C2232]/40'
                      }`}
                    >
                      <div className="flex items-center gap-2 truncate">
                        <Database className={`w-3.5 h-3.5 shrink-0 ${active ? 'text-gray-900 dark:text-white' : STATUS_ICON_COLOR[c.status] ?? 'text-gray-400'}`} />
                        <span className="truncate">{c.name}</span>
                      </div>
                      <span className={`text-[8.5px] font-bold px-1.5 py-0.5 rounded uppercase font-mono tracking-wider shrink-0 scale-90 ${STATUS_BADGE[c.status] ?? 'bg-gray-100 text-gray-600'}`}>
                        {c.status}
                      </span>
                    </button>
                  );
                })
              )}
            </nav>
          </div>
        ) : (
          <div>
            <div className="flex items-center justify-between px-2 py-1">
              <span className="text-gray-400 dark:text-slate-500 text-[9.5px] font-mono tracking-widest font-extrabold uppercase">
                Ranking Sessions
              </span>
              <button
                onClick={() => { onNew(); after(); }}
                className="flex items-center gap-1 text-[10px] font-bold text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition"
              >
                <Plus className="w-3 h-3" /> New
              </button>
            </div>

            <nav className="mt-2 space-y-1">
              {rankingSessions.length === 0 ? (
                <p className="text-[11px] text-gray-400 dark:text-slate-500 px-3 py-2">No ranking sessions yet.</p>
              ) : (
                rankingSessions.map(s => {
                  const active = s.id === activeId;
                  return (
                    <button
                      key={s.id}
                      onClick={() => { onSelect(s.id); after(); }}
                      className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold text-left transition duration-150 ${
                        active
                          ? 'bg-gray-100 text-gray-900 border-l-2 border-gray-900 dark:bg-gray-800 dark:text-white dark:border-white'
                          : 'text-gray-500 dark:text-slate-400 hover:text-gray-900 dark:hover:text-slate-200 hover:bg-gray-100 dark:hover:bg-[#1C2232]/40'
                      }`}
                    >
                      <div className="flex items-center gap-2 truncate">
                        <Trophy className={`w-3.5 h-3.5 shrink-0 ${active ? 'text-amber-500' : 'text-gray-400'}`} />
                        <span className="truncate">{s.name}</span>
                      </div>
                      <span className={`text-[8.5px] font-bold px-1.5 py-0.5 rounded uppercase font-mono tracking-wider shrink-0 scale-90 ${STATUS_BADGE[s.status] ?? 'bg-emerald-100 text-emerald-700'}`}>
                        {s.status}
                      </span>
                    </button>
                  );
                })
              )}
            </nav>
          </div>
        )}

        {/* Terminal status feed */}
        <div className="bg-gray-100 dark:bg-[#0B0F19]/95 rounded-xl p-3 border border-gray-200 dark:border-slate-800 font-mono text-[10px] space-y-2">
          <div className="flex items-center justify-between text-gray-400 dark:text-[#6B7280] font-sans font-bold text-[8.5px] uppercase tracking-wider pb-1 border-b border-gray-200 dark:border-slate-800">
            <span>System Status</span>
            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
          </div>
          <div className="space-y-1.5 pr-0.5 text-gray-600 dark:text-slate-300 leading-normal">
            {terminalLines.map((line, i) => (
              <div key={i} className="leading-tight">
                <span className="text-gray-300 dark:text-slate-600 mr-1">›</span>
                <span>{line}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Credits box & Switch Account button */}
      <div className="p-4 mt-auto border-t border-gray-200 dark:border-[#1E293B]/60 bg-gray-50 dark:bg-[#0B0F19]/40 space-y-3 shrink-0">
      {/* Credits box — sourcing mode only */}
        {currentMode === 'sourcing' && (
          <button
            onClick={() => { onOpenBilling?.(); after(); }}
            className="w-full bg-white dark:bg-[#1C2232] rounded-xl p-3.5 text-left border border-gray-200 dark:border-[#2D3748]/60 hover:border-gray-400 dark:hover:border-gray-500 transition duration-150 block shadow-xs"
          >
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[10.5px] font-bold text-gray-700 dark:text-slate-300">Data Enrichment</span>
              <span className="text-[9.5px] text-gray-900 dark:text-white font-semibold">Buy credits</span>
            </div>
            <div className="flex items-baseline justify-between mb-2">
              <span className="text-xl font-extrabold text-gray-900 dark:text-white tabular-nums tracking-tight">
                {creditBalance === null ? '—' : creditBalance.toLocaleString()}
              </span>
              <span className="text-[10px] text-gray-400 font-mono">credits</span>
            </div>
            <div className="w-full bg-gray-100 dark:bg-gray-800 rounded-full h-1 overflow-hidden">
              <div
                className="bg-gray-900 dark:bg-slate-300 h-full rounded-full transition-all duration-300"
                style={{ width: `${creditPct}%` }}
              />
            </div>
          </button>
        )}

        {/* Billing & Plans — always visible */}
        {onOpenBilling && (
          <button
            onClick={() => { onOpenBilling(); after(); }}
            className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#1C2232] text-xs font-bold text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-white/10 transition duration-150 shadow-xs"
          >
            <CreditCard className="w-3.5 h-3.5 text-indigo-500" />
            <span>Billing &amp; Plans</span>
          </button>
        )}

        {onOpenSwitchAccount && (
          <button
            onClick={() => { onOpenSwitchAccount(); after(); }}
            className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#1C2232] text-xs font-bold text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-white/10 transition duration-150 shadow-xs"
          >
            <UserCheck className="w-3.5 h-3.5" />
            <span>Switch Account</span>
          </button>
        )}

        {onLogout && (
          <button
            onClick={() => { onLogout(); after(); }}
            className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl border border-red-200 dark:border-red-500/20 bg-red-50/50 dark:bg-red-500/10 text-xs font-bold text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-500/20 transition duration-150 shadow-xs"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Log Out</span>
          </button>
        )}
      </div>
    </>
  );
}
