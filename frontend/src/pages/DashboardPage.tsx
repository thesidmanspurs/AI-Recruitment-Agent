import { useState, useMemo, useEffect, useRef, type ReactNode } from 'react';
import {
  FileEdit,
  Download,
  Sparkles,
  Loader2,
  Plus,
  Inbox,
  LogOut,
  Shield,
  Briefcase,
  Activity,
  GitBranch,
  Send,
  Bell,
  Globe,
  Mail,
  Coins,
} from 'lucide-react';
import { CandidateTable } from '../components/dashboard/CandidateTable';
import { OnboardingPlaybook } from '../components/dashboard/OnboardingPlaybook';
import { HeaderStepper, type StepperStatus } from '../components/dashboard/HeaderStepper';
import { WorkflowGuideModal } from '../components/dashboard/WorkflowGuideModal';
import { LocationFilter } from '../components/dashboard/LocationFilter';
import { ScoreFilter } from '../components/dashboard/ScoreFilter';
import { OutreachEditorModal } from '../components/dashboard/OutreachEditorModal';
import { OutreachActivityPanel } from '../components/dashboard/OutreachActivityPanel';
import { EmailSettingsModal } from '../components/settings/EmailSettingsModal';
import { emailSettingsApi } from '../api/emailSettingsApi';
import { paymentsApi } from '../api/paymentsApi';
import { ThemeToggle } from '../components/shared/ThemeToggle';
import { WorkspaceSidebar } from '../components/layout/WorkspaceSidebar';
import { SmartAlerts } from '../components/dashboard/SmartAlerts';
import { ChannelMix } from '../components/dashboard/ChannelMix';
import { CreateCampaignModal } from '../components/campaigns/CreateCampaignModal';
import { EditCampaignModal } from '../components/campaigns/EditCampaignModal';
import { AddFromLinkedInModal } from '../components/campaigns/AddFromLinkedInModal';
import { ConfirmModal } from '../components/shared/CenterModal';
import { useCampaigns } from '../hooks/useCampaigns';
import { useToast } from '../components/shared/Toast';
import { toCandidate } from '../lib/candidateAdapter';
import type { AuthUser } from '../hooks/useAuth';
import type { CampaignDto } from '../api/campaignApi';
import { Trash2, Linkedin, Infinity as InfinityIcon } from 'lucide-react';

// Reveals included in a Campaign Pass — mirrors CAMPAIGN_PASS_REVEAL_CAP on the
// backend (backend/config/creditPackages.ts). Keep in sync.
const PASS_REVEAL_CAP = 120;

interface DashboardPageProps {
  user?: AuthUser | null;
  onLogout?: () => void;
  onOpenAdmin?: () => void;
  onOpenBilling?: () => void;
  onOpenHome?: () => void;
}

