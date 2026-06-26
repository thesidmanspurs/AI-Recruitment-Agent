import { useState } from 'react';
import { ChevronDown, ArrowRight, MessageCircle } from 'lucide-react';
import { MarketingShell } from '../../components/marketing/MarketingShell';

interface PageProps {
  onNavigate: (to: string) => void;
  authed?: boolean;
  onOpenWorkspace?: () => void;
}

type Category = 'All' | 'Credits' | 'Sourcing' | 'Outreach' | 'Security' | 'Teams';

const FAQS: { q: string; a: string; cat: Category }[] = [
  {
    cat: 'Credits',
    q: 'What exactly costs a credit?',
    a: "Only revealing a candidate's verified email or phone via Apollo — 1 credit per reveal. Sourcing candidates, AI match-scoring, deep scoring, and drafting outreach are all free and unlimited. You can run a full campaign and shortlist 50 candidates before spending anything.",
  },
  {
    cat: 'Credits',
    q: 'How does the Start Tier subscription work?',
    a: "$149/month grants 2,000 fresh credits at the start of every billing cycle. Unused credits don't roll over, but Top-Up credits (purchased separately) never expire. Cancel anytime from the Stripe billing portal inside the app — no contracts, no penalty.",
  },
  {
    cat: 'Credits',
    q: 'What if I run out of credits mid-month?',
    a: "Buy a Top-Up Pack: $65 for 1,000 additional credits. Top-up credits stack on top of your subscription balance and never expire — so buying in advance always makes sense if you have a high-volume month coming up.",
  },
  {
    cat: 'Credits',
    q: 'Can I use TalentScanr without a subscription?',
    a: "Sourcing, scoring, and outreach drafting are free to use without a subscription. You only need the Start Tier subscription (or a Top-Up Pack) when you want to reveal contact details via Apollo. If you never need contact reveals, the platform is effectively free.",
  },
  {
    cat: 'Sourcing',
    q: 'Where does candidate data come from?',
    a: "TalentScanr sources from three platforms simultaneously: LinkedIn profiles via Apollo's verified database, active contributors in domain-relevant Reddit communities, and GitHub users whose public repositories match your technical requirements. All three run in parallel and merge into a single candidate table.",
  },
  {
    cat: 'Sourcing',
    q: 'How are candidates scored?',
    a: "Each candidate gets a 0–10 fit score from a semantic comparison between their public profile and your extracted job spec. You set a suitability threshold — anyone below it moves to a separate queue. On-demand deep scoring runs a Gemini research pass on the candidate's full public profile and applies your must-have / nice-to-have rubric explicitly, with a written evidence-backed explanation.",
  },
  {
    cat: 'Sourcing',
    q: 'Can I export my candidate data?',
    a: "Yes — full CSV export at any time from within a campaign. The export includes candidate names, profiles, scores, source platforms, enriched contact details, and outreach history. Your data is yours and never locked in the platform.",
  },
  {
    cat: 'Outreach',
    q: 'Which email address can I send outreach from?',
    a: "Your own. Connect a Gmail account via App Password, or use a Resend-verified custom domain (e.g. recruiting@yourcompany.com). Every outreach email is sent from your real address — not a shared TalentScanr pool. Replies go directly to your inbox, and your sender reputation is entirely under your control.",
  },
  {
    cat: 'Outreach',
    q: 'How personalised is the AI-drafted outreach?',
    a: "Gemini reads the candidate's actual public profile — their current role, employer, career history, and listed skills — alongside your job spec, and writes a unique message for each candidate. It's not a template with a name substituted in. You review every draft in the built-in editor before sending.",
  },
  {
    cat: 'Security',
    q: 'Is my data secure?',
    a: "Credentials (API keys, App Passwords) are encrypted at rest using AES-256-GCM and never returned to the browser after storage. Auth tokens are httpOnly, SameSite=Strict cookies. Payments are processed by Stripe — we never store or handle card data. The platform runs on Google Cloud Run with SOC2-aligned infrastructure and automated backups.",
  },
  {
    cat: 'Teams',
    q: 'Can my whole agency use it?',
    a: "Yes. Each recruiter gets isolated campaigns, their own sending identity, and an individual credit balance. Campaign data, candidate lists, outreach history, and contact reveals are strictly separated between seats — no recruiter can see another's pipeline. Admins can manage seats, reset passwords, and view credit balances from the Admin panel.",
  },
  {
    cat: 'Teams',
    q: 'How does multi-client work for agencies?',
    a: "Each campaign is completely isolated. Run a search for Client A and a search for Client B in the same workspace — their candidate pools, enriched contacts, and outreach histories never cross. Export each campaign separately for client reporting. Credits are shared across the organisation but consumed per-reveal, so you control exactly how much is spent per search.",
  },
];

