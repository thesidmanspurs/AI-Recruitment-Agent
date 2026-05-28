import { useEffect, useState } from 'react';
import { X, Loader2, Send, Sparkles, AlertCircle, Mail, MessageSquare, PencilLine, Check } from 'lucide-react';
import { campaignApi } from '../../api/campaignApi';
import { authApi } from '../../api/authApi';
import { ApiError } from '../../api/client';
import type { Candidate } from '../../types';

/**
 * Outreach editor — replaces the "fire and forget" send.
 * Flow:
 *   1. On open, call /outreach/generate-message to pre-fill subject + body
 *      from Gemini (or the template fallback). Spinner during fetch.
 *   2. Recruiter edits the subject + body freely.
 *   3. "Regenerate" button re-calls Gemini for a fresh draft (overwrites
 *      the edited text — we ask for confirmation if the body has been
 *      modified to avoid surprise data loss).
 *   4. "Send" calls /outreach/send with the edited subject + body.
 *
 * Channel is chosen automatically by the backend (EMAIL if enriched,
 * LINKEDIN_DM otherwise) but the modal surfaces which channel will be
 * used so the recruiter isn't surprised.
 */

interface OutreachEditorModalProps {
  open: boolean;
  campaignId: string;
  candidate: Candidate | null;
  onClose: () => void;
  onSent: (resultMessage?: string, simulated?: boolean) => void;
}

