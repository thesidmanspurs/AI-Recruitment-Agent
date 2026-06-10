import { Check, HelpCircle } from 'lucide-react';

/**
 * Compact horizontal workflow stepper for the dashboard header.
 * Matches the design pattern: dark filled chip with white check (complete),
 * dark chip with white step number (active/in-progress), or light bordered
 * chip with grey number (pending). Thin grey connector lines between chips.
 *
 * State is owned by the parent — this component is purely presentational.
 */

export type StepperStatus = 'complete' | 'active' | 'pending';

export interface StepperItem {
  key: string;
  label: string;
  status: StepperStatus;
}

interface HeaderStepperProps {
  steps: StepperItem[];
  onHelp?: () => void;
}

export function HeaderStepper({ steps, onHelp }: HeaderStepperProps) {
  return (
    <div className="flex items-center gap-2 px-3 py-1.5 bg-white dark:bg-[#10131c] border border-gray-200 dark:border-white/10 rounded-full shadow-xs">
      {steps.map((s, idx) => (
        <div key={s.key} className="flex items-center gap-2">
          {idx > 0 && (
            <span
              aria-hidden
              className={`hidden sm:block w-6 h-px ${
                steps[idx - 1].status === 'complete' ? 'bg-gray-700 dark:bg-gray-400' : 'bg-gray-200 dark:bg-white/10'
              }`}
            />
          )}
          <div className="flex items-center gap-1.5">
            <span
              className={`relative w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 transition-colors ${
                s.status === 'complete'
                  ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900'
                  : s.status === 'active'
                    ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900 ring-2 ring-gray-900/15 dark:ring-white/20'
                    : 'bg-white dark:bg-white/5 border border-gray-300 dark:border-white/10 text-gray-400 dark:text-gray-500'
              }`}
            >
              {s.status === 'complete' ? <Check className="w-3 h-3" /> : idx + 1}
            </span>
            <span
              className={`text-[11px] font-semibold whitespace-nowrap ${
                s.status === 'pending' ? 'text-gray-400 dark:text-gray-500' : 'text-gray-900 dark:text-white'
              }`}
            >
              {s.label}
            </span>
          </div>
        </div>
      ))}
      {onHelp && (
        <>
          <span aria-hidden className="hidden sm:block w-px h-4 bg-gray-200 dark:bg-white/10 ml-1" />
          <button
            onClick={onHelp}
            aria-label="View full workflow guide"
            title="View full workflow guide"
            className="ml-0.5 w-5 h-5 rounded-full bg-gray-100 dark:bg-white/5 hover:bg-indigo-100 dark:hover:bg-indigo-500/10 text-gray-500 dark:text-gray-400 hover:text-indigo-700 dark:hover:text-indigo-300 flex items-center justify-center transition-colors"
          >
            <HelpCircle className="w-3.5 h-3.5" />
          </button>
        </>
      )}
    </div>
  );
}
