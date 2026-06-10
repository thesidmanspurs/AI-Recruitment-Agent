import { useState, useEffect, type FormEvent, type ReactNode } from 'react';
import {
  Globe, SlidersHorizontal, Mail, Loader2, ArrowRight, Lock, ShieldCheck, Sparkles,
} from 'lucide-react';
import { MarketingLayout, Pill, SectionHeading } from '../../components/marketing/MarketingLayout';

interface LandingPageProps {
  onLogin: (email: string, password: string) => Promise<void>;
  onNavigate: (to: string) => void;
}

const FEATURES = [
  {
    icon: Globe,
    color: 'from-orange-500/20 to-orange-600/10 text-orange-400',
    title: 'Cross-Platform Community Sourcing',
    body: "Our autonomous search system crawls high-intent tech discussion forums, Reddit tags, and public professional sites. We find talent based on what they've actually constructed rather than static resume descriptions.",
  },
  {
    icon: SlidersHorizontal,
    color: 'from-indigo-500/20 to-indigo-600/10 text-indigo-400',
    title: 'Calibrated Quality Gates',
    body: 'Set dynamic AI match parameters on our slider from 6.0 up to 10.0. Immediately filter out low-scoring candidates or configure description text templates dynamically. Raw data remains securely preserved for later evaluation.',
  },
  {
    icon: Mail,
    color: 'from-emerald-500/20 to-emerald-600/10 text-emerald-400',
    title: 'High-Response Draft Sequencing',
    body: 'Aries builds hyper-personalized outreach sequences. By parsing candidate alternate titles and keywords (e.g. Jenkins, Git, Cobol), the generative text feels individual and authentic to prospects, tripling response rates.',
  },
];

