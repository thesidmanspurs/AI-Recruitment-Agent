import { useEffect, useState, type ReactNode } from 'react';
import {
  Loader2,
  AlertCircle,
  Shield,
  ShieldOff,
  Lock,
  Trash2,
  Pencil,
  Ban,
  CheckCircle2,
  Save,
  Briefcase,
  Activity,
} from 'lucide-react';
import { ApiError } from '../../api/client';
import { CenterModal, ConfirmModal } from '../shared/CenterModal';
import { adminApi, type AdminUserRow, type AdminUserBehavior } from '../../api/adminApi';
import type { AuthUser, UserRole } from '../../hooks/useAuth';

interface UserDetailModalProps {
  open: boolean;
  user: AdminUserRow | null;
  currentUser: AuthUser;
  onClose: () => void;
  /** Re-fetch the user list after any successful mutation. */
  onChanged: () => void;
}

type Action = null | 'block' | 'unblock' | 'delete' | 'reset-password';

export function UserDetailModal({
  open,
  user,
  currentUser,
  onClose,
  onChanged,
}: UserDetailModalProps) {
  const [behavior, setBehavior] = useState<AdminUserBehavior | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  // Edit fields (initialised when user changes)
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [limitOverride, setLimitOverride] = useState('');

  // Pending confirms
  const [confirm, setConfirm] = useState<Action>(null);
  const [blockReason, setBlockReason] = useState('');
  const [newPassword, setNewPassword] = useState('');

  // Hydrate when user changes
  useEffect(() => {
    if (!user) return;
    setName(user.name);
    setEmail(user.email);
    setLimitOverride(user.dailyLimitOverride == null ? '' : String(user.dailyLimitOverride));
    setError(null);
    setBlockReason('');
    setNewPassword('');
  }, [user?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // Load behavior on open
  useEffect(() => {
    if (!open || !user) return;
    setLoading(true);
    adminApi
      .getUserBehavior(user.id)
      .then(setBehavior)
      .catch(err => setError(err instanceof Error ? err.message : 'Failed to load behavior.'))
      .finally(() => setLoading(false));
  }, [open, user?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!user) return null;

  const isSelf = currentUser.id === user.id;
  const dirty =
    name !== user.name ||
    email !== user.email ||
    limitOverride !== (user.dailyLimitOverride == null ? '' : String(user.dailyLimitOverride));

  async function run<T>(fn: () => Promise<T>): Promise<T | null> {
    setBusy(true);
    setError(null);
    try {
      return await fn();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Action failed.');
      return null;
    } finally {
      setBusy(false);
    }
  }

  async function handleSaveEdit() {
    if (!user) return;
    const overrideValue =
      limitOverride.trim() === '' ? null : Number.parseInt(limitOverride, 10);
    if (overrideValue !== null && (!Number.isFinite(overrideValue) || overrideValue < 0)) {
      setError('Daily limit override must be a non-negative number, or blank.');
      return;
    }
    const ok = await run(() =>
      adminApi.updateUser(user.id, {
        name: name.trim(),
        email: email.trim(),
        dailyLimitOverride: overrideValue,
      })
    );
    if (ok) onChanged();
  }

  async function handleToggleRole() {
    if (!user) return;
    const next: UserRole = user.role === 'ADMIN' ? 'USER' : 'ADMIN';
    const ok = await run(() => adminApi.setRole(user.id, next));
    if (ok) onChanged();
  }

  async function handleSetBlocked(blocked: boolean) {
    if (!user) return;
    const ok = await run(() =>
      adminApi.setBlocked(user.id, blocked, blocked ? blockReason.trim() || undefined : undefined)
    );
    if (ok) {
      setBlockReason('');
      onChanged();
    }
  }

  async function handleResetPassword() {
    if (!user) return;
    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    const ok = await run(() => adminApi.resetPassword(user.id, newPassword));
    if (ok) {
      setNewPassword('');
      // Stay open so admin can share the new credentials.
    }
  }

  async function handleDelete() {
    if (!user) return;
    const ok = await run(() => adminApi.deleteUser(user.id));
    if (ok) {
      onChanged();
      onClose();
    }
  }

  return (
    <>
      <CenterModal
        open={open}
        onClose={onClose}
        title={user.name}
        subtitle={user.email}
        icon={
          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center">
            <span className="text-xs font-bold text-white">
              {user.name.charAt(0).toUpperCase()}
            </span>
          </div>
        }
        size="lg"
      >
        <div className="flex flex-col gap-6">
          {error && (
            <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-lg px-4 py-3">
              <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {/* Quick status badges */}
          <div className="flex items-center gap-2 flex-wrap">
            <RoleBadge role={user.role} />
            {user.isBlocked ? <BlockedBadge /> : <ActiveBadge />}
            {isSelf && (
              <span className="text-[10px] font-bold uppercase tracking-wide bg-amber-50 border border-amber-200 text-amber-700 px-2 py-0.5 rounded-md">
                You
              </span>
            )}
            <span className="text-[10px] text-gray-400 ml-auto">
              Joined {formatDate(user.createdAt)} · last login{' '}
              {user.lastLoginAt ? formatRelative(user.lastLoginAt) : 'never'}
            </span>
          </div>

          {/* ─── Edit profile ───────────────────────────────────────── */}
          <Section icon={<Pencil className="w-3.5 h-3.5 text-indigo-600" />} title="Profile">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <FormField label="Name">
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="w-full bg-white border border-gray-300 rounded-lg px-3.5 py-2 text-sm text-gray-900 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/15"
                />
              </FormField>
              <FormField label="Email">
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="w-full bg-white border border-gray-300 rounded-lg px-3.5 py-2 text-sm text-gray-900 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/15"
                />
              </FormField>
              <FormField
                label="Daily limit override"
                hint="Leave blank to inherit global daily_free_limit."
              >
                <input
                  type="number"
                  min={0}
                  value={limitOverride}
                  onChange={e => setLimitOverride(e.target.value)}
                  placeholder="(inherit)"
                  className="w-full bg-white border border-gray-300 rounded-lg px-3.5 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/15"
                />
              </FormField>
            </div>
            <div className="flex justify-end mt-1">
              <button
                onClick={handleSaveEdit}
                disabled={!dirty || busy}
                className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <Save className="w-4 h-4" />
                Save changes
              </button>
            </div>
          </Section>

          {/* ─── Role ───────────────────────────────────────────────── */}
          <Section icon={<Shield className="w-3.5 h-3.5 text-indigo-600" />} title="Role">
            <div className="flex items-center gap-3 flex-wrap">
              <p className="text-sm text-gray-700">
                Currently:{' '}
                <span className="font-semibold text-gray-900">{user.role}</span>
              </p>
              <button
                onClick={handleToggleRole}
                disabled={isSelf || busy}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-white border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                {user.role === 'ADMIN' ? (
                  <>
                    <ShieldOff className="w-3.5 h-3.5" />
                    Demote to User
                  </>
                ) : (
                  <>
                    <Shield className="w-3.5 h-3.5" />
                    Promote to Admin
                  </>
                )}
              </button>
              {isSelf && (
                <span className="text-[11px] text-gray-500">You cannot change your own role.</span>
              )}
            </div>
          </Section>

          {/* ─── Block / unblock ────────────────────────────────────── */}
          <Section
            icon={
              user.isBlocked ? (
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              ) : (
                <Ban className="w-3.5 h-3.5 text-amber-600" />
              )
            }
            title={user.isBlocked ? 'Blocked' : 'Account access'}
          >
            {user.isBlocked ? (
              <div className="flex flex-col gap-3">
                <p className="text-sm text-gray-700">
                  Blocked {user.blockedAt && `on ${formatDate(user.blockedAt)}`}
                  {user.blockedReason && (
                    <>
                      {' — '}
                      <span className="italic">"{user.blockedReason}"</span>
                    </>
                  )}
                </p>
                <button
                  onClick={() => handleSetBlocked(false)}
                  disabled={busy}
                  className="self-start flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-emerald-600 rounded-md hover:bg-emerald-700 disabled:opacity-50 transition-colors"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Unblock
                </button>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                <FormField label="Reason (optional)">
                  <input
                    type="text"
                    value={blockReason}
                    onChange={e => setBlockReason(e.target.value)}
                    placeholder="e.g. ToS violation"
                    className="w-full bg-white border border-gray-300 rounded-lg px-3.5 py-2 text-sm focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/15"
                  />
                </FormField>
                <div className="flex justify-end">
                  <button
                    onClick={() => setConfirm('block')}
                    disabled={isSelf || busy}
                    className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-amber-700 bg-amber-50 border border-amber-200 rounded-md hover:bg-amber-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    <Ban className="w-3.5 h-3.5" />
                    Block account
                  </button>
                </div>
              </div>
            )}
          </Section>

          {/* ─── Reset password ─────────────────────────────────────── */}
          <Section icon={<Lock className="w-3.5 h-3.5 text-indigo-600" />} title="Reset password">
            <div className="flex flex-col gap-3">
              <FormField label="New password" hint="At least 8 characters.">
                <input
                  type="text"
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  placeholder="Min. 8 characters"
                  className="w-full bg-white border border-gray-300 rounded-lg px-3.5 py-2 text-sm text-gray-900 placeholder-gray-400 font-mono focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/15"
                />
              </FormField>
              <div className="flex justify-end">
                <button
                  onClick={handleResetPassword}
                  disabled={busy || newPassword.length < 8}
                  className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-white bg-indigo-600 rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <Lock className="w-3.5 h-3.5" />
                  Reset password
                </button>
              </div>
            </div>
          </Section>

          {/* ─── Behavior summary ───────────────────────────────────── */}
          <Section
            icon={<Activity className="w-3.5 h-3.5 text-indigo-600" />}
            title="Behavior"
          >
            {loading ? (
              <div className="flex justify-center py-6">
                <Loader2 className="w-4 h-4 text-indigo-500 animate-spin" />
              </div>
            ) : behavior ? (
              <div className="flex flex-col gap-3">
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <Meta label="Joined" value={formatDate(behavior.user.createdAt)} />
                  <Meta label="Last login" value={formatRelative(behavior.user.lastLoginAt)} />
                </div>
                <div>
                  <h5 className="text-[10px] font-semibold text-gray-500 uppercase tracking-widest mb-2">
                    Campaigns ({behavior.campaigns.length})
                  </h5>
                  {behavior.campaigns.length === 0 ? (
                    <p className="text-xs text-gray-400">No campaigns yet.</p>
                  ) : (
                    <ul className="flex flex-col gap-1.5">
                      {behavior.campaigns.slice(0, 5).map(c => (
                        <li
                          key={c.id}
                          className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-md px-3 py-1.5 text-xs"
                        >
                          <Briefcase className="w-3 h-3 text-indigo-500 shrink-0" />
                          <span className="font-medium text-gray-900 truncate flex-1">
                            {c.name}
                          </span>
                          <span className="text-gray-500">{c.candidateCount} cand.</span>
                        </li>
                      ))}
                      {behavior.campaigns.length > 5 && (
                        <li className="text-[11px] text-gray-400 pl-1">
                          +{behavior.campaigns.length - 5} more
                        </li>
                      )}
                    </ul>
                  )}
                </div>
                <div>
                  <h5 className="text-[10px] font-semibold text-gray-500 uppercase tracking-widest mb-2">
                    Recent activity ({behavior.recentActivity.length})
                  </h5>
                  {behavior.recentActivity.length === 0 ? (
                    <p className="text-xs text-gray-400">No activity logged.</p>
                  ) : (
                    <ul className="flex flex-col gap-1.5 max-h-40 overflow-y-auto">
                      {behavior.recentActivity.slice(0, 10).map(a => (
                        <li
                          key={a.id}
                          className="bg-gray-50 border border-gray-200 rounded-md px-3 py-1.5"
                        >
                          <p className="text-xs text-gray-800">{a.message}</p>
                          <p className="text-[10px] text-gray-500 mt-0.5">
                            {a.candidateName ? `${a.candidateName} · ` : ''}
                            {formatRelative(a.timestamp)}
                          </p>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            ) : null}
          </Section>

          {/* ─── Danger zone ────────────────────────────────────────── */}
          <Section icon={<Trash2 className="w-3.5 h-3.5 text-red-600" />} title="Danger zone">
            <div className="flex items-center justify-between gap-3 bg-red-50 border border-red-200 rounded-lg px-4 py-3">
              <div className="min-w-0">
                <p className="text-sm font-semibold text-red-700">Delete this user</p>
                <p className="text-xs text-red-600 mt-0.5">
                  Removes the account plus every campaign, candidate, and activity log they own.
                  Cannot be undone.
                </p>
              </div>
              <button
                onClick={() => setConfirm('delete')}
                disabled={isSelf || busy}
                className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-white bg-red-600 rounded-md hover:bg-red-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors shrink-0"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Delete user
              </button>
            </div>
          </Section>
        </div>
      </CenterModal>

      <ConfirmModal
        open={confirm === 'block'}
        onClose={() => setConfirm(null)}
        onConfirm={() => handleSetBlocked(true)}
        title="Block this user?"
        message={
          <>
            <strong>{user.name}</strong> ({user.email}) will be unable to use the API until you
            unblock them. Their existing JWT becomes useless on the next request.
          </>
        }
        confirmLabel="Block"
        tone="danger"
      />
      <ConfirmModal
        open={confirm === 'delete'}
        onClose={() => setConfirm(null)}
        onConfirm={handleDelete}
        title="Delete this user?"
        message={
          <>
            This permanently removes <strong>{user.name}</strong> ({user.email}) and cascades to{' '}
            <strong>{user.campaignCount}</strong> campaign{user.campaignCount === 1 ? '' : 's'} and{' '}
            <strong>{user.candidateCount}</strong> candidate
            {user.candidateCount === 1 ? '' : 's'}. This cannot be undone.
          </>
        }
        confirmLabel="Delete"
        tone="danger"
      />
    </>
  );
}

function Section({
  icon,
  title,
  children,
}: {
  icon: ReactNode;
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        {icon}
        <h4 className="text-[11px] font-semibold text-gray-900 uppercase tracking-widest">
          {title}
        </h4>
      </div>
      {children}
    </div>
  );
}

function FormField({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-[11px] font-semibold text-gray-600 uppercase tracking-wider">
        {label}
      </label>
      {children}
      {hint && <p className="text-[11px] text-gray-500">{hint}</p>}
    </div>
  );
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-gray-50 border border-gray-200 rounded-md px-3 py-2">
      <p className="text-[10px] text-gray-500 uppercase tracking-wider">{label}</p>
      <p className="text-xs text-gray-700 mt-0.5">{value}</p>
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

function BlockedBadge() {
  return (
    <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide bg-red-50 border border-red-200 text-red-700 px-2 py-0.5 rounded-md">
      <Ban className="w-3 h-3" />
      Blocked
    </span>
  );
}

function ActiveBadge() {
  return (
    <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide bg-emerald-50 border border-emerald-200 text-emerald-700 px-2 py-0.5 rounded-md">
      <CheckCircle2 className="w-3 h-3" />
      Active
    </span>
  );
}

function formatDate(iso: string | Date): string {
  return new Date(iso).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
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
