import { ArrowRight, Zap, Search, Star, Mail as MailIcon, BarChart2, Shield, Trophy, Upload, Sparkles } from 'lucide-react';
import { MarketingShell } from '../../components/marketing/MarketingShell';
const logoSrc = '/logo.png'; // served from frontend/public/logo.png

interface LandingPageProps {
  onLogin: (email: string, password: string) => Promise<void>;
  onNavigate: (to: string) => void;
  authed?: boolean;
  onOpenWorkspace?: () => void;
  onOpenRanking?: () => void;
}

const STEPS = [
  { n: '01', icon: <Search className="w-5 h-5" />, title: 'Define the role', body: 'Upload or paste your job spec. Gemini extracts title, required skills, experience thresholds, and seniority signals into a structured scoring rubric — automatically.' },
  { n: '02', icon: <Zap className="w-5 h-5" />, title: 'Source or upload CVs', body: 'Autonomously crawl LinkedIn & GitHub for passive talent, OR drag-and-drop batches of up to 50 applicant CVs (PDF/DOCX) for instant inbound AI screening.' },
  { n: '03', icon: <Star className="w-5 h-5" />, title: 'Score & rank matches', body: 'Every candidate receives an objective 0–10 AI fit score with key strengths & missing gaps vs your JD. Automatically rank top candidates on a winners stage.' },
  { n: '04', icon: <Shield className="w-5 h-5" />, title: 'Enrich contacts', body: 'Apollo resolves verified work emails and direct phone numbers for approved candidates. One click, one credit, one real contact — no guessing.' },
  { n: '05', icon: <MailIcon className="w-5 h-5" />, title: 'Draft outreach', body: 'Gemini writes a unique pitch for each candidate referencing their actual role history and technical background. Review and edit before sending from your domain.' },
  { n: '06', icon: <BarChart2 className="w-5 h-5" />, title: 'Track and follow up', body: '48-hour no-response alerts fire automatically. Every send, open, reply, and follow-up logged per candidate — no separate CRM needed.' },
];

const COMPARISON = [
  { label: 'Time to first shortlist', traditional: '2–4 weeks', talentscanr: 'Same day' },
  { label: 'Outbound candidate sourcing', traditional: 'Manual LinkedIn search', talentscanr: 'Automated multi-platform crawl' },
  { label: 'Inbound applicant screening', traditional: 'Manual CV scanning (hours)', talentscanr: 'AI Bulk CV Ranking (seconds)' },
  { label: 'Fit assessment', traditional: 'Subjective CV review', talentscanr: 'AI-graded 0–10 score & Strengths/Gaps' },
  { label: 'Personalised outreach', traditional: 'Copy-paste templates', talentscanr: 'Gemini-drafted per candidate' },
  { label: 'Contact enrichment', traditional: 'Separate tool + manual lookup', talentscanr: 'Built-in, 1 click per reveal' },
  { label: 'Candidate privacy', traditional: 'CVs stored in unencrypted drives', talentscanr: '100% In-memory CV parsing' },
  { label: 'Agency fees', traditional: '15–25% of first-year salary', talentscanr: 'Flat $99–$229/month plan' },
];

const PLATFORM_FEATURES = [
  { label: 'Multi-platform sourcing', desc: 'LinkedIn and GitHub in a single pass — Reddit coming soon. No tab switching.' },
  { label: 'AI Bulk CV Ranking', desc: 'Upload up to 50 PDF/DOCX CVs per batch. Screened & ranked 0–10 against your JD.' },
  { label: 'Strengths & Gaps rationale', desc: 'Granular breakdown of candidate qualifications, key highlights, and missing skills.' },
  { label: '100% In-memory privacy', desc: 'Applicant CVs are processed in-memory and never stored on disk for total security.' },
  { label: 'Gemini fit scoring', desc: 'Semantic 0–10 grade. Not keyword density — actual relevance.' },
  { label: 'Apollo contact enrichment', desc: 'Verified emails and phone numbers. 1 credit per reveal.' },
  { label: 'AI outreach drafts', desc: 'Unique pitch per candidate, written from their real profile.' },
  { label: 'Campaign analytics', desc: 'Pipeline breakdown, channel mix, stat cards — live.' },
  { label: 'Exportable data', desc: 'Full CSV export including scores, contacts, and history.' },
];

