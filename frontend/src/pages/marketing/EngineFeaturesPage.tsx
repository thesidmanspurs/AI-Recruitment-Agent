import { ArrowRight } from 'lucide-react';
import { MarketingShell } from '../../components/marketing/MarketingShell';

interface PageProps {
  onNavigate: (to: string) => void;
  authed?: boolean;
  onOpenWorkspace?: () => void;
}

const FEATURES = [
  { n: '01', title: 'Autonomous community sourcing', body: 'Crawls LinkedIn via Apollo and GitHub contributor graphs simultaneously — both run in parallel and merge into a single candidate table, tagged by source. Reddit community sourcing is coming soon.', tag: 'Sourcing' },
  { n: '02', title: 'Calibrated AI quality gates', body: 'Every candidate scored 0–10 against your extracted job spec using semantic embeddings — not keyword matching. Set a suitability threshold; anyone below it moves to a separate queue. Raw data always preserved.', tag: 'Scoring' },
  { n: '03', title: 'Grounded deep scoring', body: "On demand, Gemini researches a candidate's real public profile and applies your must-have / nice-to-have rubric for a defensible, evidence-backed match score with a written explanation.", tag: 'Scoring' },
  { n: '04', title: 'Personalised outreach drafting', body: "Gemini writes a unique pitch for each candidate from their actual role history and public profile — not a template with a name substituted. You review in the built-in editor before sending.", tag: 'Outreach' },
  { n: '05', title: 'Own-domain sending', body: "Connect Gmail via App Password or Resend for custom domain sending. Every message goes from your address. Replies land in your inbox — not a shared TalentScanr pool.", tag: 'Outreach' },
  { n: '06', title: 'Credit-only enrichment', body: "Sourcing, scoring, and drafting are free. Credits are spent only when you reveal a verified email or phone via Apollo — 1 credit per reveal. Top-Up Packs never expire.", tag: 'Pricing' },
  { n: '07', title: 'Reply tracking & 48h alerts', body: 'Inbox monitoring surfaces replies against the correct candidate automatically. No-response alerts fire at 48 hours so warm leads never go cold — with full context before you follow up.', tag: 'Tracking' },
  { n: '08', title: 'Campaign analytics', body: 'Live pipeline breakdown: sourced, enriched, outreach sent, replied, awaiting follow-up. Channel mix panel shows LinkedIn vs GitHub split. Exportable to CSV any time.', tag: 'Analytics' },
  { n: '09', title: 'Multi-seat workspace isolation', body: 'Each recruiter has isolated campaigns, their own sending identity, and an individual credit balance. Agency consultants can run ten simultaneous client searches with zero cross-contamination.', tag: 'Teams' },
  { n: '10', title: 'SOC2-aligned & encrypted', body: 'Credentials encrypted at rest with AES-256-GCM, never returned to the client. httpOnly, SameSite=Strict auth cookies. Payments via Stripe — no card data ever touches our servers.', tag: 'Security' },
];

const SCORING_STEPS = [
  { n: '1', title: 'Spec extraction', desc: 'Gemini reads your job description and outputs a structured rubric: title, skills, experience thresholds, seniority level, must-haves, and nice-to-haves.' },
  { n: '2', title: 'Profile embedding', desc: "Each candidate's public profile is converted to a semantic vector. Meaning is captured, not just keywords — two different ways of describing the same seniority are close in embedding space." },
  { n: '3', title: 'Semantic distance', desc: 'Cosine distance between profile and job spec embeddings is normalised to 0–10. Scores reflect relative fit within your batch — not an absolute grade against a fixed standard.' },
  { n: '4', title: 'Threshold filter', desc: 'Candidates below your configured minimum score move to the below-threshold queue. Your active shortlist stays clean. Lower the threshold any time to surface more.' },
  { n: '5', title: 'Deep scoring', desc: "For borderline candidates, trigger a Gemini deep pass: full profile research, explicit rubric application, written evidence. The deep score replaces the initial score in the table." },
];