export function LandingPage({ onLogin, onNavigate }: LandingPageProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Surface an error bounced back from the Google OAuth callback (?auth_error),
  // then strip it from the URL so a refresh doesn't re-show it.
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
      setError(err instanceof Error ? err.message : 'Sign in failed.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <MarketingLayout current="/" onNavigate={onNavigate} onSignIn={() => {
      document.getElementById('recruiter-console')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }}>
      {/* Hero */}
      <section className="max-w-[1280px] mx-auto px-6 pt-16 pb-20 grid lg:grid-cols-2 gap-12 items-center">
        {/* Left */}
        <div>
          <Pill>🚀 High-Conversion Recruiting Playbook</Pill>
          <h1 className="mt-6 text-5xl sm:text-6xl font-extrabold tracking-tight text-white leading-[1.05]">
            Autonomous candidate{' '}
            <span className="bg-gradient-to-r from-indigo-400 via-violet-400 to-teal-300 bg-clip-text text-transparent">
              sourcing at scale.
            </span>
          </h1>
          <p className="mt-6 text-[15px] text-gray-400 leading-relaxed max-w-xl">
            ARIES scans the best public tech communities, extracts verified profiles, scores matches
            using advanced filter matrices (6.0 to 10.0), and crafts custom invitation outreach
            templates powered by Gemini. Stop depending on high-fee external staffing agencies.
          </p>

          {/* Stats */}
          <div className="mt-10 flex flex-wrap gap-10">
            <Stat value="2,000" label="Credits / seat / mo" valueClass="text-white" />
            <Stat value="$149" label="Seat license rate" valueClass="text-emerald-400" />
            <Stat value="10x" label="Lower hiring fees" valueClass="text-indigo-400" />
          </div>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Pill tone="gray"><ShieldCheck className="w-3 h-3" /> SOC2 Compliant</Pill>
            <Pill tone="gray"><Sparkles className="w-3 h-3" /> Gemini Powered</Pill>
            <span className="text-[12px] text-gray-500">Empowering multi-seat global workspace isolation.</span>
          </div>
        </div>

        {/* Right — sign-in console */}
        <div id="recruiter-console" className="relative">
          <div className="absolute -inset-0.5 bg-gradient-to-br from-indigo-500/30 to-violet-600/10 rounded-3xl blur-xl" />
          <div className="relative rounded-3xl border border-white/10 bg-[#10131c]/90 backdrop-blur p-7 shadow-2xl">
            <div className="flex justify-end mb-2">
              <Pill tone="emerald">● Gate Lock Active</Pill>
            </div>
            <h2 className="text-xl font-bold text-white text-center">Enter Recruiter Console</h2>
            <p className="text-[12px] text-gray-500 text-center mt-1.5 mb-5 px-4">
              Provide verified authorization keys or business emails below to unlock active candidate campaign flows.
            </p>

            <button
              type="button"
              onClick={signInWithGoogle}
              className="w-full flex items-center justify-center gap-2.5 bg-white text-gray-800 font-semibold text-sm rounded-xl py-3 hover:bg-gray-100 transition-colors"
            >
              <GoogleMark /> Continue with Google workspace
            </button>

            <div className="flex items-center gap-3 my-5">
              <div className="h-px flex-1 bg-white/10" />
              <span className="text-[10px] font-bold tracking-[0.15em] text-gray-500 uppercase">Business Gatepass</span>
              <div className="h-px flex-1 bg-white/10" />
            </div>

            {error && (
              <div className="mb-3 text-[12px] text-red-300 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">{error}</div>
            )}

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <Field label="Registered Business Email">
                <div className="relative">
                  <input
                    type="email" required value={email} onChange={e => setEmail(e.target.value)}
                    placeholder="name@agency-brand.com"
                    className="w-full bg-[#0a0c12] border border-white/10 rounded-xl pl-3.5 pr-10 py-2.5 text-sm text-gray-100 placeholder:text-gray-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/40"
                  />
                  <Mail className="w-4 h-4 text-gray-600 absolute right-3 top-1/2 -translate-y-1/2" />
                </div>
              </Field>
              <Field label="Authentication Password" hint="Forgot Keys?">
                <div className="relative">
                  <input
                    type="password" required value={password} onChange={e => setPassword(e.target.value)}
                    placeholder="Enter secure master password"
                    className="w-full bg-[#0a0c12] border border-white/10 rounded-xl pl-3.5 pr-10 py-2.5 text-sm text-gray-100 placeholder:text-gray-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/40"
                  />
                  <Lock className="w-4 h-4 text-gray-600 absolute right-3 top-1/2 -translate-y-1/2" />
                </div>
              </Field>

              <button
                type="submit" disabled={submitting}
                className="mt-1 w-full flex items-center justify-center gap-2 bg-gradient-to-br from-indigo-500 to-violet-600 hover:from-indigo-400 hover:to-violet-500 text-white font-semibold text-sm rounded-xl py-3 transition-colors disabled:opacity-60"
              >
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <>Sign In &amp; Open Tool <ArrowRight className="w-4 h-4" /></>}
              </button>
            </form>

            <div className="mt-5 rounded-xl border border-white/10 bg-white/[0.02] px-4 py-3 flex items-center justify-between">
              <div>
                <p className="text-[12px] font-bold text-amber-300">Need an account?</p>
                <p className="text-[11px] text-gray-500">Register a new recruiter workspace.</p>
              </div>
              <button onClick={() => onNavigate('/register')} className="text-[12px] font-semibold text-indigo-300 hover:text-indigo-200">
                Register →
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Why section */}
      <section className="max-w-[1280px] mx-auto px-6 pb-8">
        <SectionHeading
          eyebrow="Powered by Gemini"
          title="Why Recruiting Agencies are Panicking"
          subtitle="Aries automates the absolute hardest components of outbound tech recruitment: pipeline sourcing, rating quality objectively, and drafting genuine invitations that receive responses."
        />
        <div className="grid md:grid-cols-3 gap-5">
          {FEATURES.map(f => (
            <div key={f.title} className="rounded-2xl border border-white/8 bg-white/[0.02] p-6 hover:bg-white/[0.04] transition-colors">
              <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${f.color} flex items-center justify-center mb-4`}>
                <f.icon className="w-5 h-5" />
              </div>
              <h3 className="text-white font-bold text-[15px] mb-2">{f.title}</h3>
              <p className="text-[13px] text-gray-400 leading-relaxed">{f.body}</p>
            </div>
          ))}
        </div>
      </section>
    </MarketingLayout>
  );
}

function Stat({ value, label, valueClass }: { value: string; label: string; valueClass: string }) {
  return (
    <div>
      <div className={`text-3xl font-extrabold ${valueClass}`}>{value}</div>
      <div className="text-[10px] font-semibold tracking-[0.12em] text-gray-500 uppercase mt-1">{label}</div>
    </div>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <label className="block">
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-[10px] font-bold tracking-[0.1em] text-indigo-300 uppercase">{label}</span>
        {hint && <span className="text-[10px] text-gray-500">{hint}</span>}
      </div>
      {children}
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
