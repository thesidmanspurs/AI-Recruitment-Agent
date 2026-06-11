import { useState, useEffect, useMemo, type FormEvent, type ReactNode } from 'react';
import {
  Flame, Sparkles, ShieldCheck, Zap, Mail, Lock, ArrowRight, Loader2, Globe,
  SlidersHorizontal, Calculator, Info, CheckCircle2, ChevronDown, RefreshCw,
} from 'lucide-react';
import { ApiError } from '../../api/client';

interface LandingPageProps {
  onLogin: (email: string, password: string) => Promise<void>;
  onNavigate: (to: string) => void;
  /** Start the purchase flow for a package (auth → Stripe checkout). */
  onSelectPlan?: (packageId: string) => void;
}

const NAV = [
  { id: 'home', label: 'Overview' },
  { id: 'features', label: 'Engine Features' },
  { id: 'pricing', label: 'Pricing Calculator' },
  { id: 'faq', label: 'Platform FAQs' },
];

const FEATURES = [
  {
    icon: Globe, color: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
    title: 'Cross-Platform Community Sourcing',
    body: "Our autonomous search crawls high-intent tech communities and public professional sites via Apollo, resolving verified profiles. We find talent based on what they've actually built — not stale resume keywords.",
  },
  {
    icon: SlidersHorizontal, color: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
    title: 'Calibrated Quality Gates',
    body: 'Set dynamic AI match parameters from 6.0 up to 10.0. Instantly filter out low-scoring candidates while raw data stays securely preserved for later review.',
  },
  {
    icon: Mail, color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    title: 'High-Response Draft Sequencing',
    body: 'Aries builds hyper-personalized outreach from each candidate’s titles and keywords (Jenkins, Git, Cobol…), so the generative text feels individual and authentic — sent from your own Gmail or Resend domain.',
  },
];

const FAQS = [
  { q: 'What exactly costs a credit?', a: 'Only revealing a candidate’s email or phone via Apollo — 1 credit per reveal. Sourcing candidates, AI match-scoring, deep scoring, and drafting outreach are all free and unlimited.' },
  { q: 'How does the Start Tier subscription work?', a: 'It’s $149/month and grants 2,000 fresh credits at the start of every billing cycle. Cancel anytime from the Stripe billing portal inside the app — no contracts.' },
  { q: 'What if I run out of credits mid-month?', a: 'Buy a Top-Up Pack: $65 for 1,000 additional credits. Top-up credits never expire and stack on top of your subscription balance.' },
  { q: 'Which email can I send outreach from?', a: 'Your own. Connect a Gmail App Password or request an admin-configured Resend sending domain. No shared mailbox, so your deliverability and reputation stay yours.' },
  { q: 'Is my data secure?', a: 'Credentials are AES-256-GCM encrypted at rest and never returned to the browser. Payments are processed by Stripe — we never store card data. The platform is SOC2-aligned.' },
];

