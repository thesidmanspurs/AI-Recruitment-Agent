import { Check, ArrowRight, Zap, Shield, Sparkles, Search, Cpu, Mail, FileSpreadsheet, Lock, Clock as ClockIcon, BarChart3, Database, Layers } from 'lucide-react';
import { MarketingShell } from '../../components/marketing/MarketingShell';

interface PageProps {
  onNavigate: (to: string) => void;
  onSelectPlan?: (packageId: string) => void;
  authed?: boolean;
  onOpenWorkspace?: () => void;
}

const SALES_EMAIL = 'sales@talentscanr.com';

const SOURCING_FEATURES = [
  'AI Multi-platform Sourcing (LinkedIn, GitHub)',
  '2,000 Contact Reveal credits per month',
  'Deep candidate scoring & fit breakdown',
  'Automated outreach drafting & 48h alert tracking',
  'Unlimited active sourcing campaigns',
  'Full CSV export',
];

const RANKING_FEATURES = [
  '7-Day Free Trial included',
  'Bulk CV Upload & Ranking (PDF/DOCX, up to 50 CVs/batch)',
  'In-Memory CV extraction (100% Privacy & Security guarantee)',
  'AI Fit Scoring 0–10 + Strengths & Gaps analysis',
  'Top 50% automatic candidate persistence & Medals',
  'CSV Export of ranking results',
];

const PRO_FEATURES = [
  '7-Day Free Trial included',
  'FULL AI Sourcing (2,000 credits/mo) + FULL CV Ranking',
  'Best Value — Save $29/mo compared to buying separately',
  'Combined candidate dashboard & cross-feature workflows',
  'Priority AI processing & support',
  'All Sourcing & Ranking features included',
];

const PLATFORM_FEATURES = [
  { icon: Search, label: 'Multi-platform sourcing', sub: 'LinkedIn & GitHub contributor profiles' },
  { icon: Cpu, label: 'AI fit scoring 0–10', sub: 'Objective semantic candidate evaluation' },
  { icon: Database, label: 'Gemini deep scoring', sub: 'In-depth profile analysis & signal extraction' },
  { icon: Mail, label: 'Outreach draft generation', sub: 'Tailored outreach per candidate background' },
  { icon: ClockIcon, label: '48h follow-up alerts', sub: 'Automatic reminders so no leads stall' },
  { icon: BarChart3, label: 'Campaign analytics', sub: 'Live pipeline statistics & channel metrics' },
  { icon: FileSpreadsheet, label: 'Full CSV export', sub: 'Complete data portability anytime' },
  { icon: Lock, label: '100% In-Memory Privacy', sub: 'Raw CV files & text are never stored' },
  { icon: Layers, label: 'Multi-campaign workspace', sub: 'Organise multiple roles independently' },
];

