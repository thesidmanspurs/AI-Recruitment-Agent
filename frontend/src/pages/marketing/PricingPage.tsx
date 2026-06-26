import { useMemo, useState } from 'react';
import { Check, ArrowRight, Zap, Repeat, Shield } from 'lucide-react';
import { MarketingShell } from '../../components/marketing/MarketingShell';

interface PageProps {
  onNavigate: (to: string) => void;
  onSelectPlan: (packageId: string) => void;
  authed?: boolean;
  onOpenWorkspace?: () => void;
}

const FREE_FEATURES = [
  { icon: '🔍', label: 'Multi-platform sourcing', sub: 'LinkedIn, Reddit, GitHub' },
  { icon: '🤖', label: 'AI fit scoring 0–10', sub: 'Semantic match per candidate' },
  { icon: '🧠', label: 'Gemini deep scoring', sub: 'On-demand research pass' },
  { icon: '✍️', label: 'Outreach draft generation', sub: 'Unique pitch per candidate' },
  { icon: '📬', label: 'Outreach editor + send queue', sub: 'Built-in, no extra tools' },
  { icon: '⏱️', label: '48h follow-up alerts', sub: 'No warm leads go cold' },
  { icon: '📊', label: 'Campaign analytics', sub: 'Pipeline + channel mix' },
  { icon: '📥', label: 'Full CSV export', sub: 'Your data, always' },
  { icon: '🗂️', label: 'Multi-campaign workspace', sub: 'Run all roles in parallel' },
];

const SUB_FEATURES = [
  '2,000 contact-reveal credits monthly',
  'Unlimited AI sourcing, scoring & drafting',
  'Send from Gmail or Resend custom domain',
  'Reply tracking + 48h no-response alerts',
  'Multi-seat workspace isolation',
  'Cancel anytime — no contracts',
];

const TOPUP_FEATURES = [
  '1,000 additional credits, one-time',
  'Stacks on your subscription balance',
  '1 credit = 1 verified email or phone',
  'Buy as many packs as needed',
  'Credits never expire',
];

