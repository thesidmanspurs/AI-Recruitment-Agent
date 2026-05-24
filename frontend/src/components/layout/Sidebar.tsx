import { Database, LogOut, Shield } from 'lucide-react';
import type { Campaign } from '../../data/mockCampaigns';
import type { AuthUser } from '../../hooks/useAuth';

interface SidebarProps {
  campaigns: Campaign[];
  activeCampaignId: string;
  onSelectCampaign: (id: string) => void;
  enrichmentCredits: number;
  user?: AuthUser | null;
  onLogout?: () => void;
  onOpenAdmin?: () => void;
}

function CampaignBadge({ status, code }: { status: Campaign['status']; code?: string }) {
  if (status === 'running') {
    return (
      <span className="text-[10px] font-bold tracking-wide bg-emerald-500 text-white px-2 py-0.5 rounded-sm uppercase">
        Running
      </span>
    );
  }
  if (code) {
    return (
      <span className="text-[10px] font-mono bg-gray-700 text-gray-400 px-2 py-0.5 rounded-sm uppercase tracking-widest">
        {code}
      </span>
    );
  }
  return null;
}

export function Sidebar({
  campaigns,
  activeCampaignId,
  onSelectCampaign,
  enrichmentCredits,
  user,
  onLogout,
  onOpenAdmin,
}: SidebarProps) {
  const creditPct = Math.min(100, (enrichmentCredits / 200) * 100);

  return (
    <aside className="w-64 shrink-0 flex flex-col bg-[#0d1117] h-screen select-none">
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 py-5">
        <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center shrink-0">
          <span className="text-sm font-extrabold text-white">T</span>
        </div>
        <div className="flex flex-col"> 
          <span className="text-white font-bold text-[15px] tracking-tight">ARIES</span>
          <p className="text-[8px] font-semibold tracking-widest text-gray-500 uppercase">
            AI Recruitment{"   "}& <br></br>
            Intelligent Engagement
          </p>
        </div>
      </div>

      {/* Active Campaigns */}
      <div className="px-5 pt-2 pb-1">
        <p className="text-[10px] font-semibold tracking-widest text-gray-500 uppercase">
          Active Campaigns
        </p>
      </div>

      <nav className="flex-1 px-3 flex flex-col gap-0.5 mt-1 overflow-y-auto">
        {campaigns.map(campaign => {
          const isActive = campaign.id === activeCampaignId;
          return (
            <button
              key={campaign.id}
              onClick={() => onSelectCampaign(campaign.id)}
              className={[
                'w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-left transition-colors',
                isActive
                  ? 'bg-[#1e2338] text-white'
                  : 'text-gray-400 hover:bg-[#161b28] hover:text-gray-200',
              ].join(' ')}
            >
              <span className={`text-sm font-medium truncate ${isActive ? 'text-white' : ''}`}>
                {campaign.name}
              </span>
              <CampaignBadge status={campaign.status} code={campaign.code} />
            </button>
          );
        })}
      </nav>

      {/* Data Enrichment Card */}
      <div className="p-4 mt-auto">
        <div className="rounded-xl bg-gradient-to-br from-indigo-600 to-violet-700 p-4">
          <div className="flex items-center gap-2 mb-1">
            <Database className="w-3.5 h-3.5 text-indigo-200" />
            <span className="text-sm font-semibold text-white">Data Enrichment</span>
          </div>
          <p className="text-xs text-indigo-200 mb-3">{enrichmentCredits} credits remaining</p>
          <div className="w-full h-1.5 bg-indigo-900/60 rounded-full overflow-hidden">
            <div
              className="h-full bg-white/60 rounded-full transition-all duration-500"
              style={{ width: `${creditPct}%` }}
            />
          </div>
        </div>
      </div>

      {/* User chip + logout */}
      {user && (
        <div className="px-4 pb-4 flex flex-col gap-2 border-t border-white/5 pt-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-indigo-600/30 border border-indigo-500/40 flex items-center justify-center shrink-0">
              <span className="text-xs font-bold text-indigo-200">
                {user.name.charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-200 truncate">{user.name}</p>
              <p className="text-[11px] text-gray-500 truncate">{user.email}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {user.role === 'ADMIN' && onOpenAdmin && (
              <button
                onClick={onOpenAdmin}
                className="flex-1 flex items-center justify-center gap-1.5 text-xs font-medium px-2.5 py-1.5 rounded-md bg-indigo-600/20 border border-indigo-500/30 text-indigo-300 hover:bg-indigo-600/30 transition-colors"
              >
                <Shield className="w-3.5 h-3.5" />
                Admin
              </button>
            )}
            <button
              onClick={onLogout}
              className="flex-1 flex items-center justify-center gap-1.5 text-xs font-medium px-2.5 py-1.5 rounded-md bg-[#161b28] border border-gray-700 text-gray-300 hover:bg-[#1e2338] hover:text-white transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
              Logout
            </button>
          </div>
        </div>
      )}
    </aside>
  );
}
