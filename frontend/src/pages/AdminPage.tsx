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
  Loader2,
  CheckCircle2,
  Send,
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
} from '../api/adminApi';
import { ApiError } from '../api/client';
import { Tabs, type TabSpec } from '../components/shared/Tabs';
import { Pagination } from '../components/shared/Pagination';
import { UserDetailModal } from '../components/admin/UserDetailModal';
import { CreateUserModal } from '../components/admin/CreateUserModal';
import type { AuthUser, UserRole } from '../hooks/useAuth';

interface AdminPageProps {
  currentUser: AuthUser;
  onLogout: () => void;
}

type AdminTab = 'overview' | 'campaigns' | 'activity' | 'users' | 'email' | 'settings';

export function AdminPage({ currentUser, onLogout }: AdminPageProps) {
  const [tab, setTab] = useState<AdminTab>('overview');
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [statsLoading, setStatsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
    { key: 'email', label: 'Email Requests', icon: <Mail className="w-3.5 h-3.5" /> },
    { key: 'settings', label: 'Settings', icon: <Sliders className="w-3.5 h-3.5" /> },
  ];

  return (
    <div className="min-h-screen bg-[#f3f4f8] text-gray-900 font-sans">
      {/* Header */}
      <header className="border-b border-gray-200 bg-white sticky top-0 z-10">
        <div className="max-w-[1400px] mx-auto px-6 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center shrink-0">
              <Shield className="w-4 h-4 text-white" />
            </div>
            <div className="min-w-0">
              <h1 className="text-base font-bold text-gray-900 leading-none truncate">
                ARIES - Control Panel
              </h1>
              <p className="text-[11px] text-gray-500 mt-0.5 truncate">
                Welcome, {currentUser.name}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={loadStats}
              disabled={refreshing}
              className="flex items-center gap-2 text-xs font-medium px-3 py-1.5 rounded-md bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50 transition-colors"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </button>
            <div className="hidden sm:flex items-center gap-2.5 pl-3 border-l border-gray-200">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shrink-0">
                <span className="text-xs font-bold text-white">
                  {currentUser.name.charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="min-w-0">
                <p className="text-xs font-medium text-gray-900 truncate leading-none">
                  {currentUser.name}
                </p>
                <p className="text-[10px] text-gray-500 mt-0.5 truncate">{currentUser.email}</p>
              </div>
            </div>
            <button
              onClick={onLogout}
              className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-md bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Sidebar + content */}
      <div className="max-w-[1400px] mx-auto px-6 py-8 flex flex-col lg:flex-row gap-6">
        <aside className="lg:w-56 shrink-0">
          <div className="lg:sticky lg:top-24">
            <p className="text-[10px] font-semibold tracking-widest text-gray-500 uppercase mb-2 px-1">
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
            <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-lg px-4 py-3 mb-6">
              <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {tab === 'overview' && (
            <OverviewTab stats={stats} statsLoading={statsLoading} onError={msg => setError(msg)} />
          )}
          {tab === 'campaigns' && <CampaignsTab onError={msg => setError(msg)} />}
          {tab === 'activity' && <ActivityTab onError={msg => setError(msg)} />}
          {tab === 'users' && <UsersTab currentUser={currentUser} onError={msg => setError(msg)} />}
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
              icon={<GitBranch className="w-3.5 h-3.5 text-indigo-600" />}
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
      icon={<Activity className="w-3.5 h-3.5 text-indigo-600" />}
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
        icon={<Users className="w-3.5 h-3.5 text-indigo-600" />}
        title="Users"
        subtitle={`${total} accounts · click a row to manage`}
        noBodyPadding
        headerAction={
          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-indigo-600 rounded-md hover:bg-indigo-700 transition-colors"
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
                  <tr className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider bg-gray-50/60">
                    <th className="text-left px-6 py-3">User</th>
                    <th className="text-left px-6 py-3">Role</th>
                    <th className="text-left px-6 py-3">Status</th>
                    <th className="text-right px-6 py-3">Daily limit</th>
                    <th className="text-right px-6 py-3">Campaigns</th>
                    <th className="text-right px-6 py-3">Candidates</th>
                    <th className="text-left px-6 py-3">Last Login</th>
                    <th className="text-left px-6 py-3">Joined</th>
                  </tr>
                </thead>
                <tbody>
                  {users.length === 0 && (
                    <tr>
                      <td colSpan={8} className="px-6 py-12 text-center text-sm text-gray-400">
                        No users on this page.
                      </td>
                    </tr>
                  )}
                  {users.map(u => (
                    <tr
                      key={u.id}
                      onClick={() => setSelected(u)}
                      className="border-t border-gray-100 hover:bg-gray-50/60 cursor-pointer transition-colors"
                    >
                      <td className="px-6 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shrink-0">
                            <span className="text-xs font-bold text-white">
                              {u.name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{u.name}</p>
                            <p className="text-xs text-gray-500">{u.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-3">
                        <RoleBadge role={u.role} />
                      </td>
                      <td className="px-6 py-3">
                        {u.isBlocked ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide bg-red-50 border border-red-200 text-red-700 px-2 py-0.5 rounded-md">
                            Blocked
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide bg-emerald-50 border border-emerald-200 text-emerald-700 px-2 py-0.5 rounded-md">
                            Active
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-3 text-right font-mono text-xs text-gray-700">
                        {u.dailyLimitOverride == null ? (
                          <span className="text-gray-400">inherit</span>
                        ) : (
                          u.dailyLimitOverride
                        )}
                      </td>
                      <td className="px-6 py-3 text-right font-mono text-gray-700">
                        {u.campaignCount}
                      </td>
                      <td className="px-6 py-3 text-right font-mono text-gray-700">
                        {u.candidateCount}
                      </td>
                      <td className="px-6 py-3 text-gray-500 text-xs">
                        {formatRelative(u.lastLoginAt)}
                      </td>
                      <td className="px-6 py-3 text-gray-500 text-xs">{formatDate(u.createdAt)}</td>
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
      icon={<Sliders className="w-3.5 h-3.5 text-indigo-600" />}
      title="Platform settings"
      subtitle="Global values that apply to every account"
    >
      {loading || !settings ? (
        <CenterLoader />
      ) : settings.length === 0 ? (
        <p className="text-xs text-gray-400">No settings configured.</p>
      ) : (
        <div className="flex flex-col gap-5">
          {settings.map(s => {
            const meta = LABELS[s.key] ?? { title: s.key, description: '' };
            const dirty = draft[s.key] !== s.value;
            const isSaving = savingKey === s.key;
            return (
              <div
                key={s.key}
                className="bg-gray-50 border border-gray-200 rounded-lg p-4 flex flex-col gap-3"
              >
                <div>
                  <p className="text-sm font-semibold text-gray-900">{meta.title}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{meta.description}</p>
                  <p className="text-[10px] text-gray-400 mt-1 font-mono">
                    key: <span className="text-gray-500">{s.key}</span>
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
                    className="w-40 bg-white border border-gray-300 rounded-lg px-3.5 py-2 text-sm font-mono text-gray-900 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/15"
                  />
                  <button
                    onClick={() => save(s.key)}
                    disabled={!dirty || isSaving}
                    className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-white bg-indigo-600 rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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

// ─── Shared cards & primitives ────────────────────────────────────────────────

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
    indigo: 'bg-indigo-50 border-indigo-100 text-indigo-600',
    emerald: 'bg-emerald-50 border-emerald-100 text-emerald-600',
    blue: 'bg-blue-50 border-blue-100 text-blue-600',
    violet: 'bg-violet-50 border-violet-100 text-violet-600',
    amber: 'bg-amber-50 border-amber-100 text-amber-600',
  };
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4">
      <div className="flex items-center justify-between mb-3">
        <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest">{label}</p>
        <div className={`w-7 h-7 rounded-md flex items-center justify-center border ${tints[tint]}`}>
          <Icon className="w-3.5 h-3.5" />
        </div>
      </div>
      <p className="text-3xl font-bold text-gray-900 tabular-nums">{value.toLocaleString()}</p>
    </div>
  );
}

function RoleBadge({ role }: { role: UserRole }) {
  if (role === 'ADMIN') {
    return (
      <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide bg-indigo-50 border border-indigo-200 text-indigo-700 px-2 py-0.5 rounded-md">
        <Shield className="w-3 h-3" />
        Admin
      </span>
    );
  }
  return (
    <span className="text-[10px] font-bold uppercase tracking-wide bg-gray-100 border border-gray-200 text-gray-600 px-2 py-0.5 rounded-md">
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
      className={`bg-white border border-gray-200 rounded-xl overflow-hidden flex flex-col ${className ?? ''}`}
    >
      <header className="px-5 py-3.5 border-b border-gray-100 flex items-center gap-2.5">
        <div className="w-7 h-7 rounded-md bg-gray-50 border border-gray-200 flex items-center justify-center">
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-xs font-semibold text-gray-900 leading-none">{title}</h3>
          {subtitle && <p className="text-[10px] text-gray-500 mt-1 truncate">{subtitle}</p>}
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
              <span className="text-xs text-gray-700">{labels[s.stage]}</span>
              <span className="text-xs font-bold text-gray-900 tabular-nums">{s.count}</span>
            </div>
            <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
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
    return <p className="text-xs text-gray-400 p-4">No campaigns on this page.</p>;
  }
  return (
    <ol className="flex flex-col divide-y divide-gray-100">
      {campaigns.map((c, i) => (
        <li key={c.id} className="px-5 py-3.5 flex items-center gap-4">
          <span className="text-[10px] font-bold text-gray-400 w-5 tabular-nums">
            {String(i + 1).padStart(2, '0')}
          </span>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">{c.name}</p>
            <p className="text-[11px] text-gray-500 truncate">
              {c.jobTitle} · {c.owner.email}
            </p>
          </div>
          <div className="flex items-center gap-4 text-[11px] text-gray-500 tabular-nums shrink-0">
            <span>
              <span className="font-bold text-gray-900">{c.candidateCount}</span> candidates
            </span>
            <span>
              <span className="font-bold text-gray-900">{c.activityCount}</span> events
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
  };
  return (
    <div className="flex flex-col gap-3">
      {platforms.map(p => {
        const pct = (p.count / total) * 100;
        return (
          <div key={p.platform}>
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-gray-700">{p.platform}</span>
              <span className="text-xs text-gray-500">
                <span className="text-gray-900 font-bold tabular-nums">{p.count}</span>
                <span className="text-gray-400 ml-1">({pct.toFixed(0)}%)</span>
              </span>
            </div>
            <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
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
    return <p className="text-xs text-gray-400">No candidates scored yet.</p>;
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
                  isThreshold ? 'bg-emerald-500' : 'bg-indigo-400'
                } transition-all`}
                style={{ height: `${h}%` }}
              />
            </div>
            <span className="text-[9px] text-gray-400 mt-1 opacity-0 group-hover:opacity-100">
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
    return <p className="text-xs text-gray-400">No signups yet.</p>;
  }
  return (
    <ol className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
      {signups.map(s => (
        <li
          key={s.id}
          className="flex items-center gap-3 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2"
        >
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shrink-0">
            <span className="text-xs font-bold text-white">{s.name.charAt(0).toUpperCase()}</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-gray-900 truncate">{s.name}</p>
            <p className="text-[10px] text-gray-500 truncate">{s.email}</p>
          </div>
          <div className="flex flex-col items-end gap-0.5 shrink-0">
            <RoleBadge role={s.role} />
            <span className="text-[9px] text-gray-400">{formatRelative(s.createdAt)}</span>
          </div>
        </li>
      ))}
    </ol>
  );
}

function SystemActivityFeed({ events }: { events: AdminSystemEvent[] }) {
  if (events.length === 0) {
    return <p className="text-xs text-gray-400 p-4">No activity on this page.</p>;
  }
  return (
    <ol className="flex flex-col divide-y divide-gray-100">
      {events.map(e => (
        <li key={e.id} className="px-5 py-2.5 flex items-start gap-3">
          <ActivityDot type={e.type} />
          <div className="flex-1 min-w-0">
            <p className="text-xs text-gray-800">{e.message}</p>
            <p className="text-[10px] text-gray-500 mt-0.5 truncate">
              {e.campaign.name} · {e.owner.email}
              {e.candidateName ? ` · ${e.candidateName}` : ''}
            </p>
          </div>
          <span className="text-[10px] text-gray-400 shrink-0 whitespace-nowrap">
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
    RUNNING: 'bg-emerald-50 border-emerald-200 text-emerald-700',
    PAUSED: 'bg-amber-50 border-amber-200 text-amber-700',
    DRAFT: 'bg-gray-100 border-gray-200 text-gray-600',
    COMPLETED: 'bg-blue-50 border-blue-200 text-blue-700',
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
    SYSTEM: 'bg-indigo-500',
  } as const;
  return <span className={`w-1.5 h-1.5 rounded-full mt-1.5 shrink-0 ${colors[type]}`} />;
}

function CenterLoader() {
  return (
    <div className="flex items-center justify-center py-16">
      <Loader2 className="w-5 h-5 text-indigo-500 animate-spin" />
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
      <div className="bg-white border border-gray-200 rounded-2xl p-10 text-center text-sm text-gray-500">
        No Resend setup requests yet.
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-100 text-left text-[11px] uppercase tracking-wider text-gray-500">
            <th className="px-5 py-3 font-semibold">User</th>
            <th className="px-3 py-3 font-semibold">WhatsApp</th>
            <th className="px-3 py-3 font-semibold">Email / Domain</th>
            <th className="px-3 py-3 font-semibold">Status</th>
            <th className="px-3 py-3 font-semibold">Requested</th>
            <th className="px-5 py-3 font-semibold text-right">Action</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {requests.map(r => (
            <tr key={r.id}>
              <td className="px-5 py-3">
                <div className="font-semibold text-gray-900">{r.contactName}</div>
                <div className="text-[11px] text-gray-500">{r.user.email}</div>
              </td>
              <td className="px-3 py-3 text-gray-700">{r.whatsapp}</td>
              <td className="px-3 py-3">
                <div className="text-gray-900">{r.emailAccount}</div>
                <div className="text-[11px] text-gray-500">{r.domain}</div>
              </td>
              <td className="px-3 py-3">
                <span className={`text-[10.5px] font-semibold px-2 py-0.5 rounded-full border ${
                  r.status === 'CONFIGURED'
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    : r.status === 'REJECTED'
                      ? 'bg-red-50 text-red-700 border-red-200'
                      : 'bg-amber-50 text-amber-700 border-amber-200'
                }`}>{r.status}</span>
              </td>
              <td className="px-3 py-3 text-gray-500">{formatRelative(r.createdAt)}</td>
              <td className="px-5 py-3 text-right">
                <button onClick={() => setConfiguring(r)}
                  className="text-xs font-semibold text-indigo-700 hover:text-indigo-800">
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
      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl p-6 flex flex-col gap-4">
        <div>
          <h3 className="text-base font-bold text-gray-900">Configure Resend — {request.contactName}</h3>
          <p className="text-xs text-gray-500 mt-0.5">{request.user.email} · WhatsApp {request.whatsapp}</p>
        </div>
        {notice && (
          <div className="flex items-start gap-2 bg-indigo-50 border border-indigo-200 rounded-lg px-3 py-2">
            <CheckCircle2 className="w-4 h-4 text-indigo-500 mt-0.5 shrink-0" />
            <p className="text-sm text-indigo-800">{notice}</p>
          </div>
        )}
        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-gray-700 uppercase tracking-wide">From address *</label>
            <input value={fromAddress} onChange={e => setFromAddress(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30" />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-gray-700 uppercase tracking-wide">From name</label>
            <input value={fromName} onChange={e => setFromName(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30" />
          </div>
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-gray-700 uppercase tracking-wide">Resend API key (leave blank to keep)</label>
          <input type="password" value={resendApiKey} onChange={e => setResendApiKey(e.target.value)}
            placeholder="re_xxxxxxxxxxxxxxxx"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30" />
          <p className="text-[11px] text-gray-500">The from-address domain ({request.domain}) must be verified in your Resend account.</p>
        </div>
        <div className="flex items-center justify-end gap-3 pt-1">
          <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50">Close</button>
          <button onClick={handleSave} disabled={saving || testing}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-60">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save'}
          </button>
          <button onClick={handleTest} disabled={saving || testing}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:opacity-60">
            {testing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            Save &amp; send test
          </button>
        </div>
      </div>
    </div>
  );
}
