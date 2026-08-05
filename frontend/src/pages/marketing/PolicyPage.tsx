import { ShieldCheck, FileText, Globe, ArrowRight, Lock } from 'lucide-react';
import { MarketingShell } from '../../components/marketing/MarketingShell';

interface PageProps {
  onNavigate: (to: string) => void;
  authed?: boolean;
  onOpenWorkspace?: () => void;
}

/**
 * Public legal / trust page — Privacy Policy, Terms of Use, and GDPR &
 * public-sourcing principles. Content mirrors policy.md. Linked from the
 * marketing footer ("Privacy & Terms"). Uses the light marketing shell.
 */

type Clause = { heading: string; body: string };
type Section = { id: string; icon: typeof ShieldCheck; eyebrow: string; title: string; intro: string; clauses: Clause[] };

const SECTIONS: Section[] = [
  {
    id: 'privacy',
    icon: ShieldCheck,
    eyebrow: 'Privacy Policy',
    title: 'Public Sourcing Principles',
    intro:
      'TalentScanr acts as a custom search aggregator that operates under secure, compliant, and transparent parameters. We strictly protect privacy limits by restricting candidate profiling only to public domain information.',
    clauses: [
      {
        heading: '1. Scope of Data Sourced',
        body:
          'TalentScanr compiles publicly available domain information to assist talent acquisition teams. We analyse and present professional data from the following source points to evaluate specific fit alignment:\n\n' +
          '• Professional Registries & Platforms (LinkedIn, etc.): Static titles, publicly available job histories, highlighted certs, and skill designations listed as visible to the public internet.\n\n' +
          '• Public Tech Communities (GitHub, Reddit, Upwork): Verified links, active open-source contributions, public forum responses tagging certain technologies, and developer portfolios representing declared project experience.\n\n' +
          '• Apollo Data Provider Registries: Validated professional business communication contacts, organizational lookups, and secondary phone records fetched under licensed commercial distribution agreements.',
      },
      {
        heading: '2. Processing Legitimacy',
        body:
          'Processing of public domain talent profiles is validated on the grounds of Legitimate Interests under GDPR Article 6(1)(f). Recruiting teams utilize TalentScanr solely to identify technical specialists for relevant career advancements, maintaining high respect for candidates’ field expertise.',
      },
      {
        heading: '3. Workspace Data Portability & Isolation',
        body:
          'TalentScanr supports robust multi-tenant environment configurations. When a licensed recruiter shares access with multiple clients, candidate histories, internal evaluation logs, and campaign templates remain strictly isolated at the database schema layer. Clients never cross-pollinate database indicators.',
      },
      {
        heading: '4. Opt-Out and Deletion Channel',
        body:
          'Any professional may request absolute deletion of their matching logs from our index. Requests are processed within 24 business hours. If you wish to purge your profile records from our lookups, please contact our compliance desk at privacy@TalentScanr-outbound.com.',
      },
    ],
  },
  {
    id: 'terms',
    icon: FileText,
    eyebrow: 'Terms of Use',
    title: 'Workspace Conduct & Shared Licensing',
    intro:
      'Please read these conditions carefully before activating recruiter licenses. By deploying matching credit pipelines on TalentScanr, you agree to protect recipient communication standards.',
    clauses: [
      {
        heading: '1. Recruiter License Allocation',
        body:
          'Recruiter licenses are issued on a seat capacity model. A single Professional seat allocates a massive pool of 4,000 Unified Monthly Credits. Users may pool or partition these credits across campaigns for multiple distinct end-customers, provided each workspace maintains dedicated, verified compliance trackers.',
      },
      {
        heading: '2. Outreach Code of Integrity',
        body:
          'Recruiting teams must agree to utilize Gemini personal text templates in good faith. You are strictly forbidden from generating excessive spam vectors, misleading candidacy descriptions, or using tech integrations to harvest profiles maliciously. Outreach emails must support conspicuous Opt-Out headers.',
      },
      {
        heading: '3. Disclaimer of Response Success',
        body:
          'TalentScanr evaluates match indicators transparently using available public forum statements. However, TalentScanr does not certify, warrant, or guarantee response rates, ultimate placement conversion rates, or candidate qualification validations beyond the score indications dynamically rendered in the panel.',
      },
      {
        heading: '4. Fee Standards and Commitments',
        body:
          'Pricing tiers operate at $149 per seat / month on standard cycles. Refunds are not issued for partly used credit pools, but seats can be re-allocated across internal coordinators dynamically.',
      },
    ],
  },
  {
    id: 'gdpr',
    icon: Globe,
    eyebrow: 'GDPR & Public Sourcing',
    title: 'Compliance with Global Data Directives',
    intro:
      'TalentScanr has built dedicated controls inside our match algorithms to assure rigorous compliance with CCPA rights and European GDPR data protection processing.',
    clauses: [
      {
        heading: 'Data Minimization',
        body:
          'We only load key career credentials, programming languages, and matching forum context points. We never track metadata unrelated to candidate criteria or personal life indicators.',
      },
      {
        heading: 'Tenant Segregation',
        body:
          'When shared with multiple customers/clients, TalentScanr partitions candidate queues into unique, sandboxed workspaces to prevent cross-account leakage of confidential staffing leads.',
      },
      {
        heading: 'De-Identification',
        body:
          'Prior to active enrichment confirmation, sensitive candidate details remain pseudonymized (e.g., “Blagovest Yo***v”). Unlocked profile details require active credit allocation.',
      },
      {
        heading: 'Community API Scruples',
        body:
          'TalentScanr adheres to GitHub’s Developer API Terms, Reddit’s open search endpoints, and public platform robots-exclusion directories, respecting technical request limits uniformly.',
      },
      {
        heading: 'The Sourcing Truth',
        body:
          'TalentScanr does not hack or buy illegal black-market datasets. Profiles represent indices of what engineers have proactively declared publicly. For example, if an engineer shares helpful code projects on GitHub or submits their credentials openly to Reddit recruiting subreddits, TalentScanr captures the lead so match specialists can deliver relevant offers directly.',
      },
    ],
  },
];

