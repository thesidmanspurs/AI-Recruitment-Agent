import { useState } from 'react';
import { ChevronDown, ArrowRight } from 'lucide-react';
import { MarketingShell, MarketingHeading } from '../../components/marketing/MarketingShell';

interface PageProps {
  onNavigate: (to: string) => void;
  authed?: boolean;
  onOpenWorkspace?: () => void;
}

const FAQS = [
  { q: 'What exactly costs a credit?', a: 'Only revealing a candidate’s email or phone via Apollo — 1 credit per reveal. Sourcing candidates, AI match-scoring, deep scoring, and drafting outreach are all free and unlimited.' },
  { q: 'How does the Start Tier subscription work?', a: 'It’s $149/month and grants 2,000 fresh credits at the start of every billing cycle. Cancel anytime from the Stripe billing portal inside the app — no contracts.' },
  { q: 'What if I run out of credits mid-month?', a: 'Buy a Top-Up Pack: $65 for 1,000 additional credits. Top-up credits never expire and stack on top of your subscription balance.' },
  { q: 'Where does candidate data come from?', a: 'Aries searches public tech communities and professional sources and resolves verified records through Apollo. Contact details are only fetched when you explicitly reveal a candidate.' },
  { q: 'Which email can I send outreach from?', a: 'Your own. Connect a Gmail App Password or request an admin-configured Resend sending domain. There’s no shared mailbox, so your deliverability and reputation stay yours.' },
  { q: 'How are candidates scored?', a: 'Each candidate gets a 0–10 match score against your job spec. You set a suitability threshold; anyone below it is held in a separate queue. On-demand deep scoring has Gemini research the real profile and apply your must-have / nice-to-have rubric.' },
  { q: 'Is my data secure?', a: 'Credentials are AES-256-GCM encrypted at rest and never returned to the browser. Payments are processed by Stripe — we never store card data. The platform is SOC2-aligned.' },
  { q: 'Can my whole agency use it?', a: 'Yes. Each recruiter gets isolated campaigns, their own sending identity, and an individual credit balance. It’s built for multi-seat agency use.' },
];

export function FaqPage({ onNavigate, authed, onOpenWorkspace }: PageProps) {
  const [open, setOpen] = useState<number | null>(0);
  return (
    <MarketingShell current="faq" onNavigate={onNavigate} authed={authed} onOpenWorkspace={onOpenWorkspace}>
      <MarketingHeading
        eyebrow="Platform FAQs"
        title="Frequently Asked Questions"
        subtitle="Everything you need to know about credits, sourcing, and getting started."
      />
      <div className="max-w-3xl mx-auto space-y-4">
        {FAQS.map((faq, i) => {
          const isOpen = open === i;
          return (
            <div key={i} className="bg-slate-950/40 border border-slate-900 rounded-2xl overflow-hidden">
              <button onClick={() => setOpen(isOpen ? null : i)}
                className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-slate-900/40 transition">
                <span className="text-xs sm:text-sm font-bold text-slate-200">{faq.q}</span>
                <ChevronDown className={`w-4 h-4 text-slate-500 transition-transform ${isOpen ? 'rotate-180 text-indigo-400' : ''}`} />
              </button>
              {isOpen && <div className="px-6 pb-5 pt-1 text-xs text-slate-400 leading-relaxed font-medium border-t border-slate-900/60">{faq.a}</div>}
            </div>
          );
        })}
      </div>
      <div className="mt-12 text-center max-w-md mx-auto rounded-3xl border border-slate-900 bg-slate-950/40 p-8">
        <h3 className="text-white font-bold text-lg">Still have questions?</h3>
        <p className="text-xs text-slate-400 mt-2 mb-5">Jump in and explore the engine — sourcing and scoring are free.</p>
        <button onClick={() => onNavigate('/')}
          className="inline-flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-bold text-xs rounded-xl px-6 py-3 transition shadow-md shadow-indigo-600/10">
          Open the Recruiter Console <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </MarketingShell>
  );
}
