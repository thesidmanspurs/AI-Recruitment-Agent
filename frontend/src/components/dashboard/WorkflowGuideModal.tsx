import { X, ClipboardList, Filter, Star, Send, CheckCircle2, Circle, CircleDot } from 'lucide-react';
import type { StepperStatus } from './HeaderStepper';

interface WorkflowGuideModalProps {
  open: boolean;
  onClose: () => void;
  liveStatuses?: Record<string, StepperStatus>; // key → status, so the modal mirrors the stepper
}

/**
 * Full-screen-ish modal explaining the 4-step TalentScanr workflow.
 * Content sourced verbatim from step-by-step.md so a non-technical
 * reviewer can edit the guidance there and see it in the UI immediately.
 */
const STEPS = [
  {
    key: 'ingest',
    title: 'Ingest Job Spec',
    Icon: ClipboardList,
    body: 'Upload raw client specifications (PDF, DOCX, or paste text) to extract parameters via Gemini. The active trigger button opens the Job Spec Analyzer Console. Marks Complete once a specification has been successfully analyzed.',
  },
  {
    key: 'filter',
    title: 'Filter Sourcing',
    Icon: Filter,
    body: 'Refine candidates by platform channels (LinkedIn, Reddit) or query terms. Displays active parameters and marks In Progress as soon as any filter is modified.',
  },
  {
    key: 'review',
    title: 'Review Match Scores',
    Icon: Star,
    body: 'Evaluate AI Fit Grades, highlighting candidates with a Match Score > 9.0. Updates live to reflect whichever candidate is currently being reviewed in the detail drawer.',
  },
  {
    key: 'outreach',
    title: 'Send Pitch Outreach',
    Icon: Send,
    body: 'Generate tailored pitches using the Gemini AI copy assistant and queue outreach sequences. Tracks and displays the live count of sent campaigns.',
  },
];

function statusBadge(status: StepperStatus | undefined) {
  if (status === 'complete') {
    return (
      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-400/20 px-2 py-0.5 rounded-full">
        <CheckCircle2 className="w-3 h-3" /> Complete
      </span>
    );
  }
  if (status === 'active') {
    return (
      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-400/20 px-2 py-0.5 rounded-full">
        <CircleDot className="w-3 h-3" /> In progress
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 text-[11px] font-medium text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 px-2 py-0.5 rounded-full">
      <Circle className="w-3 h-3" /> Pending
    </span>
  );
}

export function WorkflowGuideModal({ open, onClose, liveStatuses }: WorkflowGuideModalProps) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-2xl bg-white dark:bg-[#10131c] rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        <header className="px-6 py-4 border-b border-gray-100 dark:border-white/10 flex items-center justify-between shrink-0">
          <div>
            <h2 className="text-base font-bold text-gray-900 dark:text-white">TalentScanr Workflow Guide</h2>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              The 4-step playbook from spec ingestion to outreach delivery.
            </p>
          </div>
          <button
            onClick={onClose}
            aria-label="Close workflow guide"
            className="w-8 h-8 rounded-md flex items-center justify-center text-gray-400 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-white/5 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto px-6 py-5 flex flex-col gap-4">
          {STEPS.map((s, idx) => {
            const status = liveStatuses?.[s.key];
            return (
              <article
                key={s.key}
                className={`relative flex gap-4 rounded-xl border p-4 ${
                  status === 'complete'
                    ? 'border-emerald-200 dark:border-emerald-400/20 bg-emerald-50/30 dark:bg-emerald-500/10'
                    : status === 'active'
                      ? 'border-amber-200 dark:border-amber-400/20 bg-amber-50/30 dark:bg-amber-500/10'
                      : 'border-gray-200 dark:border-white/10 bg-white dark:bg-[#10131c]'
                }`}
              >
                <div className="flex flex-col items-center gap-2 shrink-0">
                  <span className="w-8 h-8 rounded-full bg-gray-900 text-white flex items-center justify-center font-bold text-xs">
                    {idx + 1}
                  </span>
                  <s.Icon className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1.5">
                    <h3 className="font-semibold text-sm text-gray-900 dark:text-white">{s.title}</h3>
                    {statusBadge(status)}
                  </div>
                  <p className="text-[12.5px] text-gray-600 dark:text-gray-400 leading-relaxed">{s.body}</p>
                </div>
              </article>
            );
          })}

          <div className="rounded-xl bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-800 px-4 py-3">
            <p className="text-[11.5px] text-gray-800 dark:text-gray-200 leading-relaxed">
              <span className="font-semibold">Tip:</span> Progress updates live across the stepper,
              the Sourcing Playbook panel, and this guide. The pipeline never invents candidates —
              every row is a real Apollo (LinkedIn) or Reddit user.
            </p>
          </div>
        </div>

        <footer className="px-6 py-3 border-t border-gray-100 dark:border-white/10 flex items-center justify-end shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-semibold text-white bg-gray-900 rounded-lg hover:bg-gray-800 transition-colors"
          >
            Got it
          </button>
        </footer>
      </div>
    </div>
  );
}