export function PolicyPage({ onNavigate, authed, onOpenWorkspace }: PageProps) {
  return (
    <MarketingShell current="policy" onNavigate={onNavigate} authed={authed} onOpenWorkspace={onOpenWorkspace}>

      {/* ── HERO ──────────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-white dark:bg-[#0a0a0a] border-b border-gray-200/80 dark:border-white/10 transition-colors">
        <div className="absolute inset-0 pointer-events-none"
          style={{ backgroundImage: 'radial-gradient(ellipse 80% 50% at 50% -20%, rgba(16,185,129,0.08), transparent)' }} />
        <div className="relative max-w-6xl mx-auto px-6 pt-20 pb-16 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-emerald-200 dark:border-emerald-500/30 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-300 text-[12px] font-mono uppercase tracking-wider mb-8">
            <Lock className="w-3.5 h-3.5" />
            Trust Centre
          </div>
          <h1 className="text-6xl font-normal text-gray-900 dark:text-white max-w-3xl mx-auto mb-5 leading-tight"
            style={{ fontFamily: "'DM Serif Display', serif" }}>
            Privacy, Terms<br /><span className="italic text-emerald-600 dark:text-emerald-400">& Public Sourcing</span>
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-300 max-w-xl mx-auto">
            Platform rules, public-sourcing compliance, and data protection — written plainly.
          </p>
        </div>
      </section>

      {/* ── CONTENT ───────────────────────────────────────────────────────────── */}
      <section className="bg-white dark:bg-[#0a0a0a] transition-colors">
        <div className="max-w-6xl mx-auto px-6 py-16 grid lg:grid-cols-[220px_1fr] gap-12">

          {/* Sticky section nav */}
          <aside className="hidden lg:block">
            <div className="sticky top-28 space-y-1">
              <p className="text-[11px] font-mono uppercase tracking-wider text-gray-400 dark:text-gray-400 mb-3 px-3">On this page</p>
              {SECTIONS.map(s => (
                <a key={s.id} href={`#${s.id}`}
                  className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-[14px] text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/5 transition-colors">
                  <s.icon className="w-4 h-4 shrink-0 text-emerald-500" />
                  {s.eyebrow}
                </a>
              ))}
            </div>
          </aside>

          {/* Sections */}
          <div className="max-w-3xl space-y-16">
            {SECTIONS.map(section => (
              <div key={section.id} id={section.id} className="scroll-mt-28">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-500/20 border border-emerald-100 dark:border-emerald-500/30 flex items-center justify-center">
                    <section.icon className="w-4.5 h-4.5 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <span className="text-[11px] font-mono uppercase tracking-widest text-gray-400 dark:text-gray-400">{section.eyebrow}</span>
                </div>
                <h2 className="text-3xl font-normal text-gray-900 dark:text-white mb-4" style={{ fontFamily: "'DM Serif Display', serif" }}>
                  {section.title}
                </h2>
                <p className="text-[15px] text-gray-600 dark:text-gray-300 leading-relaxed mb-8 font-normal">{section.intro}</p>

                <div className="space-y-5">
                  {section.clauses.map(clause => (
                    <div key={clause.heading} className="rounded-2xl border border-gray-200 dark:border-white/10 bg-gray-50/60 dark:bg-white/[0.02] px-6 py-5">
                      <h3 className="text-[15px] font-bold text-gray-900 dark:text-white mb-2">{clause.heading}</h3>
                      <p className="text-[14px] text-gray-600 dark:text-gray-300 leading-relaxed whitespace-pre-line font-normal">{clause.body}</p>
                    </div>
                  ))}
                </div>
              </div>
            ))}

            {/* Contact strip */}
            <div className="flex flex-col sm:flex-row items-center gap-6 bg-gray-900 rounded-2xl px-8 py-7">
              <div className="w-12 h-12 rounded-2xl bg-white/10 border border-white/10 flex items-center justify-center shrink-0 text-2xl">
                ✉️
              </div>
              <div className="flex-1 text-center sm:text-left">
                <p className="text-[15px] font-semibold text-white mb-1">Data requests & deletion</p>
                <p className="text-[13px] text-gray-400">
                  Purge requests are processed within 24 business hours via our compliance desk.
                </p>
              </div>
              <a href="mailto:privacy@TalentScanr-outbound.com"
                className="shrink-0 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white text-gray-900 text-[14px] font-semibold hover:bg-gray-100 transition-colors">
                Contact compliance <ArrowRight className="w-4 h-4" />
              </a>
            </div>
          </div>
        </div>
      </section>

    </MarketingShell>
  );
}
