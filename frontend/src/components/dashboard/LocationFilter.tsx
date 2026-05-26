import { useState, useRef, useEffect, useLayoutEffect, type KeyboardEvent } from 'react';
import { createPortal } from 'react-dom';
import { MapPin, ChevronDown, Check, X, Loader2 } from 'lucide-react';
import { apiClient } from '../../api/client';

/**
 * LinkedIn-style multi-select location dropdown.
 *
 * Behaviour:
 *   - Pill button on the page shows the count of selected locations.
 *   - Clicking opens a panel with a typeahead input + suggested locations.
 *   - Typing adds the value (Enter) or matches it against the suggestions.
 *   - Selections are kept in a local draft until the user clicks
 *     "Show results" — that commits the change and fires onApply.
 *   - "Reset" clears all selections (and fires onApply with []).
 *
 * The component is stateless apart from the draft selection — the parent
 * owns the canonical list of applied locations (so it can pass them to
 * sourceCandidates).
 */

// Curated baseline shown when the input is empty. Covers the markets the
// app is most likely to be sourcing in. Recruiters can type any other city,
// region, or country and it'll go to Apollo verbatim.
const SUGGESTIONS = [
  'United Kingdom',
  'England, United Kingdom',
  'London Area, United Kingdom',
  'Greater London, England, United Kingdom',
  'Manchester, England, United Kingdom',
  'India',
  'Bengaluru, India',
  'Mumbai, India',
  'United States',
  'New York Area, United States',
  'San Francisco Bay Area, United States',
  'Germany',
  'Berlin, Germany',
  'Remote',
];

interface LocationFilterProps {
  applied: string[];
  onApply: (locations: string[]) => void;
}

