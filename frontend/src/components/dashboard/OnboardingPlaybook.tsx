import { useMemo, useState } from 'react';
import {
  CheckCircle2,
  Circle,
  ClipboardList,
  Filter,
  Star,
  Send,
  ChevronUp,
  ChevronDown,
  Sparkles,
} from 'lucide-react';
import type { Candidate } from '../../types';
import type { CampaignDto } from '../../api/campaignApi';

/**
 * Sourcing Playbook — 4-step roadmap that tracks the recruiter's progress
 * through the workflow. State is derived from the active campaign + its
 * candidates so there's no separate progress store to keep in sync.
 *
 * Step model:
 *   1. Ingest Job Spec    — complete once Gemini has populated extracted keywords
 *   2. Filter Sourcing    — in progress when candidates exist, complete at 5+
 *   3. Review Match Scores — in progress with any candidate, complete with ≥1 score ≥9.0
 *   4. Send Pitch Outreach — in progress with any draft, complete with ≥1 sent;
 *                           also shows live count of sent outreaches
 */

interface OnboardingPlaybookProps {
  campaign: CampaignDto | null;
  candidates: Candidate[];
  onIngestSpec: () => void;       // open Create Campaign modal
  onScrollToCandidates: () => void; // smooth-scroll to the candidate table
}

type StepStatus = 'pending' | 'in_progress' | 'complete';

interface Step {
  key: string;
  title: string;
  description: string;
  Icon: typeof ClipboardList;
  status: StepStatus;
  metric?: string;
  action?: { label: string; onClick: () => void };
}

function statusOrder(s: StepStatus): number {
  return s === 'complete' ? 2 : s === 'in_progress' ? 1 : 0;
}