export function PricingPage({ onNavigate, authed, onOpenWorkspace }: PageProps) {
  const goStart = () => onNavigate(authed ? '/home' : '/register');

  return (
    <MarketingShell current="pricing" onNavigate={onNavigate} authed={authed} onOpenWorkspace={onOpenWorkspace}>

      {/* ── HERO ──────────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-white dark:bg-[#0a0a0a] border-b border-gray-200/80 dark:border-white/10 py-20 transition-colors">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 text-gray-700 dark:text-gray-300 text-xs font-semibold uppercase tracking-wider mb-6">
            Transparent Pricing Matrix
          </div>
          <h1 className="text-5xl sm:text-6xl font-normal text-gray-900 dark:text-white mb-6 leading-tight"
            style={{ fontFamily: "'DM Serif Display', serif" }}>
            Predictable plans for <br />
            <span className="italic text-gray-700 dark:text-gray-300">outbound sourcing & inbound ranking</span>
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto leading-relaxed mb-8 font-normal">
            Choose outbound AI Sourcing, inbound CV Ranking, or get the complete suite with Pro.
            No hidden fees, cancel anytime.
          </p>

          <div className="flex flex-wrap justify-center gap-2.5">
            {[
              { icon: <Zap className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />, label: '7-day free trial on Ranking & Pro' },
              { icon: <Sparkles className="w-3.5 h-3.5 text-gray-600 dark:text-gray-400" />, label: 'Add-ons available from $109/mo' },
              { icon: <Shield className="w-3.5 h-3.5 text-gray-600 dark:text-gray-400" />, label: '100% In-memory CV privacy guarantee' },
            ].map(c => (
              <span key={c.label} className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-gray-100/80 dark:bg-white/5 text-gray-700 dark:text-gray-300 text-xs font-medium border border-gray-200/60 dark:border-white/10">
                {c.icon}{c.label}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ── PLANS ─────────────────────────────────────────────────────────────── */}
      <section className="bg-gray-50/60 dark:bg-white/[0.02] py-20 border-b border-gray-200/80 dark:border-white/10">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch">

            {/* Sourcing Plan */}
            <div className="rounded-2xl p-8 flex flex-col border border-gray-200 dark:border-white/10 bg-white dark:bg-[#10131c] shadow-sm hover:shadow-md transition-all">
              <div className="mb-6">
                <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-1.5">Outbound Sourcing</p>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white">Sourcing Plan</h3>
              </div>
              <div className="mb-1 flex items-baseline gap-1">
                <span className="text-5xl font-bold text-gray-900 dark:text-white" style={{ fontFamily: "'DM Serif Display', serif" }}>$149</span>
                <span className="text-gray-500 dark:text-gray-400 font-medium">/ month</span>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-8 font-medium">2,000 credits/mo included · Add CV Ranking for +$109/mo</p>

              <ul className="space-y-3.5 flex-1 mb-8">
                {SOURCING_FEATURES.map(f => (
                  <li key={f} className="flex items-start gap-3">
                    <div className="w-5 h-5 rounded-full bg-emerald-50 dark:bg-emerald-500/20 border border-emerald-200/60 dark:border-emerald-500/30 flex items-center justify-center shrink-0 mt-0.5">
                      <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <span className="text-sm text-gray-700 dark:text-gray-300 font-medium">{f}</span>
                  </li>
                ))}
              </ul>

              <button onClick={goStart}
                className="w-full py-3.5 rounded-xl font-semibold text-sm border border-gray-300 dark:border-white/10 hover:border-gray-900 dark:hover:border-white text-gray-900 dark:text-white transition-all bg-white dark:bg-white/5 hover:bg-gray-900 hover:text-white dark:hover:bg-white dark:hover:text-gray-900 shadow-xs">
                Select Sourcing Plan
              </button>
            </div>

            {/* Ranking Plan */}
            <div className="rounded-2xl p-8 flex flex-col border border-gray-200 dark:border-white/10 bg-white dark:bg-[#10131c] shadow-sm hover:shadow-md transition-all relative">
              <div className="absolute top-6 right-6">
                <span className="text-[11px] font-semibold uppercase tracking-wider bg-emerald-50 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 px-3 py-1 rounded-full border border-emerald-200 dark:border-emerald-500/30">
                  7-Day Free Trial
                </span>
              </div>
              <div className="mb-6">
                <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-1.5">Inbound Screening</p>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white">Ranking Plan</h3>
              </div>
              <div className="mb-1 flex items-baseline gap-1">
                <span className="text-5xl font-bold text-gray-900 dark:text-white" style={{ fontFamily: "'DM Serif Display', serif" }}>$99</span>
                <span className="text-gray-500 dark:text-gray-400 font-medium">/ month</span>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-8 font-medium">Upload CVs & rank candidates · Add Sourcing for +$159/mo</p>

              <ul className="space-y-3.5 flex-1 mb-8">
                {RANKING_FEATURES.map(f => (
                  <li key={f} className="flex items-start gap-3">
                    <div className="w-5 h-5 rounded-full bg-emerald-50 dark:bg-emerald-500/20 border border-emerald-200/60 dark:border-emerald-500/30 flex items-center justify-center shrink-0 mt-0.5">
                      <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <span className="text-sm text-gray-700 dark:text-gray-300 font-medium">{f}</span>
                  </li>
                ))}
              </ul>

              <button onClick={goStart}
                className="w-full py-3.5 rounded-xl font-semibold text-sm border border-gray-300 dark:border-white/10 hover:border-gray-900 dark:hover:border-white text-gray-900 dark:text-white transition-all bg-white dark:bg-white/5 hover:bg-gray-900 hover:text-white dark:hover:bg-white dark:hover:text-gray-900 shadow-xs">
                Start 7-Day Free Trial
              </button>
            </div>

            {/* Pro Plan — High Contrast Primary */}
            <div className="rounded-2xl p-8 flex flex-col border-2 border-gray-900 dark:border-amber-400/80 bg-gray-900 dark:bg-[#151928] text-white shadow-xl relative md:-mt-2 md:mb-[-0.5rem]">
              <div className="absolute top-6 right-6">
                <span className="text-[11px] font-bold uppercase tracking-wider bg-amber-400 text-black px-3 py-1 rounded-full shadow-xs">
                  Best Value
                </span>
              </div>
              <div className="mb-6">
                <p className="text-xs font-semibold uppercase tracking-widest text-amber-300 mb-1.5">Complete Suite</p>
                <h3 className="text-2xl font-bold text-white">Pro Plan</h3>
              </div>
              <div className="mb-1 flex items-baseline gap-1">
                <span className="text-5xl font-bold text-white" style={{ fontFamily: "'DM Serif Display', serif" }}>$229</span>
                <span className="text-gray-400 font-medium">/ month</span>
              </div>
              <p className="text-xs text-gray-300 mb-8 font-medium">Save $29/mo · Sourcing + Ranking · 7-Day Free Trial</p>

              <ul className="space-y-3.5 flex-1 mb-8">
                {PRO_FEATURES.map(f => (
                  <li key={f} className="flex items-start gap-3">
                    <div className="w-5 h-5 rounded-full bg-white/10 flex items-center justify-center shrink-0 mt-0.5">
                      <Check className="w-3.5 h-3.5 text-amber-400" />
                    </div>
                    <span className="text-sm text-gray-200 font-medium">{f}</span>
                  </li>
                ))}
              </ul>

              <button onClick={goStart}
                className="w-full py-3.5 rounded-xl font-semibold text-sm bg-white text-gray-900 hover:bg-gray-100 transition-all shadow-sm">
                Start Pro 7-Day Trial →
              </button>
            </div>

          </div>

          {/* Add-ons footnote */}
          <div className="mt-12 p-6 rounded-2xl bg-white dark:bg-[#10131c] border border-gray-200 dark:border-white/10 text-center max-w-3xl mx-auto shadow-xs">
            <h4 className="text-base font-semibold text-gray-900 dark:text-white mb-1">Need to combine features later?</h4>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              Already subscribed to Sourcing Plan? Add CV Ranking anytime for <strong className="text-gray-900 dark:text-white">+$109/month</strong>.<br />
              Already on Ranking Plan? Add AI Sourcing anytime for <strong className="text-gray-900 dark:text-white">+$159/month</strong> (includes 2,000 credits).
            </p>
          </div>
        </div>
      </section>

      {/* ── WHAT'S INCLUDED ───────────────────────────────────────────────────── */}
      <section className="bg-white dark:bg-[#0a0a0a] py-20 border-b border-gray-200/80 dark:border-white/10 transition-colors">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-14">
            <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-gray-100 dark:bg-white/5 text-gray-700 dark:text-gray-300 text-xs font-semibold uppercase tracking-wider mb-3 border border-gray-200/60 dark:border-white/10">
              Core Capabilities
            </span>
            <h2 className="text-3xl sm:text-4xl font-normal text-gray-900 dark:text-white" style={{ fontFamily: "'DM Serif Display', serif" }}>
              Built for speed, precision &amp; absolute privacy
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {PLATFORM_FEATURES.map(f => {
              const Icon = f.icon;
              return (
                <div key={f.label} className="flex items-start gap-4 bg-gray-50/70 dark:bg-[#10131c] border border-gray-200/70 dark:border-white/10 rounded-xl p-5 hover:border-gray-300 dark:hover:border-white/20 transition-all shadow-xs">
                  <div className="w-10 h-10 rounded-lg bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 flex items-center justify-center shrink-0 shadow-2xs">
                    <Icon className="w-5 h-5 text-gray-700 dark:text-gray-300" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-gray-900 dark:text-white">{f.label}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 leading-relaxed">{f.sub}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── COMPARISON ────────────────────────────────────────────────────────── */}
      <section className="bg-gray-50/60 dark:bg-white/[0.02] py-20 border-b border-gray-200/80 dark:border-white/10">
        <div className="max-w-6xl mx-auto px-6">
          <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-400 mb-2 text-center">Cost &amp; Efficiency Comparison</p>
          <h2 className="text-4xl font-normal text-gray-900 dark:text-white max-w-xl mx-auto text-center mb-14"
            style={{ fontFamily: "'DM Serif Display', serif" }}>
            Traditional Agency vs TalentScanr
          </h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-4xl mx-auto">

            {/* Traditional Agency */}
            <div className="border border-gray-200 dark:border-white/10 rounded-2xl bg-white dark:bg-[#10131c] overflow-hidden shadow-xs">
              <div className="bg-gray-100/70 dark:bg-white/5 px-6 py-4 border-b border-gray-200 dark:border-white/10">
                <p className="text-xs font-bold uppercase tracking-wider text-gray-600 dark:text-gray-300">Traditional Agency</p>
              </div>
              <div className="px-6 divide-y divide-gray-100 dark:divide-white/5">
                {[
                  { label: 'Fee Structure', value: '15–25% of first-year salary' },
                  { label: '$120k Engineer Hire', value: '$18,000 – $30,000 per hire' },
                  { label: 'Time to Shortlist', value: '2–4 weeks' },
                  { label: 'CV Screening', value: 'Manual, subjective review' },
                  { label: 'Data Ownership', value: 'Retained by agency' },
                ].map(r => (
                  <div key={r.label} className="flex items-center justify-between py-4">
                    <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">{r.label}</span>
                    <span className="text-xs font-semibold text-gray-600 dark:text-gray-300">{r.value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* TalentScanr */}
            <div className="border-2 border-gray-900 dark:border-amber-400/80 rounded-2xl bg-white dark:bg-[#10131c] overflow-hidden shadow-sm">
              <div className="bg-gray-900 dark:bg-[#151928] px-6 py-4 flex items-center justify-between text-white border-b border-gray-800 dark:border-amber-500/20">
                <p className="text-xs font-bold uppercase tracking-wider text-white">TalentScanr Platform</p>
                <span className="text-[10px] font-semibold uppercase tracking-widest bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2.5 py-0.5 rounded-full">
                  Recommended
                </span>
              </div>
              <div className="px-6 divide-y divide-gray-100 dark:divide-white/5">
                {[
                  { label: 'Fee Structure', value: '$99/mo Ranking or $149/mo Sourcing' },
                  { label: '$120k Engineer Hire', value: 'Flat monthly subscription' },
                  { label: 'Time to Shortlist', value: 'Same day (minutes for CV batch)' },
                  { label: 'CV Screening', value: 'AI ranking in-memory, top 50% saved' },
                  { label: 'Data Ownership', value: '100% yours — export anytime' },
                ].map(r => (
                  <div key={r.label} className="flex items-center justify-between py-4">
                    <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">{r.label}</span>
                    <span className="text-xs font-bold text-gray-900 dark:text-white">{r.value}</span>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ── CTA ───────────────────────────────────────────────────────────────── */}
      <section className="bg-white dark:bg-[#0a0a0a] py-24 transition-colors">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-4xl sm:text-5xl font-normal text-gray-900 dark:text-white mb-4" style={{ fontFamily: "'DM Serif Display', serif" }}>
            Ready to streamline your recruitment?
          </h2>
          <p className="text-gray-600 dark:text-gray-300 text-lg leading-relaxed max-w-xl mx-auto mb-8 font-normal">
            Start a 7-day free trial on Ranking or Pro plans today.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <button onClick={() => onNavigate(authed ? '/home' : '/register')}
              className="inline-flex items-center gap-2 px-8 py-4 rounded-xl font-semibold text-base text-white bg-gray-900 hover:bg-gray-800 dark:bg-white dark:text-gray-900 dark:hover:bg-gray-100 transition-all shadow-sm">
              Get Started Now <ArrowRight className="w-4 h-4" />
            </button>
            <a href={`mailto:${SALES_EMAIL}?subject=TalentScanr%20Enterprise%20Enquiry`}
              className="inline-flex items-center gap-2 px-8 py-4 rounded-xl border border-gray-300 dark:border-white/10 hover:border-gray-900 dark:hover:border-white text-gray-700 dark:text-gray-200 hover:text-gray-900 dark:hover:text-white font-medium text-base transition-colors bg-white dark:bg-white/5">
              Contact Sales
            </a>
          </div>
        </div>
      </section>

    </MarketingShell>
  );
}


