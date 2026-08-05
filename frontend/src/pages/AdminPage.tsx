import { useEffect, useState, useCallback, type ReactNode } from 'react';
import {
  Users,
  Briefcase,
  Send,
  Activity,
  TrendingUp,
  Loader2,
  Shield,
  AlertCircle,
  Flame,
  GitBranch,
  Globe,
  BarChart3,
  UserPlus,
  RefreshCw,
  LayoutDashboard,
  LogOut,
  Sliders,
  Save,
  Mail,
  CheckCircle2,
  CreditCard,
  Coins,
  Plus,
  Package,
  Check,
  Zap,
  Sparkles,
  Trophy,
} from 'lucide-react';
import {
  adminApi,
  type AdminUserRow,
  type AdminStats,
  type AdminHotCampaign,
  type AdminSystemEvent,
  type FunnelStage,
  type PlatformBreakdownEntry,
  type ScoreBucket,
  type RecentSignup,
  type SettingRow,
  type EmailRequestRow,
  type AdminBilling,
  type AdminSubscriber,
} from '../api/adminApi';
import { UserCheck } from 'lucide-react';
import { QuickAccountSwitcherModal } from '../components/shared/QuickAccountSwitcherModal';
import { ApiError } from '../api/client';
import { ThemeToggle } from '../components/shared/ThemeToggle';
import { Tabs, type TabSpec } from '../components/shared/Tabs';
import { Pagination } from '../components/shared/Pagination';
import { UserDetailModal } from '../components/admin/UserDetailModal';
import { CreateUserModal } from '../components/admin/CreateUserModal';
import type { AuthUser, UserRole } from '../hooks/useAuth';

interface AdminPageProps {
  currentUser: AuthUser;
  onLogout: () => void;
  onHome?: () => void;
}

type AdminTab = 'overview' | 'campaigns' | 'activity' | 'users' | 'plans' | 'billing' | 'email' | 'settings';

