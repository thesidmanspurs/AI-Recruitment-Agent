import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { MarketingLayout, SectionHeading } from '../../components/marketing/MarketingLayout';

interface PageProps {
  onNavigate: (to: string) => void;
}

const FAQS = [
  {
    q: 'What exactly costs a credit?',
    a: 'Only revealing a candidate’s email or phone number via Apollo. That’s 1 credit per reveal. Sourcing candidates, AI match-scoring, deep scoring, and drafting outreach are all free and unlimited.',
  },
  {
    q: 'How does the Start Tier subscription work?',
    a: 'It’s $149/month. You receive 2,000 fresh credits at the start of every billing cycle. You can cancel anytime from the Stripe billing portal inside the app — no contracts.',
  },
  {
    q: 'What if I run out of credits mid-month?',
    a: 'Buy a Top-Up Pack: $65 for 1,000 additional credits. Top-up credits don’t expire and stack on top of your subscription balance. Buy as many as you need.',
  },
  {
    q: 'Where does candidate data come from?',
    a: 'Aries searches public tech communities and professional sources and resolves verified records through Apollo. Contact details are only fetched when you explicitly reveal a candidate.',
  },
  {
    q: 'Which email can I send outreach from?',
    a: 'Your own. Connect a Gmail account with an App Password, or request an admin-configured Resend sending domain. There’s no shared mailbox, so your deliverability and reputation stay yours.',
  },
  {
    q: 'How are candidates scored?',
    a: 'Each candidate gets a 0–10 match score against your job spec. You set a suitability threshold; anyone below it is held in a separate queue. On-demand “deep scoring” has Gemini research the real profile and apply your must-have / nice-to-have rubric.',
  },
  {
    q: 'Is my data secure?',
    a: 'Credentials (email passwords, API keys) are AES-256-GCM encrypted at rest and never returned to the browser. Payments are processed by Stripe — we never store card data. The platform is SOC2-aligned.',
  },
  {
    q: 'Can my whole agency use it?',
    a: 'Yes. Each recruiter gets isolated campaigns, their own sending identity, and an individual credit balance. It’s built for multi-seat agency use.',
  },
];

export function FaqPage({ onNavigate }: PageProps) {
  const [open, setOpen] = useState<number | null>(0);
  return (
    <MarketingLayout current="/faq" onNavigate={onNavigate} onSignIn={() => onNavigate('/')}>
      <section className="max-w-[820px] mx-auto px-6 pt-16 pb-8">
        <SectionHeading
          eyebrow="Platform FAQs"
          title="Questions, answered"
          subtitle="Everything you need to know about credits, sourcing, and getting started."
        />
        <div className="flex flex-col gap-3">
          {FAQS.map((item, i) => {
            const isOpen = open === i;
            return (
              <div key={item.q} className="rounded-xl border border-white/8 bg-white/[0.02] overflow-hidden">
                <button
                  onClick={() => setOpen(isOpen ? null : i)}
                  className="w-full flex items-center justify-between gap-4 px-5 py-4 text-left"
                >
                  <span className="text-[14px] font-semibold text-white">{item.q}</span>
                  <ChevronDown className={`w-4 h-4 text-gray-400 shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                </button>
                {isOpen && (
                  <div className="px-5 pb-4 -mt-1 text-[13px] text-gray-400 leading-relaxed">{item.a}</div>
                )}
              </div>
            );
          })}
        </div>

        <div className="mt-12 text-center rounded-2xl border border-white/8 bg-white/[0.02] p-8">
          <h3 className="text-white font-bold text-lg">Still have questions?</h3>
          <p className="text-[13px] text-gray-400 mt-2 mb-5">Jump in and explore the engine — sourcing and scoring are free.</p>
          <button
            onClick={() => onNavigate('/')}
            className="inline-flex items-center gap-2 bg-gradient-to-br from-indigo-500 to-violet-600 hover:from-indigo-400 hover:to-violet-500 text-white font-semibold text-sm rounded-xl px-6 py-3 transition-colors shadow-lg shadow-indigo-900/30"
          >
            Open the Recruiter Console
          </button>
        </div>
      </section>
    </MarketingLayout>
  );
}