const SOURCES: { name: string; signal: string; pro: string; con: string; comingSoon?: boolean }[] = [
  { name: 'LinkedIn via Apollo', signal: 'Professional visibility', pro: 'Accurate titles, employment history, Apollo-verified work emails available for enrichment.', con: 'Only surfaces people who maintain an active LinkedIn profile.' },
  { name: 'Reddit communities', signal: 'Active domain engagement', comingSoon: true, pro: "Finds practitioners actively contributing to your role's domain — often stronger signal than job titles.", con: 'Profiles are pseudonymous; enrichment requires cross-referencing LinkedIn.' },
  { name: 'GitHub contributors', signal: 'Public code output', pro: "Reveals the actual tech stack a candidate works in — not just what they list on a resume.", con: 'Public repos only; private or corporate work is not visible.' },
];

const FREE_ITEMS = ['Candidate sourcing (all platforms)', 'AI fit scoring 0–10', 'Score threshold filtering', 'Outreach draft generation', 'Outreach editor & send queue', 'Reply tracking & 48h alerts', 'Campaign analytics & CSV export', 'Deep scoring (on-demand)'];
const CREDIT_ITEMS = [{ label: 'Reveal work email via Apollo', cost: '1 credit' }, { label: 'Reveal direct phone via Apollo', cost: '1 credit' }];

const TAG_COLORS: Record<string, string> = {
  Sourcing:  'text-sky-600 dark:text-sky-400 border-sky-200 dark:border-sky-800',
  Scoring:   'text-violet-600 dark:text-violet-400 border-violet-200 dark:border-violet-800',
  Outreach:  'text-indigo-600 dark:text-indigo-400 border-indigo-200 dark:border-indigo-800',
  Pricing:   'text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-800',
  Tracking:  'text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800',
  Analytics: 'text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-800',
  Teams:     'text-orange-600 dark:text-orange-400 border-orange-200 dark:border-orange-800',
  Security:  'text-teal-600 dark:text-teal-400 border-teal-200 dark:border-teal-800',
};

