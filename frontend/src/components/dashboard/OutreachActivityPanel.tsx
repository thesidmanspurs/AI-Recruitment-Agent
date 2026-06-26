import { useState, useMemo } from 'react';
import {
  Send,
  Mail,
  MessageSquare,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Loader2,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import type { CandidateDto } from '../../api/campaignApi';

/**
 * Outreach activity panel — surfaces every candidate the recruiter has
 * contacted, when they were contacted, the channel used, and the reply
 * state. Data is derived entirely from existing CandidateDto fields:
 *   outreachStatus, outreachSentAt, outreachChannel, repliedAt,
 *   replyPreview, daysSinceOutreach, alertTriggered.
 *
 * Reply detection happens server-side via the IMAP poller — this panel
 * just reflects whatever the DB currently says.
 */

interface OutreachActivityPanelProps {
  candidates: CandidateDto[];
  onMarkReplied: (candidateId: string) => Promise<void>;
  markingId?: string | null;
}

type Tab = 'all' | 'awaiting' | 'replied';

function formatRelative(iso: string | null): string {
  if (!iso) return '—';
  const d = new Date(iso);
  const diffMs = Date.now() - d.getTime();
  const mins = Math.floor(diffMs / 60_000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return d.toLocaleDateString();
}

function channelChip(channel: CandidateDto['outreachChannel']) {
  if (channel === 'EMAIL') {
    return (
      <span className="inline-flex items-center gap-1 text-[10.5px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded dark:bg-emerald-500/10 dark:text-emerald-300 dark:border-emerald-400/20">
        <Mail className="w-2.5 h-2.5" /> Email
      </span>
    );
  }
  if (channel === 'LINKEDIN_DM') {
    return (
      <span className="inline-flex items-center gap-1 text-[10.5px] font-semibold text-blue-700 bg-blue-50 border border-blue-200 px-1.5 py-0.5 rounded dark:bg-blue-500/10 dark:text-blue-300 dark:border-blue-400/20">
        <MessageSquare className="w-2.5 h-2.5" /> LinkedIn
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 text-[10.5px] font-semibold text-gray-700 bg-gray-50 border border-gray-200 px-1.5 py-0.5 rounded dark:bg-white/5 dark:text-gray-200 dark:border-white/10">
      <MessageSquare className="w-2.5 h-2.5" /> {channel ?? '—'}
    </span>
  );
}

function statusChip(c: CandidateDto) {
  const s = c.outreachStatus;
  if (s === 'REPLIED') {
    return (
      <span className="inline-flex items-center gap-1 text-[10.5px] font-semibold text-emerald-800 bg-emerald-100 border border-emerald-300 px-1.5 py-0.5 rounded-full dark:bg-emerald-500/10 dark:text-emerald-300 dark:border-emerald-400/20">
        <CheckCircle2 className="w-3 h-3" /> Replied
      </span>
    );
  }
  if (s === 'OPENED') {
    return (
      <span className="inline-flex items-center gap-1 text-[10.5px] font-semibold text-gray-700 dark:text-gray-300 bg-indigo-50 border border-gray-200 dark:border-gray-700 px-1.5 py-0.5 rounded-full dark:bg-gray-100 dark:bg-gray-800/10 dark:text-gray-700 dark:text-gray-300 dark:border-gray-200 dark:border-gray-700/20">
        Opened
      </span>
    );
  }
  if (s === 'NO_RESPONSE' || (c.daysSinceOutreach >= 2 && s === 'OUTREACH_SENT')) {
    return (
      <span className="inline-flex items-center gap-1 text-[10.5px] font-semibold text-amber-800 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded-full dark:bg-amber-500/10 dark:text-amber-300 dark:border-amber-400/20">
        <AlertTriangle className="w-3 h-3" /> Awaiting
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 text-[10.5px] font-semibold text-gray-700 bg-gray-50 border border-gray-200 px-1.5 py-0.5 rounded-full dark:bg-white/5 dark:text-gray-200 dark:border-white/10">
      <Clock className="w-3 h-3" /> Sent
    </span>
  );
}

export function OutreachActivityPanel({
  candidates,
  onMarkReplied,
  markingId,
}: OutreachActivityPanelProps) {
  const [tab, setTab] = useState<Tab>('all');
  const [collapsed, setCollapsed] = useState(false);
  const [expandedReply, setExpandedReply] = useState<string | null>(null);

  // Only candidates we've actually contacted (OUTREACH_SENT or later).
  const contacted = useMemo(
    () =>
      candidates
        .filter(c => c.outreachSentAt && ['OUTREACH_SENT', 'OPENED', 'REPLIED', 'NO_RESPONSE'].includes(c.outreachStatus))
        .sort((a, b) => {
          const ta = a.outreachSentAt ? new Date(a.outreachSentAt).getTime() : 0;
          const tb = b.outreachSentAt ? new Date(b.outreachSentAt).getTime() : 0;
          return tb - ta;
        }),
    [candidates]
  );

  const counts = useMemo(() => {
    const replied = contacted.filter(c => c.outreachStatus === 'REPLIED').length;
    const awaiting = contacted.filter(c => c.outreachStatus !== 'REPLIED').length;
    return { all: contacted.length, awaiting, replied };
  }, [contacted]);

  const filtered = useMemo(() => {
    if (tab === 'replied') return contacted.filter(c => c.outreachStatus === 'REPLIED');
    if (tab === 'awaiting') return contacted.filter(c => c.outreachStatus !== 'REPLIED');
    return contacted;
  }, [contacted, tab]);

  if (contacted.length === 0) return null;

  return (
    <section className="bg-white border border-gray-200 rounded-2xl overflow-hidden dark:bg-[#10131c] dark:border-white/10">
      <header className="px-5 py-3.5 border-b border-gray-100 flex items-center justify-between gap-3 flex-wrap dark:border-white/10">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-7 h-7 rounded-lg bg-gray-900 dark:bg-gray-700 flex items-center justify-center shrink-0">
            <Send className="w-3.5 h-3.5 text-white" />
          </div>
          <div className="min-w-0">
            <h3 className="text-sm font-bold text-gray-900 leading-tight dark:text-white">Outreach activity</h3>
            <p className="text-[11px] text-gray-500 mt-0.5 dark:text-gray-400">
              {counts.all} sent · {counts.replied} replied · {counts.awaiting} awaiting
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {(['all', 'awaiting', 'replied'] as Tab[]).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`text-[11px] font-semibold px-3 py-1.5 rounded-full border transition-colors capitalize ${
                tab === t
                  ? 'bg-gray-900 text-white border-gray-900'
                  : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50 dark:bg-[#10131c] dark:text-gray-200 dark:border-white/10 dark:hover:bg-white/5'
              }`}
            >
              {t} · {counts[t]}
            </button>
          ))}
          <button
            onClick={() => setCollapsed(c => !c)}
            className="inline-flex items-center gap-1 text-[11px] font-medium text-gray-500 hover:text-gray-700 ml-1 dark:text-gray-400 dark:hover:text-gray-200"
          >
            {collapsed ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronUp className="w-3.5 h-3.5" />}
          </button>
        </div>
      </header>

      {!collapsed && (
        <div className="divide-y divide-gray-100 dark:divide-white/10">
          {filtered.length === 0 ? (
            <div className="px-5 py-8 text-center text-sm text-gray-400 dark:text-gray-500">
              Nothing in this view.
            </div>
          ) : (
            filtered.map(c => {
              const isExpanded = expandedReply === c.id;
              return (
                <div key={c.id} className="px-5 py-3 flex flex-col gap-2">
                  <div className="flex items-center gap-3 flex-wrap">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-sm text-gray-900 truncate dark:text-white">{c.name}</span>
                        {statusChip(c)}
                        {channelChip(c.outreachChannel)}
                      </div>
                      <div className="text-[11px] text-gray-500 mt-0.5 truncate dark:text-gray-400">
                        {c.currentTitle} · {c.company}
                        {c.email ? <> · <span className="font-mono">{c.email}</span></> : null}
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="text-[11px] text-gray-500 dark:text-gray-400">Sent</div>
                      <div className="text-xs font-semibold text-gray-700 tabular-nums dark:text-gray-200">
                        {formatRelative(c.outreachSentAt)}
                      </div>
                    </div>
                    {c.outreachStatus === 'REPLIED' && (
                      <div className="text-right shrink-0 border-l border-gray-100 pl-3 ml-2 dark:border-white/10">
                        <div className="text-[11px] text-emerald-700 dark:text-emerald-400">Replied</div>
                        <div className="text-xs font-semibold text-emerald-800 tabular-nums dark:text-emerald-300">
                          {formatRelative(c.repliedAt)}
                        </div>
                      </div>
                    )}
                    {c.outreachStatus !== 'REPLIED' && (
                      <button
                        onClick={() => onMarkReplied(c.id)}
                        disabled={markingId === c.id}
                        className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-emerald-700 bg-white border border-emerald-200 hover:bg-emerald-50 disabled:opacity-60 px-2.5 py-1.5 rounded-md transition-colors dark:bg-[#10131c] dark:text-emerald-400 dark:border-emerald-400/20 dark:hover:bg-emerald-500/10"
                      >
                        {markingId === c.id ? (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        ) : (
                          <CheckCircle2 className="w-3 h-3" />
                        )}
                        Mark replied
                      </button>
                    )}
                  </div>

                  {c.replyPreview && (
                    <div>
                      <button
                        onClick={() => setExpandedReply(isExpanded ? null : c.id)}
                        className="text-[11px] font-semibold text-gray-700 dark:text-gray-300 hover:text-gray-700 dark:text-gray-300 dark:text-gray-700 dark:text-gray-300 dark:hover:text-gray-700 dark:text-gray-300"
                      >
                        {isExpanded ? 'Hide reply preview' : 'Show reply preview'}
                      </button>
                      {isExpanded && (
                        <p className="mt-2 text-[12.5px] text-gray-700 leading-relaxed bg-emerald-50/40 border-l-2 border-emerald-300 pl-3 py-2 rounded-r whitespace-pre-wrap dark:text-gray-200 dark:bg-emerald-500/5 dark:border-emerald-400/30">
                          {c.replyPreview}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}
    </section>
  );
}
