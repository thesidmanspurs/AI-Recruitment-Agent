import { useState, useRef, type FormEvent, type ChangeEvent } from 'react';
import { X, Loader2, Sparkles, AlertCircle, Upload, FileText } from 'lucide-react';
import { ApiError } from '../../api/client';
import type { CreateCampaignInput } from '../../api/campaignApi';

interface CreateCampaignModalProps {
  onClose: () => void;
  onCreate: (input: CreateCampaignInput) => Promise<void>;
}

const PLACEHOLDER = `Paste the full job description here.

Example:

We're hiring a Senior Azure Infrastructure Engineer to lead our cloud migration. You'll own Terraform modules for our AKS clusters, configure Entra ID for access management, and build CI/CD pipelines in Azure DevOps. Required: 5+ years Azure, deep Terraform expertise, production Kubernetes experience...`;

export function CreateCampaignModal({ onClose, onCreate }: CreateCampaignModalProps) {
  const [name, setName] = useState('');
  const [jobText, setJobText] = useState('');
  const [location, setLocation] = useState('On-site');
  const [jobType, setJobType] = useState('Full-time');
  const [department, setDepartment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  async function handleFileChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = ''; // allow re-uploading the same file
    if (!file) return;

    setError(null);
    setUploading(true);
    try {
      // Backend extracts text from PDF / DOCX / TXT and returns it. We never
      // bypass the existing Analyze step — the text just lands in the textarea
      // so the user can review / edit before submitting.
      const form = new FormData();
      form.append('file', file);
      const res = await fetch('/api/upload/extract-text', {
        method: 'POST',
        credentials: 'include',
        body: form,
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || `HTTP ${res.status}`);
      }
      setJobText(json.text as string);
      setUploadedFileName(file.name);
      // Auto-fill campaign name from filename if it's still empty.
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

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!name.trim() || !jobText.trim()) {
      setError('Campaign name and job description are required.');
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      await onCreate({
        name: name.trim(),
        jobText: jobText.trim(),
        location: location.trim() || undefined,
        jobType: jobType.trim() || undefined,
        department: department.trim() || undefined,
      });
      onClose();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to create campaign.');
    } finally {
      setSubmitting(false);
    }
  }

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
              <h2 className="text-base font-bold text-gray-900 dark:text-white">New campaign</h2>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                Gemini will extract title, keywords, and requirements
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

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-6 py-5 flex flex-col gap-4">
          {error && (
            <div className="flex items-start gap-3 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-400/20 rounded-lg px-4 py-3">
              <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
              <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
            </div>
          )}

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
              <label className="text-xs font-semibold text-gray-700 dark:text-gray-200 uppercase tracking-wide">
                Location
              </label>
              <select
                value={location}
                onChange={e => setLocation(e.target.value)}
                className="w-full bg-white dark:bg-[#0a0c12] border border-gray-300 dark:border-white/10 rounded-lg px-3 py-2 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:border-gray-900 dark:focus:border-gray-400 focus:ring-1 focus:ring-gray-900/10"
              >
                <option>On-site</option>
                <option>Hybrid</option>
                <option>Fully Remote</option>
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-gray-700 dark:text-gray-200 uppercase tracking-wide">
                Job type
              </label>
              <select
                value={jobType}
                onChange={e => setJobType(e.target.value)}
                className="w-full bg-white dark:bg-[#0a0c12] border border-gray-300 dark:border-white/10 rounded-lg px-3 py-2 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:border-gray-900 dark:focus:border-gray-400 focus:ring-1 focus:ring-gray-900/10"
              >
                <option>Full-time</option>
                <option>Contract</option>
                <option>Part-time</option>
                <option>Freelance</option>
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-gray-700 dark:text-gray-200 uppercase tracking-wide">
                Department
              </label>
              <input
                type="text"
                value={department}
                onChange={e => setDepartment(e.target.value)}
                placeholder="Engineering"
                className="w-full bg-white dark:bg-[#0a0c12] border border-gray-300 dark:border-white/10 rounded-lg px-3.5 py-2 text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder:text-gray-600 focus:outline-none focus:border-gray-900 dark:focus:border-gray-400 focus:ring-1 focus:ring-gray-900/10"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5 flex-1">
            <div className="flex items-center justify-between gap-3">
              <label className="text-xs font-semibold text-gray-700 dark:text-gray-200 uppercase tracking-wide">
                Job description *
              </label>
              <div className="flex items-center gap-2">
                {uploadedFileName && (
                  <span className="inline-flex items-center gap-1 text-[11px] text-gray-500 dark:text-gray-400 max-w-[180px] truncate">
                    <FileText className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                    <span className="truncate">{uploadedFileName}</span>
                  </span>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.docx,.txt,.md,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain"
                  className="hidden"
                  onChange={handleFileChange}
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading || submitting}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-[11px] font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
                >
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
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-[#10131c] border border-gray-300 dark:border-white/10 rounded-lg hover:bg-gray-50 dark:hover:bg-white/5 disabled:opacity-60 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            onClick={handleSubmit}
            disabled={submitting}
            className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-black dark:bg-gray-800 rounded-lg hover:bg-gray-800 dark:hover:bg-gray-700 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
          >
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Analyzing…
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                Analyze + create
              </>
            )}
          </button>
        </footer>
      </div>
    </div>
  );
}
