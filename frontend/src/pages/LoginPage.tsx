import { useState, type FormEvent, type ReactNode } from 'react';
import { Mail, Lock, ArrowRight, Loader2, AlertCircle, Sparkles, Zap, Bell } from 'lucide-react';
import { ApiError } from '../api/client';

interface LoginPageProps {
  onLogin: (email: string, password: string) => Promise<void>;
  onSwitchToRegister: () => void;
}

export function LoginPage({ onLogin, onSwitchToRegister }: LoginPageProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await onLogin(email, password);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell
      heading={
        <>
          Autonomous talent
          <br />
          sourcing at scale.
        </>
      }
      tagline="End-to-end AI pipeline from job spec ingestion to personalised outreach — no manual effort required."
    >
      <div className="w-full max-w-sm">
        <BrandMobile />

        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">Welcome back</h2>
        <p className="text-sm text-gray-500 dark:text-slate-400 mb-8">Sign in to your account to continue</p>

        {error && (
          <div className="flex items-start gap-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/40 rounded-lg px-4 py-3 mb-6">
            <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
            <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Field
            label="Email address"
            icon={<Mail className="w-4 h-4 text-gray-400 dark:text-slate-500" />}
            type="email"
            value={email}
            onChange={setEmail}
            placeholder="you@company.com"
            required
          />
          <Field
            label="Password"
            icon={<Lock className="w-4 h-4 text-gray-400 dark:text-slate-500" />}
            type="password"
            value={password}
            onChange={setPassword}
            placeholder="••••••••"
            required
          />

          <button
            type="submit"
            disabled={loading}
            className="mt-2 w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold rounded-lg px-4 py-2.5 text-sm shadow-sm shadow-indigo-600/20 transition-colors"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                Sign in
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <p className="text-center text-sm text-gray-500 dark:text-slate-400 mt-6">
          Don't have an account?{' '}
          <button
            onClick={onSwitchToRegister}
            className="text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300 font-medium transition-colors"
          >
            Create one
          </button>
        </p>
      </div>
    </AuthShell>
  );
}

// ─── Shared auth shell (re-used by RegisterPage) ──────────────────────────────

interface AuthShellProps {
  heading: ReactNode;
  tagline: string;
  children: ReactNode;
}

export function AuthShell({ heading, tagline, children }: AuthShellProps) {
  return (
    <div className="min-h-screen bg-[#f3f4f8] dark:bg-[#0B0F19] flex font-sans transition-colors">
      {/* Left brand panel */}
      <div className="hidden lg:flex lg:w-[45%] flex-col justify-between p-12 bg-white dark:bg-slate-900/80 border-r border-gray-200 dark:border-slate-800 relative overflow-hidden transition-colors">
        {/* Soft background accents */}
        <div className="absolute -top-32 -left-32 w-96 h-96 bg-indigo-100/40 dark:bg-indigo-900/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-violet-100/40 dark:bg-violet-900/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center shadow-sm shadow-indigo-600/20">
            <span className="text-base font-extrabold text-white">A</span>
          </div>
          <span className="text-gray-900 dark:text-white font-bold text-lg tracking-tight">
            ARIES
          </span>
        </div>

        <div className="relative">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white leading-tight mb-4">{heading}</h1>
          <p className="text-gray-600 dark:text-slate-400 text-base leading-relaxed mb-10">{tagline}</p>

          <div className="flex flex-col gap-4">
            {[
              {
                icon: <Sparkles className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />,
                label: 'AI-powered candidate scoring',
                sub: 'Gemini semantic matching with 9.5+ threshold',
              },
              {
                icon: <Zap className="w-4 h-4 text-violet-600 dark:text-violet-400" />,
                label: 'Apollo contact enrichment',
                sub: 'Direct email & phone for approved candidates',
              },
              {
                icon: <Bell className="w-4 h-4 text-amber-500" />,
                label: '48h smart follow-up alerts',
                sub: 'Automatic recruiter notifications on no-response',
              },
            ].map(f => (
              <div key={f.label} className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 flex items-center justify-center mt-0.5 shrink-0 shadow-sm">
                  {f.icon}
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">{f.label}</p>
                  <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">{f.sub}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <p className="relative text-xs text-gray-400 dark:text-slate-500">© 2026 ARIES</p>
      </div>

      {/* Right form panel */}
      <div className="flex-1 flex items-center justify-center p-6">{children}</div>
    </div>
  );
}

function BrandMobile() {
  return (
    <div className="flex lg:hidden items-center gap-3 mb-10 justify-center">
      <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center">
        <span className="text-base font-extrabold text-white">A</span>
      </div>
      <span className="text-gray-900 dark:text-white font-bold text-lg">ARIES</span>
    </div>
  );
}

interface FieldProps {
  label: string;
  icon: ReactNode;
  type: string;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  required?: boolean;
  hint?: string;
}

export function Field({
  label,
  icon,
  type,
  value,
  onChange,
  placeholder,
  required,
  hint,
}: FieldProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-[11px] font-semibold text-gray-600 dark:text-slate-400 uppercase tracking-wider">
        {label}
      </label>
      <div className="relative">
        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none">
          {icon}
        </span>
        <input
          type={type}
          required={required}
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full bg-white dark:bg-slate-900 border border-gray-300 dark:border-slate-700 text-gray-900 dark:text-slate-100 placeholder-gray-400 dark:placeholder:text-slate-500 rounded-lg pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/15 transition-colors"
        />
      </div>
      {hint && <p className="text-[11px] text-gray-500 dark:text-slate-400">{hint}</p>}
    </div>
  );
}

export { BrandMobile };