export function LocationFilter({ applied, onApply }: LocationFilterProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [draft, setDraft] = useState<string[]>(applied);
  const panelRef = useRef<HTMLDivElement | null>(null);
  const buttonRef = useRef<HTMLButtonElement | null>(null);

  // Panel position — computed from the button's bounding rect so the panel
  // renders via portal at document.body level and isn't clipped by any
  // overflow:hidden ancestor (campaign card, sticky header, etc).
  const [panelPos, setPanelPos] = useState<{ top: number; left: number } | null>(null);

  useLayoutEffect(() => {
    if (!open || !buttonRef.current) return;
    function reposition() {
      const r = buttonRef.current!.getBoundingClientRect();
      const PANEL_W = 340;
      const margin = 8;
      // Default to anchoring under the button, left-aligned; flip to the
      // right edge if it would overflow the viewport.
      const wantLeft = r.left;
      const overflowsRight = wantLeft + PANEL_W > window.innerWidth - margin;
      const left = overflowsRight ? Math.max(margin, r.right - PANEL_W) : wantLeft;
      setPanelPos({ top: r.bottom + margin, left });
    }
    reposition();
    window.addEventListener('resize', reposition);
    window.addEventListener('scroll', reposition, true);
    return () => {
      window.removeEventListener('resize', reposition);
      window.removeEventListener('scroll', reposition, true);
    };
  }, [open]);

  // Re-sync draft from applied whenever the panel opens, so closing without
  // committing doesn't leave stale state next time.
  useEffect(() => {
    if (open) setDraft(applied);
  }, [open, applied]);

  // Live global search via /api/locations/search (proxies OpenStreetMap
  // Nominatim). Debounced 300ms; falls back to the curated static list when
  // the input is empty or the query is too short.
  const [remoteHits, setRemoteHits] = useState<string[]>([]);
  const [searching, setSearching] = useState(false);
  useEffect(() => {
    const q = query.trim();
    if (q.length < 2) {
      setRemoteHits([]);
      setSearching(false);
      return;
    }
    let cancelled = false;
    setSearching(true);
    const t = setTimeout(async () => {
      try {
        const res = await apiClient.get<{
          success: boolean;
          results: { name: string; displayName: string }[];
        }>(`/locations/search?q=${encodeURIComponent(q)}`);
        if (!cancelled) setRemoteHits(res.results.map(r => r.name));
      } catch {
        if (!cancelled) setRemoteHits([]);
      } finally {
        if (!cancelled) setSearching(false);
      }
    }, 300);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [query]);

  // Click-outside to close (cancels uncommitted draft).
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

  function toggle(loc: string) {
    setDraft(prev =>
      prev.includes(loc) ? prev.filter(l => l !== loc) : [...prev, loc]
    );
  }

  function addCustom() {
    const v = query.trim();
    if (!v) return;
    if (!draft.includes(v)) setDraft(prev => [...prev, v]);
    setQuery('');
  }

  function handleInputKey(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') {
      e.preventDefault();
      addCustom();
    }
  }

  function commit() {
    onApply(draft);
    setOpen(false);
  }

  function reset() {
    setDraft([]);
    onApply([]);
  }

  // List shown in the dropdown:
  //   - empty query → curated static suggestions
  //   - 2+ chars    → live Nominatim global search results
  // In both cases, anything already in draft is pinned at the top.
  const lowerQ = query.trim().toLowerCase();
  const sourceList = lowerQ.length >= 2 ? remoteHits : SUGGESTIONS;
  const visibleList = Array.from(new Set([...draft, ...sourceList])).slice(0, 12);

  const buttonLabel =
    applied.length === 0
      ? 'Locations'
      : applied.length === 1
        ? applied[0]
        : `Locations · ${applied.length}`;

  return (
    <div className="relative inline-block">
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setOpen(o => !o)}
        className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-full border transition-colors ${
          applied.length > 0
            ? 'bg-gray-900 text-white border-gray-900 hover:bg-gray-800'
            : 'bg-white text-gray-800 border-gray-300 hover:bg-gray-50'
        }`}
      >
        <MapPin className="w-3.5 h-3.5" />
        <span className="truncate max-w-[160px]">{buttonLabel}</span>
        <ChevronDown className={`w-3.5 h-3.5 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && panelPos && createPortal(
        <div
          ref={panelRef}
          style={{ position: 'fixed', top: panelPos.top, left: panelPos.left, width: 340 }}
          className="bg-white border border-gray-200 rounded-xl shadow-xl z-50 flex flex-col"
        >
          {/* Add input */}
          <div className="p-3 border-b border-gray-100">
            <div className="relative">
              <input
                value={query}
                onChange={e => setQuery(e.target.value)}
                onKeyDown={handleInputKey}
                placeholder="Add a location"
                className="w-full bg-white border border-gray-300 rounded-full pl-3.5 pr-9 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30"
              />
              {searching ? (
                <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 animate-spin" />
              ) : query ? (
                <button
                  type="button"
                  onClick={() => setQuery('')}
                  aria-label="Clear input"
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full text-gray-400 hover:text-gray-700 hover:bg-gray-100 flex items-center justify-center"
                >
                  <X className="w-3 h-3" />
                </button>
              ) : null}
            </div>
            {query.trim() &&
              !visibleList.some(s => s.toLowerCase() === lowerQ) &&
              !searching && (
                <button
                  type="button"
                  onClick={addCustom}
                  className="mt-2 text-[11.5px] font-medium text-indigo-700 hover:text-indigo-800"
                >
                  + Add "{query.trim()}"
                </button>
              )}
          </div>

          {/* Suggestion checklist */}
          <div className="px-2 py-1.5 max-h-[260px] overflow-y-auto">
            {visibleList.length === 0 ? (
              <p className="text-xs text-gray-400 px-3 py-4 text-center">
                {searching
                  ? 'Searching…'
                  : `No matches. Press Enter to add "${query.trim()}".`}
              </p>
            ) : (
              visibleList.map(loc => {
                const checked = draft.includes(loc);
                return (
                  <button
                    key={loc}
                    type="button"
                    onClick={() => toggle(loc)}
                    className="w-full flex items-center gap-3 px-3 py-2 rounded-md hover:bg-gray-50 transition-colors text-left"
                  >
                    <span
                      className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 ${
                        checked
                          ? 'bg-gray-900 border-gray-900 text-white'
                          : 'bg-white border-gray-300'
                      }`}
                    >
                      {checked && <Check className="w-3 h-3" />}
                    </span>
                    <span className="text-sm text-gray-800 truncate">{loc}</span>
                  </button>
                );
              })
            )}
          </div>

          {/* Footer actions */}
          <div className="flex items-center justify-between gap-2 px-3 py-2.5 border-t border-gray-100">
            <button
              type="button"
              onClick={reset}
              disabled={draft.length === 0 && applied.length === 0}
              className="px-3.5 py-1.5 text-xs font-semibold text-gray-700 bg-white border border-gray-300 rounded-full hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Reset
            </button>
            <button
              type="button"
              onClick={commit}
              className="px-4 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-full transition-colors"
            >
              Show results
            </button>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