export function PricingPage({ onNavigate, onSelectPlan, authed, onOpenWorkspace }: PageProps) {
  const [reveals, setReveals] = useState(2500);

  const estimate = useMemo(() => {
    const base = 2000, subCost = 149;
    if (reveals <= base) return { plan: 'Start Tier', monthly: subCost, detail: `${base.toLocaleString()} credits cover it all`, packs: 0 };
    const packs = Math.ceil((reveals - base) / 1000);
    return { plan: `Start Tier + ${packs} Top-Up${packs > 1 ? 's' : ''}`, monthly: subCost + packs * 65, detail: `${base.toLocaleString()} sub + ${(packs * 1000).toLocaleString()} top-up`, packs };
  }, [reveals]);

  return (
    <MarketingShell current="pricing" onNavigate={onNavigate} authed={authed} onOpenWorkspace={onOpenWorkspace}>

      {/* ── HERO ──────────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-white border-b border-gray-100">
        <div className="absolute inset-0 pointer-events-none"
          style={{ backgroundImage: 'radial-gradient(ellipse 80% 50% at 50% -20%, rgba(139,92,246,0.08), transparent)' }} />
        <div className="relative max-w-6xl mx-auto px-6 pt-20 pb-20 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-violet-200 bg-violet-50 text-violet-600 text-[12px] font-mono uppercase tracking-wider mb-8">
            Simple, transparent pricing
          </div>
          <h1 className="text-6xl font-normal text-gray-900 max-w-3xl mx-auto mb-5 leading-tight"
            style={{ fontFamily: "'DM Serif Display', serif" }}>
            Pay for contacts,<br /><span className="italic text-violet-600">not seats</span>
          </h1>
          <p className="text-lg text-gray-500 max-w-xl mx-auto leading-relaxed mb-10">
            Sourcing, scoring, and outreach drafting are free. Credits only when you reveal a verified contact — 1 credit per reveal.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            {[
              { icon: <Zap className="w-3.5 h-3.5" />, label: 'Free to start' },
              { icon: <Repeat className="w-3.5 h-3.5" />, label: 'Cancel anytime' },
              { icon: <Shield className="w-3.5 h-3.5" />, label: 'No contracts' },
            ].map(c => (
              <span key={c.label} className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gray-100 text-gray-500 text-[12px] font-medium">
                {c.icon}{c.label}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ── PLANS ─────────────────────────────────────────────────────────────── */}
      <section className="bg-gray-50 border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-6 py-20">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto">

            {/* Start Tier */}
            <div className="relative rounded-2xl p-px overflow-hidden"
              style={{ background: 'linear-gradient(135deg, rgba(139,92,246,0.7), rgba(99,102,241,0.4), rgba(139,92,246,0.15))' }}>
              <div className="rounded-2xl p-8 flex flex-col h-full bg-white">
                <div className="flex items-center justify-between mb-8">
                  <div>
                    <p className="text-[10px] font-mono uppercase tracking-widest text-violet-500 mb-1">Monthly subscription</p>
                    <h3 className="text-xl font-bold text-gray-900">Start Tier</h3>
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-wider bg-violet-600 text-white px-3 py-1 rounded-full">
                    Popular
                  </span>
                </div>

                <div className="mb-1">
                  <span className="text-7xl font-normal text-gray-900" style={{ fontFamily: "'DM Serif Display', serif" }}>$149</span>
                  <span className="text-gray-400 text-base ml-2">/ month</span>
                </div>
                <p className="text-[12px] font-mono text-gray-400 mb-8">2,000 credits included · renews monthly</p>

                <ul className="space-y-3.5 flex-1 mb-8">
                  {SUB_FEATURES.map(f => (
                    <li key={f} className="flex items-start gap-3">
                      <div className="w-5 h-5 rounded-full bg-violet-100 flex items-center justify-center shrink-0 mt-0.5">
                        <Check className="w-3 h-3 text-violet-600" />
                      </div>
                      <span className="text-[14px] text-gray-600">{f}</span>
                    </li>
                  ))}
                </ul>

                <button onClick={() => onSelectPlan('start-tier')}
                  className="w-full py-4 rounded-xl font-semibold text-[15px] transition-all text-white"
                  style={{ background: 'linear-gradient(135deg, #7c3aed, #6366f1)', boxShadow: '0 4px 16px rgba(124,58,237,0.3)' }}>
                  Start subscription →
                </button>
              </div>
            </div>

            {/* Top-Up */}
            <div className="rounded-2xl p-8 flex flex-col border border-gray-200 bg-white">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <p className="text-[10px] font-mono uppercase tracking-widest text-gray-400 mb-1">One-time purchase</p>
                  <h3 className="text-xl font-bold text-gray-900">Top-Up Pack</h3>
                </div>
                <span className="text-[10px] font-bold uppercase tracking-wider border border-gray-300 text-gray-500 px-3 py-1 rounded-full">
                  Add-on
                </span>
              </div>

              <div className="mb-1">
                <span className="text-7xl font-normal text-gray-900" style={{ fontFamily: "'DM Serif Display', serif" }}>$65</span>
                <span className="text-gray-400 text-base ml-2">one-time</span>
              </div>
              <p className="text-[12px] font-mono text-gray-400 mb-8">1,000 credits · never expires</p>

              <ul className="space-y-3.5 flex-1 mb-8">
                {TOPUP_FEATURES.map(f => (
                  <li key={f} className="flex items-start gap-3">
                    <div className="w-5 h-5 rounded-full bg-gray-100 flex items-center justify-center shrink-0 mt-0.5">
                      <Check className="w-3 h-3 text-gray-500" />
                    </div>
                    <span className="text-[14px] text-gray-600">{f}</span>
                  </li>
                ))}
              </ul>

              <button onClick={() => onSelectPlan('topup-1000')}
                className="w-full py-4 rounded-xl font-semibold text-[15px] border border-gray-200 hover:border-gray-400 text-gray-700 hover:text-gray-900 transition-all bg-gray-50 hover:bg-gray-100">
                Buy a top-up
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ── WHAT'S FREE ───────────────────────────────────────────────────────── */}
      <section className="bg-emerald-50 border-b border-emerald-100">
        <div className="max-w-6xl mx-auto px-6 py-16">
          <div className="text-center mb-10">
            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-100 border border-emerald-200 text-emerald-700 text-[11px] font-mono uppercase tracking-widest mb-4">
              Always free — no credit card needed
            </span>
            <h2 className="text-3xl font-normal text-gray-900" style={{ fontFamily: "'DM Serif Display', serif" }}>
              Everything included at $0
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {FREE_FEATURES.map(f => (
              <div key={f.label} className="flex items-center gap-4 bg-white border border-emerald-100 rounded-xl px-5 py-4 hover:border-emerald-200 hover:shadow-sm transition-all">
                <span className="text-2xl shrink-0">{f.icon}</span>
                <div>
                  <p className="text-[13px] font-semibold text-gray-900">{f.label}</p>
                  <p className="text-[11px] text-emerald-600">{f.sub}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── COMPARISON ────────────────────────────────────────────────────────── */}
      <section className="bg-white border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-6 py-20">
          <p className="text-[11px] font-mono tracking-widest uppercase text-gray-400 mb-3 text-center">vs Traditional hiring</p>
          <h2 className="text-4xl font-normal text-gray-900 max-w-xl mx-auto text-center mb-12"
            style={{ fontFamily: "'DM Serif Display', serif" }}>
            The real cost of a hire
          </h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 max-w-4xl mx-auto">
            <div className="border border-gray-200 rounded-2xl overflow-hidden">
              <div className="bg-gray-50 px-6 py-4 border-b border-gray-200 flex items-center gap-2">
                <span className="text-lg">🏢</span>
                <p className="text-[13px] font-semibold uppercase tracking-wider text-gray-500">Recruitment agency</p>
              </div>
              <div className="px-6 divide-y divide-gray-50">
                {[
                  { label: 'Fee structure', value: '15–25% of first-year salary' },
                  { label: '$120k engineer hire', value: '$18,000 – $30,000' },
                  { label: 'Time to shortlist', value: '2–4 weeks' },
                  { label: 'Data ownership', value: 'Stays with agency' },
                  { label: 'Outreach', value: 'Generic template' },
                ].map(r => (
                  <div key={r.label} className="flex items-center justify-between py-3.5">
                    <span className="text-[13px] text-gray-500">{r.label}</span>
                    <span className="text-[13px] font-medium text-gray-400">{r.value}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="border-2 border-violet-400 rounded-2xl overflow-hidden shadow-lg shadow-violet-50">
              <div className="bg-violet-600 px-6 py-4 flex items-center gap-2">
                <span className="text-lg">⚡</span>
                <p className="text-[13px] font-semibold uppercase tracking-wider text-white">TalentScanr</p>
              </div>
              <div className="px-6 divide-y divide-gray-50">
                {[
                  { label: 'Fee structure', value: '$149/month flat' },
                  { label: '$120k engineer hire', value: '$149 + ~$10 credits' },
                  { label: 'Time to shortlist', value: 'Same day' },
                  { label: 'Data ownership', value: 'Yours — export any time' },
                  { label: 'Outreach', value: 'Gemini-drafted per candidate' },
                ].map(r => (
                  <div key={r.label} className="flex items-center justify-between py-3.5">
                    <span className="text-[13px] text-gray-500">{r.label}</span>
                    <span className="text-[13px] font-bold text-gray-900">{r.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── CALCULATOR ────────────────────────────────────────────────────────── */}
      <section className="bg-gray-50 border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-6 py-20">
          <div className="text-center mb-12">
            <p className="text-[11px] font-mono tracking-widest uppercase text-gray-400 mb-3">Credit calculator</p>
            <h2 className="text-4xl font-normal text-gray-900" style={{ fontFamily: "'DM Serif Display', serif" }}>
              Estimate your monthly cost
            </h2>
          </div>

          <div className="max-w-2xl mx-auto">
            <div className="border border-gray-200 rounded-2xl p-8 bg-white shadow-sm mb-6">
              <div className="flex items-baseline justify-between mb-6">
                <label className="text-[14px] font-medium text-gray-700">Contact reveals per month</label>
                <span className="text-3xl font-normal text-gray-900 tabular-nums" style={{ fontFamily: "'DM Serif Display', serif" }}>
                  {reveals.toLocaleString()}
                </span>
              </div>

              <div className="relative mb-8">
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full rounded-full transition-all"
                    style={{
                      width: `${((reveals - 250) / (10000 - 250)) * 100}%`,
                      background: 'linear-gradient(to right, #7c3aed, #6366f1)',
                    }} />
                </div>
                <input type="range" min={250} max={10000} step={250} value={reveals}
                  onChange={e => setReveals(Number(e.target.value))}
                  className="absolute inset-0 w-full opacity-0 cursor-pointer h-2" />
              </div>

              <div className="mb-6">
                <div className="flex justify-between text-[11px] font-mono text-gray-400 mb-2">
                  <span>Subscription (2,000)</span>
                  {estimate.packs > 0 && <span>Top-up ({(estimate.packs * 1000).toLocaleString()})</span>}
                </div>
                <div className="h-3 bg-gray-100 rounded-full overflow-hidden flex">
                  <div className="h-full bg-violet-500 transition-all"
                    style={{ width: `${Math.min(100, (2000 / reveals) * 100)}%` }} />
                  {estimate.packs > 0 && (
                    <div className="h-full bg-indigo-300 transition-all"
                      style={{ width: `${Math.min(100, ((estimate.packs * 1000) / reveals) * 100)}%` }} />
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="border border-gray-100 rounded-xl p-5 bg-gray-50">
                  <p className="text-[10px] font-mono uppercase tracking-wider text-gray-400 mb-2">Recommended plan</p>
                  <p className="text-[15px] font-semibold text-gray-900 leading-snug">{estimate.plan}</p>
                  <p className="text-[12px] text-gray-500 mt-1">{estimate.detail}</p>
                </div>
                <div className="border border-violet-200 rounded-xl p-5 bg-violet-50 flex flex-col justify-center">
                  <p className="text-[10px] font-mono uppercase tracking-wider text-violet-500 mb-2">Monthly total</p>
                  <p className="text-5xl font-normal text-gray-900" style={{ fontFamily: "'DM Serif Display', serif" }}>${estimate.monthly}</p>
                  <p className="text-[12px] text-gray-500 mt-1">/ month</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              {[
                { reveals: '≤2,000', cost: '$149/mo', note: 'Sub only' },
                { reveals: '3,000', cost: '$214/mo', note: '+1 top-up' },
                { reveals: '5,000', cost: '$344/mo', note: '+3 top-ups' },
              ].map(ex => (
                <div key={ex.reveals} className="border border-gray-200 rounded-xl px-4 py-4 bg-white text-center">
                  <p className="text-[11px] font-mono text-gray-400 mb-1">{ex.reveals} reveals</p>
                  <p className="text-[18px] font-bold text-gray-900">{ex.cost}</p>
                  <p className="text-[11px] text-gray-400 mt-1">{ex.note}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA ───────────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-white border-t border-gray-100">
        <div className="absolute inset-0 pointer-events-none"
          style={{ backgroundImage: 'radial-gradient(ellipse 60% 50% at 50% 100%, rgba(139,92,246,0.06), transparent)' }} />
        <div className="relative max-w-6xl mx-auto px-6 py-24 text-center">
          <h2 className="text-5xl font-normal text-gray-900 mb-4" style={{ fontFamily: "'DM Serif Display', serif" }}>
            Start free,<br /><span className="italic text-violet-600">spend only when you hire</span>
          </h2>
          <p className="text-gray-500 text-lg leading-relaxed max-w-xl mx-auto mb-10">
            Source, score, and draft outreach before spending a single credit.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <button onClick={() => onNavigate('/register')}
              className="inline-flex items-center gap-2 px-8 py-4 rounded-xl font-semibold text-[16px] text-white transition-all"
              style={{ background: 'linear-gradient(135deg, #7c3aed, #6366f1)', boxShadow: '0 4px 20px rgba(124,58,237,0.25)' }}>
              Create free account <ArrowRight className="w-4 h-4" />
            </button>
            <button onClick={() => onNavigate('/faq')}
              className="inline-flex items-center gap-2 px-8 py-4 rounded-xl border border-gray-200 hover:border-gray-400 text-gray-600 hover:text-gray-900 font-medium text-[16px] transition-colors bg-white">
              Read the FAQ
            </button>
          </div>
        </div>
      </section>

    </MarketingShell>
  );
}