export function OnboardingPlaybook({
  campaign,
  candidates,
  onIngestSpec,
  onScrollToCandidates,
}: OnboardingPlaybookProps) {
  const [collapsed, setCollapsed] = useState(false);

  const steps = useMemo<Step[]>(() => {
    const hasCampaign = !!campaign;
    const analyzed = !!campaign && (campaign.extractedKeywords?.length ?? 0) > 0;
    const candidateCount = candidates.length;
    const topMatchCount = candidates.filter(c => c.matchScore >= 9.0).length;
    const sentCount = candidates.filter(c =>
      ['Outreach Sent', 'Opened', 'Replied'].includes(c.outreachStatus)
    ).length;
    const draftCount = candidates.filter(c => c.outreachMessage && c.outreachStatus === 'Enriched').length;

    // Step 1
    let step1: StepStatus = 'pending';
    if (analyzed) step1 = 'complete';
    else if (hasCampaign) step1 = 'in_progress';

    // Step 2
    let step2: StepStatus = 'pending';
    if (candidateCount >= 5) step2 = 'complete';
    else if (candidateCount > 0) step2 = 'in_progress';

    // Step 3
    let step3: StepStatus = 'pending';
    if (topMatchCount >= 1) step3 = 'complete';
    else if (candidateCount > 0) step3 = 'in_progress';

    // Step 4
    let step4: StepStatus = 'pending';
    if (sentCount >= 1) step4 = 'complete';
    else if (draftCount > 0 || candidateCount > 0) step4 = 'in_progress';

    return [
      {
        key: 'ingest',
        title: 'Ingest Job Spec',
        description: analyzed
          ? `Gemini extracted ${campaign?.extractedKeywords?.length} keywords from "${campaign?.jobTitle ?? 'spec'}".`
          : hasCampaign
            ? 'Campaign created — waiting on analysis.'
            : 'Upload or paste the client spec to extract parameters via Gemini.',
        Icon: ClipboardList,
        status: step1,
        action: hasCampaign ? undefined : { label: 'Open analyzer', onClick: onIngestSpec },
      },
      {
        key: 'filter',
        title: 'Filter Sourcing',
        description:
          candidateCount === 0
            ? 'Source from LinkedIn (Apollo) + Reddit. Refine by title, keywords, platform.'
            : `${candidateCount} candidate${candidateCount === 1 ? '' : 's'} sourced across ${[
                ...new Set(candidates.map(c => c.platform)),
              ].join(' + ')}.`,
        Icon: Filter,
        status: step2,
        metric: candidateCount > 0 ? `${candidateCount} sourced` : undefined,
      },
      {
        key: 'review',
        title: 'Review Match Scores',
        description:
          topMatchCount > 0
            ? `${topMatchCount} candidate${topMatchCount === 1 ? '' : 's'} above the 9.0 fit threshold.`
            : candidateCount > 0
              ? 'Open the candidate detail drawer to review fit and approve top picks.'
              : 'Evaluate AI fit grades once candidates are sourced.',
        Icon: Star,
        status: step3,
        metric: topMatchCount > 0 ? `${topMatchCount} ≥ 9.0` : undefined,
        action: candidateCount > 0 ? { label: 'Jump to table', onClick: onScrollToCandidates } : undefined,
      },
      {
        key: 'outreach',
        title: 'Send Pitch Outreach',
        description:
          sentCount > 0
            ? `${sentCount} pitch${sentCount === 1 ? '' : 'es'} delivered. Track responses below.`
            : 'Generate tailored pitches with Gemini and queue outreach sequences.',
        Icon: Send,
        status: step4,
        metric: sentCount > 0 ? `${sentCount} sent` : undefined,
      },
    ];
  }, [campaign, candidates, onIngestSpec, onScrollToCandidates]);

  const total = steps.length;
  const completed = steps.filter(s => s.status === 'complete').length;
  const inProgress = steps.filter(s => s.status === 'in_progress').length;
  const percent = Math.round(((completed + inProgress * 0.5) / total) * 100);

  // Slim-ticker variant when collapsed
  if (collapsed) {
    return (
      <button
        onClick={() => setCollapsed(false)}
        className="w-full flex items-center justify-between gap-3 px-4 py-2.5 bg-[#fafaf8] dark:bg-[#10131c] border border-teal-200/60 dark:border-white/10 rounded-xl hover:border-teal-300 dark:hover:border-white/20 transition-colors"
      >
        <div className="flex items-center gap-3 min-w-0">
          <Sparkles className="w-4 h-4 text-teal-600 shrink-0" />
          <span className="text-xs font-semibold text-gray-800 dark:text-gray-200 truncate">
            Sourcing playbook · {completed}/{total} complete
          </span>
          <div className="hidden sm:flex items-center gap-1 ml-2">
            {steps.map(s => (
              <span
                key={s.key}
                className={`w-1.5 h-1.5 rounded-full ${
                  s.status === 'complete'
                    ? 'bg-teal-500'
                    : s.status === 'in_progress'
                      ? 'bg-amber-400'
                      : 'bg-gray-300 dark:bg-gray-600'
                }`}
              />
            ))}
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-[11px] font-mono text-gray-500 dark:text-gray-400">{percent}%</span>
          <ChevronDown className="w-3.5 h-3.5 text-gray-400 dark:text-gray-500" />
        </div>
      </button>
    );
  }

  return (
    <section className="bg-[#fafaf8] dark:bg-[#10131c] border border-teal-200/60 dark:border-white/10 rounded-2xl overflow-hidden">
      <header className="px-5 py-3.5 border-b border-teal-100 dark:border-white/10 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-7 h-7 rounded-lg bg-teal-600 flex items-center justify-center shrink-0">
            <Sparkles className="w-3.5 h-3.5 text-white" />
          </div>
          <div className="min-w-0">
            <h3 className="text-sm font-bold text-gray-900 dark:text-white leading-tight">Sourcing Playbook</h3>
            <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">
              {completed === total
                ? 'All steps complete — pipeline running.'
                : `Step ${Math.max(1, completed + 1)} of ${total} · ${percent}% complete`}
            </p>
          </div>
        </div>
        <button
          onClick={() => setCollapsed(true)}
          className="inline-flex items-center gap-1 px-2.5 py-1.5 text-[11px] font-medium text-gray-600 dark:text-gray-400 bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-md hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
        >
          Collapse
          <ChevronUp className="w-3 h-3" />
        </button>
      </header>

      {/* Progress bar */}
      <div className="px-5 pt-3">
        <div className="w-full h-1.5 bg-gray-100 dark:bg-white/10 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-teal-500 to-emerald-500 transition-all duration-500 ease-out"
            style={{ width: `${percent}%` }}
          />
        </div>
      </div>

      {/* Steps */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 p-5">
        {steps.map((step, idx) => {
          const order = statusOrder(step.status);
          return (
            <article
              key={step.key}
              className={`relative flex flex-col gap-2 rounded-xl border p-3.5 transition-colors ${
                step.status === 'complete'
                  ? 'border-teal-300 dark:border-teal-400/20 bg-teal-50/50 dark:bg-teal-500/10'
                  : step.status === 'in_progress'
                    ? 'border-amber-200 dark:border-amber-400/20 bg-amber-50/40 dark:bg-amber-500/10'
                    : 'border-gray-200 dark:border-white/10 bg-white dark:bg-[#10131c]'
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <span
                    className={`w-6 h-6 rounded-md flex items-center justify-center shrink-0 ${
                      step.status === 'complete'
                        ? 'bg-teal-500 text-white'
                        : step.status === 'in_progress'
                          ? 'bg-amber-100 dark:bg-amber-500/10 text-amber-700 dark:text-amber-300'
                          : 'bg-gray-100 dark:bg-white/5 text-gray-500 dark:text-gray-400'
                    }`}
                  >
                    <step.Icon className="w-3.5 h-3.5" />
                  </span>
                  <span className="text-[10px] font-mono uppercase tracking-wider text-gray-400 dark:text-gray-500">
                    Step {idx + 1}
                  </span>
                </div>
                {step.status === 'complete' ? (
                  <CheckCircle2 className="w-4 h-4 text-teal-600 shrink-0" />
                ) : step.status === 'in_progress' ? (
                  <span className="text-[9px] font-semibold uppercase text-amber-700 dark:text-amber-300 tracking-wider px-1.5 py-0.5 bg-amber-100 dark:bg-amber-500/10 rounded">
                    In progress
                  </span>
                ) : (
                  <Circle className="w-4 h-4 text-gray-300 dark:text-gray-600 shrink-0" />
                )}
              </div>

              <h4 className="font-semibold text-sm text-gray-900 dark:text-white leading-tight">{step.title}</h4>
              <p className="text-[11px] text-gray-600 dark:text-gray-400 leading-relaxed flex-1">{step.description}</p>

              {(step.metric || step.action) && (
                <div className="flex items-center justify-between gap-2 pt-1 mt-auto border-t border-gray-100 dark:border-white/10">
                  {step.metric ? (
                    <span className="text-[11px] font-semibold text-teal-700 dark:text-teal-300">{step.metric}</span>
                  ) : (
                    <span />
                  )}
                  {step.action && (
                    <button
                      onClick={step.action.onClick}
                      className="text-[11px] font-semibold text-gray-900 dark:text-white hover:underline transition-colors"
                    >
                      {step.action.label} →
                    </button>
                  )}
                </div>
              )}

              {/* Visual rail accent on the left edge */}
              <span
                aria-hidden
                className={`absolute left-0 top-3 bottom-3 w-0.5 rounded-r-full ${
                  order === 2 ? 'bg-teal-500' : order === 1 ? 'bg-amber-400' : 'bg-gray-200 dark:bg-white/10'
                }`}
              />
            </article>
          );
        })}
      </div>
    </section>
  );
}
