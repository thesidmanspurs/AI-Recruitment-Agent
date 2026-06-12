import { useState, useEffect, type FormEvent, type ReactNode } from 'react';
import {
  Sparkles, ShieldCheck, Zap, Mail, Lock, ArrowRight, RefreshCw, Globe, SlidersHorizontal,
} from 'lucide-react';
import { ApiError } from '../../api/client';
import { MarketingShell, GoogleMark } from '../../components/marketing/MarketingShell';

interface LandingPageProps {
  onLogin: (email: string, password: string) => Promise<void>;
  onNavigate: (to: string) => void;
  /** Already signed in — show "Open workspace" instead of the login console. */
  authed?: boolean;
  onOpenWorkspace?: () => void;
}

const HIGHLIGHTS = [
  { icon: Globe, color: 'bg-orange-500/10 text-orange-400 border-orange-500/20', title: 'Cross-platform sourcing', body: 'Crawl public tech communities and resolve verified profiles via Apollo.' },
  { icon: SlidersHorizontal, color: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20', title: 'Calibrated quality gates', body: 'Score 0–10 and filter low matches while raw data stays preserved.' },
  { icon: Mail, color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20', title: 'High-response outreach', body: 'Hyper-personalized drafts sent from your own Gmail / Resend domain.' },
];

/** Overview tab ("/") — hero + sign-in console + a short feature teaser. */
export function LandingPage({ onLogin, onNavigate, authed, onOpenWorkspace }: LandingPageProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const authError = params.get('auth_error');
    if (authError) {
      setError(authError);
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, []);

  function signInWithGoogle() {
    const apiBase = import.meta.env.VITE_API_BASE_URL ?? '';
    window.location.href = `${apiBase}/api/auth/google`;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await onLogin(email.trim(), password);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Sign in failed.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <MarketingShell current="home" onNavigate={onNavigate} authed={authed} onOpenWorkspace={onOpenWorkspace}>
      {/* HERO */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center pt-4">
        <div className="lg:col-span-7 space-y-6">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-indigo-500/10 text-indigo-300 rounded-full text-xs font-bold border border-indigo-500/25 uppercase tracking-wide">
            <Sparkles className="w-3.5 h-3.5" /> High-conversion Recruiting Playbook
          </span>
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-black text-white tracking-tight leading-[1.1]">
            Autonomous candidate <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-violet-400 to-emerald-400">sourcing at scale.</span>
          </h1>
          <p className="text-sm md:text-base text-slate-400 leading-relaxed max-w-xl font-medium">
            ARIES scans the best public tech communities, extracts verified profiles, scores matches using advanced filter matrices (6.0 to 10.0), and crafts custom invitation outreach templates powered by Gemini. Stop depending on high-fee external staffing agencies.
          </p>
          <div className="grid grid-cols-3 gap-6 pt-4 border-t border-slate-900/80">
            <Stat value="2,000" label="Credits / seat / mo" cls="text-white" />
            <Stat value="$149" label="Seat license rate" cls="text-emerald-400" />
            <Stat value="10x" label="Lower hiring fees" cls="text-indigo-400" />
          </div>
          <div className="flex flex-wrap items-center gap-4 pt-3 text-slate-400 text-xs">
            <span className="flex items-center gap-1 bg-slate-900/60 px-2.5 py-1 rounded-lg border border-slate-800/80 font-mono text-[10px]">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> SOC2 COMPLIANT
            </span>
            <span className="flex items-center gap-1 bg-slate-900/60 px-2.5 py-1 rounded-lg border border-slate-800/80 font-mono text-[10px]">
              <Zap className="w-3.5 h-3.5 text-indigo-400" /> GEMINI POWERED
            </span>
            <span className="text-slate-500 text-[11px]">Empowering multi-seat global workspace isolation.</span>
          </div>
        </div>

        {/* Sign-in console — or, if already signed in, an "open workspace" card */}
        <div className="lg:col-span-5 flex justify-center">
          {authed ? (
            <div className="w-full max-w-md bg-slate-950/80 border border-slate-800/80 rounded-3xl p-8 shadow-2xl relative ring-1 ring-white/5 text-center">
              <div className="absolute top-0 right-6 -translate-y-1/2 bg-emerald-500 text-slate-950 font-mono text-[9px] font-bold px-3 py-1 rounded-full uppercase tracking-widest shadow-md">
                Session Active
              </div>
              <h3 className="text-lg font-black text-white">You're signed in</h3>
              <p className="text-[12px] text-slate-400 mt-1.5 mb-6 leading-relaxed">
                Your session is active — jump straight back into your recruiter workspace.
              </p>
              <button onClick={onOpenWorkspace}
                className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-xs py-3 rounded-xl transition active:scale-[0.98]">
                Open workspace <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
          <div className="w-full max-w-md bg-slate-950/80 border border-slate-800/80 rounded-3xl p-8 shadow-2xl relative ring-1 ring-white/5">
            <div className="absolute top-0 right-6 -translate-y-1/2 bg-emerald-500 text-slate-950 font-mono text-[9px] font-bold px-3 py-1 rounded-full uppercase tracking-widest shadow-md">
              Gate Lock Active
            </div>
            <div className="text-center mb-6">
              <h3 className="text-lg font-black text-white">Enter Recruiter Console</h3>
              <p className="text-[11px] text-slate-400 mt-1.5 leading-relaxed">
                Provide verified business emails below to unlock active candidate campaign flows.
              </p>
            </div>

            <button type="button" onClick={signInWithGoogle}
              className="w-full flex items-center justify-center gap-3 bg-white hover:bg-slate-100 text-slate-900 font-extrabold text-xs py-3 rounded-xl transition">
              <GoogleMark /> Continue with Google workspace
            </button>

            <div className="flex items-center gap-3 my-5">
              <div className="h-px bg-slate-800 flex-1" />
              <span className="text-[10px] text-slate-500 font-mono font-bold uppercase tracking-wider">Business Gatepass</span>
              <div className="h-px bg-slate-800 flex-1" />
            </div>

            {error && <p className="mb-3 text-xs text-rose-400 font-semibold bg-rose-500/10 border border-rose-500/20 rounded-lg px-3 py-2">{error}</p>}

            <form onSubmit={handleSubmit} className="space-y-4">
              <Field label="Registered Business Email" icon={<Mail className="w-4 h-4" />}>
                <input type="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="name@agency-brand.com"
                  className="w-full bg-slate-900 border border-slate-800 text-slate-100 placeholder:text-slate-600 rounded-xl py-2.5 pl-3.5 pr-10 text-xs focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/50" />
              </Field>
              <Field label="Authentication Password" icon={<Lock className="w-4 h-4" />} hint="Forgot Keys?">
                <input type="password" required value={password} onChange={e => setPassword(e.target.value)} placeholder="Enter secure master password"
                  className="w-full bg-slate-900 border border-slate-800 text-slate-100 placeholder:text-slate-600 rounded-xl py-2.5 pl-3.5 pr-10 text-xs focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/50" />
              </Field>
              <button type="submit" disabled={submitting}
                className="mt-2 w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-xs py-3 rounded-xl transition active:scale-[0.98] disabled:bg-slate-800 disabled:text-slate-500">
                {submitting ? <><RefreshCw className="animate-spin h-3.5 w-3.5" /> Securing workspace…</> : <>Sign In &amp; Open Tool <ArrowRight className="w-3.5 h-3.5" /></>}
              </button>
            </form>

            <div className="mt-5 p-3.5 bg-slate-900 border border-slate-800/80 rounded-2xl flex justify-between items-center text-[10.5px]">
              <div>
                <span className="text-indigo-300 font-bold block mb-0.5">Need an account?</span>
                <span className="text-slate-400 leading-snug">Register a new recruiter workspace.</span>
              </div>
              <button type="button" onClick={() => onNavigate('/register')}
                className="text-[11px] text-indigo-400 hover:text-indigo-300 font-bold shrink-0">Register →</button>
            </div>
          </div>
          )}
        </div>
      </section>

      {/* Teaser → link to the Engine Features tab */}
      <section className="mt-24 space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {HIGHLIGHTS.map(h => (
            <div key={h.title} className="p-6 bg-slate-950/40 border border-slate-900 rounded-3xl space-y-3 hover:border-slate-800 transition">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${h.color}`}><h.icon className="w-5 h-5" /></div>
              <h3 className="text-base font-bold text-white">{h.title}</h3>
              <p className="text-xs text-slate-400 leading-relaxed font-medium">{h.body}</p>
            </div>
          ))}
        </div>
        <div className="text-center">
          <button onClick={() => onNavigate('/engine-features')}
            className="inline-flex items-center gap-2 text-xs font-bold text-indigo-300 hover:text-indigo-200">
            Explore all engine features <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </section>
    </MarketingShell>
  );
}

function Stat({ value, label, cls }: { value: string; label: string; cls: string }) {
  return (
    <div>
      <span className={`text-2xl sm:text-3xl font-black block ${cls}`}>{value}</span>
      <span className="text-[10.5px] text-slate-500 font-mono uppercase tracking-wider block mt-1">{label}</span>
    </div>
  );
}

function Field({ label, icon, hint, children }: { label: string; icon: ReactNode; hint?: string; children: ReactNode }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <label className="block text-[10px] font-mono font-bold text-indigo-400 uppercase tracking-widest text-left">{label}</label>
        {hint && <span className="text-[9.5px] font-semibold text-slate-500">{hint}</span>}
      </div>
      <div className="relative">
        {children}
        <div className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500">{icon}</div>
      </div>
    </div>
  );
}