export function OutreachEditorModal({
  open,
  campaignId,
  candidate,
  onClose,
  onSent,
}: OutreachEditorModalProps) {
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [loadingDraft, setLoadingDraft] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dirty, setDirty] = useState(false);
  const [simulated, setSimulated] = useState(false);
  const [showSigEditor, setShowSigEditor] = useState(false);
  const [signature, setSignature] = useState('');
  const [signatureSaved, setSignatureSaved] = useState(false);
  const [savingSig, setSavingSig] = useState(false);

  // Load the user's existing signature when the modal opens so it can be
  // edited inline. Cached for the modal's lifetime; not re-fetched per open.
  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    authApi.me().then(res => {
      if (!cancelled) setSignature(res.user.outreachSignature ?? '');
    }).catch(() => { /* non-fatal */ });
    return () => { cancelled = true; };
  }, [open]);

  async function saveSignature() {
    setSavingSig(true);
    try {
      await authApi.updateProfile({ outreachSignature: signature });
      setSignatureSaved(true);
      setTimeout(() => setSignatureSaved(false), 1800);
      // Re-pull the draft so the new signature shows immediately.
      void regenerate(false);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not save signature.');
    } finally {
      setSavingSig(false);
    }
  }

  // Hydrate draft when modal opens for a new candidate. If the candidate
  // already has a stored outreachMessage we hydrate from that to preserve
  // the recruiter's previous edits — otherwise call Gemini.
  useEffect(() => {
    if (!open || !candidate) return;
    setError(null);
    setDirty(false);
    if (candidate.outreachMessage) {
      const stored = candidate.outreachMessage;
      const idx = stored.indexOf('\n\n');
      if (idx > 0) {
        setSubject(stored.slice(0, idx));
        setBody(stored.slice(idx + 2));
      } else {
        setSubject('');
        setBody(stored);
      }
      setSimulated(false);
      return;
    }
    void regenerate(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, candidate?.id]);

  async function regenerate(confirmIfDirty: boolean) {
    if (!candidate) return;
    if (confirmIfDirty && dirty) {
      const ok = window.confirm('Discard your edits and regenerate a fresh draft with Gemini?');
      if (!ok) return;
    }
    setLoadingDraft(true);
    setError(null);
    try {
      const res = await campaignApi.draftMessage(campaignId, candidate.id);
      setSubject(res.subject);
      setBody(res.body);
      setSimulated(res.isSimulated);
      setDirty(false);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not generate draft.');
    } finally {
      setLoadingDraft(false);
    }
  }

  async function handleSend() {
    if (!candidate) return;
    if (!subject.trim() || !body.trim()) {
      setError('Subject and body are required.');
      return;
    }
    setSending(true);
    setError(null);
    try {
      const res = await campaignApi.sendOutreach(campaignId, candidate.id, {
        subject: subject.trim(),
        body: body.trim(),
      });
      onSent(
        res.isSimulated
          ? res.simulationReason ?? 'Outreach logged in simulation mode.'
          : `Outreach sent to ${candidate.name} via ${res.channel}.`,
        res.isSimulated
      );
      onClose();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Send failed.');
    } finally {
      setSending(false);
    }
  }

  if (!open || !candidate) return null;

  const channelHint = candidate.contact.email
    ? { Icon: Mail, label: `Email → ${candidate.contact.email}`, tone: 'emerald' as const }
    : { Icon: MessageSquare, label: 'LinkedIn DM (simulated)', tone: 'amber' as const };

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <header className="px-6 py-4 border-b border-gray-100 flex items-center justify-between shrink-0">
          <div className="min-w-0">
            <h2 className="text-base font-bold text-gray-900 truncate">
              Outreach · {candidate.name}
            </h2>
            <p className="text-xs text-gray-500 mt-0.5 truncate">
              {candidate.currentTitle} @ {candidate.company}
            </p>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="w-8 h-8 rounded-md flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </header>

        <div className="px-6 py-4 flex items-center justify-between gap-3 bg-gray-50 border-b border-gray-100 shrink-0 flex-wrap">
          <div
            className={`inline-flex items-center gap-1.5 text-[11.5px] font-semibold px-2.5 py-1 rounded-full ${
              channelHint.tone === 'emerald'
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                : 'bg-amber-50 text-amber-700 border border-amber-200'
            }`}
          >
            <channelHint.Icon className="w-3 h-3" />
            {channelHint.label}
          </div>
          {simulated && (
            <span className="inline-flex items-center gap-1 text-[11px] font-medium text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
              <AlertCircle className="w-3 h-3" />
              Template fallback (Gemini unavailable)
            </span>
          )}
          <button
            onClick={() => regenerate(true)}
            disabled={loadingDraft || sending}
            className="inline-flex items-center gap-1.5 text-[11.5px] font-semibold text-indigo-700 bg-white border border-indigo-200 px-3 py-1.5 rounded-full hover:bg-indigo-50 disabled:opacity-60 disabled:cursor-not-allowed transition-colors ml-auto"
          >
            {loadingDraft ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
            Regenerate with Gemini
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5 flex flex-col gap-4">
          {error && (
            <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-lg px-4 py-3">
              <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-gray-700 uppercase tracking-wide">
              Subject
            </label>
            <input
              value={subject}
              onChange={e => {
                setSubject(e.target.value);
                setDirty(true);
              }}
              disabled={loadingDraft || sending}
              placeholder={loadingDraft ? 'Generating draft…' : 'Subject line'}
              className="w-full bg-white border border-gray-300 rounded-lg px-3.5 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30 disabled:bg-gray-50 disabled:text-gray-500"
            />
          </div>
          <div className="flex flex-col gap-1.5 flex-1">
            <label className="text-xs font-semibold text-gray-700 uppercase tracking-wide">
              Body
            </label>
            <textarea
              value={body}
              onChange={e => {
                setBody(e.target.value);
                setDirty(true);
              }}
              disabled={loadingDraft || sending}
              placeholder={loadingDraft ? 'Generating draft…' : 'Message body'}
              rows={14}
              className="w-full bg-white border border-gray-300 rounded-lg px-3.5 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30 disabled:bg-gray-50 disabled:text-gray-500 resize-y leading-relaxed"
            />
            <p className="text-[11px] text-gray-500">
              {body.length.toLocaleString()} characters{dirty ? ' · edited' : ''}
            </p>
          </div>

          {/* Signature editor — saved per user, auto-appended to every draft */}
          <div className="flex flex-col gap-1.5">
            <button
              type="button"
              onClick={() => setShowSigEditor(s => !s)}
              className="self-start inline-flex items-center gap-1.5 text-[11.5px] font-semibold text-indigo-700 hover:text-indigo-800"
            >
              <PencilLine className="w-3.5 h-3.5" />
              {showSigEditor ? 'Hide signature' : 'Edit your signature'}
            </button>
            {showSigEditor && (
              <div className="flex flex-col gap-2 border border-gray-200 rounded-lg p-3 bg-gray-50">
                <label className="text-[11px] font-semibold text-gray-600 uppercase tracking-wider">
                  Email signature
                </label>
                <textarea
                  value={signature}
                  onChange={e => setSignature(e.target.value)}
                  rows={5}
                  placeholder={`Best,\nRayaz Siddiqi\nSenior Recruiter — ARIES\n+44 1234 567890`}
                  className="w-full bg-white border border-gray-300 rounded-md px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30 font-mono leading-relaxed"
                />
                <p className="text-[11px] text-gray-500">
                  Saved on your account and auto-appended to every outreach. Use blank lines for paragraph breaks.
                </p>
                <div className="flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={saveSignature}
                    disabled={savingSig}
                    className="inline-flex items-center gap-1.5 text-[11.5px] font-semibold text-white bg-gray-900 hover:bg-gray-800 disabled:opacity-60 px-3 py-1.5 rounded-md transition-colors"
                  >
                    {savingSig ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : signatureSaved ? (
                      <Check className="w-3 h-3" />
                    ) : null}
                    {signatureSaved ? 'Saved' : 'Save signature'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        <footer className="px-6 py-4 border-t border-gray-100 flex items-center justify-end gap-3 shrink-0">
          <button
            onClick={onClose}
            disabled={sending}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-60 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSend}
            disabled={loadingDraft || sending || !subject.trim() || !body.trim()}
            className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
          >
            {sending ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Sending…
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                Send outreach
              </>
            )}
          </button>
        </footer>
      </div>
    </div>
  );
}
