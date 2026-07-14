import { useState, type FormEvent, type ReactNode } from 'react';
import { Mail, Lock, User, ArrowRight, Loader2, AlertCircle, Eye, EyeOff, Check, ShoppingBag } from 'lucide-react';
import { ApiError } from '../api/client';
const logoSrc = '/logo.png'; // served from frontend/public/logo.png

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
    <div className="min-h-screen w-full flex bg-white text-gray-900" style={{ fontFamily: "'Inter', sans-serif" }}>

      {/* ── LEFT: black brand panel (desktop only) ─────────────────────────── */}
      <aside className="hidden lg:flex w-[46%] max-w-[620px] relative overflow-hidden bg-[#0a0a0a] text-white flex-col justify-between p-12">
        {/* faint dot grid */}
        <div className="absolute inset-0 pointer-events-none opacity-[0.07]"
          style={{ backgroundImage: 'radial-gradient(circle, #ffffff 1px, transparent 1px)', backgroundSize: '26px 26px' }} />
        {/* soft top glow */}
        <div className="absolute inset-x-0 top-0 h-[420px] pointer-events-none"
          style={{ backgroundImage: 'radial-gradient(ellipse 60% 60% at 30% -10%, rgba(255,255,255,0.10), transparent)' }} />

        <button onClick={() => onNavigate('/')} className="relative z-10 self-start">
          <img src={logoSrc} alt="TalentScanr" className="h-11 w-auto brightness-0 invert" />
        </button>

        <div className="relative z-10 max-w-md">
          <h2 className="text-[42px] leading-[1.1] font-normal tracking-tight" style={{ fontFamily: "'DM Serif Display', serif" }}>
            Find the people<br />others can’t.
          </h2>
          <p className="mt-5 text-[15px] leading-relaxed text-gray-400">
            AI sourcing across LinkedIn, GitHub and Reddit — scored, ranked, and ready to reach out.
          </p>
          <div className="mt-9 flex flex-col gap-3.5">
            {PERKS.map(p => (
              <div key={p} className="flex items-center gap-3 text-[13.5px] text-gray-300">
                <span className="w-5 h-5 rounded-full bg-white/10 border border-white/15 flex items-center justify-center shrink-0">
                  <Check className="w-3 h-3 text-white" />
                </span>
                {p}
              </div>
            ))}
          </div>
        </div>

        <p className="relative z-10 text-[11px] text-gray-600">© 2026 TalentScanr · AI Talent Sourcing</p>
      </aside>

      {/* ── RIGHT: form panel ──────────────────────────────────────────────── */}
      <main className="flex-1 flex flex-col items-center justify-center px-5 py-12 relative">
        {/* subtle dot grid on the light side too */}
        <div className="absolute inset-0 pointer-events-none opacity-[0.5] lg:hidden"
          style={{ backgroundImage: 'radial-gradient(circle, #e5e7eb 1px, transparent 1px)', backgroundSize: '26px 26px' }} />

        {/* mobile logo (left panel hidden) */}
        <button onClick={() => onNavigate('/')} className="lg:hidden relative z-10 mb-8">
          <img src={logoSrc} alt="TalentScanr" className="h-11 w-auto" />
        </button>

        <div className="relative z-10 w-full max-w-[400px]">
          {pendingLabel && (
            <div className="mb-6 flex items-start gap-2.5 rounded-xl border border-gray-200 bg-gray-50 px-4 py-3">
              <ShoppingBag className="w-4 h-4 text-gray-900 mt-0.5 shrink-0" />
              <p className="text-[13px] text-gray-700">
                {isRegister ? 'Create your account' : 'Sign in'} to continue to your{' '}
                <strong className="font-semibold text-gray-900">{pendingLabel}</strong> — you’ll go straight to secure checkout.
              </p>
            </div>
          )}

          <div className="mb-7">
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
            className="w-full flex items-center justify-center gap-2.5 bg-white hover:bg-gray-50 text-gray-800 font-semibold text-[14px] rounded-xl py-3 border border-gray-300 hover:border-gray-400 transition-colors"
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
                  <button type="button" className="text-[11px] font-medium text-gray-500 hover:text-gray-900">
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
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-10 pr-10 py-2.5 text-[14px] text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-gray-900 focus:ring-2 focus:ring-gray-900/10 focus:bg-white transition-all"
                />
                <button type="button" onClick={() => setShowPw(s => !s)}
                  className="text-gray-400 hover:text-gray-700 absolute right-3 top-1/2 -translate-y-1/2">
                  {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit" disabled={loading}
              className="mt-1 w-full flex items-center justify-center gap-2 text-white font-semibold text-[14px] rounded-xl py-3.5 bg-black hover:bg-gray-800 transition-colors disabled:opacity-60"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" />
                : <>{isRegister ? 'Create account' : 'Sign in'} <ArrowRight className="w-4 h-4" /></>}
            </button>
          </form>

          <p className="text-[13px] text-gray-500 mt-7">
            {isRegister ? 'Already have an account?' : "Don't have an account?"}{' '}
            <button
              onClick={() => onNavigate(isRegister ? '/login' : '/register')}
              className="text-gray-900 font-semibold underline underline-offset-2 hover:text-black"
            >
              {isRegister ? 'Sign in' : 'Create one free'}
            </button>
          </p>
        </div>
      </main>
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
          className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-10 pr-3.5 py-2.5 text-[14px] text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-gray-900 focus:ring-2 focus:ring-gray-900/10 focus:bg-white transition-all"
        />
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
