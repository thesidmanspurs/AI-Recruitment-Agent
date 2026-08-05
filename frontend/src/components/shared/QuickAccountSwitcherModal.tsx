import { useState, type FormEvent } from 'react';
import { UserCheck, KeyRound, Mail, Lock, ArrowRight, Sparkles, Trophy, Shield } from 'lucide-react';
import { CenterModal } from './CenterModal';
import { authApi } from '../../api/authApi';
import { useToast } from './Toast';

interface AccountOption {
  email: string;
  password: string;
  name: string;
  badge: string;
  icon: 'pro' | 'ranking' | 'admin';
}

const PRESET_HELPERS: AccountOption[] = [
  {
    email: 'pro.user@talentscanr.com',
    password: 'Password123!',
    name: 'Pro Tester',
    badge: 'Pro Plan',
    icon: 'pro',
  },
  {
    email: 'ranking.user@talentscanr.com',
    password: 'Password123!',
    name: 'Ranking Tester',
    badge: 'Ranking Plan',
    icon: 'ranking',
  },
  {
    email: 'admin@talentscanr.com',
    password: 'Admin@123456',
    name: 'System Admin',
    badge: 'Admin',
    icon: 'admin',
  },
];

interface QuickAccountSwitcherModalProps {
  open: boolean;
  onClose: () => void;
  currentEmail?: string;
  onSwitched?: () => void;
}

export function QuickAccountSwitcherModal({
  open,
  onClose,
  currentEmail,
  onSwitched,
}: QuickAccountSwitcherModalProps) {
  const toast = useToast();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const fillCredentials = (acc: AccountOption) => {
    setEmail(acc.email);
    setPassword(acc.password);
  };

  const handleLoginSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      toast.push({
        title: 'Input Required',
        body: 'Please enter both email and password to switch account.',
        tone: 'warning',
      });
      return;
    }

    setLoading(true);
    try {
      await authApi.login({ email: email.trim(), password });
      toast.push({
        title: 'Account Switched Successfully',
        body: `Logged in as ${email.trim()}`,
        tone: 'success',
      });
      onClose();
      if (onSwitched) {
        onSwitched();
      } else {
        window.location.reload();
      }
    } catch (err) {
      toast.push({
        title: 'Authentication Failed',
        body: err instanceof Error ? err.message : 'Invalid email or password',
        tone: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <CenterModal
      open={open}
      onClose={onClose}
      title="Switch Account Login"
      subtitle="Enter your account credentials below to sign in & switch session"
      size="md"
      icon={<UserCheck className="w-5 h-5 text-gray-900 dark:text-white" />}
    >
      <div className="space-y-6">
        {/* Currently active user info */}
        {currentEmail && (
          <div className="px-3.5 py-2.5 rounded-xl bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 flex items-center justify-between text-xs">
            <span className="text-gray-500 dark:text-gray-400">Currently logged in:</span>
            <span className="font-bold text-gray-900 dark:text-white truncate max-w-[220px]">{currentEmail}</span>
          </div>
        )}

        {/* Quick autofill helper chips */}
        <div>
          <label className="block text-[11px] font-bold text-gray-400 dark:text-gray-400 uppercase tracking-wider mb-2">
            Quick Fill Test Credentials:
          </label>
          <div className="grid grid-cols-3 gap-2">
            {PRESET_HELPERS.map(acc => (
              <button
                key={acc.email}
                type="button"
                onClick={() => fillCredentials(acc)}
                className="p-2.5 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 hover:bg-gray-100 dark:hover:bg-white/10 text-left transition-all group"
              >
                <div className="flex items-center gap-1.5 mb-1">
                  {acc.icon === 'pro' && <Sparkles className="w-3.5 h-3.5 text-emerald-500" />}
                  {acc.icon === 'ranking' && <Trophy className="w-3.5 h-3.5 text-amber-500" />}
                  {acc.icon === 'admin' && <Shield className="w-3.5 h-3.5 text-indigo-500" />}
                  <span className="font-bold text-xs text-gray-900 dark:text-white truncate">{acc.name}</span>
                </div>
                <span className="text-[10px] text-gray-400 dark:text-gray-500 font-mono block truncate">
                  {acc.badge}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Formal Login Form */}
        <form onSubmit={handleLoginSubmit} className="space-y-4 pt-2 border-t border-gray-100 dark:border-white/10">
          <div>
            <label className="block text-xs font-bold text-gray-700 dark:text-gray-200 mb-1.5">
              Email Address
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
              <input
                type="email"
                required
                placeholder="name@company.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 text-xs rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:border-gray-400 dark:focus:border-white/30 transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 dark:text-gray-200 mb-1.5">
              Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
              <input
                type="password"
                required
                placeholder="••••••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 text-xs rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:border-gray-400 dark:focus:border-white/30 transition-colors"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || !email.trim() || !password}
            className="w-full py-3 rounded-xl bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-extrabold text-xs flex items-center justify-center gap-2 hover:bg-gray-800 dark:hover:bg-gray-100 disabled:opacity-50 transition-all shadow-md mt-2"
          >
            {loading ? (
              <div className="w-4 h-4 rounded-full border-2 border-current border-t-transparent animate-spin" />
            ) : (
              <>
                <KeyRound className="w-4 h-4" />
                <span>Log In & Switch Account</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>
      </div>
    </CenterModal>
  );
}
