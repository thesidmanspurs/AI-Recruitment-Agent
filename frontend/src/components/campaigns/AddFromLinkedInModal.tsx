import { useState, type FormEvent } from 'react';
import { Linkedin, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { ApiError } from '../../api/client';
import { CenterModal } from '../shared/CenterModal';

interface AddFromLinkedInModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (
    linkedinUrls: string[]
  ) => Promise<{ addedCount: number; skipped: Array<{ url: string; reason: string }> } | null>;
}

/**
 * Paste LinkedIn profile URLs (one per line) → Apollo Match resolves each
 * into a real candidate row with verified email + full name + title +
 * company. Costs 1 Apollo credit per URL that Apollo finds.
 *
 * This is the workaround for Apollo Basic's redacted Search results:
 * Search alone returns first-name-only, but Match-by-LinkedIn-URL returns
 * the full record. The recruiter does the discovery on LinkedIn (free),
 * pastes the URLs here, and the system does the contact lookup.
 */
export function AddFromLinkedInModal({ open, onClose, onSubmit }: AddFromLinkedInModalProps) {
  const [text, setText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{
    addedCount: number;
    skipped: Array<{ url: string; reason: string }>;
  } | null>(null);

  function reset() {
    setText('');
    setError(null);
    setResult(null);
  }
  function close() {
    reset();
    onClose();
  }

  const urls = text
    .split(/[\n,]+/)
    .map(u => u.trim())
    .filter(Boolean);
  const valid = urls.filter(u => /linkedin\.com\/in\//.test(u));
  const invalid = urls.length - valid.length;

  async function handleSubmit(e?: FormEvent) {
    e?.preventDefault();
    if (valid.length === 0) {
      setError('Paste at least one LinkedIn profile URL (e.g. linkedin.com/in/satyanadella/).');
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const r = await onSubmit(valid);
      setResult(r);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to look up candidates.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <CenterModal
      open={open}
      onClose={close}
      title="Add candidates from LinkedIn"
      subtitle="Paste profile URLs — Apollo will look up each one"
      icon={<Linkedin className="w-4 h-4 text-blue-600" />}
      size="lg"
      footer={
        result ? (
          <button
            onClick={close}
            className="px-4 py-2 text-sm font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors"
          >
            Done
          </button>
        ) : (
          <>
            <button
              onClick={close}
              disabled={submitting}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-60 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={() => handleSubmit()}
              disabled={submitting || valid.length === 0}
              className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Looking up {valid.length} {valid.length === 1 ? 'profile' : 'profiles'}…
                </>
              ) : (
                <>
                  <Linkedin className="w-4 h-4" />
                  Look up {valid.length} {valid.length === 1 ? 'profile' : 'profiles'}
                </>
              )}
            </button>
          </>
        )
      }
    >
      {result ? (
        // ─── Result view ───────────────────────────────────────────────────
        <div className="flex flex-col gap-4">
          <div className="flex items-start gap-3 bg-emerald-50 border border-emerald-200 rounded-lg px-4 py-3">
            <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
            <div className="text-sm text-emerald-800">
              <p className="font-semibold">
                Added {result.addedCount}{' '}
                {result.addedCount === 1 ? 'candidate' : 'candidates'}.
              </p>
              {result.skipped.length > 0 && (
                <p className="text-xs mt-1 text-emerald-700">
                  {result.skipped.length} URL{result.skipped.length === 1 ? '' : 's'} skipped (see
                  below).
                </p>
              )}
            </div>
          </div>

          {result.skipped.length > 0 && (
            <div>
              <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-widest mb-2">
                Skipped
              </p>
              <ul className="flex flex-col gap-1.5 max-h-64 overflow-y-auto">
                {result.skipped.map((s, i) => (
                  <li
                    key={i}
                    className="bg-amber-50 border border-amber-200 rounded-md px-3 py-2"
                  >
                    <p className="text-[11px] font-mono text-amber-800 truncate" title={s.url}>
                      {s.url}
                    </p>
                    <p className="text-[11px] text-amber-700 mt-0.5">{s.reason}</p>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      ) : (
        // ─── Input view ────────────────────────────────────────────────────
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {error && (
            <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-lg px-4 py-3">
              <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-semibold text-gray-600 uppercase tracking-wider">
              LinkedIn profile URLs
            </label>
            <textarea
              value={text}
              onChange={e => setText(e.target.value)}
              placeholder={`https://www.linkedin.com/in/satyanadella/\nhttps://www.linkedin.com/in/sundarpichai/\nhttps://www.linkedin.com/in/...`}
              rows={10}
              className="w-full bg-white border border-gray-300 rounded-lg px-3.5 py-2.5 text-sm font-mono leading-relaxed focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/15 resize-y"
            />
            <p className="text-[11px] text-gray-500">
              One URL per line (or comma-separated).{' '}
              <span className="font-semibold">{valid.length} valid</span>
              {invalid > 0 && (
                <span className="text-amber-600"> · {invalid} not recognised as LinkedIn URLs</span>
              )}
            </p>
          </div>

          <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4 text-xs text-indigo-800 leading-relaxed">
            <p className="font-semibold mb-1">How this works</p>
            <p>
              Apollo's basic-tier <code className="font-mono">people/match</code> endpoint returns
              the full record — name, title, company, verified email — when given a LinkedIn URL.
              Each successful lookup costs <strong>1 Apollo credit</strong>. URLs that Apollo
              can't resolve are listed afterwards, no credit charged.
            </p>
          </div>
        </form>
      )}
    </CenterModal>
  );
}
