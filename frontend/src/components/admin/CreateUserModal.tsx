import { useState, type FormEvent, type ReactNode } from 'react';
import { Loader2, UserPlus, AlertCircle } from 'lucide-react';
import { ApiError } from '../../api/client';
import { CenterModal } from '../shared/CenterModal';
import { adminApi } from '../../api/adminApi';
import type { UserRole } from '../../hooks/useAuth';

interface CreateUserModalProps {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
}

export function CreateUserModal({ open, onClose, onCreated }: CreateUserModalProps) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<UserRole>('USER');
  const [limitOverride, setLimitOverride] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function reset() {
    setName('');
    setEmail('');
    setPassword('');
    setRole('USER');
    setLimitOverride('');
    setError(null);
  }

  function close() {
    reset();
    onClose();
  }

  async function handleSubmit(e?: FormEvent) {
    e?.preventDefault();
    if (!name.trim() || !email.trim() || !password) {
      setError('Name, email, and password are required.');
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      const override = limitOverride.trim() === '' ? null : Number.parseInt(limitOverride, 10);
      if (override !== null && (!Number.isFinite(override) || override < 0)) {
        setError('Daily limit override must be a non-negative number, or blank.');
        return;
      }
      await adminApi.createUser({
        name: name.trim(),
        email: email.trim(),
        password,
        role,
        dailyLimitOverride: override,
      });
      onCreated();
      close();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to create user.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <CenterModal
      open={open}
      onClose={close}
      title="Create user"
      subtitle="Admin-only — credentials work immediately"
      icon={<UserPlus className="w-4 h-4 text-gray-700 dark:text-gray-300" />}
      size="md"
      footer={
        <>
          <button
            onClick={close}
            disabled={submitting}
            className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-white/5 border border-gray-300 dark:border-white/10 rounded-lg hover:bg-gray-50 dark:hover:bg-white/10 disabled:opacity-60 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => handleSubmit()}
            disabled={submitting}
            className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-black dark:bg-gray-800 rounded-lg hover:bg-gray-800 dark:hover:bg-gray-700 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
          >
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Creating…
              </>
            ) : (
              <>
                <UserPlus className="w-4 h-4" />
                Create user
              </>
            )}
          </button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {error && (
          <div className="flex items-start gap-3 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-400/20 rounded-lg px-4 py-3">
            <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
            <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
          </div>
        )}

        <FormField label="Full name" required>
          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="Jane Smith"
            required
            className="w-full bg-white dark:bg-[#0a0c12] border border-gray-300 dark:border-white/10 rounded-lg px-3.5 py-2 text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder:text-gray-600 focus:outline-none focus:border-gray-900 dark:focus:border-gray-400 focus:ring-2 focus:ring-gray-900/10"
          />
        </FormField>

        <FormField label="Email address" required>
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="user@company.com"
            required
            className="w-full bg-white dark:bg-[#0a0c12] border border-gray-300 dark:border-white/10 rounded-lg px-3.5 py-2 text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder:text-gray-600 focus:outline-none focus:border-gray-900 dark:focus:border-gray-400 focus:ring-2 focus:ring-gray-900/10"
          />
        </FormField>

        <FormField label="Initial password" required hint="At least 8 characters.">
          <input
            type="text"
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="Min. 8 characters"
            required
            className="w-full bg-white dark:bg-[#0a0c12] border border-gray-300 dark:border-white/10 rounded-lg px-3.5 py-2 text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder:text-gray-600 font-mono focus:outline-none focus:border-gray-900 dark:focus:border-gray-400 focus:ring-2 focus:ring-gray-900/10"
          />
        </FormField>

        <div className="grid grid-cols-2 gap-3">
          <FormField label="Role">
            <select
              value={role}
              onChange={e => setRole(e.target.value as UserRole)}
              className="w-full bg-white dark:bg-[#0a0c12] border border-gray-300 dark:border-white/10 rounded-lg px-3 py-2 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:border-gray-900 dark:focus:border-gray-400 focus:ring-2 focus:ring-gray-900/10"
            >
              <option value="USER">User</option>
              <option value="ADMIN">Admin</option>
            </select>
          </FormField>
          <FormField label="Daily limit override" hint="Leave blank to inherit global default.">
            <input
              type="number"
              min={0}
              value={limitOverride}
              onChange={e => setLimitOverride(e.target.value)}
              placeholder="(inherit)"
              className="w-full bg-white dark:bg-[#0a0c12] border border-gray-300 dark:border-white/10 rounded-lg px-3.5 py-2 text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder:text-gray-600 focus:outline-none focus:border-gray-900 dark:focus:border-gray-400 focus:ring-2 focus:ring-gray-900/10"
            />
          </FormField>
        </div>
      </form>
    </CenterModal>
  );
}

function FormField({
  label,
  required,
  hint,
  children,
}: {
  label: string;
  required?: boolean;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-[11px] font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      {children}
      {hint && <p className="text-[11px] text-gray-500 dark:text-gray-400">{hint}</p>}
    </div>
  );
}
