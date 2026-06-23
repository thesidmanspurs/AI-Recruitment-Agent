import { useState, type FormEvent, type ReactNode } from 'react';
import { Mail, Lock, User, ArrowRight, Loader2, AlertCircle, Flame, ShoppingCart } from 'lucide-react';
import { ApiError } from '../api/client';

type Mode = 'login' | 'register';

interface AuthPageProps {
  mode: Mode;
  onLogin: (email: string, password: string) => Promise<void>;
  onRegister: (name: string, email: string, password: string) => Promise<void>;
  onNavigate: (to: string) => void;
  /** When the user arrived mid-purchase, show what they'll continue to. */
  pendingLabel?: string | null;
}

export function AuthPage({ mode, onLogin, onRegister, onNavigate, pendingLabel }: AuthPageProps) {
  const isRegister = mode === 'register';
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (isRegister && password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    setLoading(true);
    try {
      if (isRegister) await onRegister(name.trim(), email.trim(), password);
      else await onLogin(email.trim(), password);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  function signInWithGoogle() {
    const apiBase = import.meta.env.VITE_API_BASE_URL ?? '';
    window.location.href = `${apiBase}/api/auth/google`;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0a0c12] text-gray-800 dark:text-gray-200 font-sans flex flex-col items-center justify-center px-4 relative overflow-hidden transition-colors">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[420px] bg-[radial-gradient(ellipse_60%_60%_at_50%_-10%,rgba(99,91,255,0.12),transparent)] dark:bg-[radial-gradient(ellipse_60%_60%_at_50%_-10%,rgba(99,91,255,0.18),transparent)]" />

      <button onClick={() => onNavigate('/')} className="relative z-10 flex items-center gap-3 mb-8">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-900/40">
          <Flame className="w-5 h-5 text-white" />
        </div>
        <span className="text-gray-900 dark:text-white font-extrabold tracking-tight text-lg">ARIES</span>
      </button>

      <div className="relative z-10 w-full max-w-md">
        <div className="absolute -inset-0.5 bg-gradient-to-br from-indigo-500/25 to-violet-600/5 rounded-3xl blur-xl" />
        <div className="relative rounded-3xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#10131c]/90 backdrop-blur p-7 shadow-xl dark:shadow-2xl">
          {pendingLabel && (
            <div className="mb-5 flex items-start gap-2.5 rounded-xl border border-indigo-300 dark:border-indigo-400/20 bg-indigo-50 dark:bg-indigo-500/10 px-4 py-3">
              <ShoppingCart className="w-4 h-4 text-indigo-500 dark:text-indigo-300 mt-0.5 shrink-0" />
              <p className="text-[13px] text-indigo-700 dark:text-indigo-200">
                {isRegister ? 'Create your account' : 'Sign in'} to continue to your{' '}
                <strong className="text-indigo-900 dark:text-white">{pendingLabel}</strong> — you'll go straight to secure checkout.
              </p>
            </div>
          )}

          <h1 className="text-xl font-bold text-gray-900 dark:text-white text-center">
            {isRegister ? 'Create your account' : 'Welcome back'}
          </h1>
          <p className="text-[13px] text-gray-500 dark:text-gray-500 text-center mt-1.5 mb-6">
            {isRegister ? 'Start sourcing candidates in minutes.' : 'Sign in to your recruiter workspace.'}
          </p>

          <button
            type="button"
            onClick={signInWithGoogle}
            className="w-full flex items-center justify-center gap-2.5 bg-white hover:bg-gray-50 dark:bg-white dark:hover:bg-gray-100 text-gray-800 font-semibold text-sm rounded-xl py-3 border border-gray-200 dark:border-transparent transition-colors shadow-sm"
          >
            <GoogleMark /> Continue with Google
          </button>

          <div className="flex items-center gap-3 my-5">
            <div className="h-px flex-1 bg-gray-200 dark:bg-white/10" />
            <span className="text-[10px] font-bold tracking-[0.15em] text-gray-400 dark:text-gray-500 uppercase">or</span>
            <div className="h-px flex-1 bg-gray-200 dark:bg-white/10" />
          </div>

          {error && (
            <div className="mb-4 flex items-start gap-2 text-[12px] text-red-600 dark:text-red-300 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-lg px-3 py-2">
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" /> <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {isRegister && (
              <AuthField label="Full name" icon={<User className="w-4 h-4" />} type="text"
                value={name} onChange={setName} placeholder="Jane Smith" required />
            )}
            <AuthField label="Email" icon={<Mail className="w-4 h-4" />} type="email"
              value={email} onChange={setEmail} placeholder="you@company.com" required />
            <AuthField label="Password" icon={<Lock className="w-4 h-4" />} type="password"
              value={password} onChange={setPassword}
              placeholder={isRegister ? 'Min. 8 characters' : 'Your password'} required />

            <button
              type="submit" disabled={loading}
              className="mt-1 w-full flex items-center justify-center gap-2 bg-gradient-to-br from-indigo-500 to-violet-600 hover:from-indigo-400 hover:to-violet-500 text-white font-semibold text-sm rounded-xl py-3 transition-colors disabled:opacity-60"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" />
                : <>{isRegister ? 'Create account' : 'Sign in'} <ArrowRight className="w-4 h-4" /></>}
            </button>
          </form>

          <p className="text-center text-[13px] text-gray-500 dark:text-gray-500 mt-6">
            {isRegister ? 'Already have an account?' : "Don't have an account?"}{' '}
            <button
              onClick={() => onNavigate(isRegister ? '/login' : '/register')}
              className="text-indigo-600 hover:text-indigo-500 dark:text-indigo-300 dark:hover:text-indigo-200 font-medium"
            >
              {isRegister ? 'Sign in' : 'Create one'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}

function AuthField({
  label, icon, type, value, onChange, placeholder, required,
}: {
  label: string; icon: ReactNode; type: string;
  value: string; onChange: (v: string) => void; placeholder?: string; required?: boolean;
}) {
  return (
    <label className="block">
      <span className="block text-[10px] font-bold tracking-[0.1em] text-indigo-600 dark:text-indigo-300 uppercase mb-1.5">{label}</span>
      <div className="relative">
        <input
          type={type} value={value} onChange={e => onChange(e.target.value)}
          placeholder={placeholder} required={required}
          className="w-full bg-gray-50 dark:bg-[#0a0c12] border border-gray-300 dark:border-white/10 rounded-xl pl-3.5 pr-10 py-2.5 text-sm text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/40 transition-colors"
        />
        <span className="text-gray-400 dark:text-gray-600 absolute right-3 top-1/2 -translate-y-1/2">{icon}</span>
      </div>
    </label>
  );
}

function GoogleMark() {
  return (
    <svg className="w-4 h-4" viewBox="0 0 24 24" aria-hidden="true">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.27-4.74 3.27-8.1Z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23Z" />
      <path fill="#FBBC05" d="M5.84 14.1a6.6 6.6 0 0 1 0-4.2V7.06H2.18a11 11 0 0 0 0 9.88l3.66-2.84Z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38Z" />
    </svg>
  );
}