export function DashboardPage({ user, onLogout, onOpenAdmin, onOpenBilling, onOpenHome }: DashboardPageProps = {}) {
  const {
    campaigns,
    activeCampaign,
    activeId,
    setActiveId,
    candidates,
    loading,
    sourcing,
    error,
    isSimulated,
    simulationReason,
    screening,
    usage,
    sourcingPagination,
    enrichCandidate,
    enrichingId,
    awaitingPhoneIds,
    sendOutreach,
    reloadCandidates,
    enrichSelected,
    enrichingSelected,
    markReplied,
    outreachId,
    alerts,
    createCampaign,
    updateCampaign,
    addFromLinkedIn,
    resetCandidates,
    deleteCampaign,
    sourceCandidates,
    refreshCampaigns,
  } = useCampaigns();

  const [showCreate, setShowCreate] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [buyingPass, setBuyingPass] = useState(false);
  const [showAddLinkedIn, setShowAddLinkedIn] = useState(false);
  const [showGuide, setShowGuide] = useState(false);
  const [showEmailSettings, setShowEmailSettings] = useState(false);
  const [emailCanSend, setEmailCanSend] = useState<boolean | null>(null); // null = unknown/loading
  const [sourceLocations, setSourceLocations] = useState<string[]>([]);
  // Which channels to source from: both (default), LinkedIn only, or GitHub only.
  const [sourceMode, setSourceMode] = useState<'both' | 'linkedin' | 'github'>('both');

  // Load the user's email-send capability so we can gate the outreach editor
  // before they waste time drafting. Re-checked when the settings modal closes.
  const refreshEmailStatus = () => {
    emailSettingsApi
      .get()
      .then(res => setEmailCanSend(res.settings.canSend))
      .catch(() => setEmailCanSend(false));
  };
  useEffect(() => {
    if (user) refreshEmailStatus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  // Credit balance for the header chip. Re-fetched on mount (so it refreshes
  // after returning from the Billing page) and after any reveal action.
  const [creditBalance, setCreditBalance] = useState<number | null>(null);
  const refreshCredits = () => {
    paymentsApi
      .balance()
      .then(res => setCreditBalance(res.balance))
      .catch(() => {});
  };
  useEffect(() => {
    if (user) refreshCredits();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);
  // Reveals spend credits — refresh the chip when candidate data changes
  // (covers source, enrich-selected, and add-from-LinkedIn).
  useEffect(() => {
    if (user) refreshCredits();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [candidates]);
  // Default approve bar = the screening threshold (7.0), not 9.0 — at 9.0 the
  // Approved Queue looked empty for normal sourced candidates (GitHub caps at
  // 9.0; most Apollo/Reddit hits are 7–9 too).
  const [minScore, setMinScore] = useState<number>(7.0);
  const [outreachEditorId, setOutreachEditorId] = useState<string | null>(null);
  const toast = useToast();
  const lastSimReason = useRef<string | null>(null);
  const lastError = useRef<string | null>(null);

  // Surface backend errors as red toasts. Guarded by ref so we don't re-fire
  // every render — only when the error message actually changes.
  useEffect(() => {
    if (error && error !== lastError.current) {
      toast.push({ title: 'Something went wrong', body: error, tone: 'error' });
    }
    lastError.current = error;
  }, [error, toast]);

  // Surface simulation-fallback as an amber toast. Same change-detection rule.
  useEffect(() => {
    if (isSimulated && simulationReason && simulationReason !== lastSimReason.current) {
      toast.push({
        title: 'Simulation mode',
        body: simulationReason,
        tone: 'warning',
        duration: 10_000,
      });
    }
    if (!isSimulated) lastSimReason.current = null;
    else lastSimReason.current = simulationReason;
  }, [isSimulated, simulationReason, toast]);

  const stats = useMemo(() => {
    // "Enriched" = candidates that actually hold a revealed contact. We check
    // the value, not just the flag: the Apollo phone webhook sets
    // phoneEnriched=true even when it confirms "no phone on file" (phone stays
    // null), which would otherwise over-count vs the candidates shown enriched.
    const enriched = candidates.filter(
      c => (c.emailEnriched && !!c.email) || (c.phoneEnriched && !!c.phone)
    ).length;
    // "Outreach Sent" = candidates we've actually contacted. Must match the
    // Outreach Activity panel's definition exactly (outreachSentAt set + a
    // post-send status) — NOT "any non-SOURCED candidate", which wrongly
    // counted every ENRICHED candidate as sent.
    const outreachSent = candidates.filter(
      c => !!c.outreachSentAt && ['OUTREACH_SENT', 'OPENED', 'REPLIED', 'NO_RESPONSE'].includes(c.outreachStatus)
    ).length;
    return { identified: candidates.length, enriched, outreachSent };
  }, [candidates]);

  const channelMix = useMemo(() => {
    if (candidates.length === 0) return [];
    const counts: Record<string, number> = {};
    for (const c of candidates) counts[c.platform] = (counts[c.platform] ?? 0) + 1;
    const total = candidates.length;
    const meta: Record<string, { label: string; color: string }> = {
      LinkedIn: { label: 'LinkedIn (Apollo)', color: 'bg-blue-500' },
      GitHub: { label: 'GitHub', color: 'bg-slate-500' },
      Reddit: { label: 'Reddit', color: 'bg-orange-500' },
      Upwork: { label: 'Upwork', color: 'bg-emerald-500' },
    };
    // Show every platform actually present in this campaign's pool, busiest
    // first — not a hardcoded LinkedIn-only row.
    return Object.keys(counts)
      .sort((a, b) => counts[b] - counts[a])
      .map(p => ({
        label: meta[p]?.label ?? p,
        pct: Math.round((counts[p] / total) * 100),
        color: meta[p]?.color ?? 'bg-gray-400',
      }));
  }, [candidates]);

  // Full candidate set, mapped to the frontend Candidate shape. The table
  // receives this whole set and splits it into Approved / Below / All by the
  // score threshold — so candidates are never hidden from the "All" tab.
  const tableCandidates = useMemo(() => candidates.map(toCandidate), [candidates]);

  // The Both/LinkedIn/GitHub selector controls ONLY which channels get sourced
  // (see handleSource) — it deliberately does NOT filter the table. Sourcing is
  // additive, so the table always shows every candidate on the campaign; an
  // empty view after a single-channel run would look like data loss.
  const displayedCandidates = tableCandidates;

  // ── Workflow step state — shared by header stepper, playbook panel, guide modal ──
  const stepStatuses = useMemo<Record<string, StepperStatus>>(() => {
    const analyzed = !!activeCampaign && (activeCampaign.extractedKeywords?.length ?? 0) > 0;
    const count = tableCandidates.length;
    const topMatch = tableCandidates.filter(c => c.matchScore >= 9.0).length;
    const sent = tableCandidates.filter(c =>
      ['Outreach Sent', 'Opened', 'Replied'].includes(c.outreachStatus)
    ).length;

    const ingest: StepperStatus = analyzed ? 'complete' : activeCampaign ? 'active' : 'pending';
    const filter: StepperStatus = count >= 5 ? 'complete' : count > 0 ? 'active' : 'pending';
    const review: StepperStatus = topMatch >= 1 ? 'complete' : count > 0 ? 'active' : 'pending';
    const outreach: StepperStatus = sent >= 1 ? 'complete' : count > 0 ? 'active' : 'pending';
    return { ingest, filter, review, outreach };
  }, [activeCampaign, tableCandidates]);

  const headerSteps = useMemo(
    () => [
      { key: 'ingest', label: 'Ingest', status: stepStatuses.ingest },
      { key: 'filter', label: 'Filter', status: stepStatuses.filter },
      { key: 'review', label: 'Review', status: stepStatuses.review },
      { key: 'outreach', label: 'Outreach', status: stepStatuses.outreach },
    ],
    [stepStatuses]
  );

  async function handleSource() {
    if (!activeId) return;
    try {
      const r = await sourceCandidates(activeId, {
        locations: sourceLocations.length > 0 ? sourceLocations : undefined,
        sources: sourceMode === 'both' ? ['linkedin', 'github'] : [sourceMode],
      });
      const s = r?.sources;
      if (s) {
        const linkedInOn = sourceMode !== 'github';
        const githubOn = sourceMode !== 'linkedin';
        // Per-channel transparency: show counts only for the channels that ran.
        const parts: string[] = [];
        if (linkedInOn) parts.push(`LinkedIn ${s.apollo.count} · Reddit ${s.reddit.count}`);
        if (githubOn) parts.push(`GitHub ${s.github.count}`);
        toast.push({
          title: `Sourced ${r.total} candidate${r.total === 1 ? '' : 's'}`,
          body: parts.join('  ·  '),
          tone: 'success',
        });
        if (linkedInOn && s.apollo.error) {
          toast.push({
            title: 'LinkedIn (Apollo) returned nothing',
            body: s.apollo.error,
            tone: 'warning',
            duration: 10_000,
          });
        } else if (linkedInOn && s.apollo.count === 0) {
          toast.push({
            title: 'No LinkedIn matches this run',
            body: 'Apollo found no new profiles for these titles/keywords. Try broader alternate titles, or "Re-source" to fetch the next page.',
            tone: 'warning',
            duration: 9_000,
          });
        }
        if (s.github.count > 0) {
          toast.push({
            title: 'Heads-up on GitHub candidates',
            body: 'GitHub profiles often have no public email or phone — those candidates may need outreach via their GitHub profile rather than email.',
            tone: 'info',
            duration: 10_000,
          });
        }
      }
    } catch {
      // surfaced via hook state
    }
  }

  // Campaign Pass — pay $299 once to unlock unlimited reveals for this campaign.
  async function handleBuyPass() {
    if (!activeId) return;
    setBuyingPass(true);
    try {
      const res = await paymentsApi.createCheckout('campaign-pass', activeId);
      window.location.href = res.checkoutUrl;
    } catch (err) {
      toast.push({
        title: 'Could not start checkout',
        body: err instanceof Error ? err.message : 'Please try again.',
        tone: 'error',
      });
      setBuyingPass(false);
    }
  }

  function handleExport(ids?: string[]) {
    // When ids are passed (selection export) we export only those rows;
    // otherwise the whole campaign pool.
    const pool = ids && ids.length
      ? candidates.filter(c => ids.includes(c.id))
      : candidates;
    if (!activeCampaign || pool.length === 0) {
      toast.push({
        title: 'Nothing to export',
        body: ids && ids.length ? 'No matching candidates selected.' : 'Source candidates first.',
        tone: 'warning',
      });
      return;
    }
    const rows = pool.map(c => ({
      Name: c.name,
      'AI Score': c.matchScore.toFixed(1),
      Title: c.currentTitle,
      Company: c.company,
      Platform: c.platform,
      Email: c.email ?? '',
      Phone: c.phone ?? '',
      Location: c.location ?? '',
      'LinkedIn URL': c.linkedinUrl ?? '',
      'Outreach Status': c.outreachStatus,
      'Outreach Channel': c.outreachChannel ?? '',
      'Sent At': c.outreachSentAt ?? '',
      Skills: c.skills.join('; '),
      Strengths: c.strengths.join('; '),
      Gaps: c.gaps.join('; '),
      'Match Explanation': c.matchExplanation,
    }));
    const headers = Object.keys(rows[0]);
    const body = [
      headers.join(','),
      ...rows.map(r => headers.map(h => csvEscape(String((r as Record<string, string>)[h] ?? ''))).join(',')),
    ].join('\r\n'); // CRLF — Excel's preferred row terminator
    // "sep=," tells Excel to split on commas regardless of the OS locale list
    // separator (e.g. Vietnamese Excel defaults to ";", which dumps everything
    // into column A). The leading ﻿ BOM marks the file UTF-8 so accented
    // characters / em-dashes render correctly instead of mojibake.
    const csv = '\uFEFF' + 'sep=,\r\n' + body;
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    const suffix = ids && ids.length ? '-selected' : '';
    a.download = `${activeCampaign.name.replace(/[^a-z0-9-]+/gi, '_').toLowerCase()}-candidates${suffix}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
    toast.push({
      title: 'CSV exported',
      body: `${rows.length} candidate(s) downloaded.`,
      tone: 'success',
    });
  }

  return (
    <div className="min-h-screen flex bg-[#F8FAFC] dark:bg-[#0a0c12] text-gray-900 dark:text-gray-100 font-sans">
      {/* Top header — mirrors admin layout */}
      <WorkflowGuideModal
        open={showGuide}
        onClose={() => setShowGuide(false)}
        liveStatuses={stepStatuses}
      />
      <EmailSettingsModal
        open={showEmailSettings}
        onClose={() => {
          setShowEmailSettings(false);
          refreshEmailStatus();
        }}
        onChanged={canSend => setEmailCanSend(canSend)}
      />
      <OutreachEditorModal
        open={outreachEditorId !== null}
        campaignId={activeId ?? ''}
        candidate={tableCandidates.find(c => c.id === outreachEditorId) ?? null}
        onClose={() => setOutreachEditorId(null)}
        onSent={(msg, simulated) => {
          if (msg) {
            toast.push({
              title: simulated ? 'Outreach sent (simulated)' : 'Outreach sent',
              body: msg,
              tone: simulated ? 'warning' : 'success',
            });
          }
          void reloadCandidates();
        }}
      />

      {/* Persistent dark workspace sidebar (campaigns + status + credits) */}
      <WorkspaceSidebar
        campaigns={campaigns}
        activeId={activeId}
        onSelect={setActiveId}
        onNew={() => setShowCreate(true)}
        creditBalance={creditBalance}
        onOpenBilling={onOpenBilling}
        onHome={onOpenHome}
        activeCampaignName={activeCampaign?.name}
        candidateCount={candidates.length}
      />

      {/* Main workspace column */}
      <div className="flex-1 flex flex-col min-w-0 max-h-screen overflow-y-auto">
      <header className="border-b border-gray-200 dark:border-white/10 bg-white dark:bg-[#10131c] sticky top-0 z-10 transition-colors">
        <div className="px-6 sm:px-8 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="min-w-0">
              <div className="flex items-center gap-2.5">
                <h1 className="text-lg font-bold text-gray-900 dark:text-white leading-none truncate">
                  {activeCampaign?.jobTitle ?? 'Workspace'}
                </h1>
                <span className="hidden sm:inline text-[10px] bg-slate-100 dark:bg-white/10 border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300 font-mono font-bold px-2 py-0.5 rounded leading-none uppercase">
                  Campaign Profile
                </span>
              </div>
              <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-1 truncate">
                {activeCampaign
                  ? [activeCampaign.location, activeCampaign.jobType, activeCampaign.department].filter(Boolean).join(' • ') || 'AI Recruitment & Intelligent Engagement'
                  : 'AI Recruitment & Intelligent Engagement Service'}
              </p>
            </div>
          </div>

          {user && (
            <div className="flex items-center gap-3 shrink-0">
              {usage && (
                <div
                  className={`hidden md:flex items-center gap-2 px-3 py-1.5 rounded-md border text-[11px] font-medium ${
                    usage.exceeded
                      ? 'bg-red-50 border-red-200 text-red-700 dark:bg-red-500/10 dark:border-red-400/20 dark:text-red-300'
                      : usage.remaining <= Math.max(1, Math.floor(usage.limit * 0.1))
                        ? 'bg-amber-50 border-amber-200 text-amber-700 dark:bg-amber-500/10 dark:border-amber-400/20 dark:text-amber-300'
                        : 'bg-gray-50 border-gray-200 text-gray-700 dark:bg-white/5 dark:border-white/10 dark:text-gray-200'
                  }`}
                  title="Daily AI usage — resets at 00:00 UTC"
                >
                  <span className="uppercase tracking-wider text-[9px] font-bold text-gray-500 dark:text-gray-400">
                    Today
                  </span>
                  <span className="font-bold tabular-nums">
                    {usage.used} / {usage.limit}
                  </span>
                </div>
              )}
              <div className="hidden sm:flex items-center gap-2.5 pr-3 border-r border-gray-200 dark:border-white/10">
                <div className="w-8 h-8 rounded-full bg-gray-900 dark:bg-gray-600 flex items-center justify-center shrink-0">
                  <span className="text-xs font-bold text-white">
                    {user.name.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-medium text-gray-900 dark:text-gray-100 truncate leading-none">
                    {user.name}
                  </p>
                  <p className="text-[10px] text-gray-500 mt-0.5 truncate">{user.email}</p>
                </div>
              </div>
              <ThemeToggle />
              {onOpenBilling && (
                <button
                  onClick={onOpenBilling}
                  className={`flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-md border transition-colors ${
                    creditBalance !== null && creditBalance <= 0
                      ? 'bg-red-50 border-red-200 text-red-700 hover:bg-red-100 dark:bg-red-500/10 dark:border-red-400/20 dark:text-red-300 dark:hover:bg-red-500/20'
                      : 'bg-amber-50 border-amber-200 text-amber-800 hover:bg-amber-100 dark:bg-amber-500/10 dark:border-amber-400/20 dark:text-amber-300 dark:hover:bg-amber-500/20'
                  }`}
                  title="Credits are spent on Apollo email/phone reveals. Click to buy more."
                >
                  <Coins className="w-3.5 h-3.5" />
                  <span className="tabular-nums font-bold">
                    {creditBalance === null ? '—' : creditBalance.toLocaleString()}
                  </span>
                  <span className="hidden lg:inline text-[11px] font-normal opacity-80">credits</span>
                </button>
              )}
              <button
                onClick={() => setShowEmailSettings(true)}
                className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-md bg-white dark:bg-white/5 border border-gray-300 dark:border-white/10 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/10 transition-colors"
                title="Configure the email you send outreach from"
              >
                <Mail className="w-3.5 h-3.5" />
                Email
              </button>
              {user.role === 'ADMIN' && onOpenAdmin && (
                <button
                  onClick={onOpenAdmin}
                  className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-md bg-gray-100 border border-gray-200 text-gray-700 hover:bg-gray-200 dark:bg-white/5 dark:border-white/10 dark:text-gray-300 dark:hover:bg-white/10 transition-colors"
                >
                  <Shield className="w-3.5 h-3.5" />
                  Admin
                </button>
              )}
              <button
                onClick={onLogout}
                className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-md bg-white dark:bg-white/5 border border-gray-300 dark:border-white/10 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/10 transition-colors"
              >
                <LogOut className="w-3.5 h-3.5" />
                Logout
              </button>
            </div>
          )}
        </div>

        {/* Workflow stepper strip — visible whenever a user is signed in */}
        {user && (
          <div className="px-6 sm:px-8 pb-3 -mt-1 flex items-center justify-center sm:justify-start overflow-x-auto">
            <HeaderStepper steps={headerSteps} onHelp={() => setShowGuide(true)} />
          </div>
        )}
      </header>

      <div className="px-6 sm:px-8 py-8">
        {/* Main content */}
        <main className="flex-1 min-w-0 flex flex-col gap-6">
          {loading ? (
            <CenterLoader />
          ) : campaigns.length === 0 ? (
            <EmptyDashboard onNew={() => setShowCreate(true)} />
          ) : activeCampaign ? (
            <>
              {/* Email-not-configured banner — outreach is blocked until set up */}
              {emailCanSend === false && (
                <div className="flex items-center justify-between gap-3 px-4 py-3 rounded-xl border border-amber-200 bg-amber-50 dark:bg-amber-500/10 dark:border-amber-400/20">
                  <div className="flex items-center gap-2 min-w-0">
                    <Mail className="w-4 h-4 text-amber-600 shrink-0" />
                    <p className="text-sm text-amber-800 dark:text-amber-300 truncate">
                      Outreach is blocked until you set up and verify your own sending email.
                    </p>
                  </div>
                  <button
                    onClick={() => setShowEmailSettings(true)}
                    className="shrink-0 inline-flex items-center gap-1.5 text-xs font-semibold text-white bg-amber-600 hover:bg-amber-700 px-3 py-1.5 rounded-md transition-colors"
                  >
                    Set up email
                  </button>
                </div>
              )}

              {/* Sourcing Playbook — 4-step roadmap derived from campaign state */}
              <OnboardingPlaybook
                campaign={activeCampaign}
                candidates={tableCandidates}
                onIngestSpec={() => setShowCreate(true)}
                onScrollToCandidates={() =>
                  document.getElementById('candidates-table')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
                }
              />

              {/* Campaign header */}
              <SectionCard
                noBodyPadding
                className="px-6 py-5"
                renderHeader={false}
              >
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div className="min-w-0">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white leading-tight truncate">
                      {activeCampaign.jobTitle}
                    </h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 truncate">
                      {activeCampaign.location ?? '—'}
                      <span className="mx-2 text-gray-300 dark:text-white/20">•</span>
                      {activeCampaign.jobType ?? '—'}
                      <span className="mx-2 text-gray-300 dark:text-white/20">•</span>
                      {activeCampaign.department ?? '—'}
                      <span className="mx-2 text-gray-300 dark:text-white/20">•</span>
                      <span className="uppercase tracking-wider text-[11px] font-semibold text-gray-400 dark:text-gray-500">
                        {activeCampaign.status}
                      </span>
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0 flex-wrap">
                    <ScoreFilter
                      value={minScore}
                      onChange={setMinScore}
                      defaultValue={screening?.threshold ?? 9.0}
                    />
                    <LocationFilter
                      applied={sourceLocations}
                      onApply={async (locs) => {
                        setSourceLocations(locs);
                        if (locs.length === 0) return; // reset only
                        if (!activeId) return;
                        try {
                          await sourceCandidates(activeId, {
                            locations: locs,
                            sources: sourceMode === 'both' ? ['linkedin', 'github'] : [sourceMode],
                          });
                        } catch {}
                      }}
                    />
                    {/* Source channel selector */}
                    <div
                      className="inline-flex items-center rounded-lg border border-gray-300 dark:border-white/10 overflow-hidden text-xs font-semibold"
                      title="Choose which channels to source from. The table always shows every candidate already on the campaign."
                    >
                      {(['both', 'linkedin', 'github'] as const).map(m => (
                        <button
                          key={m}
                          onClick={() => setSourceMode(m)}
                          disabled={sourcing}
                          className={`px-2.5 py-2 transition-colors disabled:opacity-60 ${
                            sourceMode === m
                              ? 'bg-indigo-600 text-white'
                              : 'bg-white dark:bg-[#0a0c12] text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5'
                          }`}
                        >
                          {m === 'both' ? 'Both' : m === 'linkedin' ? 'LinkedIn' : 'GitHub'}
                        </button>
                      ))}
                    </div>
                    <button
                      onClick={handleSource}
                      disabled={sourcing}
                      className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-blue-700 dark:text-blue-300 bg-white dark:bg-[#0a0c12] border border-blue-200 dark:border-blue-400/20 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-500/10 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
                    >
                      {sourcing ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Sourcing…
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-4 h-4" />
                          {candidates.length === 0 ? 'Auto-source' : 'Re-source'}
                        </>
                      )}
                    </button>
                    <button
                      onClick={() => setShowEdit(true)}
                      className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-[#0a0c12] border border-gray-300 dark:border-white/10 rounded-lg hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
                    >
                      <FileEdit className="w-4 h-4" />
                      Edit Spec
                    </button>
                    <button
                      onClick={() => setShowDelete(true)}
                      className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-red-700 dark:text-red-300 bg-white dark:bg-[#0a0c12] border border-red-200 dark:border-red-400/20 rounded-lg hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
                      title="Delete this campaign"
                    >
                      <Trash2 className="w-4 h-4" />
                      Delete
                    </button>
                    {activeCampaign.unlimited && (
                      <span
                        className="inline-flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-lg text-sm font-semibold text-white bg-gradient-to-r from-emerald-500 to-teal-500 shadow-sm shadow-emerald-500/25"
                        title={`Campaign Pass active — ${Math.max(0, PASS_REVEAL_CAP - stats.enriched)} of ${PASS_REVEAL_CAP} reveals left. No credits used on this campaign.`}
                      >
                        <span className="w-6 h-6 rounded-md bg-white/20 flex items-center justify-center">
                          <InfinityIcon className="w-3.5 h-3.5" />
                        </span>
                        <span className="leading-none">
                          Pass
                          <span className="ml-1.5 font-normal text-white/85 tabular-nums">
                            {Math.max(0, PASS_REVEAL_CAP - stats.enriched)}/{PASS_REVEAL_CAP} left
                          </span>
                        </span>
                      </span>
                    )}
                    <button
                      onClick={handleExport}
                      className="flex items-center gap-2 px-3 py-2 text-sm font-semibold text-white bg-black dark:bg-gray-800 rounded-lg hover:bg-gray-800 dark:hover:bg-gray-700 transition-colors"
                    >
                      <Download className="w-4 h-4" />
                      Export
                    </button>
                  </div>
                </div>
              </SectionCard>

              {/* Spec + Stats row */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <SectionCard
                  icon={<Briefcase className="w-3.5 h-3.5 text-indigo-600" />}
                  title="Identified"
                >
                  <BigStat value={stats.identified} tone="gray" />
                </SectionCard>
                <SectionCard
                  icon={<Activity className="w-3.5 h-3.5 text-emerald-600" />}
                  title="Enriched"
                >
                  <BigStat value={stats.enriched} tone="green" />
                </SectionCard>
                <SectionCard
                  icon={<Send className="w-3.5 h-3.5 text-blue-600" />}
                  title="Outreach Sent"
                >
                  <BigStat value={stats.outreachSent} tone="blue" />
                </SectionCard>
              </div>

              {/* Spec card */}
              {activeCampaign.extractedKeywords.length > 0 && (
                <SectionCard
                  icon={<Sparkles className="w-3.5 h-3.5 text-indigo-600" />}
                  title="Extracted job spec"
                  subtitle="From Gemini analysis"
                >
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                    <SpecField label="Alternate titles" items={activeCampaign.alternateTitles} />
                    <SpecField label="Keywords" items={activeCampaign.extractedKeywords} />
                    <SpecField
                      label="Requirements"
                      items={activeCampaign.requirements}
                      compact
                    />
                  </div>
                </SectionCard>
              )}

              {/* Screening summary */}
              {screening && candidates.length > 0 && (
                <SectionCard
                  icon={<GitBranch className="w-3.5 h-3.5 text-indigo-600" />}
                  title="Screening"
                  subtitle={`Threshold ≥ ${screening.threshold.toFixed(1)}`}
                >
                  <div className="flex items-center gap-6 flex-wrap">
                    <ScreeningStat label="Sourced" value={screening.total} />
                    <ScreeningStat label="Approved" value={screening.approved} tone="green" />
                    <ScreeningStat label="Below" value={screening.belowThreshold} tone="amber" />
                    <ScreeningStat label="Dupes merged" value={screening.duplicatesMerged} />
                    <ScreeningStat label="Invalid scores" value={screening.invalidScores} />
                  </div>
                </SectionCard>
              )}

              {/* Outreach activity — only renders if anyone has been contacted */}
              <OutreachActivityPanel
                candidates={candidates}
                onMarkReplied={async (id) => {
                  try {
                    await markReplied(id);
                    toast.push({ title: 'Marked as replied', tone: 'success' });
                  } catch (err) {
                    toast.push({
                      title: 'Could not mark replied',
                      body: err instanceof Error ? err.message : String(err),
                      tone: 'error',
                    });
                  }
                }}
                markingId={outreachId}
              />

              {/* Candidate table */}
              <div id="candidates-table" />
              {candidates.length === 0 ? (
                <EmptySourcing onSource={handleSource} sourcing={sourcing} />
              ) : (
                <CandidateTable
                  candidates={displayedCandidates}
                  threshold={minScore}
                  enrichingId={enrichingId}
                  awaitingPhoneIds={awaitingPhoneIds}
                  enrichingSelected={enrichingSelected}
                  onExportSelected={(ids) => handleExport(ids)}
                  onEnrichSelected={async (ids) => {
                    try {
                      const r = await enrichSelected(ids);
                      if (r.passCapReached) {
                        toast.push({
                          title: 'Campaign Pass limit reached',
                          body: `Revealed ${r.enriched}. This pass includes ${PASS_REVEAL_CAP} reveals and they're now all used.`,
                          tone: 'warning',
                          duration: 9_000,
                        });
                      } else {
                        toast.push({
                          title: r.creditsExhausted ? 'Some emails revealed' : 'Emails revealed',
                          body: r.creditsExhausted
                            ? `Revealed ${r.enriched}, then Apollo credits ran out.`
                            : `Revealed email for ${r.enriched} candidate${r.enriched === 1 ? '' : 's'}.`,
                          tone: r.creditsExhausted ? 'warning' : 'success',
                        });
                      }
                    } catch (err) {
                      toast.push({ title: 'Get email failed', body: err instanceof Error ? err.message : String(err), tone: 'error' });
                    }
                  }}
                  outreachId={outreachId}
                  onEnrich={async (candidateId, opts) => {
                    try {
                      const r = await enrichCandidate(candidateId, opts);
                      if (!r) return;
                      const title = r.fromCache
                        ? 'Already on file — no credit spent'
                        : r.isSimulated
                          ? 'Enrichment simulated'
                          : 'Candidate enriched (1 Apollo credit)';
                      toast.push({
                        title,
                        body:
                          r.simulationReason ??
                          (r.fromCache
                            ? 'Skipped Apollo call because contact data already exists. Use "Re-enrich" to force a fresh fetch.'
                            : 'Email and phone (if available) saved.'),
                        tone: r.fromCache ? 'info' : r.isSimulated ? 'warning' : 'success',
                      });
                    } catch (err) {
                      toast.push({
                        title: 'Enrichment failed',
                        body: err instanceof Error ? err.message : String(err),
                        tone: 'error',
                      });
                    }
                  }}
                  onSendOutreach={candidateId => {
                    // Gate: don't open the editor if the user can't actually
                    // send yet — point them to Email Settings instead.
                    if (emailCanSend === false) {
                      toast.push({
                        title: 'Configure your email first',
                        body: 'You need to set up and verify your own outreach email before sending. Opening Email settings…',
                        tone: 'warning',
                      });
                      setShowEmailSettings(true);
                      return;
                    }
                    // Replaces fire-and-forget send with the editable modal.
                    // Modal handles its own send call + result toast.
                    setOutreachEditorId(candidateId);
                  }}
                  onMarkReplied={async candidateId => {
                    try {
                      await markReplied(candidateId);
                      toast.push({ title: 'Marked as replied', tone: 'success' });
                    } catch (err) {
                      toast.push({
                        title: 'Could not mark replied',
                        body: err instanceof Error ? err.message : String(err),
                        tone: 'error',
                      });
                    }
                  }}
                />
              )}

              {/* Alerts + channel mix */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <SectionCard
                  icon={<Bell className="w-3.5 h-3.5 text-amber-600" />}
                  title="Smart alerts"
                  subtitle="48-hour follow-up + reply detection"
                  noBodyPadding
                >
                  <SmartAlerts
                  alerts={alerts}
                  onMarkReplied={async id => {
                    try {
                      await markReplied(id);
                      toast.push({ title: 'Marked as replied', tone: 'success' });
                    } catch (err) {
                      toast.push({
                        title: 'Could not mark replied',
                        body: err instanceof Error ? err.message : String(err),
                        tone: 'error',
                      });
                    }
                  }}
                />
                </SectionCard>
                <SectionCard
                  icon={<Globe className="w-3.5 h-3.5 text-blue-600" />}
                  title="Channel mix"
                  subtitle="Source platforms for this campaign"
                  noBodyPadding
                >
                  <ChannelMix channels={channelMix} />
                </SectionCard>
              </div>

              {/* Sticky upsell bar — pinned to the bottom of the workspace while
                  the campaign isn't yet unlocked. Keeps the CTA prominent but
                  out of the crowded action row. */}
              {!activeCampaign.unlimited && (
                <div className="sticky bottom-4 z-20 mt-2">
                  <div className="flex items-center justify-between gap-4 rounded-xl border border-amber-200 dark:border-amber-400/25 bg-white/95 dark:bg-[#10131c]/95 backdrop-blur px-4 sm:px-5 py-3 shadow-lg shadow-black/10">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-lg bg-amber-100 dark:bg-amber-500/15 flex items-center justify-center shrink-0">
                        <InfinityIcon className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                          Unlock this campaign — unlimited reveals
                        </p>
                        <p className="text-[12px] text-gray-500 dark:text-gray-400 truncate">
                          $299 one-time · up to {PASS_REVEAL_CAP} email/phone reveals, no credits used
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={handleBuyPass}
                      disabled={buyingPass}
                      className="shrink-0 inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-amber-500 hover:bg-amber-600 rounded-lg disabled:opacity-60 disabled:cursor-not-allowed transition-colors shadow-sm"
                    >
                      {buyingPass ? <Loader2 className="w-4 h-4 animate-spin" /> : <InfinityIcon className="w-4 h-4" />}
                      <span className="hidden sm:inline">Unlock ·</span> $299
                    </button>
                  </div>
                </div>
              )}
            </>
          ) : null}
        </main>
      </div>
      </div>

      {showCreate && (
        <CreateCampaignModal onClose={() => setShowCreate(false)} onCreate={createCampaign} onSaved={refreshCampaigns} />
      )}

      <AddFromLinkedInModal
        open={showAddLinkedIn}
        onClose={() => setShowAddLinkedIn(false)}
        onSubmit={async urls => {
          try {
            const r = await addFromLinkedIn(urls);
            if (r) {
              toast.push({
                title: `Added ${r.addedCount} real candidate${r.addedCount === 1 ? '' : 's'}`,
                body:
                  r.skipped.length > 0
                    ? `${r.skipped.length} URL(s) skipped — see the result panel.`
                    : 'All looked up successfully via Apollo Match.',
                tone: r.addedCount > 0 ? 'success' : 'warning',
              });
            }
            return r;
          } catch (err) {
            toast.push({
              title: 'Lookup failed',
              body: err instanceof Error ? err.message : String(err),
              tone: 'error',
            });
            throw err;
          }
        }}
      />

      <EditCampaignModal
        open={showEdit}
        campaign={activeCampaign ?? null}
        onClose={() => setShowEdit(false)}
        onSave={async (id, input) => {
          const r = await updateCampaign(id, input);
          if (r.isSimulated) {
            toast.push({
              title: 'Campaign updated (simulation)',
              body: r.simulationReason ?? 'Gemini fell back; analysis may be stale.',
              tone: 'warning',
            });
          } else {
            toast.push({ title: 'Campaign updated', tone: 'success' });
          }
          return r;
        }}
        onResetCandidates={async id => {
          const deleted = await resetCandidates(id);
          toast.push({
            title: 'Sourced candidates cleared',
            body: `Removed ${deleted} row(s). Click "Re-source" for a fresh batch.`,
            tone: 'success',
          });
          return deleted;
        }}
      />

      <ConfirmModal
        open={showDelete}
        onClose={() => setShowDelete(false)}
        onConfirm={async () => {
          if (!activeCampaign) return;
          try {
            await deleteCampaign(activeCampaign.id);
            toast.push({
              title: 'Campaign deleted',
              body: `"${activeCampaign.name}" and all its candidates were removed.`,
              tone: 'success',
            });
          } catch (err) {
            toast.push({
              title: 'Could not delete',
              body: err instanceof Error ? err.message : String(err),
              tone: 'error',
            });
          }
        }}
        title="Delete this campaign?"
        message={
          activeCampaign ? (
            <>
              This permanently removes <strong>{activeCampaign.name}</strong> along with all{' '}
              sourced candidates, outreach history, and activity logs for it. This cannot be
              undone.
            </>
          ) : (
            'No campaign selected.'
          )
        }
        confirmLabel="Delete campaign"
        tone="danger"
      />
    </div>
  );
}