const CATEGORIES: Category[] = ['All', 'Credits', 'Sourcing', 'Outreach', 'Security', 'Teams'];

const CAT_STYLE: Record<Category, { dot: string; activeBg: string; activeText: string; activeBorder: string; openBg: string; openBorder: string; openText: string }> = {
  All:      { dot: 'bg-gray-400',    activeBg: 'bg-gray-900',    activeText: 'text-white',       activeBorder: 'border-gray-900',    openBg: 'bg-gray-50',     openBorder: 'border-gray-100',   openText: 'text-gray-600' },
  Credits:  { dot: 'bg-amber-400',   activeBg: 'bg-amber-50',    activeText: 'text-amber-700',   activeBorder: 'border-amber-200',   openBg: 'bg-amber-50',    openBorder: 'border-amber-100',  openText: 'text-amber-800' },
  Sourcing: { dot: 'bg-sky-400',     activeBg: 'bg-sky-50',      activeText: 'text-sky-700',     activeBorder: 'border-sky-200',     openBg: 'bg-sky-50',      openBorder: 'border-sky-100',    openText: 'text-sky-800' },
  Outreach: { dot: 'bg-violet-400',  activeBg: 'bg-violet-50',   activeText: 'text-violet-700',  activeBorder: 'border-violet-200',  openBg: 'bg-violet-50',   openBorder: 'border-violet-100', openText: 'text-violet-800' },
  Security: { dot: 'bg-emerald-400', activeBg: 'bg-emerald-50',  activeText: 'text-emerald-700', activeBorder: 'border-emerald-200', openBg: 'bg-emerald-50',  openBorder: 'border-emerald-100',openText: 'text-emerald-800' },
  Teams:    { dot: 'bg-rose-400',    activeBg: 'bg-rose-50',     activeText: 'text-rose-700',    activeBorder: 'border-rose-200',    openBg: 'bg-rose-50',     openBorder: 'border-rose-100',   openText: 'text-rose-800' },
};

