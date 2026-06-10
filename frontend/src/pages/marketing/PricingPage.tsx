import { useMemo, useState } from 'react';
import { Sparkles, Zap, Check, Calculator } from 'lucide-react';
import { MarketingLayout, Pill, SectionHeading } from '../../components/marketing/MarketingLayout';

interface PageProps {
  onNavigate: (to: string) => void;
  /** Start the purchase flow for a package (auth → Stripe checkout). */
  onSelectPlan: (packageId: string) => void;
}

// Kept in sync with backend/config/creditPackages.ts.
const PLANS = [
  {
    id: 'start-tier',
    name: 'Start Tier',
    kind: 'subscription' as const,
    price: 149,
    credits: 2000,
    blurb: 'For active recruiting seats running continuous outbound.',
    features: [
      '2,000 contact-reveal credits every month',
      'Unlimited AI sourcing, scoring & outreach drafting',
      'Send from your own Gmail / Resend domain',
      'Reply tracking + 48h no-response alerts',
      'Cancel anytime from the billing portal',
    ],
    highlight: true,
  },
  {
    id: 'topup-1000',
    name: 'Top-Up Pack',
    kind: 'one_time' as const,
    price: 65,
    credits: 1000,
    blurb: 'Need more reveals this month? Stack on extra credits.',
    features: [
      '1,000 additional credits, one-time',
      'Never expires — use whenever',
      'Same 1 credit = 1 email/phone reveal',
      'Buy as many packs as you need',
    ],
    highlight: false,
  },
];

export function PricingPage({ onNavigate, onSelectPlan }: PageProps) {
  const [reveals, setReveals] = useState(2500);

  const estimate = useMemo(() => {
    const base = 2000;
    const subCost = 149;
    if (reveals <= base) {
      return { plan: 'Start Tier', monthly: subCost, detail: `${base.toLocaleString()} credits cover it` };
    }
    const extra = reveals - base;
    const packs = Math.ceil(extra / 1000);
    return {
      plan: `Start Tier + ${packs} Top-Up${packs > 1 ? 's' : ''}`,
      monthly: subCost + packs * 65,
      detail: `${base.toLocaleString()} + ${(packs * 1000).toLocaleString()} top-up credits`,
    };
  }, [reveals]);

  return (
    <MarketingLayout current="/pricing" onNavigate={onNavigate} onSignIn={() => onNavigate('/')}>
      <section className="max-w-[1280px] mx-auto px-6 pt-16 pb-8">
        <SectionHeading
          eyebrow="Pricing"
          title="Pay for contacts, not seats of bloat"
          subtitle="Sourcing, AI scoring, and outreach drafting are free. You only spend credits when you reveal a candidate’s email or phone — 1 credit per reveal."
        />

        <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          {PLANS.map(plan => (
            <div
              key={plan.id}
              className={`relative rounded-2xl border p-7 flex flex-col ${
                plan.highlight
                  ? 'border-indigo-400/30 bg-gradient-to-br from-indigo-500/10 to-white/[0.02]'
                  : 'border-white/8 bg-white/[0.02]'
              }`}
            >
              {plan.highlight && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2"><Pill>Most popular</Pill></div>
              )}
              <div className="flex items-center gap-2 mb-1">
                {plan.kind === 'subscription' ? <Sparkles className="w-4 h-4 text-indigo-400" /> : <Zap className="w-4 h-4 text-amber-400" />}
                <h3 className="text-lg font-bold text-white">{plan.name}</h3>
              </div>
              <p className="text-[13px] text-gray-400 mb-5">{plan.blurb}</p>
              <div className="flex items-baseline gap-1.5 mb-1">
                <span className="text-4xl font-extrabold text-white">${plan.price}</span>
                <span className="text-sm text-gray-500">{plan.kind === 'subscription' ? '/ month' : 'one-time'}</span>
              </div>
              <p className="text-[12px] text-gray-500 mb-6">
                {plan.credits.toLocaleString()} credits · ${(plan.price / (plan.credits / 1000)).toFixed(0)} per 1,000
              </p>
              <ul className="flex flex-col gap-2.5 mb-7">
                {plan.features.map(f => (
                  <li key={f} className="flex items-start gap-2.5 text-[13px] text-gray-300">
                    <Check className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" /> {f}
                  </li>
                ))}
              </ul>
              <button
                onClick={() => onSelectPlan(plan.id)}
                className={`mt-auto w-full rounded-xl py-3 text-sm font-semibold transition-colors ${
                  plan.highlight
                    ? 'bg-gradient-to-br from-indigo-500 to-violet-600 hover:from-indigo-400 hover:to-violet-500 text-white shadow-lg shadow-indigo-900/30'
                    : 'bg-white/5 border border-white/10 text-gray-100 hover:bg-white/10'
                }`}
              >
                {plan.kind === 'subscription' ? 'Start subscription' : 'Buy a top-up'}
              </button>
            </div>
          ))}
        </div>

        {/* Calculator */}
        <div className="mt-12 max-w-2xl mx-auto rounded-2xl border border-white/8 bg-white/[0.02] p-7">
          <div className="flex items-center gap-2 mb-5">
            <Calculator className="w-4 h-4 text-indigo-300" />
            <h3 className="text-white font-bold text-[15px]">Estimate your monthly cost</h3>
          </div>
          <label className="block text-[12px] text-gray-400 mb-2">
            Contact reveals per month: <span className="text-white font-bold">{reveals.toLocaleString()}</span>
          </label>
          <input
            type="range" min={250} max={10000} step={250} value={reveals}
            onChange={e => setReveals(Number(e.target.value))}
            className="w-full accent-indigo-500"
          />
          <div className="mt-5 flex items-center justify-between rounded-xl bg-[#0a0c12] border border-white/10 px-5 py-4">
            <div>
              <p className="text-[11px] uppercase tracking-wider text-gray-500 font-bold">Recommended</p>
              <p className="text-white font-semibold">{estimate.plan}</p>
              <p className="text-[12px] text-gray-500">{estimate.detail}</p>
            </div>
            <div className="text-right">
              <p className="text-3xl font-extrabold text-emerald-400">${estimate.monthly}</p>
              <p className="text-[11px] text-gray-500">per month</p>
            </div>
          </div>
        </div>
      </section>
    </MarketingLayout>
  );
}
