import { useState, useMemo, type ReactNode } from 'react';
import {
  ChevronDown,
  ChevronRight,
  Mail,
  Phone,
  HelpCircle,
  Sparkles,
  CheckCircle2,
  MinusCircle,
  Zap,
  Loader2,
  Send,
  MessageSquare,
  MapPin,
  Linkedin,
  ExternalLink,
} from 'lucide-react';
import type { Candidate } from '../../types';

function Avatar({ name }: { name: string }) {
  const initials = name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
  const colors = [
    'from-violet-500 to-indigo-500',
    'from-sky-500 to-blue-600',
    'from-emerald-500 to-teal-600',
    'from-orange-400 to-rose-500',
  ];
  const color = colors[name.charCodeAt(0) % colors.length];
  return (
    <div className={`w-9 h-9 rounded-full bg-gradient-to-br ${color} flex items-center justify-center shrink-0`}>
      <span className="text-xs font-bold text-white">{initials}</span>
    </div>
  );
}

function EnrichmentIcons({ contact }: { contact: Candidate['contact'] }) {
  return (
    <div className="flex items-center gap-1.5">
      <div
        title={contact.emailEnriched ? contact.email ?? 'Email enriched' : 'Email not yet enriched'}
        className={`w-7 h-7 rounded-full flex items-center justify-center border ${
          contact.emailEnriched
            ? 'bg-emerald-50 border-emerald-200'
            : 'bg-gray-100 border-gray-200'
        }`}
      >
        <Mail
          className={`w-3.5 h-3.5 ${contact.emailEnriched ? 'text-emerald-500' : 'text-gray-400'}`}
        />
      </div>
      <div
        title={
          contact.phoneEnriched
            ? contact.phone ?? 'Phone enriched'
            : 'Phone pending — Apollo delivers it asynchronously via webhook; refresh in a few minutes'
        }
        className={`w-7 h-7 rounded-full flex items-center justify-center border ${
          contact.phoneEnriched
            ? 'bg-emerald-50 border-emerald-200'
            : 'bg-gray-100 border-gray-200'
        }`}
      >
        {contact.phoneEnriched ? (
          <Phone className="w-3.5 h-3.5 text-emerald-500" />
        ) : (
          <HelpCircle className="w-3.5 h-3.5 text-gray-400" />
        )}
      </div>
    </div>
  );
}

function OutreachCell({ candidate }: { candidate: Candidate }) {
  // No outreach yet — say so explicitly instead of hinting at a channel.
  if (candidate.outreachStatus === 'Sourced') {
    return (
      <div>
        <p className="text-xs font-medium text-gray-400 whitespace-nowrap">Not contacted</p>
        <p className="text-[11px] text-gray-400 mt-0.5">Enrich first</p>
      </div>
    );
  }
  if (candidate.outreachStatus === 'Enriched') {
    // Mirror the backend's channel-selection logic so the user sees exactly
    // what "Send outreach" will do: email if we have one, otherwise the
    // platform's native DM. Show the actual destination, not a boolean.
    const destination = candidate.contact.email
      ? candidate.contact.email
      : `via ${candidate.platform}`;
    return (
      <div className="min-w-0">
        <p className="text-xs font-medium text-emerald-700 whitespace-nowrap">Ready to send</p>
        <p className="text-[11px] text-gray-500 mt-0.5 truncate" title={destination}>
          {destination}
        </p>
      </div>
    );
  }

  const channelLabel =
    candidate.outreachChannel === 'email'
      ? 'Email'
      : candidate.outreachChannel === 'linkedin_dm'
      ? 'LinkedIn DM'
      : candidate.outreachChannel === 'platform_message'
      ? 'Platform message'
      : 'LinkedIn DM';

  const sentSubtext = candidate.outreachSentAt
    ? `Sent ${relativeFrom(candidate.outreachSentAt)}`
    : 'Sent recently';

  if (candidate.outreachStatus === 'Outreach Sent') {
    return (
      <div>
        <p className="text-xs font-medium text-blue-700 whitespace-nowrap">{channelLabel}</p>
        <p className="text-[11px] text-gray-500 mt-0.5">{sentSubtext}</p>
      </div>
    );
  }
  if (candidate.outreachStatus === 'No Response') {
    return (
      <div>
        <p className="text-xs font-medium text-red-700 whitespace-nowrap">{channelLabel} · no reply</p>
        <p className="text-[11px] text-red-500 mt-0.5">{sentSubtext}</p>
      </div>
    );
  }
  if (candidate.outreachStatus === 'Replied') {
    return (
      <div>
        <p className="text-xs font-medium text-emerald-700 whitespace-nowrap">Replied</p>
        <p className="text-[11px] text-gray-500 mt-0.5">via {channelLabel.toLowerCase()}</p>
      </div>
    );
  }
  if (candidate.outreachStatus === 'Opened') {
    return (
      <div>
        <p className="text-xs font-medium text-sky-700 whitespace-nowrap">{channelLabel} · opened</p>
        <p className="text-[11px] text-gray-500 mt-0.5">{sentSubtext}</p>
      </div>
    );
  }
  return <span className="text-xs text-gray-400">—</span>;
}

