import { useState, type FormEvent, type ReactNode } from 'react';
import { Mail, Lock, User, ArrowRight, Loader2, AlertCircle, Eye, EyeOff, Check } from 'lucide-react';
import { ApiError } from '../api/client';
import logoSrc from '../public/logo.png';

type Mode = 'login' | 'register';

interface AuthPageProps {
  mode: Mode;
  onLogin: (email: string, password: string) => Promise<void>;
  onRegister: (name: string, email: string, password: string) => Promise<void>;
  onNavigate: (to: string) => void;
  /** When the user arrived mid-purchase, show what they'll continue to. */
  pendingLabel?: string | null;
}

const PERKS = [
  'Source across LinkedIn, GitHub & Reddit',
  'AI fit scoring + Gemini-drafted outreach',
  'Free to source & score — pay only per reveal',
];

export function AuthPage({ mode, onLogin, onRegister, onNavigate, pendingLabel }: AuthPageProps) {
  const isRegister = mode === 'register';
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
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
    <div className="min-h-screen w-full flex flex-col items-center justify-center px-5 py-12 relative overflow-hidden bg-white text-gray-900"
      style={{ fontFamily: "'Inter', sans-serif" }}>

      {/* Light editorial background — dot pattern + violet glow, matching LandingPage */}
      <style>{`
        .auth-dots {
          background-image: radial-gradient(circle, #d8dae0 1px, transparent 1px);
          background-size: 26px 26px;
        }
      `}</style>
      <div className="auth-dots absolute inset-0 pointer-events-none opacity-60" />
      <div className="absolute inset-x-0 top-0 h-[480px] pointer-events-none"
        style={{ backgroundImage: 'radial-gradient(ellipse 55% 60% at 50% -10%, rgba(124,58,237,0.12), transparent)' }} />

      {/* Logo */}
      <button onClick={() => onNavigate('/')} className="relative z-10 mb-8">
        <img src={logoSrc} alt="TalentScanr" className="h-12 w-auto" />
      </button>

      <div className="relative z-10 w-full max-w-[420px]">
        {/* soft violet halo behind the card */}
        <div className="absolute -inset-1 rounded-[28px] blur-2xl pointer-events-none"
          style={{ background: 'linear-gradient(135deg, rgba(124,58,237,0.18), rgba(99,102,241,0.06))' }} />

        <div className="relative rounded-3xl border border-gray-200 bg-white/95 backdrop-blur shadow-xl shadow-violet-100/40 p-8">

          {pendingLabel && (
            <div className="mb-6 flex items-start gap-2.5 rounded-xl border border-violet-200 bg-violet-50 px-4 py-3">
              <ShoppingBagIcon />
              <p className="text-[13px] text-violet-900">
                {isRegister ? 'Create your account' : 'Sign in'} to continue to your{' '}
                <strong className="font-semibold">{pendingLabel}</strong> — you'll go straight to secure checkout.
              </p>
            </div>
          )}

          <div className="text-center mb-7">
            <h1 className="text-4xl font-normal text-gray-900 mb-2" style={{ fontFamily: "'DM Serif Display', serif" }}>
              {isRegister ? 'Create your account' : 'Welcome back'}
            </h1>
            <p className="text-[14px] text-gray-500">
              {isRegister ? 'Start sourcing candidates in minutes.' : 'Sign in to your recruiter workspace.'}
            </p>
          </div>

          <button
            type="button"
            onClick={signInWithGoogle}
            className="w-full flex items-center justify-center gap-2.5 bg-white hover:bg-gray-50 text-gray-800 font-semibold text-[14px] rounded-xl py-3 border border-gray-200 hover:border-gray-300 transition-colors shadow-sm"
          >
            <GoogleMark /> Continue with Google
          </button>

          <div className="flex items-center gap-3 my-6">
            <div className="h-px flex-1 bg-gray-200" />
            <span className="text-[10px] font-bold tracking-[0.15em] text-gray-400 uppercase">or with email</span>
            <div className="h-px flex-1 bg-gray-200" />
          </div>

          {error && (
            <div className="mb-4 flex items-start gap-2 text-[12px] text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2.5">
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" /> <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {isRegister && (
              <AuthField label="Full name" icon={<User className="w-4 h-4" />} type="text"
                value={name} onChange={setName} placeholder="Jane Smith" required autoFocus />
            )}
            <AuthField label="Email" icon={<Mail className="w-4 h-4" />} type="email"
              value={email} onChange={setEmail} placeholder="you@company.com" required autoFocus={!isRegister} />

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="block text-[10px] font-bold tracking-[0.1em] text-gray-500 uppercase">Password</span>
                {!isRegister && (
                  <button type="button" className="text-[11px] font-medium text-violet-600 hover:text-violet-700">
                    Forgot?
                  </button>
                )}
              </div>
              <div className="relative">
                <span className="text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2"><Lock className="w-4 h-4" /></span>
                <input
                  type={showPw ? 'text' : 'password'} value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder={isRegister ? 'Min. 8 characters' : 'Your password'} required
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-10 pr-10 py-2.5 text-[14px] text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100 focus:bg-white transition-all"
                />
                <button type="button" onClick={() => setShowPw(s => !s)}
                  className="text-gray-400 hover:text-gray-600 absolute right-3 top-1/2 -translate-y-1/2">
                  {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit" disabled={loading}
              className="mt-1 w-full flex items-center justify-center gap-2 text-white font-semibold text-[14px] rounded-xl py-3.5 transition-all disabled:opacity-60"
              style={{ background: 'linear-gradient(135deg, #7c3aed, #6366f1)', boxShadow: '0 4px 16px rgba(124,58,237,0.3)' }}
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" />
                : <>{isRegister ? 'Create account' : 'Sign in'} <ArrowRight className="w-4 h-4" /></>}
            </button>
          </form>

          <p className="text-center text-[13px] text-gray-500 mt-7">
            {isRegister ? 'Already have an account?' : "Don't have an account?"}{' '}
            <button
              onClick={() => onNavigate(isRegister ? '/login' : '/register')}
              className="text-violet-600 hover:text-violet-700 font-semibold"
            >
              {isRegister ? 'Sign in' : 'Create one free'}
            </button>
          </p>
        </div>

        {/* perks strip under the card — editorial light tone */}
        <div className="relative mt-6 flex flex-col gap-2">
          {PERKS.map(p => (
            <div key={p} className="flex items-center gap-2.5 justify-center text-[12.5px] text-gray-500">
              <Check className="w-3.5 h-3.5 text-violet-500 shrink-0" />
              {p}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function AuthField({
  label, icon, type, value, onChange, placeholder, required, autoFocus,
}: {
  label: string; icon: ReactNode; type: string;
  value: string; onChange: (v: string) => void; placeholder?: string; required?: boolean; autoFocus?: boolean;
}) {
  return (
    <label className="block">
      <span className="block text-[10px] font-bold tracking-[0.1em] text-gray-500 uppercase mb-1.5">{label}</span>
      <div className="relative">
        <span className="text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2">{icon}</span>
        <input
          type={type} value={value} onChange={e => onChange(e.target.value)}
          placeholder={placeholder} required={required} autoFocus={autoFocus}
          className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-10 pr-3.5 py-2.5 text-[14px] text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100 focus:bg-white transition-all"
        />
      </div>
    </label>
  );
}

function ShoppingBagIcon() {
  return (
    <svg className="w-4 h-4 text-violet-600 mt-0.5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" /><path d="M3 6h18" /><path d="M16 10a4 4 0 0 1-8 0" />
    </svg>
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
