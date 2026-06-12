import { useMemo, useState } from 'react';
import { Calculator, CheckCircle2, Info } from 'lucide-react';
import { MarketingShell, MarketingHeading } from '../../components/marketing/MarketingShell';

interface PageProps {
  onNavigate: (to: string) => void;
  /** Start the purchase flow for a package (auth → Stripe checkout). */
  onSelectPlan: (packageId: string) => void;
  authed?: boolean;
  onOpenWorkspace?: () => void;
}

export function PricingPage({ onNavigate, onSelectPlan, authed, onOpenWorkspace }: PageProps) {
  const [reveals, setReveals] = useState(2500);

  // Real credit model: 1 credit = 1 Apollo contact reveal.
  const estimate = useMemo(() => {
    const base = 2000, subCost = 149;
    if (reveals <= base) return { plan: 'Start Tier', monthly: subCost, detail: `${base.toLocaleString()} credits cover it` };
    const packs = Math.ceil((reveals - base) / 1000);
    return { plan: `Start Tier + ${packs} Top-Up${packs > 1 ? 's' : ''}`, monthly: subCost + packs * 65, detail: `${base.toLocaleString()} + ${(packs * 1000).toLocaleString()} top-up credits` };
  }, [reveals]);

  return (
    <MarketingShell current="pricing" onNavigate={onNavigate} authed={authed} onOpenWorkspace={onOpenWorkspace}>
      <MarketingHeading
        eyebrow="Pricing Calculator"
        title="Pay for contacts, not seats of bloat"
        subtitle="Sourcing, AI scoring, and outreach drafting are free. You only spend credits when you reveal a candidate’s email or phone — 1 credit per reveal."
      />

      {/* Plans */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto">
        <Plan
          highlight badge="MOST POPULAR" name="Start Tier" price="$149" per="/ month"
          sub="2,000 credits every month · $75 per 1,000"
          features={['2,000 contact-reveal credits / month', 'Unlimited AI sourcing, scoring & drafting', 'Send from your own Gmail / Resend domain', 'Reply tracking + 48h no-response alerts', 'Cancel anytime from the billing portal']}
          cta="Start subscription" onClick={() => onSelectPlan('start-tier')}
        />
        <Plan
          name="Top-Up Pack" price="$65" per="one-time"
          sub="1,000 additional credits · never expires"
          features={['1,000 additional credits, one-time', 'Stacks on your subscription balance', '1 credit = 1 email/phone reveal', 'Buy as many packs as you need']}
          cta="Buy a top-up" onClick={() => onSelectPlan('topup-1000')}
        />
      </div>

      {/* Calculator */}
      <div className="mt-10 max-w-2xl mx-auto bg-slate-950/50 border border-slate-900 rounded-3xl p-7 space-y-5">
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
    </MarketingShell>
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