export function AdminPage({ currentUser, onLogout, onHome }: AdminPageProps) {
  const [tab, setTab] = useState<AdminTab>('overview');
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [statsLoading, setStatsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showSwitchAccount, setShowSwitchAccount] = useState(false);

  const loadStats = useCallback(async () => {
    setRefreshing(true);
    try {
      const s = await adminApi.getStats();
      setStats(s.stats);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load stats.');
    } finally {
      setRefreshing(false);
      setStatsLoading(false);
    }
  }, []);

  useEffect(() => {
    document.body.style.overflow = '';
    loadStats();
  }, [loadStats]);

  const tabSpecs: TabSpec<AdminTab>[] = [
    { key: 'overview', label: 'Overview', icon: <LayoutDashboard className="w-3.5 h-3.5" /> },
    {
      key: 'campaigns',
      label: 'Campaigns',
      icon: <Flame className="w-3.5 h-3.5" />,
      badge: stats?.campaignCount ?? null,
    },
    { key: 'activity', label: 'Activity', icon: <Activity className="w-3.5 h-3.5" /> },
    {
      key: 'users',
      label: 'Users',
      icon: <Users className="w-3.5 h-3.5" />,
      badge: stats?.userCount ?? null,
    },
    { key: 'plans', label: 'Plans & Add-ons', icon: <Package className="w-3.5 h-3.5" /> },
    { key: 'billing', label: 'Billing & Subs', icon: <CreditCard className="w-3.5 h-3.5" /> },
    { key: 'email', label: 'Email Requests', icon: <Mail className="w-3.5 h-3.5" /> },
    { key: 'settings', label: 'Settings', icon: <Sliders className="w-3.5 h-3.5" /> },
  ];

  return (
    <div className="min-h-screen bg-[#f3f4f8] dark:bg-[#0a0c12] text-gray-900 dark:text-gray-100 font-sans transition-colors">
      {/* Header */}
      <header className="border-b border-gray-200 dark:border-white/10 bg-white dark:bg-[#10131c] sticky top-0 z-10 transition-colors">
        <div className="max-w-[1400px] mx-auto px-6 py-4 flex items-center justify-between gap-4">
          <button onClick={() => (onHome ? onHome() : setTab('overview'))} title="Go to homepage" className="flex items-center gap-2.5 min-w-0 text-left">
            <div className="w-8 h-8 rounded-lg bg-gray-900 dark:bg-gray-700 flex items-center justify-center shrink-0">
              <Shield className="w-4 h-4 text-white" />
            </div>
            <div className="min-w-0">
              <h1 className="text-base font-bold text-gray-900 dark:text-white leading-none truncate">
                TalentScanr — Control Panel
              </h1>
              <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5 truncate">
                Welcome, {currentUser.name}
              </p>
            </div>
          </button>

          <div className="flex items-center gap-3 shrink-0">
            <ThemeToggle />
            <button
              onClick={loadStats}
              disabled={refreshing}
              className="flex items-center gap-2 text-xs font-medium px-3 py-1.5 rounded-md bg-white dark:bg-white/5 border border-gray-300 dark:border-white/10 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/10 disabled:opacity-50 transition-colors"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </button>
            <div className="hidden sm:flex items-center gap-2.5 pl-3 border-l border-gray-200 dark:border-white/10">
              <div className="w-8 h-8 rounded-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold flex items-center justify-center shrink-0">
                <span className="text-xs">
                  {currentUser.name.charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="min-w-0">
                <p className="text-xs font-medium text-gray-900 dark:text-gray-100 truncate leading-none">
                  {currentUser.name}
                </p>
                <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-0.5 truncate">{currentUser.email}</p>
              </div>
            </div>
            <button
              onClick={() => setShowSwitchAccount(true)}
              className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-md bg-white dark:bg-white/5 border border-gray-300 dark:border-white/10 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/10 transition-colors"
              title="Quickly switch to another test or admin account"
            >
              <UserCheck className="w-3.5 h-3.5" />
              Switch Account
            </button>
            <button
              onClick={onLogout}
              className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-md bg-white dark:bg-white/5 border border-gray-300 dark:border-white/10 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/10 transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
              Logout
            </button>
          </div>
        </div>
      </header>

      <QuickAccountSwitcherModal
        open={showSwitchAccount}
        onClose={() => setShowSwitchAccount(false)}
        currentEmail={currentUser.email}
      />

      {/* Sidebar + content */}
      <div className="max-w-[1400px] mx-auto px-6 py-8 flex flex-col lg:flex-row gap-6">
        <aside className="lg:w-56 shrink-0">
          <div className="lg:sticky lg:top-24">
            <p className="text-[10px] font-semibold tracking-widest text-gray-500 dark:text-gray-400 uppercase mb-2 px-1">
              Sections
            </p>
            <Tabs
              tabs={tabSpecs}
              active={tab}
              onChange={setTab}
              variant="light"
              orientation="vertical"
            />
          </div>
        </aside>

        <main className="flex-1 min-w-0">
          {error && (
            <div className="flex items-start gap-3 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-400/20 rounded-lg px-4 py-3 mb-6">
              <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
              <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
            </div>
          )}

          {tab === 'overview' && (
            <OverviewTab stats={stats} statsLoading={statsLoading} onError={msg => setError(msg)} />
          )}
          {tab === 'campaigns' && <CampaignsTab onError={msg => setError(msg)} />}
          {tab === 'activity' && <ActivityTab onError={msg => setError(msg)} />}
          {tab === 'users' && <UsersTab currentUser={currentUser} onError={msg => setError(msg)} />}
          {tab === 'plans' && <PlansTab onError={msg => setError(msg)} />}
          {tab === 'billing' && <BillingTab onError={msg => setError(msg)} />}
          {tab === 'email' && <EmailRequestsTab onError={msg => setError(msg)} />}
          {tab === 'settings' && <SettingsTab onError={msg => setError(msg)} />}
        </main>
      </div>
    </div>
  );
}

// ─── Tab: Overview ────────────────────────────────────────────────────────────

function OverviewTab({
  stats,
  statsLoading,
  onError,
}: {
  stats: AdminStats | null;
  statsLoading: boolean;
  onError: (msg: string) => void;
}) {
  const [funnel, setFunnel] = useState<FunnelStage[]>([]);
  const [platforms, setPlatforms] = useState<PlatformBreakdownEntry[]>([]);
  const [scoreBuckets, setScoreBuckets] = useState<ScoreBucket[]>([]);
  const [recentSignups, setRecentSignups] = useState<RecentSignup[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const [fn, pl, sd, rs] = await Promise.all([
          adminApi.getPipelineFunnel(),
          adminApi.getPlatformBreakdown(),
          adminApi.getScoreDistribution(),
          adminApi.getRecentSignups(),
        ]);
        if (cancelled) return;
        setFunnel(fn.funnel);
        setPlatforms(pl.platforms);
        setScoreBuckets(sd.buckets);
        setRecentSignups(rs.users);
      } catch (err) {
        if (!cancelled) onError(err instanceof Error ? err.message : 'Failed to load overview.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [onError]);

  return (
    <div className="flex flex-col gap-6">
      {statsLoading || !stats ? (
        <CenterLoader />
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <StatCard label="Total Users" value={stats.userCount} icon={Users} tint="indigo" />
          <StatCard label="Active (7d)" value={stats.activeUsers} icon={TrendingUp} tint="emerald" />
          <StatCard label="Campaigns" value={stats.campaignCount} icon={Briefcase} tint="blue" />
          <StatCard label="Candidates" value={stats.candidateCount} icon={Activity} tint="violet" />
          <StatCard label="Outreach Sent" value={stats.outreachSent} icon={Send} tint="amber" />
        </div>
      )}

      {loading ? (
        <CenterLoader />
      ) : (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <SectionCard
              icon={<GitBranch className="w-3.5 h-3.5 text-gray-700 dark:text-gray-300" />}
              title="Pipeline funnel"
              subtitle="Candidate counts by outreach stage"
            >
              <PipelineFunnel stages={funnel} />
            </SectionCard>
            <SectionCard
              icon={<Globe className="w-3.5 h-3.5 text-blue-600" />}
              title="Platforms"
              subtitle="Where candidates come from"
            >
              <PlatformList platforms={platforms} />
            </SectionCard>
            <SectionCard
              icon={<BarChart3 className="w-3.5 h-3.5 text-violet-600" />}
              title="AI score distribution"
              subtitle="Quality of the longlists (≥ 5.0)"
            >
              <ScoreHistogram buckets={scoreBuckets} />
            </SectionCard>
          </div>

          <SectionCard
            icon={<UserPlus className="w-3.5 h-3.5 text-emerald-600" />}
            title="Recent signups"
            subtitle="Latest accounts created"
          >
            <RecentSignupsList signups={recentSignups} />
          </SectionCard>
        </>
      )}
    </div>
  );
}

// ─── Tab: Campaigns ───────────────────────────────────────────────────────────

function CampaignsTab({ onError }: { onError: (msg: string) => void }) {
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [campaigns, setCampaigns] = useState<AdminHotCampaign[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const res = await adminApi.getHotCampaigns(page, pageSize);
        if (cancelled) return;
        setCampaigns(res.data);
        setTotal(res.total);
        setTotalPages(res.totalPages);
      } catch (err) {
        if (!cancelled) onError(err instanceof Error ? err.message : 'Failed to load campaigns.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [page, pageSize, onError]);

  return (
    <SectionCard
      icon={<Flame className="w-3.5 h-3.5 text-amber-600" />}
      title="Hot campaigns"
      subtitle="Sorted by candidates sourced (descending)"
      noBodyPadding
    >
      {loading ? (
        <div className="py-12">
          <CenterLoader />
        </div>
      ) : (
        <>
          <HotCampaignsList campaigns={campaigns} />
          <Pagination
            page={page}
            pageSize={pageSize}
            total={total}
            totalPages={totalPages}
            onChange={setPage}
            variant="light"
          />
        </>
      )}
    </SectionCard>
  );
}

// ─── Tab: Activity ────────────────────────────────────────────────────────────

function ActivityTab({ onError }: { onError: (msg: string) => void }) {
  const [page, setPage] = useState(1);
  const [pageSize] = useState(15);
  const [events, setEvents] = useState<AdminSystemEvent[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const res = await adminApi.getSystemActivity(page, pageSize);
        if (cancelled) return;
        setEvents(res.data);
        setTotal(res.total);
        setTotalPages(res.totalPages);
      } catch (err) {
        if (!cancelled) onError(err instanceof Error ? err.message : 'Failed to load activity.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [page, pageSize, onError]);

  return (
    <SectionCard
      icon={<Activity className="w-3.5 h-3.5 text-gray-700 dark:text-gray-300" />}
      title="System activity"
      subtitle="Cross-tenant event stream"
      noBodyPadding
    >
      {loading ? (
        <div className="py-12">
          <CenterLoader />
        </div>
      ) : (
        <>
          <SystemActivityFeed events={events} />
          <Pagination
            page={page}
            pageSize={pageSize}
            total={total}
            totalPages={totalPages}
            onChange={setPage}
            variant="light"
          />
        </>
      )}
    </SectionCard>
  );
}

// ─── Tab: Users ───────────────────────────────────────────────────────────────

function UsersTab({
  currentUser,
  onError,
}: {
  currentUser: AuthUser;
  onError: (msg: string) => void;
}) {
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [users, setUsers] = useState<AdminUserRow[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<AdminUserRow | null>(null);
  const [showCreate, setShowCreate] = useState(false);

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminApi.listUsers(page, pageSize);
      setUsers(res.data);
      setTotal(res.total);
      setTotalPages(res.totalPages);
      // If the currently-open detail modal targets a user, refresh its row
      // reference so blocked/role flags update without reopening.
      setSelected(curr => (curr ? res.data.find(u => u.id === curr.id) ?? null : null));
    } catch (err) {
      onError(err instanceof Error ? err.message : 'Failed to load users.');
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, onError]);

  useEffect(() => {
    reload();
  }, [reload]);

  return (
    <>
      <SectionCard
        icon={<Users className="w-3.5 h-3.5 text-gray-700 dark:text-gray-300" />}
        title="Users"
        subtitle={`${total} accounts · click a row to manage`}
        noBodyPadding
        headerAction={
          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-gray-900 dark:bg-gray-700 rounded-md hover:bg-gray-100 dark:bg-gray-800 transition-colors"
          >
            <UserPlus className="w-3.5 h-3.5" />
            Add user
          </button>
        }
      >
        {loading ? (
          <div className="py-12">
            <CenterLoader />
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider bg-gray-50/60 dark:bg-white/5">
                    <th className="text-left px-6 py-3">User</th>
                    <th className="text-left px-6 py-3">Role</th>
                    <th className="text-left px-6 py-3">Plan Tier</th>
                    <th className="text-left px-6 py-3">Status</th>
                    <th className="text-right px-6 py-3">Credits</th>
                    <th className="text-right px-6 py-3">Campaigns</th>
                    <th className="text-right px-6 py-3">Candidates</th>
                    <th className="text-left px-6 py-3">Last Login</th>
                    <th className="text-left px-6 py-3">Joined</th>
                  </tr>
                </thead>
                <tbody>
                  {users.length === 0 && (
                    <tr>
                      <td colSpan={9} className="px-6 py-12 text-center text-sm text-gray-400 dark:text-gray-500">
                        No users on this page.
                      </td>
                    </tr>
                  )}
                  {users.map(u => (
                    <tr
                      key={u.id}
                      onClick={() => setSelected(u)}
                      className="border-t border-gray-100 dark:border-white/10 hover:bg-gray-50/60 dark:hover:bg-white/5 cursor-pointer transition-colors"
                    >
                      <td className="px-6 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-slate-800 dark:bg-white/10 text-white font-bold flex items-center justify-center shrink-0">
                            <span className="text-xs">
                              {u.name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div>
                            <p className="font-medium text-gray-900 dark:text-gray-100">{u.name}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">{u.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-3">
                        <RoleBadge role={u.role} />
                      </td>
                      <td className="px-6 py-3">
                        <div className="flex flex-col gap-1">
                          <span className={`text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-md border w-fit ${
                            u.planType === 'PRO' ? 'bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-300 dark:border-emerald-500/20' :
                            u.planType === 'SOURCING' ? 'bg-slate-100 text-slate-800 border-slate-200 dark:bg-slate-800/40 dark:text-slate-200 dark:border-slate-700' :
                            u.planType === 'RANKING' ? 'bg-amber-50 text-amber-900 border-amber-200 dark:bg-amber-500/10 dark:text-amber-300 dark:border-amber-500/20' :
                            'bg-gray-100 text-gray-500 border-gray-200 dark:bg-white/5 dark:text-gray-400 dark:border-white/10'
                          }`}>
                            {u.planType ?? 'NONE'}
                          </span>
                          {u.rankingAddonActive && (
                            <span className="text-[9px] text-amber-700 dark:text-amber-300 font-semibold">+ Ranking Add-on</span>
                          )}
                          {u.sourcingAddonActive && (
                            <span className="text-[9px] text-slate-700 dark:text-slate-300 font-semibold">+ Sourcing Add-on</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-3">
                        {u.isBlocked ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-400/20 text-red-700 dark:text-red-300 px-2 py-0.5 rounded-md">
                            Blocked
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-400/20 text-emerald-700 dark:text-emerald-300 px-2 py-0.5 rounded-md">
                            Active
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-3 text-right font-mono text-xs font-semibold text-gray-900 dark:text-gray-100">
                        {(u.creditBalance ?? 0).toLocaleString()}
                      </td>
                      <td className="px-6 py-3 text-right font-mono text-gray-700 dark:text-gray-300">
                        {u.campaignCount}
                      </td>
                      <td className="px-6 py-3 text-right font-mono text-gray-700 dark:text-gray-300">
                        {u.candidateCount}
                      </td>
                      <td className="px-6 py-3 text-gray-500 dark:text-gray-400 text-xs">
                        {formatRelative(u.lastLoginAt)}
                      </td>
                      <td className="px-6 py-3 text-gray-500 dark:text-gray-400 text-xs">{formatDate(u.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pagination
              page={page}
              pageSize={pageSize}
              total={total}
              totalPages={totalPages}
              onChange={setPage}
              variant="light"
            />
          </>
        )}
      </SectionCard>

      <UserDetailModal
        open={!!selected}
        user={selected}
        currentUser={currentUser}
        onClose={() => setSelected(null)}
        onChanged={reload}
      />
      <CreateUserModal
        open={showCreate}
        onClose={() => setShowCreate(false)}
        onCreated={reload}
      />
    </>
  );
}

// ─── Tab: Settings ────────────────────────────────────────────────────────────

function SettingsTab({ onError }: { onError: (msg: string) => void }) {
  const [settings, setSettings] = useState<SettingRow[] | null>(null);
  const [draft, setDraft] = useState<Record<string, string>>({});
  const [savingKey, setSavingKey] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminApi.listSettings();
      setSettings(res.settings);
      setDraft(Object.fromEntries(res.settings.map(s => [s.key, s.value])));
    } catch (err) {
      onError(err instanceof Error ? err.message : 'Failed to load settings.');
    } finally {
      setLoading(false);
    }
  }, [onError]);

  useEffect(() => {
    reload();
  }, [reload]);

  async function save(key: string) {
    setSavingKey(key);
    try {
      const next = draft[key];
      const res = await adminApi.updateSetting(key, next);
      setSettings(res.settings);
      setDraft(Object.fromEntries(res.settings.map(s => [s.key, s.value])));
    } catch (err) {
      onError(err instanceof Error ? err.message : 'Failed to update setting.');
    } finally {
      setSavingKey(null);
    }
  }

  const LABELS: Record<string, { title: string; description: string }> = {
    daily_free_limit: {
      title: 'Daily free usage limit',
      description:
        'Global cap on AI sourcing operations per user per day. Users with a per-user override on their profile ignore this value.',
    },
  };

  return (
    <SectionCard
      icon={<Sliders className="w-3.5 h-3.5 text-gray-700 dark:text-gray-300" />}
      title="Platform settings"
      subtitle="Global values that apply to every account"
    >
      {loading || !settings ? (
        <CenterLoader />
      ) : settings.length === 0 ? (
        <p className="text-xs text-gray-400 dark:text-gray-500">No settings configured.</p>
      ) : (
        <div className="flex flex-col gap-5">
          {settings.map(s => {
            const meta = LABELS[s.key] ?? { title: s.key, description: '' };
            const dirty = draft[s.key] !== s.value;
            const isSaving = savingKey === s.key;
            return (
              <div
                key={s.key}
                className="bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg p-4 flex flex-col gap-3"
              >
                <div>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">{meta.title}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{meta.description}</p>
                  <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-1 font-mono">
                    key: <span className="text-gray-500 dark:text-gray-400">{s.key}</span>
                    {s.updatedAt && (
                      <>
                        <span className="mx-2">·</span>
                        last update by {s.updatedBy ?? 'system'} ·{' '}
                        {new Date(s.updatedAt).toLocaleString()}
                      </>
                    )}
                    {s.isDefault && <span className="ml-2 text-amber-600">(default)</span>}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min={0}
                    value={draft[s.key] ?? ''}
                    onChange={e =>
                      setDraft(prev => ({ ...prev, [s.key]: e.target.value }))
                    }
                    className="w-40 bg-white dark:bg-[#0a0c12] border border-gray-300 dark:border-white/10 rounded-lg px-3.5 py-2 text-sm font-mono text-gray-900 dark:text-gray-100 focus:outline-none focus:border-gray-900 dark:focus:border-gray-400 focus:ring-2 focus:ring-gray-900/10"
                  />
                  <button
                    onClick={() => save(s.key)}
                    disabled={!dirty || isSaving}
                    className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-white bg-gray-900 dark:bg-gray-700 rounded-md hover:bg-gray-100 dark:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {isSaving ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Save className="w-3.5 h-3.5" />
                    )}
                    Save
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </SectionCard>
  );
}

// ─── Tab: Plans & Pricing Matrix ─────────────────────────────────────────────

function PlansTab({ onError }: { onError: (msg: string) => void }) {
  const [data, setData] = useState<AdminBilling | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminApi.getBilling();
      setData({ summary: res.summary, subscribers: res.subscribers, recentTransactions: res.recentTransactions });
    } catch (err) {
      onError(err instanceof ApiError ? err.message : 'Failed to load plans data.');
    } finally {
      setLoading(false);
    }
  }, [onError]);

  useEffect(() => { void load(); }, [load]);

  if (loading) return <CenterLoader />;

  // Calculate active counts per tier
  const subscribers = data?.subscribers ?? [];
  const sourcingCount = subscribers.filter(s => s.planType === 'SOURCING' || s.subscriptionPlan === 'sourcing-plan').length;
  const rankingCount = subscribers.filter(s => s.planType === 'RANKING' || s.subscriptionPlan === 'ranking-plan').length;
  const proCount = subscribers.filter(s => s.planType === 'PRO' || s.subscriptionPlan === 'pro-plan').length;
  const rankingAddonCount = subscribers.filter(s => s.rankingAddonActive).length;
  const sourcingAddonCount = subscribers.filter(s => s.sourcingAddonActive).length;

  const planTiers = [
    {
      id: 'sourcing-plan',
      name: 'AI Sourcing Plan',
      price: '$149',
      interval: 'month',
      type: 'Base Plan',
      badge: 'Sourcing Core',
      trial: 'No trial',
      credits: '2,000 credits/mo',
      activeCount: sourcingCount,
      features: [
        'Multi-platform candidate discovery',
        'Gemini deep candidate fit analysis',
        '2,000 monthly contact reveal credits',
        'Personal email outreach integration',
      ],
    },
    {
      id: 'ranking-plan',
      name: 'CV Ranking Plan',
      price: '$99',
      interval: 'month',
      type: 'Base Plan',
      badge: '7-Day Free Trial',
      trial: '7 Days Free',
      credits: 'In-Memory RAM parse',
      activeCount: rankingCount,
      features: [
        'Up to 50 CVs per upload run (PDF/DOCX)',
        '100% transient in-memory extraction (0 disk footprint)',
        'Gemini automated candidate scoring & gap highlights',
        'Top 50% persistence with 45-day retention cron',
        'CSV export & medal distribution (🥇 🥈 🥉)',
      ],
    },
    {
      id: 'pro-plan',
      name: 'Pro All-In-One Plan',
      price: '$229',
      interval: 'month',
      type: 'Base Plan',
      badge: 'Most Popular',
      trial: '7 Days Free',
      credits: '2,000 credits/mo',
      activeCount: proCount,
      features: [
        'Full AI Sourcing suite across all platforms',
        'Full CV Ranking suite with Top 50% persistence',
        '2,000 monthly contact reveal credits',
        '7-day free trial on initial signup',
        'Priority email outreach & support',
      ],
    },
    {
      id: 'ranking-addon',
      name: 'CV Ranking Add-on',
      price: '$109',
      interval: 'month',
      type: 'Add-on Tier',
      badge: 'For Sourcing Plan',
      trial: 'Syncs with base',
      credits: 'CV Ranking access',
      activeCount: rankingAddonCount,
      features: [
        'Available to active Sourcing Plan subscribers',
        'Unlocks full CV Ranking workspace',
        'In-memory transient security & 45-day retention',
      ],
    },
    {
      id: 'sourcing-addon',
      name: 'AI Sourcing Add-on',
      price: '$159',
      interval: 'month',
      type: 'Add-on Tier',
      badge: 'For Ranking Plan',
      trial: 'Syncs with base',
      credits: '2,000 credits/mo',
      activeCount: sourcingAddonCount,
      features: [
        'Available to active Ranking Plan subscribers',
        'Unlocks multi-platform AI Sourcing engine',
        'Grants 2,000 monthly contact reveal credits',
      ],
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      {/* Metrics Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <BillingStat label="Sourcing Plan Subs" value={sourcingCount.toLocaleString()} icon={Users} tint="indigo" />
        <BillingStat label="Ranking Plan Subs" value={rankingCount.toLocaleString()} icon={Trophy} tint="amber" />
        <BillingStat label="Pro Plan Subs" value={proCount.toLocaleString()} icon={Zap} tint="emerald" />
        <BillingStat label="Active Add-ons" value={(rankingAddonCount + sourcingAddonCount).toLocaleString()} icon={Package} tint="blue" />
      </div>

      {/* Plan Cards Grid */}
      <SectionCard icon={<Package className="w-3.5 h-3.5 text-gray-700 dark:text-gray-300" />} title="Subscription Plans & Add-on Tiers" subtitle="Complete breakdown of all 5 available subscription packages in TalentScanr">
        <div className="p-5 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {planTiers.map(p => (
            <div key={p.id} className="bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl p-5 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-slate-900 text-white dark:bg-white dark:text-slate-900">
                    {p.type}
                  </span>
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-300 dark:border-emerald-500/20">
                    {p.badge}
                  </span>
                </div>

                <h3 className="text-base font-bold text-gray-900 dark:text-white mt-1">{p.name}</h3>
                <div className="flex items-baseline gap-1 my-3">
                  <span className="text-3xl font-extrabold text-gray-900 dark:text-white tabular-nums">{p.price}</span>
                  <span className="text-xs text-gray-500 dark:text-gray-400">/{p.interval}</span>
                </div>

                <div className="space-y-1.5 mb-4 text-xs text-gray-600 dark:text-gray-300">
                  <p><span className="font-semibold text-gray-900 dark:text-white">Trial:</span> {p.trial}</p>
                  <p><span className="font-semibold text-gray-900 dark:text-white">Grant:</span> {p.credits}</p>
                  <p><span className="font-semibold text-gray-900 dark:text-white">Active Subscribers:</span> <span className="font-bold text-emerald-600 dark:text-emerald-400">{p.activeCount}</span></p>
                </div>

                <hr className="border-gray-200 dark:border-white/10 my-3" />

                <ul className="space-y-2">
                  {p.features.map((f, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-xs text-gray-600 dark:text-gray-400">
                      <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
      </SectionCard>

      {/* Feature Access Matrix */}
      <SectionCard icon={<Sliders className="w-3.5 h-3.5 text-gray-700 dark:text-gray-300" />} title="Feature Access Matrix" subtitle="Capabilities granted by PlanType and Add-ons" noBodyPadding>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-[10px] uppercase tracking-wider text-gray-400 dark:text-gray-500 border-b border-gray-100 dark:border-white/10">
                <th className="px-5 py-2.5 font-semibold">Plan Type</th>
                <th className="px-5 py-2.5 font-semibold">Monthly Cost</th>
                <th className="px-5 py-2.5 font-semibold">AI Sourcing</th>
                <th className="px-5 py-2.5 font-semibold">CV Ranking</th>
                <th className="px-5 py-2.5 font-semibold">Contact Credits</th>
                <th className="px-5 py-2.5 font-semibold">Allowed Add-ons</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-white/10">
              <tr>
                <td className="px-5 py-3 font-semibold text-gray-900 dark:text-white">SOURCING</td>
                <td className="px-5 py-3 text-gray-700 dark:text-gray-300">$149 / mo</td>
                <td className="px-5 py-3 text-emerald-600 dark:text-emerald-400 font-semibold">✓ Included</td>
                <td className="px-5 py-3 text-gray-400 dark:text-gray-500">Requires Add-on</td>
                <td className="px-5 py-3 text-gray-700 dark:text-gray-300 font-mono">2,000 / mo</td>
                <td className="px-5 py-3 text-xs text-gray-600 dark:text-gray-400">Ranking Add-on ($109)</td>
              </tr>
              <tr>
                <td className="px-5 py-3 font-semibold text-gray-900 dark:text-white">RANKING</td>
                <td className="px-5 py-3 text-gray-700 dark:text-gray-300">$99 / mo (7-Day Trial)</td>
                <td className="px-5 py-3 text-gray-400 dark:text-gray-500">Requires Add-on</td>
                <td className="px-5 py-3 text-emerald-600 dark:text-emerald-400 font-semibold">✓ Included</td>
                <td className="px-5 py-3 text-gray-400 dark:text-gray-500">0 (Top-up available)</td>
                <td className="px-5 py-3 text-xs text-gray-600 dark:text-gray-400">Sourcing Add-on ($159)</td>
              </tr>
              <tr>
                <td className="px-5 py-3 font-semibold text-gray-900 dark:text-white">PRO</td>
                <td className="px-5 py-3 text-gray-700 dark:text-gray-300">$229 / mo (7-Day Trial)</td>
                <td className="px-5 py-3 text-emerald-600 dark:text-emerald-400 font-semibold">✓ Included</td>
                <td className="px-5 py-3 text-emerald-600 dark:text-emerald-400 font-semibold">✓ Included</td>
                <td className="px-5 py-3 text-gray-700 dark:text-gray-300 font-mono">2,000 / mo</td>
                <td className="px-5 py-3 text-xs text-gray-400 dark:text-gray-500">All features included</td>
              </tr>
              <tr>
                <td className="px-5 py-3 font-semibold text-gray-500 dark:text-gray-400">NONE</td>
                <td className="px-5 py-3 text-gray-400 dark:text-gray-500">$0</td>
                <td className="px-5 py-3 text-gray-400 dark:text-gray-500">Locked</td>
                <td className="px-5 py-3 text-gray-400 dark:text-gray-500">Locked</td>
                <td className="px-5 py-3 text-gray-400 dark:text-gray-500">0</td>
                <td className="px-5 py-3 text-xs text-gray-400 dark:text-gray-500">Upgrade required</td>
              </tr>
            </tbody>
          </table>
        </div>
      </SectionCard>
    </div>
  );
}

// ─── Shared cards & primitives ────────────────────────────────────────────────

function BillingTab({ onError }: { onError: (msg: string) => void }) {
  const [data, setData] = useState<AdminBilling | null>(null);
  const [loading, setLoading] = useState(true);
  const [granting, setGranting] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminApi.getBilling();
      setData({ summary: res.summary, subscribers: res.subscribers, recentTransactions: res.recentTransactions });
    } catch (err) {
      onError(err instanceof ApiError ? err.message : 'Failed to load billing.');
    } finally {
      setLoading(false);
    }
  }, [onError]);

  useEffect(() => { void load(); }, [load]);

  async function grant(sub: AdminSubscriber) {
    const raw = window.prompt(`Grant credits to ${sub.email}. How many?`, '1000');
    if (raw === null) return;
    const credits = parseInt(raw, 10);
    if (!Number.isFinite(credits) || credits <= 0) { onError('Enter a positive number of credits.'); return; }
    const note = window.prompt('Optional note (shown in the ledger):', 'Manual admin grant') ?? undefined;
    setGranting(sub.id);
    try {
      const res = await adminApi.grantCredits(sub.id, credits, note);
      setData(d => d ? { ...d, subscribers: d.subscribers.map(s => s.id === sub.id ? { ...s, creditBalance: res.balance } : s) } : d);
    } catch (err) {
      onError(err instanceof ApiError ? err.message : 'Grant failed.');
    } finally {
      setGranting(null);
    }
  }

  if (loading) return <CenterLoader />;
  if (!data) return null;
  const money = (cents: number) => `$${(cents / 100).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;

  return (
    <div className="flex flex-col gap-6">
      {/* Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <BillingStat label="Active subscriptions" value={data.summary.activeSubscriptions.toLocaleString()} icon={CreditCard} tint="indigo" />
        <BillingStat label="Lifetime revenue" value={money(data.summary.lifetimeRevenueCents)} icon={TrendingUp} tint="emerald" />
        <BillingStat label="Credits outstanding" value={data.summary.creditsOutstanding.toLocaleString()} icon={Coins} tint="amber" />
        <BillingStat label="Paid transactions" value={data.summary.paidTransactions.toLocaleString()} icon={BarChart3} tint="blue" />
      </div>

      {/* Subscribers */}
      <SectionCard icon={<CreditCard className="w-3.5 h-3.5 text-gray-700 dark:text-gray-300 dark:text-gray-700 dark:text-gray-300" />} title="Subscribers & customers" subtitle="Subscription status + credit balance per account" noBodyPadding>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-[10px] uppercase tracking-wider text-gray-400 dark:text-gray-500 border-b border-gray-100 dark:border-white/10">
                <th className="px-5 py-2.5 font-semibold">Account</th>
                <th className="px-5 py-2.5 font-semibold">Plan</th>
                <th className="px-5 py-2.5 font-semibold">Status</th>
                <th className="px-5 py-2.5 font-semibold">Renews</th>
                <th className="px-5 py-2.5 font-semibold text-right">Credits</th>
                <th className="px-5 py-2.5 font-semibold text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-white/10">
              {data.subscribers.length === 0 ? (
                <tr><td colSpan={6} className="px-5 py-8 text-center text-gray-400 dark:text-gray-500 text-xs">No subscribers or customers yet.</td></tr>
              ) : data.subscribers.map(s => (
                <tr key={s.id}>
                  <td className="px-5 py-3">
                    <p className="font-medium text-gray-900 dark:text-gray-100 leading-tight">{s.name}</p>
                    <p className="text-[11px] text-gray-500 dark:text-gray-400">{s.email}</p>
                  </td>
                  <td className="px-5 py-3 text-gray-700 dark:text-gray-300">{s.subscriptionPlan ?? '—'}</td>
                  <td className="px-5 py-3"><SubStatusBadge status={s.subscriptionStatus} /></td>
                  <td className="px-5 py-3 text-gray-500 dark:text-gray-400 whitespace-nowrap">{s.subscriptionCurrentPeriodEnd ? formatDate(s.subscriptionCurrentPeriodEnd) : '—'}</td>
                  <td className="px-5 py-3 text-right font-semibold tabular-nums text-gray-900 dark:text-gray-100">{s.creditBalance.toLocaleString()}</td>
                  <td className="px-5 py-3 text-right">
                    <button onClick={() => grant(s)} disabled={granting === s.id}
                      className="inline-flex items-center gap-1 text-[11px] font-semibold text-gray-900 dark:text-white hover:text-gray-700 dark:hover:text-gray-200 disabled:opacity-50">
                      <Plus className="w-3 h-3" /> Grant
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </SectionCard>

      {/* Recent transactions */}
      <SectionCard icon={<Coins className="w-3.5 h-3.5 text-gray-700 dark:text-gray-300 dark:text-gray-700 dark:text-gray-300" />} title="Recent transactions" subtitle="Purchases, subscription grants, admin grants & refunds" noBodyPadding>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-[10px] uppercase tracking-wider text-gray-400 dark:text-gray-500 border-b border-gray-100 dark:border-white/10">
                <th className="px-5 py-2.5 font-semibold">Date</th>
                <th className="px-5 py-2.5 font-semibold">Account</th>
                <th className="px-5 py-2.5 font-semibold">Type</th>
                <th className="px-5 py-2.5 font-semibold text-right">Credits</th>
                <th className="px-5 py-2.5 font-semibold text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-white/10">
              {data.recentTransactions.length === 0 ? (
                <tr><td colSpan={5} className="px-5 py-8 text-center text-gray-400 dark:text-gray-500 text-xs">No transactions yet.</td></tr>
              ) : data.recentTransactions.map(t => (
                <tr key={t.id}>
                  <td className="px-5 py-3 text-gray-500 dark:text-gray-400 whitespace-nowrap">{formatDate(t.createdAt)}</td>
                  <td className="px-5 py-3 text-gray-700 dark:text-gray-300">{t.user?.email ?? '—'}</td>
                  <td className="px-5 py-3"><TxnTypeBadge type={t.type} /></td>
                  <td className={`px-5 py-3 text-right font-semibold tabular-nums ${t.credits >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-gray-600 dark:text-gray-400'}`}>{t.credits >= 0 ? `+${t.credits}` : t.credits}</td>
                  <td className="px-5 py-3 text-right text-gray-700 dark:text-gray-300 tabular-nums">{t.amountCents > 0 ? money(t.amountCents) : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </SectionCard>
    </div>
  );
}

function BillingStat({ label, value, icon: Icon, tint }: { label: string; value: string; icon: typeof Users; tint: 'indigo' | 'emerald' | 'blue' | 'amber' }) {
  const tints: Record<string, string> = {
    indigo: 'bg-slate-100 text-slate-800 border-slate-200 dark:bg-slate-800/40 dark:text-slate-200 dark:border-slate-700',
    emerald: 'bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-300 dark:border-emerald-500/20',
    blue: 'bg-blue-50 text-blue-800 border-blue-200 dark:bg-blue-500/10 dark:text-blue-300 dark:border-blue-500/20',
    amber: 'bg-amber-50 text-amber-900 border-amber-200 dark:bg-amber-500/10 dark:text-amber-300 dark:border-amber-500/20',
  };
  return (
    <div className="bg-white dark:bg-[#10131c] border border-gray-200 dark:border-white/10 rounded-xl p-4">
      <div className="flex items-center justify-between mb-3">
        <p className="text-[10px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-widest">{label}</p>
        <div className={`w-7 h-7 rounded-md flex items-center justify-center border ${tints[tint]}`}><Icon className="w-3.5 h-3.5" /></div>
      </div>
      <p className="text-2xl font-bold text-gray-900 dark:text-white tabular-nums">{value}</p>
    </div>
  );
}

function SubStatusBadge({ status }: { status: string | null }) {
  const s = status ?? 'none';
  const map: Record<string, string> = {
    active: 'bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-300 dark:border-emerald-500/20',
    trialing: 'bg-blue-50 text-blue-800 border-blue-200 dark:bg-blue-500/10 dark:text-blue-300 dark:border-blue-500/20',
    past_due: 'bg-amber-50 text-amber-900 border-amber-200 dark:bg-amber-500/10 dark:text-amber-300 dark:border-amber-500/20',
    canceled: 'bg-gray-100 text-gray-700 border-gray-200 dark:bg-white/5 dark:text-gray-400 dark:border-white/10',
    none: 'bg-gray-100 text-gray-600 border-gray-200 dark:bg-white/5 dark:text-gray-500 dark:border-white/10',
  };
  return <span className={`text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-md border ${map[s] ?? map.none}`}>{status ?? 'no sub'}</span>;
}

function TxnTypeBadge({ type }: { type: AdminBilling['recentTransactions'][number]['type'] }) {
  const map: Record<string, { label: string; cls: string }> = {
    TOPUP_PURCHASE: { label: 'Top-up', cls: 'text-amber-900 bg-amber-50 border-amber-200 dark:text-amber-300 dark:bg-amber-500/10 dark:border-amber-500/20' },
    SUBSCRIPTION_GRANT: { label: 'Subscription', cls: 'text-slate-800 bg-slate-100 border-slate-200 dark:text-slate-200 dark:bg-slate-800/40 dark:border-slate-700' },
    ADMIN_GRANT: { label: 'Admin grant', cls: 'text-purple-800 bg-purple-50 border-purple-200 dark:text-purple-300 dark:bg-purple-500/10 dark:border-purple-500/20' },
    REFUND: { label: 'Refund', cls: 'text-emerald-800 bg-emerald-50 border-emerald-200 dark:text-emerald-300 dark:bg-emerald-500/10 dark:border-emerald-500/20' },
    SPEND: { label: 'Spend', cls: 'text-gray-700 bg-gray-100 border-gray-200 dark:text-gray-400 dark:bg-white/5 dark:border-white/10' },
  };
  const m = map[type] ?? map.SPEND;
  return <span className={`text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-md border ${m.cls}`}>{m.label}</span>;
}

function StatCard({
  label,
  value,
  icon: Icon,
  tint,
}: {
  label: string;
  value: number;
  icon: typeof Users;
  tint: 'indigo' | 'emerald' | 'blue' | 'violet' | 'amber';
}) {
  const tints: Record<string, string> = {
    indigo: 'bg-slate-100 text-slate-800 border-slate-200 dark:bg-slate-800/40 dark:text-slate-200 dark:border-slate-700',
    emerald: 'bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-300 dark:border-emerald-500/20',
    blue: 'bg-blue-50 text-blue-800 border-blue-200 dark:bg-blue-500/10 dark:text-blue-300 dark:border-blue-500/20',
    violet: 'bg-purple-50 text-purple-800 border-purple-200 dark:bg-purple-500/10 dark:text-purple-300 dark:border-purple-500/20',
    amber: 'bg-amber-50 text-amber-900 border-amber-200 dark:bg-amber-500/10 dark:text-amber-300 dark:border-amber-500/20',
  };
  return (
    <div className="bg-white dark:bg-[#10131c] border border-gray-200 dark:border-white/10 rounded-xl p-4">
      <div className="flex items-center justify-between mb-3">
        <p className="text-[10px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-widest">{label}</p>
        <div className={`w-7 h-7 rounded-md flex items-center justify-center border ${tints[tint]}`}>
          <Icon className="w-3.5 h-3.5" />
        </div>
      </div>
      <p className="text-3xl font-bold text-gray-900 dark:text-white tabular-nums">{value.toLocaleString()}</p>
    </div>
  );
}

function RoleBadge({ role }: { role: UserRole }) {
  if (role === 'ADMIN') {
    return (
      <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide bg-slate-900 text-white border border-slate-800 dark:bg-white dark:text-slate-900 dark:border-white/20 px-2 py-0.5 rounded-md">
        <Shield className="w-3 h-3" />
        Admin
      </span>
    );
  }
  return (
    <span className="text-[10px] font-bold uppercase tracking-wide bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-600 dark:text-gray-400 px-2 py-0.5 rounded-md">
      User
    </span>
  );
}

function SectionCard({
  icon,
  title,
  subtitle,
  children,
  className,
  noBodyPadding,
  headerAction,
}: {
  icon: ReactNode;
  title: string;
  subtitle?: string;
  children: ReactNode;
  className?: string;
  noBodyPadding?: boolean;
  headerAction?: ReactNode;
}) {
  return (
    <section
      className={`bg-white dark:bg-[#10131c] border border-gray-200 dark:border-white/10 rounded-xl overflow-hidden flex flex-col ${className ?? ''}`}
    >
      <header className="px-5 py-3.5 border-b border-gray-100 dark:border-white/10 flex items-center gap-2.5">
        <div className="w-7 h-7 rounded-md bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 flex items-center justify-center">
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-xs font-semibold text-gray-900 dark:text-white leading-none">{title}</h3>
          {subtitle && <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-1 truncate">{subtitle}</p>}
        </div>
        {headerAction && <div className="shrink-0">{headerAction}</div>}
      </header>
      <div className={noBodyPadding ? 'flex-1' : 'p-4 flex-1'}>{children}</div>
    </section>
  );
}

function PipelineFunnel({ stages }: { stages: FunnelStage[] }) {
  const max = Math.max(1, ...stages.map(s => s.count));
  const labels: Record<FunnelStage['stage'], string> = {
    SOURCED: 'Sourced',
    ENRICHED: 'Enriched',
    OUTREACH_SENT: 'Outreach Sent',
    OPENED: 'Opened',
    REPLIED: 'Replied',
    NO_RESPONSE: 'No Response',
  };
  const colors: Record<FunnelStage['stage'], string> = {
    SOURCED: 'bg-gray-400',
    ENRICHED: 'bg-violet-500',
    OUTREACH_SENT: 'bg-blue-500',
    OPENED: 'bg-sky-500',
    REPLIED: 'bg-emerald-500',
    NO_RESPONSE: 'bg-red-500',
  };
  return (
    <div className="flex flex-col gap-2.5">
      {stages.map(s => {
        const pct = (s.count / max) * 100;
        return (
          <div key={s.stage}>
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-gray-700 dark:text-gray-300">{labels[s.stage]}</span>
              <span className="text-xs font-bold text-gray-900 dark:text-white tabular-nums">{s.count}</span>
            </div>
            <div className="h-1.5 bg-gray-100 dark:bg-white/10 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${colors[s.stage]}`}
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

function HotCampaignsList({ campaigns }: { campaigns: AdminHotCampaign[] }) {
  if (campaigns.length === 0) {
    return <p className="text-xs text-gray-400 dark:text-gray-500 p-4">No campaigns on this page.</p>;
  }
  return (
    <ol className="flex flex-col divide-y divide-gray-100 dark:divide-white/10">
      {campaigns.map((c, i) => (
        <li key={c.id} className="px-5 py-3.5 flex items-center gap-4">
          <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500 w-5 tabular-nums">
            {String(i + 1).padStart(2, '0')}
          </span>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">{c.name}</p>
            <p className="text-[11px] text-gray-500 dark:text-gray-400 truncate">
              {c.jobTitle} · {c.owner.email}
            </p>
          </div>
          <div className="flex items-center gap-4 text-[11px] text-gray-500 dark:text-gray-400 tabular-nums shrink-0">
            <span>
              <span className="font-bold text-gray-900 dark:text-white">{c.candidateCount}</span> candidates
            </span>
            <span>
              <span className="font-bold text-gray-900 dark:text-white">{c.activityCount}</span> events
            </span>
            <CampaignStatusBadge status={c.status} />
          </div>
        </li>
      ))}
    </ol>
  );
}

function PlatformList({ platforms }: { platforms: PlatformBreakdownEntry[] }) {
  const total = platforms.reduce((acc, p) => acc + p.count, 0) || 1;
  const colors: Record<PlatformBreakdownEntry['platform'], string> = {
    LinkedIn: 'bg-blue-500',
    Upwork: 'bg-emerald-500',
    Reddit: 'bg-orange-500',
    GitHub: 'bg-slate-500',
  };
  return (
    <div className="flex flex-col gap-3">
      {platforms.map(p => {
        const pct = (p.count / total) * 100;
        return (
          <div key={p.platform}>
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-gray-700 dark:text-gray-300">{p.platform}</span>
              <span className="text-xs text-gray-500 dark:text-gray-400">
                <span className="text-gray-900 dark:text-white font-bold tabular-nums">{p.count}</span>
                <span className="text-gray-400 dark:text-gray-500 ml-1">({pct.toFixed(0)}%)</span>
              </span>
            </div>
            <div className="h-1.5 bg-gray-100 dark:bg-white/10 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${colors[p.platform]}`}
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

function ScoreHistogram({ buckets }: { buckets: ScoreBucket[] }) {
  if (buckets.every(b => b.count === 0)) {
    return <p className="text-xs text-gray-400 dark:text-gray-500">No candidates scored yet.</p>;
  }
  const max = Math.max(1, ...buckets.map(b => b.count));
  return (
    <div className="flex items-end gap-1 h-24">
      {buckets.map(b => {
        const h = (b.count / max) * 100;
        const isThreshold = b.lo >= 9.5;
        return (
          <div
            key={b.range}
            className="flex-1 flex flex-col items-center group"
            title={`${b.range}: ${b.count}`}
          >
            <div className="w-full flex flex-col justify-end flex-1">
              <div
                className={`w-full rounded-t ${
                  isThreshold ? 'bg-emerald-500' : 'bg-gray-100 dark:bg-gray-800'
                } transition-all`}
                style={{ height: `${h}%` }}
              />
            </div>
            <span className="text-[9px] text-gray-400 dark:text-gray-500 mt-1 opacity-0 group-hover:opacity-100">
              {b.count}
            </span>
          </div>
        );
      })}
    </div>
  );
}

function RecentSignupsList({ signups }: { signups: RecentSignup[] }) {
  if (signups.length === 0) {
    return <p className="text-xs text-gray-400 dark:text-gray-500">No signups yet.</p>;
  }
  return (
    <ol className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
      {signups.map(s => (
        <li
          key={s.id}
          className="flex items-center gap-3 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg px-3 py-2"
        >
          <div className="w-8 h-8 rounded-full bg-slate-800 dark:bg-white/10 text-white font-bold flex items-center justify-center shrink-0">
            <span className="text-xs">{s.name.charAt(0).toUpperCase()}</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-gray-900 dark:text-gray-100 truncate">{s.name}</p>
            <p className="text-[10px] text-gray-500 dark:text-gray-400 truncate">{s.email}</p>
          </div>
          <div className="flex flex-col items-end gap-0.5 shrink-0">
            <RoleBadge role={s.role} />
            <span className="text-[9px] text-gray-400 dark:text-gray-500">{formatRelative(s.createdAt)}</span>
          </div>
        </li>
      ))}
    </ol>
  );
}

function SystemActivityFeed({ events }: { events: AdminSystemEvent[] }) {
  if (events.length === 0) {
    return <p className="text-xs text-gray-400 dark:text-gray-500 p-4">No activity on this page.</p>;
  }
  return (
    <ol className="flex flex-col divide-y divide-gray-100 dark:divide-white/10">
      {events.map(e => (
        <li key={e.id} className="px-5 py-2.5 flex items-start gap-3">
          <ActivityDot type={e.type} />
          <div className="flex-1 min-w-0">
            <p className="text-xs text-gray-800 dark:text-gray-200">{e.message}</p>
            <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-0.5 truncate">
              {e.campaign.name} · {e.owner.email}
              {e.candidateName ? ` · ${e.candidateName}` : ''}
            </p>
          </div>
          <span className="text-[10px] text-gray-400 dark:text-gray-500 shrink-0 whitespace-nowrap">
            {formatRelative(e.timestamp)}
          </span>
        </li>
      ))}
    </ol>
  );
}

function CampaignStatusBadge({
  status,
}: {
  status: 'DRAFT' | 'RUNNING' | 'PAUSED' | 'COMPLETED';
}) {
  const map = {
    RUNNING: 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-400/20 text-emerald-700 dark:text-emerald-300',
    PAUSED: 'bg-amber-50 dark:bg-amber-500/10 border-amber-200 dark:border-amber-400/20 text-amber-700 dark:text-amber-300',
    DRAFT: 'bg-gray-100 dark:bg-white/5 border-gray-200 dark:border-white/10 text-gray-600 dark:text-gray-400',
    COMPLETED: 'bg-blue-50 dark:bg-blue-500/10 border-blue-200 dark:border-blue-400/20 text-blue-700 dark:text-blue-300',
  } as const;
  return (
    <span
      className={`text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-md border ${map[status]} shrink-0`}
    >
      {status}
    </span>
  );
}

function ActivityDot({
  type,
}: {
  type: 'INFO' | 'ENRICH' | 'OUTREACH' | 'REPLY' | 'ALERT' | 'SYSTEM';
}) {
  const colors = {
    INFO: 'bg-gray-400',
    ENRICH: 'bg-emerald-500',
    OUTREACH: 'bg-blue-500',
    REPLY: 'bg-violet-500',
    ALERT: 'bg-red-500',
    SYSTEM: 'bg-gray-100 dark:bg-gray-800',
  } as const;
  return <span className={`w-1.5 h-1.5 rounded-full mt-1.5 shrink-0 ${colors[type]}`} />;
}

function CenterLoader() {
  return (
    <div className="flex items-center justify-center py-16">
      <Loader2 className="w-5 h-5 text-gray-400 animate-spin" />
    </div>
  );
}


function formatDate(iso: string | Date | null): string {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return String(iso);
  }
}

function formatRelative(iso: string | Date | null): string {
  if (!iso) return 'Never';
  const diff = Date.now() - new Date(iso).getTime();
  const min = Math.floor(diff / 60_000);
  if (min < 1) return 'Just now';
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const d = Math.floor(hr / 24);
  if (d < 30) return `${d}d ago`;
  return formatDate(iso);
}

// ─── Tab: Email Requests ───────────────────────────────────────────────────────
function EmailRequestsTab({ onError }: { onError: (msg: string) => void }) {
  const [requests, setRequests] = useState<EmailRequestRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [configuring, setConfiguring] = useState<EmailRequestRow | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminApi.listEmailRequests();
      setRequests(res.requests);
    } catch (err) {
      onError(err instanceof ApiError ? err.message : 'Failed to load email requests.');
    } finally {
      setLoading(false);
    }
  }, [onError]);

  useEffect(() => { void load(); }, [load]);

  if (loading) {
    return <div className="py-12 flex justify-center"><Loader2 className="w-5 h-5 animate-spin text-gray-400" /></div>;
  }
  if (requests.length === 0) {
    return (
      <div className="bg-white dark:bg-[#10131c] border border-gray-200 dark:border-white/10 rounded-2xl p-10 text-center text-sm text-gray-500 dark:text-gray-400">
        No Resend setup requests yet.
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-[#10131c] border border-gray-200 dark:border-white/10 rounded-2xl overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-100 dark:border-white/10 text-left text-[11px] uppercase tracking-wider text-gray-500 dark:text-gray-400">
            <th className="px-5 py-3 font-semibold">User</th>
            <th className="px-3 py-3 font-semibold">WhatsApp</th>
            <th className="px-3 py-3 font-semibold">Email / Domain</th>
            <th className="px-3 py-3 font-semibold">Status</th>
            <th className="px-3 py-3 font-semibold">Requested</th>
            <th className="px-5 py-3 font-semibold text-right">Action</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100 dark:divide-white/10">
          {requests.map(r => (
            <tr key={r.id}>
              <td className="px-5 py-3">
                <div className="font-semibold text-gray-900 dark:text-gray-100">{r.contactName}</div>
                <div className="text-[11px] text-gray-500 dark:text-gray-400">{r.user.email}</div>
              </td>
              <td className="px-3 py-3 text-gray-700 dark:text-gray-300">{r.whatsapp}</td>
              <td className="px-3 py-3">
                <div className="text-gray-900 dark:text-gray-100">{r.emailAccount}</div>
                <div className="text-[11px] text-gray-500 dark:text-gray-400">{r.domain}</div>
              </td>
              <td className="px-3 py-3">
                <span className={`text-[10.5px] font-semibold px-2 py-0.5 rounded-full border ${
                  r.status === 'CONFIGURED'
                    ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-400/20'
                    : r.status === 'REJECTED'
                      ? 'bg-red-50 dark:bg-red-500/10 text-red-700 dark:text-red-300 border-red-200 dark:border-red-400/20'
                      : 'bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-400/20'
                }`}>{r.status}</span>
              </td>
              <td className="px-3 py-3 text-gray-500 dark:text-gray-400">{formatRelative(r.createdAt)}</td>
              <td className="px-5 py-3 text-right">
                <button onClick={() => setConfiguring(r)}
                  className="text-xs font-semibold text-gray-700 dark:text-gray-300 dark:text-gray-700 dark:text-gray-300 hover:text-gray-700 dark:text-gray-300 dark:hover:text-gray-700 dark:text-gray-300">
                  {r.status === 'CONFIGURED' ? 'Reconfigure' : 'Configure'}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {configuring && (
        <ConfigureEmailModal
          request={configuring}
          onClose={() => setConfiguring(null)}
          onDone={() => { setConfiguring(null); void load(); }}
          onError={onError}
        />
      )}
    </div>
  );
}

function ConfigureEmailModal({
  request, onClose, onDone, onError,
}: {
  request: EmailRequestRow;
  onClose: () => void;
  onDone: () => void;
  onError: (msg: string) => void;
}) {
  const [fromAddress, setFromAddress] = useState(request.emailAccount);
  const [fromName, setFromName] = useState(request.contactName);
  const [resendApiKey, setResendApiKey] = useState('');
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  async function save() {
    await adminApi.configureUserEmail({
      userId: request.user.id,
      provider: 'RESEND',
      fromAddress: fromAddress.trim(),
      fromName: fromName.trim() || undefined,
      resendApiKey: resendApiKey.trim() || undefined,
      requestId: request.id,
    });
    setResendApiKey('');
  }

  async function handleSave() {
    setSaving(true); setNotice(null);
    try { await save(); setNotice('Saved. Click Save & send test to verify before the user can send.'); }
    catch (err) { onError(err instanceof ApiError ? err.message : 'Save failed.'); }
    finally { setSaving(false); }
  }

  async function handleTest() {
    setTesting(true); setNotice(null);
    try {
      await save();
      const r = await adminApi.testUserEmail(request.user.id);
      setNotice(`Test sent to ${r.sentTo}. ${request.contactName} can now send outreach.`);
    } catch (err) {
      onError(err instanceof ApiError ? err.message : 'Test failed.');
    } finally { setTesting(false); }
  }

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg bg-white dark:bg-[#10131c] rounded-2xl shadow-2xl p-6 flex flex-col gap-4">
        <div>
          <h3 className="text-base font-bold text-gray-900 dark:text-white">Configure Resend — {request.contactName}</h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{request.user.email} · WhatsApp {request.whatsapp}</p>
        </div>
        {notice && (
          <div className="flex items-start gap-2 bg-indigo-50 dark:bg-gray-100 dark:bg-gray-800/10 border border-gray-200 dark:border-gray-700 dark:border-gray-200 dark:border-gray-700/20 rounded-lg px-3 py-2">
            <CheckCircle2 className="w-4 h-4 text-gray-700 dark:text-gray-300 mt-0.5 shrink-0" />
            <p className="text-sm text-gray-700 dark:text-gray-300 dark:text-gray-700 dark:text-gray-300">{notice}</p>
          </div>
        )}
        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">From address *</label>
            <input value={fromAddress} onChange={e => setFromAddress(e.target.value)}
              className="w-full bg-white dark:bg-[#0a0c12] border border-gray-300 dark:border-white/10 rounded-lg px-3 py-2 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:border-gray-900 dark:focus:border-gray-400 focus:ring-1 focus:ring-gray-900/10" />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">From name</label>
            <input value={fromName} onChange={e => setFromName(e.target.value)}
              className="w-full bg-white dark:bg-[#0a0c12] border border-gray-300 dark:border-white/10 rounded-lg px-3 py-2 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:border-gray-900 dark:focus:border-gray-400 focus:ring-1 focus:ring-gray-900/10" />
          </div>
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">Resend API key (leave blank to keep)</label>
          <input type="password" value={resendApiKey} onChange={e => setResendApiKey(e.target.value)}
            placeholder="re_xxxxxxxxxxxxxxxx"
            className="w-full bg-white dark:bg-[#0a0c12] border border-gray-300 dark:border-white/10 rounded-lg px-3 py-2 text-sm font-mono text-gray-900 dark:text-gray-100 dark:placeholder:text-gray-600 focus:outline-none focus:border-gray-900 dark:focus:border-gray-400 focus:ring-1 focus:ring-gray-900/10" />
          <p className="text-[11px] text-gray-500 dark:text-gray-400">The from-address domain ({request.domain}) must be verified in your Resend account.</p>
        </div>
        <div className="flex items-center justify-end gap-3 pt-1">
          <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-white/5 border border-gray-300 dark:border-white/10 rounded-lg hover:bg-gray-50 dark:hover:bg-white/10">Close</button>
          <button onClick={handleSave} disabled={saving || testing}
            className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-white/5 border border-gray-300 dark:border-white/10 rounded-lg hover:bg-gray-50 dark:hover:bg-white/10 disabled:opacity-60">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save'}
          </button>
          <button onClick={handleTest} disabled={saving || testing}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-black dark:bg-gray-800 rounded-lg hover:bg-gray-800 dark:hover:bg-gray-700 disabled:opacity-60">
            {testing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            Save &amp; send test
          </button>
        </div>
      </div>
    </div>
  );
}