const BIG_NUMBERS = [
  { n: '50', sub: 'CVs ranked per batch' },
  { n: '0–10', sub: 'AI Match Fit Score' },
  { n: '100%', sub: 'In-Memory CV Privacy' },
  { n: '$0', sub: 'To source and score' },
];

/* ── Product window mockup ─────────────────────────────────────────────────── */
const AVATAR_COLORS = [
  'bg-slate-800 text-white',
  'bg-slate-700 text-white',
  'bg-slate-900 text-white',
  'bg-zinc-800 text-white',
];

function MockAvatar({ name }: { name: string }) {
  const initials = name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
  const color = AVATAR_COLORS[name.charCodeAt(0) % AVATAR_COLORS.length];
  return (
    <div className={`w-9 h-9 rounded-full ${color} flex items-center justify-center shrink-0`}>
      <span className="text-xs font-bold">{initials}</span>
    </div>
  );
}

function MockStatusPill({ status }: { status: string }) {
  const styles: Record<string, string> = {
    Replied:  'bg-emerald-50 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-500/30',
    Sent:     'bg-blue-50 dark:bg-blue-500/20 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-500/30',
    Enriched: 'bg-gray-100 dark:bg-white/10 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-white/10',
    Sourced:  'bg-white dark:bg-white/5 text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-white/10',
  };
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold whitespace-nowrap ${styles[status] ?? styles.Sourced}`}>
      {status}
    </span>
  );
}

const MOCK_CANDIDATES = [
  { name: 'Sarah Chen',  role: 'Principal Engineer',  co: 'Stripe',     src: 'LinkedIn', score: 9.2, status: 'Replied'  },
  { name: 'James Park',  role: 'Staff Engineer',       co: 'Figma',      src: 'GitHub',   score: 8.7, status: 'Sent'     },
  { name: 'Priya Nair',  role: 'Senior SWE',           co: 'Shopify',    src: 'LinkedIn', score: 8.4, status: 'Enriched' },
  { name: 'Alex Morgan', role: 'Backend Lead',         co: 'Linear',     src: 'LinkedIn', score: 7.9, status: 'Sourced'  },
  { name: 'Tom Keane',   role: 'Software Engineer',    co: 'Vercel',     src: 'GitHub',   score: 7.2, status: 'Sourced'  },
  { name: 'Maya Singh',  role: 'Senior Engineer',      co: 'Notion',     src: 'LinkedIn', score: 6.8, status: 'Sourced'  },
  { name: 'Lucas Ferr.', role: 'Platform Engineer',    co: 'Cloudflare', src: 'GitHub',   score: 8.1, status: 'Enriched' },
  { name: 'Dana Okafor', role: 'Tech Lead',            co: 'Atlassian',  src: 'LinkedIn', score: 7.6, status: 'Sourced'  },
  { name: 'Raj Patel',   role: 'Distributed Systems',  co: 'Databricks', src: 'GitHub',   score: 8.9, status: 'Sent'     },
  { name: 'Emi Tanaka',  role: 'Infrastructure SWE',   co: 'GitHub',     src: 'GitHub',   score: 7.4, status: 'Sourced'  },
];

function ProductMockup() {
  const rows = [...MOCK_CANDIDATES, ...MOCK_CANDIDATES];
  return (
    <>
      <style>{`
        @keyframes ts-scroll {
          0%   { transform: translateY(0); }
          100% { transform: translateY(-50%); }
        }
        .ts-scroll-rows { animation: ts-scroll 22s linear infinite; }
      `}</style>
      <div className="w-full rounded-2xl overflow-hidden shadow-2xl border border-gray-200 dark:border-white/10 select-none pointer-events-none bg-white dark:bg-[#10131c]">
        <div className="bg-[#ececec] dark:bg-[#161a26] border-b border-gray-300 dark:border-white/10 flex items-center gap-2 px-4 py-3">
          <div className="w-3 h-3 rounded-full bg-[#ff5f57]" />
          <div className="w-3 h-3 rounded-full bg-[#febc2e]" />
          <div className="w-3 h-3 rounded-full bg-[#28c840]" />
          <div className="flex-1 flex justify-center">
            <div className="bg-white dark:bg-[#10131c] border border-gray-200 dark:border-white/10 rounded-md px-4 py-1.5 flex items-center gap-2 min-w-[280px] justify-center">
              <img src={logoSrc} alt="" className="w-4 h-4 object-contain shrink-0 dark:brightness-0 dark:invert" />
              <span className="text-[12px] text-gray-500 dark:text-gray-400 font-medium">talentscanr.com/campaigns</span>
            </div>
          </div>
          <div className="w-16" />
        </div>
        <div className="flex bg-white dark:bg-[#10131c]" style={{ height: 580 }}>
          <div className="w-64 border-r border-gray-100 dark:border-white/10 flex flex-col shrink-0 bg-white dark:bg-[#10131c]">
            <div className="px-5 py-4 border-b border-gray-100 dark:border-white/10 flex items-center gap-2.5">
              <img src={logoSrc} alt="TalentScanr" className="h-8 w-auto dark:brightness-0 dark:invert" />
            </div>
            <div className="px-3 pt-4 flex-1 overflow-hidden">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-400 mb-2 px-2">Campaigns</p>
              {[
                { name: 'Senior Backend Eng.', count: 47, active: true },
                { name: 'Product Designer',    count: 23, active: false },
                { name: 'Data Scientist',      count: 61, active: false },
                { name: 'DevOps Engineer',     count: 19, active: false },
              ].map(c => (
                <div key={c.name} className={`px-3 py-2.5 rounded-lg mb-0.5 ${c.active ? 'bg-gray-100 dark:bg-white/10 text-gray-900 dark:text-white font-semibold' : ''}`}>
                  <p className={`text-[13px] font-medium truncate ${c.active ? 'text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-400'}`}>{c.name}</p>
                  <p className={`text-[11px] mt-0.5 ${c.active ? 'text-gray-500 dark:text-gray-400' : 'text-gray-400 dark:text-gray-400'}`}>{c.count} candidates</p>
                </div>
              ))}
            </div>
            <div className="px-5 py-4 border-t border-gray-100 dark:border-white/10">
              <div className="flex items-center justify-between mb-2">
                <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-400">Credits</p>
                <p className="text-[11px] text-gray-500 dark:text-gray-400 font-medium">1,360 / 2,000</p>
              </div>
              <div className="h-1.5 bg-gray-100 dark:bg-white/10 rounded-full overflow-hidden">
                <div className="h-full bg-gray-900 dark:bg-purple-500 rounded-full" style={{ width: '68%' }} />
              </div>
            </div>
          </div>
          <div className="flex-1 flex flex-col overflow-hidden bg-white dark:bg-[#10131c]">
            <div className="px-7 py-5 border-b border-gray-100 dark:border-white/10 shrink-0">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h2 className="text-lg font-bold text-gray-900 dark:text-white">Senior Backend Engineer</h2>
                  <p className="text-[12px] text-gray-400 dark:text-gray-400 mt-0.5">Full-time · Remote · Engineering</p>
                </div>
                <div className="flex gap-2 items-center">
                  <div className="px-3 py-1.5 border border-gray-200 dark:border-white/10 rounded-lg text-[12px] font-medium text-gray-600 dark:text-gray-300 bg-white dark:bg-white/5">Export CSV</div>
                  <div className="px-3 py-1.5 bg-black dark:bg-purple-600 rounded-lg text-[12px] font-semibold text-white">+ Source more</div>
                </div>
              </div>
              <div className="flex gap-7">
                {[['47', 'Sourced'], ['47', 'Scored'], ['12', 'Enriched'], ['8', 'Sent'], ['3', 'Replied']].map(([n, l]) => (
                  <div key={l}>
                    <p className="text-xl font-bold text-gray-900 dark:text-white leading-none">{n}</p>
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-400 mt-1">{l}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="grid px-7 py-2.5 border-b border-gray-100 dark:border-white/10 bg-gray-50 dark:bg-white/5 shrink-0"
              style={{ gridTemplateColumns: '2fr 1.5fr 1.5fr 70px 100px' }}>
              {['Name', 'Current Role', 'Company', 'Score', 'Status'].map(h => (
                <span key={h} className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-400">{h}</span>
              ))}
            </div>
            <div className="flex-1 overflow-hidden relative bg-white dark:bg-[#10131c]">
              <div className="ts-scroll-rows">
                {rows.map((row, i) => (
                  <div key={`${row.name}-${i}`}
                    className="grid px-7 py-3.5 border-b border-gray-50 dark:border-white/5 items-center bg-white dark:bg-[#10131c]"
                    style={{ gridTemplateColumns: '2fr 1.5fr 1.5fr 70px 100px' }}>
                    <div className="flex items-center gap-3 min-w-0">
                      <MockAvatar name={row.name} />
                      <span className="text-[13px] font-semibold text-gray-900 dark:text-white truncate">{row.name}</span>
                    </div>
                    <span className="text-[13px] text-gray-500 dark:text-gray-400 truncate">{row.role}</span>
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-[13px] text-gray-500 dark:text-gray-400 truncate">{row.co}</span>
                      <span className="text-[10px] font-mono text-gray-400 dark:text-gray-400 shrink-0">· {row.src}</span>
                    </div>
                    <span className="text-[15px] font-bold text-gray-900 dark:text-white tabular-nums">{row.score.toFixed(1)}</span>
                    <MockStatusPill status={row.status} />
                  </div>
                ))}
              </div>
              <div className="absolute top-0 inset-x-0 h-4 bg-gradient-to-b from-white dark:from-[#10131c] to-transparent pointer-events-none" />
              <div className="absolute bottom-0 inset-x-0 h-28 bg-gradient-to-t from-white dark:from-[#10131c] to-transparent pointer-events-none" />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

/* ── Page ──────────────────────────────────────────────────────────────────── */
export function LandingPage({ onNavigate, authed, onOpenWorkspace, onOpenRanking }: LandingPageProps) {
  return (
    <MarketingShell current="home" onNavigate={onNavigate} authed={authed} onOpenWorkspace={onOpenWorkspace}>
      <style>{`
        .lp-diag {
          background-image: repeating-linear-gradient(
            45deg,
            transparent,
            transparent 20px,
            rgba(0,0,0,0.025) 20px,
            rgba(0,0,0,0.025) 21px
          );
        }
      `}</style>

      {/* ── HERO ──────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden">
        <div className="lp-dots absolute inset-0 pointer-events-none" />
        <div className="relative max-w-6xl mx-auto px-6 pt-20 pb-12">
          <div className="max-w-4xl mx-auto text-center space-y-6 mb-12">
            <div className="flex justify-center">
              <span className="inline-flex items-center gap-1.5 px-3.5 py-1 border border-gray-200 dark:border-white/10 rounded-full text-[12px] font-medium text-gray-600 dark:text-gray-300 tracking-wide bg-white/80 dark:bg-white/5 backdrop-blur-sm shadow-xs">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" /> AI-Powered Sourcing &amp; Inbound CV Ranking
              </span>
            </div>
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-normal leading-[1.05] text-gray-900 dark:text-white"
              style={{ fontFamily: "'DM Serif Display', serif" }}>
              Find &amp; rank top talent.<br />
              <span className="italic">Automatically.</span>
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-300 leading-relaxed max-w-2xl mx-auto font-normal">
              Select your workflow below: Autonomously source top passive candidates across platforms OR upload candidate CV batches &amp; JD criteria for instant AI match ranking.
            </p>

            {/* ── 2 PROMINENT HERO ACTION BUTTONS (SOURCE vs RANK) ── */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl mx-auto pt-4 text-left">
              {/* Option 1: AI Sourcing */}
              <button
                type="button"
                onClick={() => (authed ? (onOpenWorkspace ? onOpenWorkspace() : onNavigate('/home')) : onNavigate('/register'))}
                className="group relative p-5 rounded-2xl border border-amber-200 dark:border-amber-500/20 bg-gradient-to-b from-amber-500/10 to-transparent hover:from-amber-500/20 hover:border-amber-400 dark:hover:border-amber-500/40 transition-all duration-200 shadow-sm text-left flex flex-col justify-between"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-600 dark:text-amber-400">
                    <Search className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30">
                    Outbound Sourcing
                  </span>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-1.5 group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
                    Source Candidates <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                  </h3>
                  <p className="text-xs text-gray-600 dark:text-gray-300 mt-1 leading-relaxed">
                    Enter job spec &amp; criteria. Crawl LinkedIn &amp; GitHub for matching passive talent automatically.
                  </p>
                </div>
              </button>

              {/* Option 2: CV Batch Ranking */}
              <button
                type="button"
                onClick={() => (authed ? (onOpenRanking ? onOpenRanking() : onNavigate('/ranking')) : onNavigate('/ranking'))}
                className="group relative p-5 rounded-2xl border border-purple-200 dark:border-purple-500/20 bg-gradient-to-b from-purple-500/10 to-transparent hover:from-purple-500/20 hover:border-purple-400 dark:hover:border-purple-500/40 transition-all duration-200 shadow-sm text-left flex flex-col justify-between"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-600 dark:text-purple-400">
                    <Trophy className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-purple-500/15 text-purple-700 dark:text-purple-300 border border-purple-500/30">
                    Inbound Screening
                  </span>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-1.5 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                    Rank Candidate CVs <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                  </h3>
                  <p className="text-xs text-gray-600 dark:text-gray-300 mt-1 leading-relaxed">
                    Upload candidate CVs (PDF/DOCX) + JD criteria to score 0–10 &amp; find top winners instantly.
                  </p>
                </div>
              </button>
            </div>
          </div>
          <ProductMockup />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
            {BIG_NUMBERS.map(b => (
              <div key={b.n} className="border border-gray-200 dark:border-white/10 rounded-xl px-6 py-5 bg-white/90 dark:bg-white/5 backdrop-blur-sm">
                <p className="text-4xl font-normal text-gray-900 dark:text-white"
                  style={{ fontFamily: "'DM Serif Display', serif" }}>{b.n}</p>
                <p className="text-[11px] font-mono uppercase tracking-wider text-gray-400 dark:text-gray-400 mt-2">{b.sub}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PROBLEM BANNER ────────────────────────────────────────────────── */}
      <section className="bg-gray-950 dark:bg-[#07080d] mt-16 border-y border-gray-800">
        <div className="max-w-6xl mx-auto px-6 py-16 grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-gray-800">
          {[
            { label: 'Time per hire', pain: '40–80 hrs sourcing', fix: 'Under 2 hrs' },
            { label: 'Agency cost', pain: '15–25% of salary', fix: '$149/month flat' },
            { label: 'Outreach', pain: 'Same template for all', fix: 'Unique per candidate' },
          ].map(item => (
            <div key={item.label} className="px-8 py-8">
              <p className="text-[11px] font-mono uppercase tracking-wider text-gray-400 mb-4">{item.label}</p>
              <p className="text-base text-gray-500 line-through mb-2">{item.pain}</p>
              <p className="text-2xl font-semibold text-white"
                style={{ fontFamily: "'DM Serif Display', serif" }}>{item.fix}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── HOW IT WORKS ──────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden">
        <div className="lp-grid absolute inset-0 pointer-events-none" />
        <div className="relative max-w-6xl mx-auto px-6 py-24">
        <div className="mb-14">
          <p className="text-[11px] font-mono tracking-widest uppercase text-gray-400 dark:text-gray-400 mb-4">01 — How it works</p>
          <h2 className="text-4xl font-normal text-gray-900 dark:text-white max-w-xl"
            style={{ fontFamily: "'DM Serif Display', serif" }}>
            Six steps from spec to hired
          </h2>
          <p className="mt-3 text-base text-gray-600 dark:text-gray-300 max-w-xl leading-relaxed">
            Each step hands output directly to the next. No copy-paste between tools.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {STEPS.map(s => (
            <div key={s.n} className="border border-gray-200 dark:border-white/10 rounded-2xl p-6 bg-white dark:bg-[#10131c] hover:border-gray-300 dark:hover:border-white/20 transition-all group shadow-xs">
              <div className="flex items-start justify-between mb-5">
                <span className="text-[11px] font-mono text-gray-400 dark:text-gray-400 tracking-wider font-bold">{s.n}</span>
                <div className="w-9 h-9 border border-gray-200 dark:border-white/10 rounded-xl flex items-center justify-center text-gray-500 dark:text-gray-300 group-hover:border-gray-400 dark:group-hover:border-white/30 transition-colors">
                  {s.icon}
                </div>
              </div>
              <h3 className="text-[15px] font-bold text-gray-900 dark:text-white mb-2">{s.title}</h3>
              <p className="text-[13px] text-gray-600 dark:text-gray-300 leading-relaxed font-medium">{s.body}</p>
            </div>
          ))}
        </div>
        </div>
      </section>

      {/* ── PULL QUOTE ────────────────────────────────────────────────────── */}
      <section className="border-y border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/[0.02]">
        <div className="max-w-4xl mx-auto px-6 py-20 text-center">
          <p className="text-3xl md:text-4xl font-normal text-gray-900 dark:text-white leading-relaxed mb-5"
            style={{ fontFamily: "'DM Serif Display', serif" }}>
            "Source 200 candidates, score them all,<br />
            <span className="italic">before spending a single credit."</span>
          </p>
          <p className="text-[12px] font-mono uppercase tracking-wider text-gray-500 dark:text-gray-400 font-medium">
            Credits only at contact reveal · 1 credit = 1 verified contact
          </p>
        </div>
      </section>

      {/* ── COMPARISON TABLE ──────────────────────────────────────────────── */}
      <section className="relative overflow-hidden">
        <div className="lp-diag absolute inset-0 pointer-events-none" />
        <div className="relative max-w-6xl mx-auto px-6 py-24">
        <div className="mb-14">
          <p className="text-[11px] font-mono tracking-widest uppercase text-gray-400 dark:text-gray-400 mb-4">02 — Why TalentScanr</p>
          <h2 className="text-4xl font-normal text-gray-900 dark:text-white max-w-xl"
            style={{ fontFamily: "'DM Serif Display', serif" }}>
            Traditional recruiting vs TalentScanr
          </h2>
        </div>
        <div className="border border-gray-200 dark:border-white/10 rounded-2xl overflow-hidden bg-white dark:bg-[#10131c]">
          <div className="grid grid-cols-3 bg-gray-100 dark:bg-white/5 border-b border-gray-200 dark:border-white/10 px-6 py-3">
            <span className="text-[12px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Capability</span>
            <span className="text-[12px] font-bold text-gray-400 dark:text-gray-400 uppercase tracking-wider text-center">Traditional</span>
            <span className="text-[12px] font-bold text-gray-900 dark:text-white uppercase tracking-wider text-center">TalentScanr</span>
          </div>
          {COMPARISON.map((row, i) => (
            <div key={row.label}
              className={`grid grid-cols-3 px-6 py-4 border-b last:border-0 border-gray-100 dark:border-white/5 ${i % 2 === 0 ? 'bg-white dark:bg-[#10131c]' : 'bg-gray-50/50 dark:bg-white/[0.02]'}`}>
              <span className="text-[14px] text-gray-800 dark:text-gray-200 font-medium">{row.label}</span>
              <span className="text-[14px] text-gray-400 dark:text-gray-400 text-center">{row.traditional}</span>
              <span className="text-[14px] text-gray-900 dark:text-white font-bold text-center">{row.talentscanr}</span>
            </div>
          ))}
        </div>
        </div>
      </section>

      {/* ── WHO IT'S FOR ──────────────────────────────────────────────────── */}
      <section className="bg-gray-50 dark:bg-white/[0.02] border-y border-gray-200 dark:border-white/10">
        <div className="max-w-6xl mx-auto px-6 py-24">
          <div className="mb-14">
            <p className="text-[11px] font-mono tracking-widest uppercase text-gray-400 dark:text-gray-400 mb-4">03 — Who it's for</p>
            <h2 className="text-4xl font-normal text-gray-900 dark:text-white max-w-xl"
              style={{ fontFamily: "'DM Serif Display', serif" }}>
              Built for teams that hire seriously
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { who: 'In-house talent teams', visual: '🏢', bullets: ['Replace expensive agency retainers', 'Run all open roles simultaneously', 'Full pipeline visibility per role'] },
              { who: 'Boutique agencies', visual: '🤝', bullets: ['Serve more clients with same headcount', 'Isolated campaign per client', 'Own-domain outreach per consultant'] },
              { who: 'Founders & hiring managers', visual: '⚡', bullets: ['Source without a dedicated recruiter', 'Upload spec, approve shortlist, send', 'Live in under 10 minutes'] },
            ].map(fw => (
              <div key={fw.who} className="border border-gray-200 dark:border-white/10 rounded-2xl bg-white dark:bg-[#10131c] overflow-hidden shadow-xs">
                <div className="border-b border-gray-100 dark:border-white/10 px-6 py-7 flex items-center gap-4">
                  <span className="text-3xl">{fw.visual}</span>
                  <h3 className="text-[16px] font-bold text-gray-900 dark:text-white">{fw.who}</h3>
                </div>
                <ul className="px-6 py-5 space-y-3">
                  {fw.bullets.map(b => (
                    <li key={b} className="flex items-center gap-2.5 text-[13px] text-gray-700 dark:text-gray-300 font-medium">
                      <div className="w-1.5 h-1.5 rounded-full bg-gray-400 shrink-0" />
                      {b}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURES GRID ─────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden">
        <div className="lp-dots absolute inset-0 pointer-events-none" />
        <div className="relative max-w-6xl mx-auto px-6 py-24">
        <div className="mb-14">
          <p className="text-[11px] font-mono tracking-widest uppercase text-gray-400 dark:text-gray-400 mb-4">04 — Platform</p>
          <h2 className="text-4xl font-normal text-gray-900 dark:text-white max-w-xl"
            style={{ fontFamily: "'DM Serif Display', serif" }}>
            Everything in one pipeline
          </h2>
          <p className="mt-3 text-base text-gray-600 dark:text-gray-300 max-w-xl leading-relaxed">
            No integrations to configure. No additional subscriptions.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-x-12 gap-y-8">
          {PLATFORM_FEATURES.map(f => (
            <div key={f.label} className="space-y-1.5">
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-gray-900 dark:bg-white shrink-0" />
                <h3 className="text-[14px] font-bold text-gray-900 dark:text-white">{f.label}</h3>
              </div>
              <p className="text-[13px] text-gray-600 dark:text-gray-400 leading-relaxed pl-3.5">{f.desc}</p>
            </div>
          ))}
        </div>
        </div>
      </section>

      {/* ── CREDIT CLARITY ────────────────────────────────────────────────── */}
      <section className="border-y border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/[0.02]">
        <div className="max-w-6xl mx-auto px-6 py-16 grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
          <div>
            <p className="text-[11px] font-mono tracking-widest uppercase text-gray-400 dark:text-gray-400 mb-4">05 — Pricing model</p>
            <h2 className="text-3xl font-normal text-gray-900 dark:text-white mb-4"
              style={{ fontFamily: "'DM Serif Display', serif" }}>
              Pay only for contacts revealed
            </h2>
            <p className="text-[14px] text-gray-600 dark:text-gray-300 leading-relaxed">
              Source, score, review, draft. All free. Credits are only spent when you click Reveal on Apollo-verified contact details.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {[
              { item: 'Sourcing', free: true },
              { item: 'Fit scoring', free: true },
              { item: 'Outreach drafts', free: true },
              { item: 'Analytics', free: true },
              { item: 'Email / phone reveal', free: false, cost: '1 credit' },
              { item: 'Deep scoring', free: true },
            ].map(r => (
              <div key={r.item} className="flex items-center justify-between border border-gray-200 dark:border-white/10 rounded-xl px-3.5 py-3 bg-white dark:bg-[#10131c]">
                <span className="text-[12px] text-gray-700 dark:text-gray-300 font-medium">{r.item}</span>
                {r.free
                  ? <span className="text-[11px] font-mono text-gray-400 dark:text-gray-400">Free</span>
                  : <span className="text-[11px] font-mono font-bold text-gray-900 dark:text-white">{r.cost}</span>}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ───────────────────────────────────────────────────────────── */}
      <section className="bg-gray-950 dark:bg-[#07080d] border-t border-gray-800">
        <div className="max-w-6xl mx-auto px-6 py-28 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div className="space-y-5">
            <h2 className="text-5xl font-normal text-white leading-tight"
              style={{ fontFamily: "'DM Serif Display', serif" }}>
              Start sourcing<br /><span className="italic">in minutes.</span>
            </h2>
            <p className="text-gray-400 text-base leading-relaxed max-w-md">
              No integrations. No onboarding call. No agency contract. Create an account, upload a job spec, and the pipeline runs automatically.
            </p>
            <p className="text-[11px] font-mono uppercase tracking-wider text-gray-500">
              Free to start · Cancel any time · No lock-in
            </p>
          </div>
          <div className="flex flex-col gap-3">
            <button onClick={() => onNavigate('/register')}
              className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white hover:bg-gray-100 text-gray-900 rounded-xl font-bold text-[15px] transition-colors shadow-lg">
              Create free account <ArrowRight className="w-4 h-4" />
            </button>
            <button onClick={() => onNavigate('/engine-features')}
              className="inline-flex items-center justify-center gap-2 px-8 py-4 border border-gray-700 hover:border-gray-500 text-gray-300 hover:text-white rounded font-medium text-[15px] transition-colors">
              See all engine features
            </button>
          </div>
        </div>
      </section>
    </MarketingShell>
  );
}