export function EngineFeaturesPage({ onNavigate, authed, onOpenWorkspace }: PageProps) {
  return (
    <MarketingShell current="features" onNavigate={onNavigate} authed={authed} onOpenWorkspace={onOpenWorkspace}>

      {/* ── INTRO ──────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden">
        <style>{`
          .ef-dots {
            background-image: radial-gradient(circle, #d1d5db 1px, transparent 1px);
            background-size: 28px 28px;
          }
          .dark .ef-dots {
            background-image: radial-gradient(circle, #1f2937 1px, transparent 1px);
          }
          .ef-grid {
            background-image:
              linear-gradient(rgba(0,0,0,0.04) 1px, transparent 1px),
              linear-gradient(90deg, rgba(0,0,0,0.04) 1px, transparent 1px);
            background-size: 40px 40px;
          }
          .dark .ef-grid {
            background-image:
              linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px),
              linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px);
          }
        `}</style>

        <div className="ef-dots absolute inset-0 pointer-events-none" />
        <div className="relative max-w-6xl mx-auto px-6 py-20">
          <div className="mb-16 max-w-2xl">
            <p className="text-[11px] font-mono tracking-widest uppercase text-gray-400 dark:text-gray-500 mb-4">01 — Engine features</p>
            <h1 className="text-5xl font-normal text-gray-900 dark:text-white mb-5 leading-tight"
              style={{ fontFamily: "'DM Serif Display', serif" }}>
              Everything the match engine does for you
            </h1>
            <p className="text-lg text-gray-500 dark:text-gray-400 leading-relaxed">
              An end-to-end outbound recruiting pipeline — sourcing, scoring, enrichment, and personalised outreach — built around three primitives: semantic fit scoring, Apollo contact enrichment, and Gemini-drafted outreach.
            </p>
          </div>

          {/* Feature cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-px bg-gray-200 dark:bg-gray-700 border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden shadow-sm">
            {FEATURES.map(s => (
              <div key={s.title} className="bg-white dark:bg-gray-900 p-7 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-[11px] font-mono text-gray-400 dark:text-gray-500 tracking-wider">{s.n}</span>
                  <span className={`text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 border rounded ${TAG_COLORS[s.tag] ?? 'text-gray-400 dark:text-gray-500 border-gray-200 dark:border-gray-700'}`}>{s.tag}</span>
                </div>
                <h3 className="text-[15px] font-semibold text-gray-900 dark:text-white mb-2">{s.title}</h3>
                <p className="text-[13px] text-gray-500 dark:text-gray-400 leading-relaxed">{s.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW SCORING WORKS ─────────────────────────────────────────────── */}
      <section className="bg-gray-900 border-y border-gray-800">
        <div className="max-w-6xl mx-auto px-6 py-20">
          <div className="mb-12">
            <p className="text-[11px] font-mono tracking-widest uppercase text-gray-500 mb-4">02 — Scoring system</p>
            <h2 className="text-4xl font-normal text-white max-w-2xl mb-4"
              style={{ fontFamily: "'DM Serif Display', serif" }}>
              How the 0–10 fit score is calculated
            </h2>
            <p className="text-base text-gray-400 max-w-2xl leading-relaxed">
              Two passes: a fast semantic score for every candidate, and an on-demand Gemini deep pass for borderline cases.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-5 gap-4">
            {SCORING_STEPS.map(step => (
              <div key={step.n} className="flex flex-col items-start gap-3">
                <div className="w-8 h-8 border-2 border-violet-500 rounded-full flex items-center justify-center shrink-0">
                  <span className="text-[12px] font-bold text-violet-400">{step.n}</span>
                </div>
                <div>
                  <h3 className="text-[13px] font-semibold text-white mb-1.5">{step.title}</h3>
                  <p className="text-[12px] text-gray-400 leading-relaxed">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-10 grid grid-cols-3 gap-4">
            {[
              { range: '7–10', label: 'Strong fit', desc: 'Profile closely matches the role. Prioritise enrichment.', color: 'border-emerald-700 bg-emerald-950/40' },
              { range: '4–6', label: 'Moderate fit', desc: 'Relevant experience, may be missing specific requirements.', color: 'border-amber-700 bg-amber-950/30' },
              { range: '0–3', label: 'Weak fit', desc: 'Low match for this spec — likely below your threshold.', color: 'border-gray-700 bg-gray-800/40' },
            ].map(band => (
              <div key={band.range} className={`border rounded-lg p-5 ${band.color}`}>
                <p className="text-2xl font-normal text-white mb-1"
                  style={{ fontFamily: "'DM Serif Display', serif" }}>{band.range}</p>
                <p className="text-[12px] font-semibold text-gray-300 mb-1">{band.label}</p>
                <p className="text-[12px] text-gray-400 leading-relaxed">{band.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── SOURCING BREAKDOWN ────────────────────────────────────────────── */}
      <section className="relative overflow-hidden">
        <div className="ef-grid absolute inset-0 pointer-events-none" />
        <div className="relative max-w-6xl mx-auto px-6 py-20">
          <div className="mb-12">
            <p className="text-[11px] font-mono tracking-widest uppercase text-gray-400 dark:text-gray-500 mb-4">03 — Sourcing explained</p>
            <h2 className="text-4xl font-normal text-gray-900 dark:text-white max-w-xl mb-4"
              style={{ fontFamily: "'DM Serif Display', serif" }}>
              Where the candidates come from
            </h2>
            <p className="text-base text-gray-500 dark:text-gray-400 max-w-2xl leading-relaxed">
              Three platforms, three kinds of signal. Each source finds candidates the other two miss — which is why all three run in parallel.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {SOURCES.map((s, i) => {
              const accents = ['border-sky-500 dark:border-sky-600', 'border-orange-500 dark:border-orange-600', 'border-teal-500 dark:border-teal-600'];
              const headerBgs = ['bg-sky-50 dark:bg-sky-950/40', 'bg-orange-50 dark:bg-orange-950/30', 'bg-teal-50 dark:bg-teal-950/30'];
              return (
                <div key={s.name} className={`relative border-2 ${accents[i]} rounded-xl overflow-hidden bg-white dark:bg-gray-900 shadow-sm ${s.comingSoon ? 'opacity-90' : ''}`}>
                  {s.comingSoon && (
                    <span className="absolute top-3 right-3 z-10 text-[10px] font-bold uppercase tracking-wider bg-orange-500 text-white px-2.5 py-1 rounded-full shadow-sm">
                      Coming soon
                    </span>
                  )}
                  <div className={`${headerBgs[i]} border-b border-gray-100 dark:border-gray-800 px-6 py-5`}>
                    <h3 className="text-[15px] font-semibold text-gray-900 dark:text-white mb-1">{s.name}</h3>
                    <p className="text-[11px] font-mono uppercase tracking-wider text-gray-400 dark:text-gray-500">{s.comingSoon ? 'Not yet live' : s.signal}</p>
                  </div>
                  <div className="px-6 py-5 space-y-4">
                    <div>
                      <p className="text-[11px] font-mono uppercase tracking-wider text-emerald-600 dark:text-emerald-400 mb-1.5">Strength</p>
                      <p className="text-[13px] text-gray-600 dark:text-gray-400 leading-relaxed">{s.pro}</p>
                    </div>
                    <div>
                      <p className="text-[11px] font-mono uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-1.5">Limitation</p>
                      <p className="text-[13px] text-gray-400 dark:text-gray-500 leading-relaxed">{s.con}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── PULL QUOTE ────────────────────────────────────────────────────── */}
      <section className="bg-gray-950">
        <div className="max-w-4xl mx-auto px-6 py-20 text-center">
          <p className="text-3xl md:text-4xl font-normal text-white leading-relaxed mb-5"
            style={{ fontFamily: "'DM Serif Display', serif" }}>
            "A unique pitch for each candidate —<br />
            <span className="italic">written from their actual profile."</span>
          </p>
          <p className="text-[12px] font-mono uppercase tracking-wider text-gray-500">
            Gemini · No templates · Review before sending
          </p>
        </div>
      </section>

      {/* ── OUTREACH SYSTEM ───────────────────────────────────────────────── */}
      <section className="bg-slate-50 dark:bg-gray-900 border-y border-slate-200 dark:border-gray-700">
        <div className="max-w-6xl mx-auto px-6 py-20">
          <div className="mb-12">
            <p className="text-[11px] font-mono tracking-widest uppercase text-gray-400 dark:text-gray-500 mb-4">04 — Outreach system</p>
            <h2 className="text-4xl font-normal text-gray-900 dark:text-white max-w-xl mb-4"
              style={{ fontFamily: "'DM Serif Display', serif" }}>
              How outreach is drafted and sent
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {[
              { label: 'Draft generation', icon: '✍️', desc: "Gemini reads the candidate's visible profile and your job spec. The draft references their current role, company, and one or two specific aspects relevant to the opportunity." },
              { label: 'Sender identity', icon: '📧', desc: 'Connect Gmail via App Password or Resend custom domain. Every message goes from your address. TalentScanr only monitors for replies to associate them with the right candidate.' },
              { label: '48-hour follow-up', icon: '⏱️', desc: "After each send, a timer starts. If no reply is detected when it fires, the candidate appears in the Alerts panel with their full outreach history. Dismiss, snooze, or send a follow-up." },
            ].map(item => (
              <div key={item.label} className="border border-gray-200 dark:border-gray-700 rounded-xl p-7 bg-white dark:bg-gray-800">
                <div className="text-2xl mb-4">{item.icon}</div>
                <p className="text-[13px] font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300 mb-3">{item.label}</p>
                <p className="text-[13px] text-gray-600 dark:text-gray-400 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CREDIT MODEL ──────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden">
        <div className="ef-dots absolute inset-0 pointer-events-none" />
        <div className="relative max-w-6xl mx-auto px-6 py-20">
          <div className="mb-12">
            <p className="text-[11px] font-mono tracking-widest uppercase text-gray-400 dark:text-gray-500 mb-4">05 — Credit model</p>
            <h2 className="text-4xl font-normal text-gray-900 dark:text-white max-w-2xl mb-4"
              style={{ fontFamily: "'DM Serif Display', serif" }}>
              What you don't pay for
            </h2>
            <p className="text-base text-gray-500 dark:text-gray-400 max-w-2xl leading-relaxed">
              Evaluate before you spend. Credits only at the reveal step.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div>
              <p className="text-[11px] font-mono uppercase tracking-wider text-emerald-600 dark:text-emerald-400 mb-4">Free — unlimited</p>
              <div className="grid grid-cols-2 gap-3">
                {FREE_ITEMS.map(item => (
                  <div key={item} className="flex items-center gap-2.5 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-3 bg-white dark:bg-gray-900">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                    <span className="text-[12px] text-gray-600 dark:text-gray-400">{item}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="space-y-4">
              <p className="text-[11px] font-mono uppercase tracking-wider text-amber-600 dark:text-amber-400 mb-4">Credit — at reveal only</p>
              {CREDIT_ITEMS.map(item => (
                <div key={item.label} className="flex items-center justify-between border border-amber-200 dark:border-amber-800/60 rounded-lg px-5 py-4 bg-amber-50 dark:bg-amber-950/20">
                  <span className="text-[14px] text-gray-700 dark:text-gray-300">{item.label}</span>
                  <span className="text-[14px] font-semibold text-gray-900 dark:text-white font-mono">{item.cost}</span>
                </div>
              ))}
              <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-5 bg-white dark:bg-gray-900 space-y-2.5">
                <p className="text-[11px] font-mono uppercase tracking-wider text-gray-500 dark:text-gray-400">Pack pricing</p>
                <div className="flex justify-between text-[13px]">
                  <span className="text-gray-600 dark:text-gray-400">Start Tier — 2,000 credits/month</span>
                  <span className="font-semibold text-gray-900 dark:text-white">$149/mo</span>
                </div>
                <div className="flex justify-between text-[13px]">
                  <span className="text-gray-600 dark:text-gray-400">Top-Up Pack — 1,000 credits, no expiry</span>
                  <span className="font-semibold text-gray-900 dark:text-white">$65</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── SECURITY ──────────────────────────────────────────────────────── */}
      <section className="bg-gray-900 border-y border-gray-800">
        <div className="max-w-6xl mx-auto px-6 py-16">
          <div className="mb-10">
            <p className="text-[11px] font-mono tracking-widest uppercase text-gray-500 mb-4">06 — Security</p>
            <h2 className="text-3xl font-normal text-white"
              style={{ fontFamily: "'DM Serif Display', serif" }}>
              Infrastructure and data handling
            </h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Credential encryption', value: 'AES-256-GCM at rest', color: 'border-teal-700 bg-teal-950/30' },
              { label: 'Auth cookies', value: 'httpOnly + SameSite=Strict', color: 'border-sky-700 bg-sky-950/30' },
              { label: 'Payments', value: 'Stripe · no card data stored', color: 'border-violet-700 bg-violet-950/30' },
              { label: 'Data export', value: 'Full CSV · any time', color: 'border-emerald-700 bg-emerald-950/30' },
            ].map(item => (
              <div key={item.label} className={`border rounded-lg p-5 ${item.color}`}>
                <p className="text-[11px] font-mono uppercase tracking-wider text-gray-400 mb-2">{item.label}</p>
                <p className="text-[14px] font-semibold text-white leading-snug">{item.value}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FOOTER NAV ────────────────────────────────────────────────────── */}
      <section className="bg-gray-950">
        <div className="max-w-6xl mx-auto px-6 py-20 grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
          <div>
            <p className="text-[11px] font-mono tracking-widest uppercase text-gray-500 mb-4">07 — Next step</p>
            <h2 className="text-4xl font-normal text-white mb-3"
              style={{ fontFamily: "'DM Serif Display', serif" }}>
              See the pricing model
            </h2>
            <p className="text-[14px] text-gray-400 leading-relaxed">
              Start Tier subscription, Top-Up Pack pricing, and a credit calculator to estimate monthly spend — all on the pricing page.
            </p>
          </div>
          <div className="flex flex-col gap-3 md:items-end">
            <button onClick={() => onNavigate('/pricing')}
              className="inline-flex items-center gap-2 px-6 py-3 bg-white hover:bg-gray-100 text-black rounded font-semibold text-[14px] transition-colors">
              See pricing <ArrowRight className="w-4 h-4" />
            </button>
            <button onClick={() => onNavigate('/register')}
              className="inline-flex items-center gap-2 px-6 py-3 border border-gray-700 hover:border-gray-500 text-gray-300 hover:text-white rounded font-medium text-[14px] transition-colors">
              Create free account
            </button>
          </div>
        </div>
      </section>

    </MarketingShell>
  );
}