function relativeFrom(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const min = Math.floor(diff / 60_000);
  if (min < 1) return 'just now';
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  return `${Math.floor(hr / 24)}d ago`;
}

function PlatformBadge({ platform }: { platform: Candidate['platform'] }) {
  const styles: Record<string, string> = {
    LinkedIn: 'bg-blue-50 text-blue-600 border-blue-200',
    Upwork: 'bg-emerald-50 text-emerald-600 border-emerald-200',
    Reddit: 'bg-orange-50 text-orange-600 border-orange-200',
  };
  return (
    <span className={`text-[10px] font-medium border rounded px-1.5 py-0.5 ${styles[platform] ?? 'bg-gray-100 text-gray-500'}`}>
      {platform}
    </span>
  );
}

type SortKey = 'matchScore' | 'name' | 'outreachStatus';
export type Tab = 'approved' | 'below' | 'all';

interface CandidateTableProps {
  /** All candidates for the campaign — the component partitions by tab. */
  candidates: Candidate[];
  /** Suitability threshold (defaults to 9.5). */
  threshold?: number;
  /** ID currently being enriched (shows spinner on its button). */
  enrichingId?: string | null;
  /** IDs awaiting an async Apollo phone-reveal webhook. The row's phone slot
   *  shows a spinner with "Awaiting phone…" until the webhook arrives. */
  awaitingPhoneIds?: Map<string, number> | Set<string>;
  /** ID currently in flight for outreach send. */
  outreachId?: string | null;
  /** Triggers Phase 4 Apollo enrichment for one candidate.
   *  `force` skips the "already enriched" cache and spends an Apollo credit. */
  onEnrich?: (candidateId: string, opts?: { force?: boolean }) => Promise<void> | void;
  /** Triggers Phase 5 outreach (Gemini drafts + email/DM dispatch). */
  onSendOutreach?: (candidateId: string) => Promise<void> | void;
  /** Manual reply confirmation (until we have real IMAP/webhook tracking). */
  onMarkReplied?: (candidateId: string) => Promise<void> | void;
}