export function LandingPage({ onLogin, onNavigate, onSelectPlan }: LandingPageProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedFaq, setExpandedFaq] = useState<number | null>(0);
  const [reveals, setReveals] = useState(2500);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const authError = params.get('auth_error');
    if (authError) {
      setError(authError);
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, []);

  const scrollTo = (id: string) =>
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });

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

  function buy(pkg: string) {
    if (onSelectPlan) onSelectPlan(pkg);
    else scrollTo('home');
  }

  // Real credit model: 1 credit = 1 Apollo contact reveal.
  const estimate = useMemo(() => {
    const base = 2000, subCost = 149;
    if (reveals <= base) return { plan: 'Start Tier', monthly: subCost, detail: `${base.toLocaleString()} credits cover it` };
    const packs = Math.ceil((reveals - base) / 1000);
    return { plan: `Start Tier + ${packs} Top-Up${packs > 1 ? 's' : ''}`, monthly: subCost + packs * 65, detail: `${base.toLocaleString()} + ${(packs * 1000).toLocaleString()} top-up credits` };
  }, [reveals]);

  return (
    <div className="min-h-screen w-full bg-[#0B0F19] text-slate-100 font-sans selection:bg-indigo-500 selection:text-white relative overflow-x-hidden">
      {/* Cosmic backdrops */}
      <div className="absolute top-[-10%] left-[-15%] w-[80%] h-[60%] bg-indigo-900/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute top-[40%] right-[-10%] w-[60%] h-[70%] bg-violet-900/10 rounded-full blur-[160px] pointer-events-none" />

      {/* NAV */}
      <header className="sticky top-0 z-50 bg-[#0B0F19]/85 backdrop-blur-md border-b border-slate-900 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          <button onClick={() => scrollTo('home')} className="flex items-center gap-3">
            <div className="p-2.5 bg-gradient-to-tr from-indigo-600 to-violet-500 text-white rounded-xl shadow-lg shadow-indigo-500/20">
              <Flame className="w-5 h-5" />
            </div>
            <div className="text-left">
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-lg tracking-tight text-white uppercase">Aries</span>
                <span className="text-[9px] bg-indigo-500/20 text-indigo-300 font-extrabold px-1.5 py-0.5 rounded border border-indigo-500/30 font-mono tracking-wider">v4.2</span>
              </div>
              <p className="text-[10px] text-slate-400 font-mono">Autonomous Outbound Recruiting Match Engine</p>
            </div>
          </button>

          <nav className="hidden md:flex items-center gap-1 bg-slate-950/60 p-1 rounded-xl border border-slate-800/80">
            {NAV.map(t => (
              <button key={t.id} onClick={() => scrollTo(t.id)}
                className="px-4 py-1.5 rounded-lg text-xs font-bold text-slate-400 hover:text-white hover:bg-white/5 transition leading-none">
                {t.label}
              </button>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            <button onClick={() => scrollTo('login-card')}
              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold border border-slate-800 hover:border-slate-700 transition">
              Recruiter Sign In
            </button>
            <button onClick={() => scrollTo('pricing')}
              className="hidden sm:block px-4 py-2 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white rounded-xl text-xs font-bold transition shadow-md shadow-indigo-600/10 active:scale-[0.98]">
              Estimate Costings
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-12 relative z-10 space-y-24">
        {/* HERO */}
        <section id="home" className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center pt-4 scroll-mt-24">
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

          {/* Sign-in console */}
          <div id="login-card" className="lg:col-span-5 flex justify-center scroll-mt-24">
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
          </div>
        </section>

        {/* FEATURES */}
        <section id="features" className="space-y-12 scroll-mt-24">
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <span className="text-xs text-indigo-400 font-mono tracking-widest font-extrabold uppercase bg-indigo-500/5 px-3 py-1 rounded-full border border-indigo-500/10">POWERED BY GEMINI</span>
            <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight text-white">Why Recruiting Agencies are Panicking</h2>
            <p className="text-sm text-slate-400 font-medium">
              Aries automates the absolute hardest components of outbound tech recruitment: pipeline sourcing, rating quality objectively, and drafting genuine invitations that receive responses.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map(f => (
              <div key={f.title} className="p-6 bg-slate-950/40 border border-slate-900 rounded-3xl space-y-4 hover:border-slate-800 transition">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${f.color}`}><f.icon className="w-5 h-5" /></div>
                <h3 className="text-base font-bold text-white">{f.title}</h3>
                <p className="text-xs text-slate-400 leading-relaxed font-medium">{f.body}</p>
              </div>
            ))}
          </div>
        </section>

        {/* PRICING */}
        <section id="pricing" className="space-y-10 scroll-mt-24">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <span className="text-xs font-mono font-extrabold text-indigo-400 uppercase tracking-widest">CREDITS SIMULATOR</span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white">Pay for contacts, not seats of bloat</h2>
            <p className="text-sm text-slate-400 font-medium">
              Sourcing, AI scoring, and outreach drafting are free. You only spend credits when you reveal a candidate’s email or phone — 1 credit per reveal.
            </p>
          </div>

          {/* Plans */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto">
            <Plan
              highlight badge="MOST POPULAR" name="Start Tier" price="$149" per="/ month"
              sub="2,000 credits every month · $75 per 1,000"
              features={['2,000 contact-reveal credits / month', 'Unlimited AI sourcing, scoring & drafting', 'Send from your own Gmail / Resend domain', 'Reply tracking + 48h no-response alerts', 'Cancel anytime from the billing portal']}
              cta="Start subscription" onClick={() => buy('start-tier')}
            />
            <Plan
              name="Top-Up Pack" price="$65" per="one-time"
              sub="1,000 additional credits · never expires"
              features={['1,000 additional credits, one-time', 'Stacks on your subscription balance', '1 credit = 1 email/phone reveal', 'Buy as many packs as you need']}
              cta="Buy a top-up" onClick={() => buy('topup-1000')}
            />
          </div>

          {/* Calculator */}
          <div className="max-w-2xl mx-auto bg-slate-950/50 border border-slate-900 rounded-3xl p-7 space-y-5">
            <div className="flex items-center gap-2">
              <Calculator className="w-4 h-4 text-indigo-400" />
              <h3 className="text-white font-bold text-sm">Estimate your monthly cost</h3>
            </div>
            <label className="block text-xs text-slate-400">
              Contact reveals per month: <span className="text-white font-bold font-mono">{reveals.toLocaleString()}</span>
            </label>
            <input type="range" min={250} max={10000} step={250} value={reveals} onChange={e => setReveals(Number(e.target.value))}
              className="w-full h-1.5 bg-slate-900 rounded-lg appearance-none cursor-pointer accent-indigo-500" />
            <div className="flex items-center justify-between rounded-2xl bg-slate-900/60 border border-slate-800 px-5 py-4">
              <div>
                <p className="text-[10px] uppercase tracking-wider text-slate-500 font-mono font-bold">Recommended</p>
                <p className="text-white font-semibold text-sm">{estimate.plan}</p>
                <p className="text-[11px] text-slate-500">{estimate.detail}</p>
              </div>
              <div className="text-right">
                <p className="text-3xl font-black text-emerald-400">${estimate.monthly}</p>
                <p className="text-[10px] text-slate-500">/ month</p>
              </div>
            </div>
            <div className="flex items-start gap-2 text-[11px] text-slate-400 bg-indigo-950/20 border border-indigo-900/30 rounded-xl p-3">
              <Info className="w-4 h-4 text-indigo-400 shrink-0" />
              <span>Run campaigns for multiple clients under one workspace — candidate data and outreach logs stay strictly isolated per campaign.</span>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section id="faq" className="space-y-8 scroll-mt-24">
          <div className="text-center space-y-2 max-w-2xl mx-auto">
            <span className="text-xs font-mono font-extrabold text-indigo-400 uppercase tracking-widest">PRODUCT CLARITY</span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white">Frequently Asked Questions</h2>
          </div>
          <div className="max-w-3xl mx-auto space-y-4">
            {FAQS.map((faq, i) => {
              const open = expandedFaq === i;
              return (
                <div key={i} className="bg-slate-950/40 border border-slate-900 rounded-2xl overflow-hidden">
                  <button onClick={() => setExpandedFaq(open ? null : i)}
                    className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-slate-900/40 transition">
                    <span className="text-xs sm:text-sm font-bold text-slate-200">{faq.q}</span>
                    <ChevronDown className={`w-4 h-4 text-slate-500 transition-transform ${open ? 'rotate-180 text-indigo-400' : ''}`} />
                  </button>
                  {open && <div className="px-6 pb-5 pt-1 text-xs text-slate-400 leading-relaxed font-medium border-t border-slate-900/60">{faq.a}</div>}
                </div>
              );
            })}
          </div>
        </section>
      </main>

      <footer className="border-t border-slate-900 bg-slate-950/80 px-6 py-10 text-slate-500 text-xs mt-12 relative z-10 select-none">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2">
            <Flame className="w-4 h-4 text-indigo-500" />
            <span className="font-bold text-white uppercase">Aries Recruiting</span>
            <span>• © 2026 Aries Outbound Inc.</span>
          </div>
          <div className="flex flex-wrap gap-6 text-[11px]">
            <button onClick={() => scrollTo('features')} className="hover:text-slate-300">Features</button>
            <button onClick={() => scrollTo('pricing')} className="hover:text-slate-300">Pricing</button>
            <button onClick={() => scrollTo('faq')} className="hover:text-slate-300">FAQ</button>
            <span className="text-emerald-400/80 font-mono">SOC2 • GDPR-aligned</span>
          </div>
        </div>
      </footer>
    </div>
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

function Plan({
  name, price, per, sub, features, cta, onClick, highlight, badge,
}: {
  name: string; price: string; per: string; sub: string; features: string[];
  cta: string; onClick: () => void; highlight?: boolean; badge?: string;
}) {
  return (
    <div className={`relative p-6 rounded-3xl flex flex-col justify-between space-y-6 ${highlight ? 'bg-slate-900/60 border-2 border-indigo-600' : 'bg-slate-950/30 border border-slate-900'}`}>
      {badge && (
        <div className="absolute top-0 right-6 -translate-y-1/2 bg-indigo-600 text-white font-mono text-[9px] font-bold px-3 py-1 rounded-full uppercase tracking-wider">{badge}</div>
      )}
      <div>
        <h3 className="text-lg font-bold text-white">{name}</h3>
        <div className="my-4 flex items-baseline gap-1">
          <span className={`text-3xl font-black ${highlight ? 'text-indigo-400' : 'text-white'}`}>{price}</span>
          <span className="text-xs text-slate-400">{per}</span>
        </div>
        <p className="text-[11px] text-slate-500 mb-4 font-mono">{sub}</p>
        <div className="space-y-2 text-xs font-medium">
          {features.map(f => (
            <div key={f} className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" /> <span className="text-slate-300">{f}</span>
            </div>
          ))}
        </div>
      </div>
      <button onClick={onClick}
        className={`w-full py-2.5 rounded-xl text-xs font-bold transition ${highlight ? 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/10' : 'bg-slate-900 hover:bg-slate-800 text-white border border-slate-800 hover:border-slate-700'}`}>
        {cta}
      </button>
    </div>
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
