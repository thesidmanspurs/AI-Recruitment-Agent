import { Database, Plus, ShieldCheck, X } from 'lucide-react';
import type { CampaignDto } from '../../api/campaignApi';
const logoSrc = '/logo.png'; // served from frontend/public/logo.png

/**
 * Workspace sidebar (design ref: TalentFlow cockpit). Renders as a fixed
 * left rail on desktop (lg+) and as a slide-in drawer on mobile — the drawer
 * is the ONLY way to reach campaigns / New / billing on small screens, so it's
 * essential, not decorative.
 */
interface WorkspaceSidebarProps {
  campaigns: CampaignDto[];
  activeId: string | null;
  onSelect: (id: string) => void;
  onNew: () => void;
  creditBalance: number | null;
  onOpenBilling?: () => void;
  onHome?: () => void;
  activeCampaignName?: string;
  candidateCount: number;
  /** Mobile drawer state (ignored on desktop). */
  mobileOpen?: boolean;
  onCloseMobile?: () => void;
}

const STATUS_BADGE: Record<CampaignDto['status'], string> = {
  RUNNING: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400',
  PAUSED: 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400',
  DRAFT: 'bg-slate-100 text-slate-500 dark:bg-slate-600/40 dark:text-slate-400',
  COMPLETED: 'bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-400',
};

const STATUS_ICON_COLOR: Record<CampaignDto['status'], string> = {
  RUNNING: 'text-emerald-600 dark:text-emerald-400',
  PAUSED: 'text-amber-600 dark:text-amber-400',
  DRAFT: 'text-slate-400 dark:text-slate-500',
  COMPLETED: 'text-blue-600 dark:text-blue-400',
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

/** Shared sidebar body used by both the desktop rail and the mobile drawer. */
function SidebarInner({
  campaigns,
  activeId,
  onSelect,
  onNew,
  creditBalance,
  onOpenBilling,
  onHome,
  activeCampaignName,
  candidateCount,
  afterAction,
}: WorkspaceSidebarProps & { afterAction?: () => void }) {
  const creditPct = Math.min(100, ((creditBalance ?? 0) / 2000) * 100);
  const after = () => afterAction?.();

  const terminalLines = [
    'Apollo + Gemini engines connected.',
    `Workspace target: ${activeCampaignName ?? 'no campaign selected'}.`,
    `${candidateCount} candidate${candidateCount === 1 ? '' : 's'} loaded in active pool.`,
    `${creditBalance ?? 0} enrichment credits available.`,
  ];

  return (
    <>
      {/* Logo → home */}
      <button
        type="button"
        onClick={() => { onHome?.(); after(); }}
        title="Go to homepage"
        className="p-5 flex items-center gap-3 border-b border-gray-200 dark:border-[#1E293B]/80 bg-white dark:bg-[#0B0F19] w-full text-left hover:bg-gray-50 dark:hover:bg-[#0e1320] transition-colors"
      >
        <img src={logoSrc} alt="TalentScanr" className="h-12 w-auto shrink-0 dark:brightness-0 dark:invert" />
        <div>
          <h1 className="text-gray-900 dark:text-white font-extrabold text-sm tracking-wider leading-none">TalentScanr</h1>
          <p className="text-[9px] text-gray-400 dark:text-slate-500 font-mono font-bold uppercase mt-1 tracking-widest">
            AI Talent Scanner
          </p>
        </div>
      </button>

      <div className="p-4 flex-1 space-y-5 overflow-y-auto">
        {/* Campaigns */}
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
                      <Database className={`w-3.5 h-3.5 shrink-0 ${active ? 'text-gray-900 dark:text-white' : STATUS_ICON_COLOR[c.status]}`} />
                      <span className="truncate">{c.name}</span>
                    </div>
                    <span className={`text-[8.5px] font-bold px-1.5 py-0.5 rounded uppercase font-mono tracking-wider shrink-0 scale-90 ${STATUS_BADGE[c.status]}`}>
                      {c.status}
                    </span>
                  </button>
                );
              })
            )}
          </nav>
        </div>

        {/* Terminal status feed */}
        <div className="bg-gray-100 dark:bg-[#0B0F19]/95 rounded-xl p-3 border border-gray-200 dark:border-slate-800 font-mono text-[10px] space-y-2">
          <div className="flex items-center justify-between text-gray-400 dark:text-[#6B7280] font-sans font-bold text-[8.5px] uppercase tracking-wider pb-1 border-b border-gray-200 dark:border-slate-800">
            <span>System Status</span>
            <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-pulse" />
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

      {/* Credits box */}
      <div className="p-4 mt-auto border-t border-gray-200 dark:border-[#1E293B]/60 bg-gray-50 dark:bg-[#0B0F19]/40 space-y-3">
        <button
          onClick={() => { onOpenBilling?.(); after(); }}
          className="w-full bg-white dark:bg-[#1C2232] rounded-xl p-3.5 text-left border border-gray-200 dark:border-[#2D3748]/60 hover:border-gray-400 dark:hover:border-gray-500 transition duration-150 block shadow-sm dark:shadow-none"
        >
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10.5px] font-bold text-gray-700 dark:text-slate-300">Data Enrichment</span>
            <span className="text-[9.5px] text-gray-900 dark:text-white font-semibold">Buy credits</span>
          </div>
          <div className="flex items-baseline gap-1 mb-2">
            <span className="text-base font-extrabold text-gray-900 dark:text-white font-mono">
              {creditBalance === null ? '—' : creditBalance.toLocaleString()}
            </span>
            <span className="text-[9.5px] text-gray-500 dark:text-slate-400">credits remaining</span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-[#2D3748] h-1.5 rounded-full overflow-hidden">
            <div className="bg-gray-900 dark:bg-white h-full rounded-full transition-all duration-300" style={{ width: `${creditPct}%` }} />
          </div>
        </button>

        <div className="flex items-center justify-center gap-1.5 text-[10px] font-medium text-gray-400 dark:text-slate-500 select-none">
          <ShieldCheck className="w-3 h-3" />
          <span>SOC2 • GDPR-aligned sourcing</span>
        </div>
      </div>
    </>
  );
}