export function FaqPage({ onNavigate, authed, onOpenWorkspace }: PageProps) {
  const [open, setOpen] = useState<number | null>(0);
  const [cat, setCat] = useState<Category>('All');

  const filtered = FAQS.filter(f => cat === 'All' || f.cat === cat);

  return (
    <MarketingShell current="faq" onNavigate={onNavigate} authed={authed} onOpenWorkspace={onOpenWorkspace}>

      {/* ── HERO ──────────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-white border-b border-gray-100">
        <div className="absolute inset-0 pointer-events-none"
          style={{ backgroundImage: 'radial-gradient(ellipse 80% 50% at 50% -20%, rgba(245,158,11,0.08), transparent)' }} />
        <div className="relative max-w-6xl mx-auto px-6 pt-20 pb-20 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-amber-200 bg-amber-50 text-amber-600 text-[12px] font-mono uppercase tracking-wider mb-8">
            <MessageCircle className="w-3.5 h-3.5" />
            Frequently asked questions
          </div>
          <h1 className="text-6xl font-normal text-gray-900 max-w-3xl mx-auto mb-5 leading-tight"
            style={{ fontFamily: "'DM Serif Display', serif" }}>
            Everything you want<br /><span className="italic text-amber-600">to know</span>
          </h1>
          <p className="text-lg text-gray-500 max-w-lg mx-auto">
            From credits to GDPR — we've written down every answer we've given more than twice.
          </p>
        </div>
      </section>

      {/* ── QUICK STATS ───────────────────────────────────────────────────────── */}
      <section className="bg-amber-50 border-b border-amber-100">
        <div className="max-w-6xl mx-auto px-6 py-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-amber-100 rounded-2xl overflow-hidden">
            {[
              { value: '$0', label: 'To source & score', icon: '🔍' },
              { value: '1 credit', label: 'Per contact reveal', icon: '⚡' },
              { value: '$65', label: '1,000 top-up credits', icon: '💳' },
              { value: '0', label: 'Lock-in or contracts', icon: '🔓' },
            ].map(s => (
              <div key={s.label} className="bg-white px-8 py-7 flex flex-col gap-1">
                <span className="text-2xl mb-1">{s.icon}</span>
                <span className="text-3xl font-normal text-amber-600" style={{ fontFamily: "'DM Serif Display', serif" }}>
                  {s.value}
                </span>
                <span className="text-[12px] text-gray-500">{s.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CATEGORY FILTER + ACCORDION ───────────────────────────────────────── */}
      <section className="bg-white border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-6 py-16">

          {/* Category chips */}
          <div className="flex flex-wrap gap-2 justify-center mb-10">
            {CATEGORIES.map(c => {
              const s = CAT_STYLE[c];
              const isActive = cat === c;
              return (
                <button key={c} onClick={() => { setCat(c); setOpen(null); }}
                  className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-[13px] font-semibold border transition-all ${
                    isActive
                      ? `${s.activeBg} ${s.activeText} ${s.activeBorder}`
                      : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300 hover:text-gray-700'
                  }`}>
                  {c !== 'All' && <span className={`w-2 h-2 rounded-full ${isActive ? s.dot : 'bg-gray-300'}`} />}
                  {c}
                </button>
              );
            })}
          </div>

          {/* Accordion */}
          <div className="max-w-3xl mx-auto space-y-2">
            {filtered.map((faq, i) => {
              const isOpen = open === i;
              const s = CAT_STYLE[faq.cat];
              return (
                <div key={i}
                  className={`rounded-2xl border overflow-hidden transition-all ${
                    isOpen ? 'border-gray-200 shadow-sm' : 'border-gray-150 hover:border-gray-200'
                  } bg-white`}
                  style={{ borderColor: isOpen ? undefined : '#efefef' }}>
                  <button onClick={() => setOpen(isOpen ? null : i)}
                    className="w-full flex items-start gap-4 px-6 py-5 text-left hover:bg-gray-50 transition-colors">
                    <span className={`mt-1.5 w-2 h-2 rounded-full shrink-0 ${s.dot}`} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4">
                        <p className="text-[15px] font-semibold text-gray-900 leading-snug pr-2">{faq.q}</p>
                        <div className={`shrink-0 w-7 h-7 rounded-full flex items-center justify-center transition-all border ${
                          isOpen
                            ? `${s.activeBg} ${s.activeText} ${s.activeBorder}`
                            : 'bg-gray-100 border-gray-200 text-gray-400'
                        }`}>
                          <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
                        </div>
                      </div>
                      {cat === 'All' && (
                        <span className={`text-[10px] font-mono uppercase tracking-wider ${s.activeText} mt-1 block`}>
                          {faq.cat}
                        </span>
                      )}
                    </div>
                  </button>

                  {isOpen && (
                    <div className="px-6 pb-6 pl-[3.25rem]">
                      <div className={`rounded-xl px-5 py-4 border ${s.openBg} ${s.openBorder}`}>
                        <p className={`text-[14px] leading-relaxed ${s.openText}`}>{faq.a}</p>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Support callout */}
          <div className="max-w-3xl mx-auto mt-10">
            <div className="flex flex-col sm:flex-row items-center gap-6 bg-gray-50 border border-gray-200 rounded-2xl px-8 py-7">
              <div className="w-12 h-12 rounded-2xl bg-white border border-gray-200 flex items-center justify-center shrink-0 text-2xl shadow-sm">
                💬
              </div>
              <div className="flex-1 text-center sm:text-left">
                <p className="text-[15px] font-semibold text-gray-900 mb-1">Still have a question?</p>
                <p className="text-[13px] text-gray-500">We answer within one business day. No bots — a human replies.</p>
              </div>
              <a href="mailto:support@talentscanr.com"
                className="shrink-0 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gray-900 text-white text-[14px] font-semibold hover:bg-gray-800 transition-colors">
                Email support <ArrowRight className="w-4 h-4" />
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA ───────────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-gray-50 border-t border-gray-100">
        <div className="relative max-w-6xl mx-auto px-6 py-24 text-center">
          <h2 className="text-5xl font-normal text-gray-900 mb-5" style={{ fontFamily: "'DM Serif Display', serif" }}>
            Ready to try it?
          </h2>
          <p className="text-gray-500 text-lg max-w-lg mx-auto mb-10">
            Source, score, and draft your first outreach message in under five minutes.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <button onClick={() => onNavigate('/register')}
              className="inline-flex items-center gap-2 px-8 py-4 rounded-xl font-semibold text-[16px] text-white transition-all"
              style={{ background: 'linear-gradient(135deg, #7c3aed, #6366f1)', boxShadow: '0 4px 20px rgba(124,58,237,0.25)' }}>
              Create free account <ArrowRight className="w-4 h-4" />
            </button>
            <button onClick={() => onNavigate('/pricing')}
              className="inline-flex items-center gap-2 px-8 py-4 rounded-xl border border-gray-200 hover:border-gray-400 text-gray-600 hover:text-gray-900 font-medium text-[16px] transition-colors bg-white">
              View pricing
            </button>
          </div>
        </div>
      </section>

    </MarketingShell>
  );
}