function csvEscape(s: string): string {
  if (s.includes(',') || s.includes('"') || s.includes('\n')) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

// ─── Section card (shared with admin) ─────────────────────────────────────────

function SectionCard({
  icon,
  title,
  subtitle,
  children,
  className,
  noBodyPadding,
  renderHeader = true,
}: {
  icon?: ReactNode;
  title?: string;
  subtitle?: string;
  children: ReactNode;
  className?: string;
  noBodyPadding?: boolean;
  renderHeader?: boolean;
}) {
  return (
    <section
      className={`bg-white dark:bg-[#10131c] border border-gray-200 dark:border-white/10 rounded-xl overflow-hidden flex flex-col ${className ?? ''}`}
    >
      {renderHeader && title && (
        <header className="px-5 py-3.5 border-b border-gray-100 dark:border-white/10 flex items-center gap-2.5">
          {icon && (
            <div className="w-7 h-7 rounded-md bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 flex items-center justify-center">
              {icon}
            </div>
          )}
          <div>
            <h3 className="text-xs font-semibold text-gray-900 dark:text-white leading-none">{title}</h3>
            {subtitle && <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-1">{subtitle}</p>}
          </div>
        </header>
      )}
      <div className={noBodyPadding ? 'flex-1' : 'p-4 flex-1'}>{children}</div>
    </section>
  );
}

function BigStat({ value, tone }: { value: number; tone: 'gray' | 'green' | 'blue' }) {
  const tones: Record<string, string> = {
    gray: 'text-gray-900 dark:text-white',
    green: 'text-emerald-600 dark:text-emerald-400',
    blue: 'text-blue-600 dark:text-blue-400',
  };
  return (
    <p className={`text-3xl font-bold tabular-nums ${tones[tone]}`}>{value.toLocaleString()}</p>
  );
}

function ScreeningStat({
  label,
  value,
  tone = 'gray',
}: {
  label: string;
  value: number;
  tone?: 'gray' | 'green' | 'amber';
}) {
  const tones: Record<string, string> = {
    gray: 'text-gray-900 dark:text-white',
    green: 'text-emerald-600 dark:text-emerald-400',
    amber: 'text-amber-600 dark:text-amber-400',
  };
  return (
    <div className="flex items-baseline gap-1.5">
      <span className={`text-lg font-bold tabular-nums ${tones[tone]}`}>{value}</span>
      <span className="text-[11px] text-gray-500 dark:text-gray-400">{label}</span>
    </div>
  );
}

function SpecField({
  label,
  items,
  compact = false,
}: {
  label: string;
  items: string[];
  compact?: boolean;
}) {
  return (
    <div>
      <p className="text-[10px] font-semibold tracking-widest text-gray-400 dark:text-gray-500 uppercase mb-2">
        {label}
      </p>
      {items.length === 0 ? (
        <p className="text-xs text-gray-400 dark:text-gray-500">—</p>
      ) : compact ? (
        <ul className="flex flex-col gap-1.5">
          {items.map(item => (
            <li key={item} className="text-xs text-gray-700 dark:text-gray-200 flex gap-2">
              <span className="text-gray-400 dark:text-gray-500 shrink-0">•</span>
              <span>{item}</span>
            </li>
          ))}
        </ul>
      ) : (
        <div className="flex flex-wrap gap-1.5">
          {items.map(item => (
            <span
              key={item}
              className="text-[11px] font-medium px-2 py-0.5 rounded-md bg-gray-100 text-gray-700 border border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700"
            >
              {item}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

function CenterLoader() {
  return (
    <div className="flex items-center justify-center py-16">
      <Loader2 className="w-5 h-5 text-gray-400 animate-spin" />
    </div>
  );
}

function EmptyDashboard({ onNew }: { onNew: () => void }) {
  return (
    <SectionCard renderHeader={false}>
      <div className="flex flex-col items-center justify-center py-20 max-w-md mx-auto text-center">
        <div className="w-14 h-14 rounded-2xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-4">
          <Sparkles className="w-6 h-6 text-gray-900 dark:text-gray-300" />
        </div>
        <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-1.5">No campaigns yet</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
          Paste a job description and Gemini will extract the title, keywords, and requirements.
          Then run sourcing to populate the candidate batch.
        </p>
        <button
          onClick={onNew}
          className="flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-black dark:bg-gray-800 rounded-lg hover:bg-gray-800 dark:hover:bg-gray-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Create first campaign
        </button>
      </div>
    </SectionCard>
  );
}

function EmptySourcing({ onSource, sourcing }: { onSource: () => void; sourcing: boolean }) {
  return (
    <SectionCard renderHeader={false}>
      <div className="py-12 flex flex-col items-center text-center px-6">
        <div className="w-12 h-12 rounded-xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-4">
          <Inbox className="w-5 h-5 text-gray-900 dark:text-gray-300" />
        </div>
        <h3 className="text-base font-bold text-gray-900 dark:text-white mb-1">No candidates sourced yet</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-5 max-w-sm">
          Phase 2: ask Gemini to generate a longlist matching this job spec. Approved candidates
          (score ≥ 9.5) advance to Apollo enrichment.
        </p>
        <button
          onClick={onSource}
          disabled={sourcing}
          className="flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-black dark:bg-gray-800 rounded-lg hover:bg-gray-800 dark:hover:bg-gray-700 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
        >
          {sourcing ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Sourcing…
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4" />
              Run sourcing
            </>
          )}
        </button>
      </div>
    </SectionCard>
  );
}
