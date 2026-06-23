import {
  Radar, Gauge, Mail, Coins, ShieldCheck, GitBranch, Inbox, Users, ArrowRight,
} from 'lucide-react';
import { MarketingShell, MarketingHeading } from '../../components/marketing/MarketingShell';

interface PageProps {
  onNavigate: (to: string) => void;
  authed?: boolean;
  onOpenWorkspace?: () => void;
}

const SECTIONS = [
  { icon: Radar, title: 'Autonomous community sourcing', body: 'Aries crawls public tech communities and professional networks, resolving verified profiles via Apollo. You source from real signal — what people build — not stale resume keywords.' },
  { icon: Gauge, title: 'Calibrated AI quality gates', body: 'Every candidate is scored 0–10 against your job spec. Set a suitability threshold and a score filter to instantly separate the approved queue from below-threshold leads — raw data is always retained.' },
  { icon: GitBranch, title: 'Grounded deep scoring', body: "On demand, Gemini researches a candidate's real public profile and applies your rubric (must-have / nice-to-have / critical) for a defensible, evidence-backed match score." },
  { icon: Mail, title: 'High-response outreach drafting', body: "Generate hyper-personalized invitations from each candidate's titles and keywords. Send from your own verified Gmail or a Resend domain — no shared mailbox." },
  { icon: Coins, title: 'Pay only for contact reveals', body: "Sourcing, scoring, and drafting are free. Credits are spent only when you unlock a candidate's email or phone via Apollo — 1 credit per reveal." },
  { icon: Inbox, title: 'Reply tracking & alerts', body: 'An inbox poller watches for responses and surfaces replies against the right candidate, with 48-hour no-response alerts so nothing slips through.' },
  { icon: Users, title: 'Multi-seat workspace isolation', body: 'Each recruiter gets isolated campaigns, their own sending identity, and an individual credit balance — built for agencies running many seats in parallel.' },
  { icon: ShieldCheck, title: 'SOC2-aligned & encrypted', body: 'Credentials are AES-256-GCM encrypted at rest and never returned to the client. Payments run through Stripe; we never touch card data.' },
];

export function EngineFeaturesPage({ onNavigate, authed, onOpenWorkspace }: PageProps) {
  return (
    <MarketingShell current="features" onNavigate={onNavigate} authed={authed} onOpenWorkspace={onOpenWorkspace}>
      <MarketingHeading
        eyebrow="Engine Features"
        title="Everything the match engine does for you"
        subtitle="From the first crawl to the reply in your inbox — an end-to-end outbound recruiting pipeline that runs itself."
      />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {SECTIONS.map(s => (
          <div key={s.title} className="p-6 bg-white dark:bg-slate-950/40 border border-gray-200 dark:border-slate-800 rounded-3xl space-y-4 hover:border-indigo-200 dark:hover:border-slate-700 hover:shadow-md dark:hover:shadow-none transition shadow-sm dark:shadow-none">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center border border-indigo-100 dark:border-indigo-500/20">
              <s.icon className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-gray-900 dark:text-white">{s.title}</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-medium">{s.body}</p>
          </div>
        ))}
      </div>
      <div className="mt-12 text-center">
        <button onClick={() => onNavigate('/pricing')}
          className="inline-flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-bold text-xs rounded-xl px-6 py-3 transition shadow-md shadow-indigo-600/10">
          See pricing &amp; estimate costs <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </MarketingShell>
  );
}
