import { useState, useRef, type FormEvent, type ChangeEvent } from 'react';
import {
  X, Loader2, Sparkles, AlertCircle, Upload, FileText, ClipboardPaste, Wand2,
  RefreshCw, Check, Plus, Tag, ListChecks,
} from 'lucide-react';
import { ApiError } from '../../api/client';
import { campaignApi, type CreateCampaignInput, type CampaignDto } from '../../api/campaignApi';

interface CreateCampaignModalProps {
  onClose: () => void;
  onCreate: (input: CreateCampaignInput) => Promise<CampaignDto>;
  /** Refresh the campaign list after the review popup saves edits. */
  onSaved?: () => void | Promise<void>;
}

const PLACEHOLDER = `Paste the full job description here.

Example:

We're hiring a Senior Azure Infrastructure Engineer to lead our cloud migration. You'll own Terraform modules for our AKS clusters, configure Entra ID for access management, and build CI/CD pipelines in Azure DevOps. Required: 5+ years Azure, deep Terraform expertise, production Kubernetes experience...`;

export function CreateCampaignModal({ onClose, onCreate, onSaved }: CreateCampaignModalProps) {
  const [step, setStep] = useState<'input' | 'review'>('input');

  // ── input step ──────────────────────────────────────────────────────────
  const [name, setName] = useState('');
  const [jobText, setJobText] = useState('');
  const [location, setLocation] = useState('On-site');
  const [jobType, setJobType] = useState('Full-time');
  const [department, setDepartment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [drafting, setDrafting] = useState(false);
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // ── review step ─────────────────────────────────────────────────────────
  const [campaign, setCampaign] = useState<CampaignDto | null>(null);
  const [rTitle, setRTitle] = useState('');
  const [rKeywords, setRKeywords] = useState<string[]>([]);
  const [rRequirements, setRRequirements] = useState<string[]>([]);
  const [kwDraft, setKwDraft] = useState('');
  const [busy, setBusy] = useState<null | 'retry' | 'enhance' | 'save'>(null);

  function loadReview(c: CampaignDto) {
    setCampaign(c);
    setRTitle(c.jobTitle ?? '');
    setRKeywords(c.extractedKeywords ?? []);
    setRRequirements(c.requirements ?? []);
  }

  async function handleFileChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setError(null);
    setUploading(true);
    try {
      const form = new FormData();
      form.append('file', file);
      const res = await fetch('/api/upload/extract-text', { method: 'POST', credentials: 'include', body: form });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error || `HTTP ${res.status}`);
      setJobText(json.text as string);
      setUploadedFileName(file.name);
      if (!name.trim()) {
        const base = file.name.replace(/\.(pdf|docx|txt|md)$/i, '').replace(/[_-]+/g, ' ').trim();
        if (base) setName(base.slice(0, 80));
      }
    } catch (err) {
      setError(`Couldn't read that file: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setUploading(false);
    }
  }

  async function handlePaste() {
    setError(null);
    try {
      const text = await navigator.clipboard.readText();
      if (!text.trim()) { setError('Clipboard is empty — copy a job description first.'); return; }
      // Append if there's already text, otherwise replace.
      setJobText(prev => (prev.trim() ? `${prev.trim()}\n\n${text.trim()}` : text.trim()));
    } catch {
      setError('Couldn’t read the clipboard. Your browser may have blocked it — paste manually with Ctrl+V.');
    }
  }

  async function handleAiDraft() {
    if (!name.trim()) {
      setError('Enter a campaign name first — AI uses it to write the job description.');
      return;
    }
    setError(null);
    setDrafting(true);
    try {
      const r = await campaignApi.draftJobDescription({
        name: name.trim() || undefined,
        jobTitle: name.trim() || undefined,
        location: location.trim() || undefined,
        jobType: jobType.trim() || undefined,
        department: department.trim() || undefined,
        jobText: jobText.trim() || undefined,
      });
      setJobText(r.text);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'AI drafting failed. Try again.');
    } finally {
      setDrafting(false);
    }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!name.trim() || !jobText.trim()) {
      setError('Campaign name and job description are required.');
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      const created = await onCreate({
        name: name.trim(),
        jobText: jobText.trim(),
        location: location.trim() || undefined,
        jobType: jobType.trim() || undefined,
        department: department.trim() || undefined,
      });
      loadReview(created);
      setStep('review'); // show the check / repair / enhance popup instead of closing
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to create campaign.');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleRetry() {
    if (!campaign) return;
    setError(null);
    setBusy('retry');
    try {
      const res = await campaignApi.reanalyze(campaign.id);
      loadReview(res.data);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Re-analysis failed.');
    } finally {
      setBusy(null);
    }
  }

  async function handleEnhance() {
    if (!campaign) return;
    setError(null);
    setBusy('enhance');
    try {
      const res = await campaignApi.enhanceSpec(campaign.id);
      loadReview(res.data);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Enhancement failed.');
    } finally {
      setBusy(null);
    }
  }

  async function handleSave() {
    if (!campaign) return;
    if (!rTitle.trim()) { setError('Role title cannot be empty.'); return; }
    setError(null);
    setBusy('save');
    try {
      await campaignApi.update(campaign.id, {
        jobTitle: rTitle.trim(),
        extractedKeywords: rKeywords,
        requirements: rRequirements,
      });
      await onSaved?.();
      onClose();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not save changes.');
      setBusy(null);
    }
  }

  function addKeyword() {
    const v = kwDraft.trim();
    if (!v) return;
    if (!rKeywords.some(k => k.toLowerCase() === v.toLowerCase())) setRKeywords(ks => [...ks, v]);
    setKwDraft('');
  }

  const aiBusy = busy !== null;

  // Shared button style for the toolbar (matches the existing Upload button).
  const toolBtn =
    'inline-flex items-center gap-1.5 px-2.5 py-1.5 text-[11px] font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-60 disabled:cursor-not-allowed transition-colors';

  return (
    <div className="fixed inset-0 z-30 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-2xl bg-white dark:bg-[#10131c] rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <header className="px-6 py-4 border-b border-gray-100 dark:border-white/10 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-gray-900 dark:bg-gray-700 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <div>
              <h2 className="text-base font-bold text-gray-900 dark:text-white">
                {step === 'input' ? 'New campaign' : 'Review extracted spec'}
              </h2>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                {step === 'input'
                  ? 'Gemini will extract title, keywords, and requirements'
                  : 'Check what Gemini extracted — repair anything, enhance, or try again'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-md flex items-center justify-center text-gray-400 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-white/5 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </header>

        {/* Shared error banner */}
        {error && (
          <div className="mx-6 mt-4 flex items-start gap-3 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-400/20 rounded-lg px-4 py-3">
            <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
            <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
          </div>
        )}

        {step === 'input' ? (
          <>
            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-6 py-5 flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-gray-700 dark:text-gray-200 uppercase tracking-wide">
                  Campaign name *
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="e.g. SAP Architect Q3"
                  className="w-full bg-white dark:bg-[#0a0c12] border border-gray-300 dark:border-white/10 rounded-lg px-3.5 py-2 text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder:text-gray-600 focus:outline-none focus:border-gray-900 dark:focus:border-gray-400 focus:ring-1 focus:ring-gray-900/10"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-gray-700 dark:text-gray-200 uppercase tracking-wide">Location</label>
                  <select value={location} onChange={e => setLocation(e.target.value)}
                    className="w-full bg-white dark:bg-[#0a0c12] border border-gray-300 dark:border-white/10 rounded-lg px-3 py-2 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:border-gray-900 dark:focus:border-gray-400 focus:ring-1 focus:ring-gray-900/10">
                    <option>On-site</option><option>Hybrid</option><option>Fully Remote</option>
                  </select>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-gray-700 dark:text-gray-200 uppercase tracking-wide">Job type</label>
                  <select value={jobType} onChange={e => setJobType(e.target.value)}
                    className="w-full bg-white dark:bg-[#0a0c12] border border-gray-300 dark:border-white/10 rounded-lg px-3 py-2 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:border-gray-900 dark:focus:border-gray-400 focus:ring-1 focus:ring-gray-900/10">
                    <option>Full-time</option><option>Contract</option><option>Part-time</option><option>Freelance</option>
                  </select>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-gray-700 dark:text-gray-200 uppercase tracking-wide">Department</label>
                  <input type="text" value={department} onChange={e => setDepartment(e.target.value)} placeholder="Engineering"
                    className="w-full bg-white dark:bg-[#0a0c12] border border-gray-300 dark:border-white/10 rounded-lg px-3.5 py-2 text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder:text-gray-600 focus:outline-none focus:border-gray-900 dark:focus:border-gray-400 focus:ring-1 focus:ring-gray-900/10" />
                </div>
              </div>

              <div className="flex flex-col gap-1.5 flex-1">
                <div className="flex items-center justify-between gap-3 flex-wrap">
                  <label className="text-xs font-semibold text-gray-700 dark:text-gray-200 uppercase tracking-wide">
                    Job description *
                  </label>
                  <div className="flex items-center gap-2">
                    {uploadedFileName && (
                      <span className="inline-flex items-center gap-1 text-[11px] text-gray-500 dark:text-gray-400 max-w-[140px] truncate">
                        <FileText className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                        <span className="truncate">{uploadedFileName}</span>
                      </span>
                    )}
                    {/* AI: draft when empty, enhance when text exists */}
                    <button type="button" onClick={handleAiDraft} disabled={drafting || uploading || submitting || !name.trim()} className={toolBtn}
                      title={!name.trim()
                        ? 'Enter a campaign name first'
                        : jobText.trim() ? 'Improve & expand the current description with AI' : 'Let AI write a draft from the campaign name + fields above'}>
                      {drafting ? <Loader2 className="w-3 h-3 animate-spin" /> : <Wand2 className="w-3 h-3" />}
                      {drafting ? 'Writing…' : jobText.trim() ? 'AI enhance' : 'AI'}
                    </button>
                    {/* Paste from clipboard */}
                    <button type="button" onClick={handlePaste} disabled={submitting} className={toolBtn} title="Paste from clipboard">
                      <ClipboardPaste className="w-3 h-3" /> Paste
                    </button>
                    <input ref={fileInputRef} type="file"
                      accept=".pdf,.docx,.txt,.md,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain"
                      className="hidden" onChange={handleFileChange} />
                    <button type="button" onClick={() => fileInputRef.current?.click()} disabled={uploading || submitting} className={toolBtn}>
                      {uploading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Upload className="w-3 h-3" />}
                      {uploading ? 'Reading…' : 'Upload PDF / DOCX'}
                    </button>
                  </div>
                </div>
                <textarea
                  value={jobText}
                  onChange={e => setJobText(e.target.value)}
                  placeholder={PLACEHOLDER}
                  rows={10}
                  className="w-full bg-white dark:bg-[#0a0c12] border border-gray-300 dark:border-white/10 rounded-lg px-3.5 py-2.5 text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder:text-gray-600 focus:outline-none focus:border-gray-900 dark:focus:border-gray-400 focus:ring-1 focus:ring-gray-900/10 resize-y leading-relaxed font-mono"
                />
                <p className="text-[11px] text-gray-500 dark:text-gray-400">
                  {jobText.length.toLocaleString()} characters · the more detail, the better the extraction
                </p>
              </div>
            </form>

            <footer className="px-6 py-4 border-t border-gray-100 dark:border-white/10 flex items-center justify-end gap-3 shrink-0">
              <button type="button" onClick={onClose} disabled={submitting}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-[#10131c] border border-gray-300 dark:border-white/10 rounded-lg hover:bg-gray-50 dark:hover:bg-white/5 disabled:opacity-60 transition-colors">
                Cancel
              </button>
              <button type="submit" onClick={handleSubmit} disabled={submitting}
                className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-black dark:bg-gray-800 rounded-lg hover:bg-gray-800 dark:hover:bg-gray-700 disabled:opacity-60 disabled:cursor-not-allowed transition-colors">
                {submitting ? <><Loader2 className="w-4 h-4 animate-spin" /> Analyzing…</> : <><Sparkles className="w-4 h-4" /> Analyze + create</>}
              </button>
            </footer>
          </>
        ) : (
          /* ── REVIEW STEP ───────────────────────────────────────────────── */
          <>
            <div className="flex-1 overflow-y-auto px-6 py-5 flex flex-col gap-5">
              {/* Role title */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-gray-700 dark:text-gray-200 uppercase tracking-wide">Role title</label>
                <input type="text" value={rTitle} onChange={e => setRTitle(e.target.value)} disabled={aiBusy}
                  className="w-full bg-white dark:bg-[#0a0c12] border border-gray-300 dark:border-white/10 rounded-lg px-3.5 py-2 text-sm font-semibold text-gray-900 dark:text-gray-100 focus:outline-none focus:border-gray-900 dark:focus:border-gray-400 focus:ring-1 focus:ring-gray-900/10 disabled:opacity-60" />
              </div>

              {/* Keywords */}
              <div className="flex flex-col gap-1.5">
                <label className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-700 dark:text-gray-200 uppercase tracking-wide">
                  <Tag className="w-3.5 h-3.5 text-indigo-500" /> Keywords <span className="text-gray-400 normal-case font-normal">({rKeywords.length})</span>
                </label>
                <div className="flex flex-wrap gap-1.5 rounded-lg border border-gray-300 dark:border-white/10 bg-white dark:bg-[#0a0c12] p-2">
                  {rKeywords.map((k, i) => (
                    <span key={`${k}-${i}`} className="inline-flex items-center gap-1 rounded-md bg-indigo-50 dark:bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-400/20 px-2 py-1 text-[12px] font-medium">
                      {k}
                      <button type="button" onClick={() => setRKeywords(ks => ks.filter((_, j) => j !== i))} disabled={aiBusy}
                        className="text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-200 disabled:opacity-50">
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                  <input
                    value={kwDraft}
                    onChange={e => setKwDraft(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); addKeyword(); } }}
                    onBlur={addKeyword}
                    disabled={aiBusy}
                    placeholder={rKeywords.length ? 'Add…' : 'Add a keyword and press Enter'}
                    className="flex-1 min-w-[120px] bg-transparent px-1 py-1 text-[12px] text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder:text-gray-600 focus:outline-none"
                  />
                </div>
              </div>

              {/* Requirements */}
              <div className="flex flex-col gap-1.5">
                <label className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-700 dark:text-gray-200 uppercase tracking-wide">
                  <ListChecks className="w-3.5 h-3.5 text-emerald-500" /> Requirements <span className="text-gray-400 normal-case font-normal">({rRequirements.length})</span>
                </label>
                <div className="flex flex-col gap-2">
                  {rRequirements.map((req, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <span className="mt-2 w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
                      <textarea rows={1} value={req} disabled={aiBusy}
                        onChange={e => setRRequirements(rs => rs.map((r, j) => (j === i ? e.target.value : r)))}
                        className="flex-1 bg-white dark:bg-[#0a0c12] border border-gray-300 dark:border-white/10 rounded-lg px-3 py-1.5 text-[13px] text-gray-900 dark:text-gray-100 focus:outline-none focus:border-gray-900 dark:focus:border-gray-400 focus:ring-1 focus:ring-gray-900/10 resize-y disabled:opacity-60" />
                      <button type="button" onClick={() => setRRequirements(rs => rs.filter((_, j) => j !== i))} disabled={aiBusy}
                        className="mt-1 w-6 h-6 rounded-md flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-gray-100 dark:hover:bg-white/5 disabled:opacity-50">
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                  <button type="button" onClick={() => setRRequirements(rs => [...rs, ''])} disabled={aiBusy}
                    className="inline-flex items-center gap-1.5 self-start text-[12px] font-medium text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white disabled:opacity-50">
                    <Plus className="w-3.5 h-3.5" /> Add requirement
                  </button>
                </div>
              </div>
            </div>

            <footer className="px-6 py-4 border-t border-gray-100 dark:border-white/10 flex items-center justify-between gap-3 shrink-0">
              <div className="flex items-center gap-2">
                <button type="button" onClick={handleRetry} disabled={aiBusy} className={toolBtn} title="Re-run the extraction from scratch">
                  {busy === 'retry' ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />} Try again
                </button>
                <button type="button" onClick={handleEnhance} disabled={aiBusy} className={toolBtn} title="Let AI strengthen the title, keywords, and requirements">
                  {busy === 'enhance' ? <Loader2 className="w-3 h-3 animate-spin" /> : <Wand2 className="w-3 h-3" />} Enhance with AI
                </button>
              </div>
              <button type="button" onClick={handleSave} disabled={aiBusy}
                className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-black dark:bg-gray-800 rounded-lg hover:bg-gray-800 dark:hover:bg-gray-700 disabled:opacity-60 disabled:cursor-not-allowed transition-colors">
                {busy === 'save' ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving…</> : <><Check className="w-4 h-4" /> Save &amp; continue</>}
              </button>
            </footer>
          </>
        )}
      </div>
    </div>
  );
}
