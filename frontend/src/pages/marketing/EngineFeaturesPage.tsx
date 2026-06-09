import {
  Radar, Gauge, Mail, Coins, ShieldCheck, GitBranch, Inbox, Users,
} from 'lucide-react';
import { MarketingLayout, SectionHeading } from '../../components/marketing/MarketingLayout';

interface PageProps {
  onNavigate: (to: string) => void;
}

const SECTIONS = [
  {
    icon: Radar,
    title: 'Autonomous community sourcing',
    body: 'Aries crawls public tech communities, professional networks, and hiring-relevant discussions, resolving verified profiles via Apollo. You source from real signal — what people build — not stale resume keywords.',
  },
  {
    icon: Gauge,
    title: 'Calibrated AI quality gates',
    body: 'Every candidate is scored 0–10 against your job spec. Set a suitability threshold and an on-screen score filter to instantly separate the approved queue from below-threshold leads — raw data is always retained for review.',
  },
  {
    icon: GitBranch,
    title: 'Grounded deep scoring',
    body: 'On demand, Gemini researches a candidate’s real public profile and applies your scoring rubric (must-have / nice-to-have / critical) for a defensible, evidence-backed match score.',
  },
  {
    icon: Mail,
    title: 'High-response outreach drafting',
    body: 'Generate hyper-personalized invitations from each candidate’s titles and keywords. Send from your own verified Gmail or a Resend domain — no shared mailbox, full deliverability control.',
  },
  {
    icon: Coins,
    title: 'Pay only for contact reveals',
    body: 'Sourcing, scoring, and drafting are free. Credits are spent only when you unlock a candidate’s email or phone via Apollo — 1 credit per reveal — so you never pay for leads you don’t pursue.',
  },
  {
    icon: Inbox,
    title: 'Reply tracking & alerts',
    body: 'An inbox poller watches for responses and surfaces replies against the right candidate, with 48-hour no-response alerts so nothing slips through your pipeline.',
  },
  {
    icon: Users,
    title: 'Multi-seat workspace isolation',
    body: 'Each recruiter gets isolated campaigns, their own sending identity, and an individual credit balance — built for agencies running many seats in parallel.',
  },
  {
    icon: ShieldCheck,
    title: 'SOC2-aligned & encrypted',
    body: 'Credentials are AES-256-GCM encrypted at rest and never returned to the client. Payments run through Stripe; we never touch card data.',
  },
];

export function EngineFeaturesPage({ onNavigate }: PageProps) {
  return (
    <MarketingLayout current="/engine-features" onNavigate={onNavigate} onSignIn={() => onNavigate('/')}>
      <section className="max-w-[1280px] mx-auto px-6 pt-16 pb-8">
        <SectionHeading
          eyebrow="Engine Features"
          title="Everything the match engine does for you"
          subtitle="From the first crawl to the reply in your inbox — an end-to-end outbound recruiting pipeline that runs itself."
        />
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {SECTIONS.map(s => (
            <div key={s.title} className="rounded-2xl border border-white/8 bg-white/[0.02] p-6 hover:bg-white/[0.04] transition-colors">
              <div className="w-11 h-11 rounded-xl bg-indigo-500/10 border border-indigo-400/20 flex items-center justify-center mb-4">
                <s.icon className="w-5 h-5 text-indigo-300" />
              </div>
              <h3 className="text-white font-bold text-[15px] mb-2">{s.title}</h3>
              <p className="text-[13px] text-gray-400 leading-relaxed">{s.body}</p>
            </div>
          ))}
        </div>

        <div className="mt-14 text-center">
          <button
            onClick={() => onNavigate('/pricing')}
            className="inline-flex items-center gap-2 bg-gradient-to-br from-indigo-500 to-violet-600 hover:from-indigo-400 hover:to-violet-500 text-white font-semibold text-sm rounded-xl px-6 py-3 transition-colors shadow-lg shadow-indigo-900/30"
          >
            See pricing &amp; estimate your costs
          </button>
        </div>
      </section>
    </MarketingLayout>
  );
}
