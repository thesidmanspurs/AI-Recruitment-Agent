import { useState, useRef, useEffect, useLayoutEffect } from 'react';
import { createPortal } from 'react-dom';
import { Star, ChevronDown, X } from 'lucide-react';

/**
 * Minimum-AI-score filter — applied client-side to the candidate table.
 * Range is 6.0–10.0 in 0.1 steps; default 9.0 matches the suitability
 * threshold the backend screening service uses.
 *
 * UX: small pill button shows "AI score ≥ 9.0". Clicking opens a portal
 * popover (positioned via getBoundingClientRect so it isn't clipped by any
 * overflow-hidden parent) with a range slider + number input.
 */

interface ScoreFilterProps {
  value: number;
  onChange: (next: number) => void;
  defaultValue?: number; // Reset target. Defaults to 9.0.
}

const MIN = 6.0;
const MAX = 10.0;

export function ScoreFilter({ value, onChange, defaultValue = 9.0 }: ScoreFilterProps) {
  const [open, setOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement | null>(null);
  const panelRef = useRef<HTMLDivElement | null>(null);
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);

  useLayoutEffect(() => {
    if (!open || !buttonRef.current) return;
    function reposition() {
      const r = buttonRef.current!.getBoundingClientRect();
      const W = 280;
      const margin = 8;
      const left =
        r.left + W > window.innerWidth - margin
          ? Math.max(margin, r.right - W)
          : r.left;
      setPos({ top: r.bottom + margin, left });
    }
    reposition();
    window.addEventListener('resize', reposition);
    window.addEventListener('scroll', reposition, true);
    return () => {
      window.removeEventListener('resize', reposition);
      window.removeEventListener('scroll', reposition, true);
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    function onDocClick(e: MouseEvent) {
      if (
        panelRef.current &&
        !panelRef.current.contains(e.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, [open]);

  // Clamp safely — keeps the slider visually consistent if a caller passes
  // a value outside [MIN, MAX].
  const clamped = Math.min(MAX, Math.max(MIN, value));
  const isFiltered = clamped > MIN;

  return (
    <div className="relative inline-block">
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setOpen(o => !o)}
        className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-full border transition-colors ${
          isFiltered
            ? 'bg-gray-900 text-white border-gray-900 hover:bg-gray-800'
            : 'bg-white text-gray-800 border-gray-300 hover:bg-gray-50 dark:bg-[#10131c] dark:text-gray-200 dark:border-white/10 dark:hover:bg-white/5'
        }`}
        title="Filter the candidate table by minimum AI fit score"
      >
        <Star className={`w-3.5 h-3.5 ${isFiltered ? '' : 'text-amber-500'}`} />
        <span>AI score ≥ {clamped.toFixed(1)}</span>
        <ChevronDown className={`w-3.5 h-3.5 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && pos && createPortal(
        <div
          ref={panelRef}
          style={{ position: 'fixed', top: pos.top, left: pos.left, width: 280 }}
          className="bg-white border border-gray-200 rounded-xl shadow-xl z-50 flex flex-col dark:bg-[#10131c] dark:border-white/10"
        >
          <div className="flex items-center justify-between px-4 pt-3.5 pb-1.5">
            <h4 className="text-xs font-bold text-gray-900 dark:text-white">Minimum AI score</h4>
            <button
              onClick={() => setOpen(false)}
              aria-label="Close"
              className="w-6 h-6 rounded-md flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-gray-100 dark:text-gray-500 dark:hover:text-gray-200 dark:hover:bg-white/5"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
          <p className="text-[11px] text-gray-500 px-4 dark:text-gray-400">
            Hide candidates scoring below this. Server still saves them; this is a view-only filter.
          </p>

          <div className="px-4 py-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-mono text-gray-500 dark:text-gray-400">{MIN.toFixed(1)}</span>
              <span className="text-2xl font-extrabold text-gray-700 dark:text-gray-300 tabular-nums">
                {clamped.toFixed(1)}
              </span>
              <span className="text-[11px] font-mono text-gray-500 dark:text-gray-400">{MAX.toFixed(1)}</span>
            </div>
            <input
              type="range"
              min={MIN}
              max={MAX}
              step={0.1}
              value={clamped}
              onChange={e => onChange(parseFloat(e.target.value))}
              className="w-full accent-indigo-600"
            />
            <div className="flex items-center justify-between mt-2">
              <input
                type="number"
                min={MIN}
                max={MAX}
                step={0.1}
                value={clamped}
                onChange={e => {
                  const v = parseFloat(e.target.value);
                  if (Number.isFinite(v)) onChange(Math.min(MAX, Math.max(MIN, v)));
                }}
                className="w-20 bg-white border border-gray-300 rounded-md px-2 py-1 text-sm text-gray-900 focus:outline-none focus:border-gray-900 dark:focus:border-gray-400 focus:ring-1 focus:ring-gray-900/10 tabular-nums dark:bg-[#0a0c12] dark:border-white/10 dark:text-gray-100"
              />
              <span className="text-[11px] text-gray-500 dark:text-gray-400">/ 10.0</span>
            </div>
          </div>

          {/* Quick presets */}
          <div className="px-3 pb-2 flex items-center gap-1.5">
            {[7.0, 8.0, 9.0, 9.5].map(p => (
              <button
                key={p}
                onClick={() => onChange(p)}
                className={`text-[11px] font-semibold px-2 py-1 rounded-md border transition-colors ${
                  clamped === p
                    ? 'bg-indigo-50 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 dark:bg-gray-100 dark:bg-gray-800/10 dark:border-gray-200 dark:border-gray-700/20 dark:text-gray-700 dark:text-gray-300'
                    : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50 dark:bg-[#10131c] dark:border-white/10 dark:text-gray-200 dark:hover:bg-white/5'
                }`}
              >
                ≥ {p.toFixed(1)}
              </button>
            ))}
          </div>

          <div className="flex items-center justify-between px-3 py-2.5 border-t border-gray-100 dark:border-white/10">
            <button
              type="button"
              onClick={() => onChange(defaultValue)}
              className="text-[11px] font-semibold text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
            >
              Reset to default ({defaultValue.toFixed(1)})
            </button>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="px-3 py-1.5 text-xs font-semibold text-white bg-gray-900 rounded-full hover:bg-gray-800"
            >
              Done
            </button>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