export function CandidateTable({
  candidates,
  threshold = 9.5,
  enrichingId,
  awaitingPhoneIds,
  outreachId,
  onEnrich,
  onSendOutreach,
  onMarkReplied,
}: CandidateTableProps) {
  const awaitingHas = (id: string) =>
    awaitingPhoneIds instanceof Map
      ? awaitingPhoneIds.has(id)
      : awaitingPhoneIds instanceof Set
        ? awaitingPhoneIds.has(id)
        : false;
  const [tab, setTab] = useState<Tab>('approved');
  const [sort, setSort] = useState<SortKey>('matchScore');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const tabCounts = useMemo(() => {
    const approved = candidates.filter(c => c.matchScore >= threshold).length;
    return {
      approved,
      below: candidates.length - approved,
      all: candidates.length,
    };
  }, [candidates, threshold]);

  const filtered = useMemo(() => {
    if (tab === 'approved') return candidates.filter(c => c.matchScore >= threshold);
    if (tab === 'below') return candidates.filter(c => c.matchScore < threshold);
    return candidates;
  }, [candidates, tab, threshold]);

  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      const av = a[sort] as unknown as number | string;
      const bv = b[sort] as unknown as number | string;
      const cmp = typeof av === 'number' ? (av as number) - (bv as number) : String(av).localeCompare(String(bv));
      return sortDir === 'desc' ? -cmp : cmp;
    });
  }, [filtered, sort, sortDir]);

  function toggleSort(key: SortKey) {
    if (sort === key) setSortDir(d => (d === 'desc' ? 'asc' : 'desc'));
    else {
      setSort(key);
      setSortDir('desc');
    }
  }

  function toggleExpand(id: string) {
    setExpandedId(curr => (curr === id ? null : id));
  }

  return (
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
      {/* Header + tabs */}
      <div className="flex items-center justify-between gap-4 px-5 py-4 border-b border-gray-100 flex-wrap">
        <div className="flex items-center gap-2">
          <TabButton active={tab === 'approved'} onClick={() => setTab('approved')}>
            Approved Queue
            <CountChip>{tabCounts.approved}</CountChip>
          </TabButton>
          <TabButton active={tab === 'below'} onClick={() => setTab('below')}>
            Below Threshold
            <CountChip muted>{tabCounts.below}</CountChip>
          </TabButton>
          <TabButton active={tab === 'all'} onClick={() => setTab('all')}>
            All
            <CountChip muted>{tabCounts.all}</CountChip>
          </TabButton>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-[11px] text-gray-400 tabular-nums">
            Threshold ≥ {threshold.toFixed(1)}
          </span>
          <button
            onClick={() => toggleSort('matchScore')}
            className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-700 transition-colors"
          >
            Sort by: Suitability
            <ChevronDown className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Scrollable table — native horizontal scroll when min-width exceeds container */}
      <div className="overflow-x-auto">
        <table className="w-full table-fixed">
          <thead>
            <tr className="border-b border-gray-100">
              {[
                { label: '', key: null, w: 'w-8' },
                // Candidate column expands to fill remaining space, others fixed.
                { label: 'Candidate', key: 'name' as SortKey, w: 'w-auto' },
                { label: 'AI Score', key: 'matchScore' as SortKey, w: 'w-20' },
                { label: 'Enrichment', key: null, w: 'w-24' },
                { label: 'Outreach', key: 'outreachStatus' as SortKey, w: 'w-44' },
                { label: 'Platform', key: null, w: 'w-24' },
                { label: 'Status', key: null, w: 'w-28' },
              ].map(col => (
                <th
                  key={col.label || 'expand'}
                  className={`px-3 py-3 text-left text-[10px] font-semibold text-gray-400 tracking-widest uppercase ${col.w}`}
                >
                  {col.key ? (
                    <button onClick={() => toggleSort(col.key!)} className="hover:text-gray-600 transition-colors">
                      {col.label}
                    </button>
                  ) : col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sorted.length === 0 && (
              <tr>
                <td colSpan={7} className="px-5 py-12 text-center text-sm text-gray-400">
                  {tab === 'approved'
                    ? 'No candidates passed the suitability threshold yet.'
                    : tab === 'below'
                    ? 'Nothing was screened out — every candidate met the threshold.'
                    : 'No candidates have been sourced yet.'}
                </td>
              </tr>
            )}
            {sorted.flatMap(candidate => {
              const expanded = expandedId === candidate.id;
              const below = candidate.matchScore < threshold;
              return renderExpandableRow(
                candidate,
                expanded,
                below,
                threshold,
                () => toggleExpand(candidate.id),
                {
                  onEnrich,
                  onSendOutreach,
                  onMarkReplied,
                  isEnriching: enrichingId === candidate.id,
                  isSendingOutreach: outreachId === candidate.id,
                  isAwaitingPhone: awaitingHas(candidate.id),
                }
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

interface RowActions {
  onEnrich?: (candidateId: string, opts?: { force?: boolean }) => Promise<void> | void;
  onSendOutreach?: (candidateId: string) => Promise<void> | void;
  onMarkReplied?: (candidateId: string) => Promise<void> | void;
  isEnriching?: boolean;
  isSendingOutreach?: boolean;
  isAwaitingPhone?: boolean;
}

function renderExpandableRow(
  candidate: Candidate,
  expanded: boolean,
  below: boolean,
  threshold: number,
  onToggle: () => void,
  actions: RowActions = {}
): ReactNode[] {
  const {
    onEnrich,
    onSendOutreach,
    onMarkReplied,
    isEnriching = false,
    isSendingOutreach = false,
    isAwaitingPhone = false,
  } = actions;
  // "Has actual data" — true only when at least one contact field was found.
  const hasContactData = candidate.contact.emailEnriched || candidate.contact.phoneEnriched;
  // "Attempt made" — true if user has clicked Enrich at least once (status moved
  // past Sourced). On Apollo free tier this is true even when no fields came
  // back, so we still render the panel — just with "Not available" rows.
  const enrichmentAttempted = candidate.outreachStatus !== 'Sourced';
  const alreadyEnriched = hasContactData || enrichmentAttempted;
  const canEnrich = !below && !!onEnrich;
  const outreachInFlight = candidate.outreachStatus !== 'Sourced' && candidate.outreachStatus !== 'Enriched';
  const canSendOutreach = !below && !!onSendOutreach;
  const canMarkReplied =
    !!onMarkReplied &&
    candidate.outreachStatus !== 'Sourced' &&
    candidate.outreachStatus !== 'Enriched' &&
    candidate.outreachStatus !== 'Replied';
  const rows: ReactNode[] = [
    <tr
      key={`row-${candidate.id}`}
      onClick={onToggle}
      className={`border-b border-gray-50 hover:bg-gray-50/60 cursor-pointer transition-colors ${
        below ? 'opacity-70' : ''
      }`}
    >
      <td className="px-3 py-3.5 text-center">
        <ChevronRight
          className={`w-4 h-4 text-gray-400 transition-transform ${expanded ? 'rotate-90' : ''}`}
        />
      </td>
      <td className="px-3 py-3.5">
        <div className="flex items-center gap-3">
          <Avatar name={candidate.name} />
          <div className="min-w-0">
            <p className="text-sm font-semibold text-gray-900 truncate">{candidate.name}</p>
            <p className="text-xs text-gray-400 truncate">
              {candidate.currentTitle} @ {candidate.company}
            </p>
          </div>
        </div>
      </td>
      <td className="px-3 py-3.5">
        <div className="flex items-baseline gap-1">
          <span
            className={`text-xl font-bold tabular-nums ${
              below ? 'text-gray-400' : 'text-indigo-600'
            }`}
          >
            {candidate.matchScore.toFixed(1)}
          </span>
          {below && (
            <span className="text-[10px] font-semibold text-amber-600 uppercase">
              &lt;{threshold}
            </span>
          )}
        </div>
      </td>
      <td className="px-3 py-3.5">
        <EnrichmentIcons contact={candidate.contact} />
      </td>
      <td className="px-3 py-3.5">
        <OutreachCell candidate={candidate} />
      </td>
      <td className="px-3 py-3.5">
        <PlatformBadge platform={candidate.platform} />
      </td>
      <td className="px-3 py-3.5">
        <StatusPill status={candidate.outreachStatus} />
      </td>
    </tr>,
  ];

  if (expanded) {
    rows.push(
      <tr key={`detail-${candidate.id}`} className="bg-gray-50/60 border-b border-gray-100">
        <td colSpan={7} className="px-12 py-5">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <DetailBlock
              icon={<Sparkles className="w-3.5 h-3.5 text-indigo-500" />}
              label="Why this score"
            >
              <p className="text-xs text-gray-700 leading-relaxed">
                {candidate.matchExplanation}
              </p>
              {candidate.skills.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-3">
                  {candidate.skills.map(s => (
                    <span
                      key={s}
                      className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-100"
                    >
                      {s}
                    </span>
                  ))}
                </div>
              )}
            </DetailBlock>

            <DetailBlock
              icon={<CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />}
              label="Strengths"
            >
              {candidate.strengths.length === 0 ? (
                <p className="text-xs text-gray-400">—</p>
              ) : (
                <ul className="flex flex-col gap-1.5">
                  {candidate.strengths.map(s => (
                    <li key={s} className="text-xs text-gray-700 flex gap-2">
                      <span className="text-emerald-500 shrink-0">•</span>
                      <span>{s}</span>
                    </li>
                  ))}
                </ul>
              )}
            </DetailBlock>

            <DetailBlock
              icon={<MinusCircle className="w-3.5 h-3.5 text-rose-500" />}
              label="Gaps"
            >
              {candidate.gaps.length === 0 ? (
                <p className="text-xs text-gray-400">—</p>
              ) : (
                <ul className="flex flex-col gap-1.5">
                  {candidate.gaps.map(g => (
                    <li key={g} className="text-xs text-gray-700 flex gap-2">
                      <span className="text-rose-500 shrink-0">•</span>
                      <span>{g}</span>
                    </li>
                  ))}
                </ul>
              )}
            </DetailBlock>
          </div>
          {candidate.bio && (
            <p className="text-xs text-gray-500 mt-5 italic leading-relaxed">
              {candidate.bio}
            </p>
          )}

          {/* Phase 4 — per-candidate enrichment action */}
          {canEnrich && (
            <div className="mt-5 bg-gray-50 border border-gray-200 rounded-lg px-4 py-3">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-gray-700">
                  {hasContactData ? (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                      Contact data on file
                    </>
                  ) : enrichmentAttempted ? (
                    <>
                      <HelpCircle className="w-3.5 h-3.5 text-amber-500" />
                      Apollo had no public contact info
                    </>
                  ) : (
                    <>
                      <Zap className="w-3.5 h-3.5 text-indigo-500" />
                      Resolve contact via Apollo
                    </>
                  )}
                </div>
                <button
                  onClick={e => {
                    e.stopPropagation();
                    // First-time enrich: no force flag (uses cache if data exists).
                    // Re-enrich on an already-enriched candidate: force a fresh
                    // Apollo call (costs 1 credit) — make that intent explicit.
                    onEnrich?.(candidate.id, alreadyEnriched ? { force: true } : {});
                  }}
                  disabled={isEnriching}
                  title={
                    alreadyEnriched
                      ? 'Force a fresh Apollo lookup — spends 1 credit even though data is on file'
                      : 'Look up email & phone via Apollo — 1 credit if found'
                  }
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-indigo-600 rounded-md hover:bg-indigo-700 disabled:opacity-60 disabled:cursor-not-allowed transition-colors shrink-0"
                >
                  {isEnriching ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      Enriching…
                    </>
                  ) : (
                    <>
                      <Zap className="w-3.5 h-3.5" />
                      {alreadyEnriched ? 'Re-enrich (1 credit)' : 'Enrich contact'}
                    </>
                  )}
                </button>
              </div>

              {/* Contact details — visible once any field is populated */}
              {alreadyEnriched ? (
                <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-2">
                  <ContactRow
                    icon={<Mail className="w-3.5 h-3.5 text-emerald-600" />}
                    label="Email"
                    value={candidate.contact.email}
                    href={candidate.contact.email ? `mailto:${candidate.contact.email}` : undefined}
                  />
                  <ContactRow
                    icon={
                      isAwaitingPhone && !candidate.contact.phone ? (
                        <Loader2 className="w-3.5 h-3.5 text-emerald-600 animate-spin" />
                      ) : (
                        <Phone className="w-3.5 h-3.5 text-emerald-600" />
                      )
                    }
                    label="Phone"
                    value={candidate.contact.phone}
                    href={candidate.contact.phone ? `tel:${candidate.contact.phone}` : undefined}
                    fallback={
                      isAwaitingPhone
                        ? 'Awaiting phone… Apollo will deliver it within a few minutes.'
                        : 'Pending — click Re-enrich to request a phone reveal.'
                    }
                  />
                  <ContactRow
                    icon={<MapPin className="w-3.5 h-3.5 text-gray-500" />}
                    label="Location"
                    value={candidate.contact.location}
                  />
                  <ContactRow
                    icon={<Linkedin className="w-3.5 h-3.5 text-blue-600" />}
                    label="LinkedIn"
                    value={candidate.contact.linkedinUrl}
                    href={candidate.contact.linkedinUrl ?? undefined}
                    external
                  />
                </div>
              ) : (
                <p className="text-[11px] text-gray-500 mt-2">
                  Each enrichment costs 1 Apollo credit.
                </p>
              )}

              {/* Diagnostic note for the empty-result case */}
              {enrichmentAttempted && !hasContactData && (
                <p className="text-[11px] text-amber-700 mt-3 leading-relaxed">
                  Apollo Match couldn't disambiguate{' '}
                  <span className="font-mono">"{candidate.name}"</span> at{' '}
                  <span className="font-mono">{candidate.company}</span> with the data we have.
                  This is a known limitation of Apollo's Basic tier — Search results redact
                  <span className="font-mono"> last_name</span>, and Match needs a full name + email
                  or a LinkedIn URL to reveal contact details. Workarounds: provide a LinkedIn URL
                  manually, or upgrade to a tier that returns full names on Search.
                </p>
              )}
            </div>
          )}

          {/* Phase 5 — outreach + reply tracking */}
          {(canSendOutreach || canMarkReplied) && (
            <div className="mt-3 flex items-center justify-between gap-3 bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 flex-wrap">
              <div className="text-xs text-gray-600">
                {outreachInFlight ? (
                  <span className="flex items-center gap-1.5">
                    <Send className="w-3.5 h-3.5 text-blue-500" />
                    Outreach status:{' '}
                    <span className="font-semibold text-gray-900">{candidate.outreachStatus}</span>
                    {candidate.outreachChannel && (
                      <span className="text-gray-400">
                        · channel: {candidate.outreachChannel.replace(/_/g, ' ')}
                      </span>
                    )}
                  </span>
                ) : (
                  <>
                    Send a personalised Gemini-drafted message to this candidate.{' '}
                    <span className="text-gray-400">
                      {candidate.contact.email
                        ? `Will go to ${candidate.contact.email}.`
                        : 'No email yet — will use LinkedIn DM.'}
                    </span>
                  </>
                )}
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {canMarkReplied && (
                  <button
                    onClick={e => {
                      e.stopPropagation();
                      onMarkReplied?.(candidate.id);
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-md hover:bg-emerald-100 transition-colors"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    Mark replied
                  </button>
                )}
                {canSendOutreach && (
                  <button
                    onClick={e => {
                      e.stopPropagation();
                      onSendOutreach?.(candidate.id);
                    }}
                    disabled={isSendingOutreach}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-indigo-600 rounded-md hover:bg-indigo-700 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
                  >
                    {isSendingOutreach ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        Sending…
                      </>
                    ) : (
                      <>
                        <Send className="w-3.5 h-3.5" />
                        {outreachInFlight ? 'Re-send' : 'Send outreach'}
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          )}
        </td>
      </tr>
    );
  }

  return rows;
}

function DetailBlock({
  icon,
  label,
  children,
}: {
  icon: ReactNode;
  label: string;
  children: ReactNode;
}) {
  return (
    <div>
      <div className="flex items-center gap-1.5 mb-2">
        {icon}
        <p className="text-[10px] font-semibold tracking-widest text-gray-500 uppercase">{label}</p>
      </div>
      {children}
    </div>
  );
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${
        active
          ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
          : 'text-gray-500 hover:bg-gray-50 border border-transparent'
      }`}
    >
      {children}
    </button>
  );
}

function CountChip({ children, muted }: { children: ReactNode; muted?: boolean }) {
  return (
    <span
      className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
        muted
          ? 'bg-gray-200/80 text-gray-600'
          : 'bg-indigo-100 text-indigo-700'
      }`}
    >
      {children}
    </span>
  );
}

function ContactRow({
  icon,
  label,
  value,
  href,
  external,
  fallback,
}: {
  icon: ReactNode;
  label: string;
  value: string | null | undefined;
  href?: string;
  external?: boolean;
  fallback?: string;
}) {
  const has = !!value && value.trim().length > 0;
  return (
    <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-md px-3 py-2">
      <span className="shrink-0">{icon}</span>
      <div className="flex-1 min-w-0">
        <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-widest">{label}</p>
        {has ? (
          href ? (
            <a
              href={href}
              target={external ? '_blank' : undefined}
              rel={external ? 'noopener noreferrer' : undefined}
              onClick={e => e.stopPropagation()}
              className="text-xs font-medium text-indigo-700 hover:text-indigo-800 truncate flex items-center gap-1"
              title={value!}
            >
              <span className="truncate">{value}</span>
              {external && <ExternalLink className="w-3 h-3 shrink-0 opacity-60" />}
            </a>
          ) : (
            <p className="text-xs text-gray-700 truncate" title={value!}>
              {value}
            </p>
          )
        ) : (
          <p className="text-[11px] text-gray-400 italic truncate" title={fallback ?? ''}>
            {fallback ?? '—'}
          </p>
        )}
      </div>
    </div>
  );
}

function StatusPill({ status }: { status: Candidate['outreachStatus'] }) {
  const styles: Record<string, string> = {
    Sourced: 'bg-gray-100 text-gray-500',
    Enriched: 'bg-purple-50 text-purple-600',
    'Outreach Sent': 'bg-blue-50 text-blue-600',
    Opened: 'bg-sky-50 text-sky-600',
    Replied: 'bg-emerald-50 text-emerald-600',
    'No Response': 'bg-red-50 text-red-500',
  };
  return (
    <span className={`text-[11px] font-medium px-2 py-1 rounded-full ${styles[status] ?? 'bg-gray-100 text-gray-500'}`}>
      {status}
    </span>
  );
}
