import { useEffect, useState, type FormEvent, type ReactNode } from 'react';
import { Loader2, FileEdit, AlertCircle, RefreshCw } from 'lucide-react';
import { ApiError } from '../../api/client';
import { CenterModal } from '../shared/CenterModal';
import type { CampaignDto } from '../../api/campaignApi';

interface EditCampaignModalProps {
  open: boolean;
  campaign: CampaignDto | null;
  onClose: () => void;
  onSave: (
    id: string,
    input: {
      name?: string;
      location?: string;
      jobType?: string;
      department?: string;
      jobText?: string;
      outreachTemplate?: string | null;
    }
  ) => Promise<{ isSimulated: boolean; simulationReason?: string }>;
  onResetCandidates?: (id: string) => Promise<number>;
}

/**
 * Edit Spec modal. Two flows:
 *   1. Light edit — name / location / jobType / department only. No Gemini call.
 *   2. Heavy edit — modifies the job text. On save, backend re-runs analysis
 *      and refreshes title/keywords/requirements. Candidates already sourced
 *      stay, but their match scores were computed against the OLD spec, so we
 *      offer (but don't force) the "Reset sourced candidates" button.
 */
export function EditCampaignModal({
  open,
  campaign,
  onClose,
  onSave,
  onResetCandidates,
}: EditCampaignModalProps) {
  const [name, setName] = useState('');
  const [location, setLocation] = useState('');
  const [jobType, setJobType] = useState('Full-time');
  const [department, setDepartment] = useState('');
  const [jobText, setJobText] = useState('');
  const [outreachTemplate, setOutreachTemplate] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!campaign) return;
    setName(campaign.name);
    setLocation(campaign.location ?? '');
    setJobType(campaign.jobType ?? 'Full-time');
    setDepartment(campaign.department ?? '');
    setJobText(campaign.rawJobText);
    setOutreachTemplate(campaign.outreachTemplate ?? '');
    setError(null);
  }, [campaign?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!campaign) return null;

  const jdChanged = jobText.trim() !== campaign.rawJobText.trim();

  async function handleSubmit(e?: FormEvent) {
    e?.preventDefault();
    if (!campaign) return;
    setError(null);
    setSubmitting(true);
    try {
      await onSave(campaign.id, {
        name: name.trim(),
        location: location.trim() || undefined,
        jobType: jobType.trim() || undefined,
        department: department.trim() || undefined,
        // Only send jobText if it actually changed — saves a Gemini call.
        jobText: jdChanged ? jobText.trim() : undefined,
        // Empty string -> null so the backend falls back to per-candidate
        // Gemini generation.
        outreachTemplate: outreachTemplate.trim() === '' ? null : outreachTemplate,
      });
      onClose();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to update campaign.');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleReset() {
    if (!campaign || !onResetCandidates) return;
    setResetting(true);
    setError(null);
    try {
      await onResetCandidates(campaign.id);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to reset candidates.');
    } finally {
      setResetting(false);
    }
  }

  return (
    <CenterModal
      open={open}
      onClose={onClose}
      title="Edit campaign"
      subtitle={campaign.name}
      icon={<FileEdit className="w-4 h-4 text-indigo-600" />}
      size="lg"
      footer={
        <>
          <button
            onClick={onClose}
            disabled={submitting}
            className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-[#10131c] border border-gray-300 dark:border-white/10 rounded-lg hover:bg-gray-50 dark:hover:bg-white/5 disabled:opacity-60 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => handleSubmit()}
            disabled={submitting}
            className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
          >
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Saving…
              </>
            ) : (
              <>
                <FileEdit className="w-4 h-4" />
                Save changes
              </>
            )}
          </button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {error && (
          <div className="flex items-start gap-3 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-400/20 rounded-lg px-4 py-3">
            <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
            <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
          </div>
        )}

        <Field label="Campaign name" required>
          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            required
            className="w-full bg-white dark:bg-[#0a0c12] border border-gray-300 dark:border-white/10 rounded-lg px-3.5 py-2 text-sm dark:text-gray-100 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/15"
          />
        </Field>

        <div className="grid grid-cols-3 gap-3">
          <Field label="Location">
            <select
              value={['On-site', 'Hybrid', 'Fully Remote'].includes(location) ? location : 'On-site'}
              onChange={e => setLocation(e.target.value)}
              className="w-full bg-white dark:bg-[#0a0c12] border border-gray-300 dark:border-white/10 rounded-lg px-3 py-2 text-sm dark:text-gray-100 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/15"
            >
              <option>On-site</option>
              <option>Hybrid</option>
              <option>Fully Remote</option>
            </select>
          </Field>
          <Field label="Job type">
            <select
              value={jobType}
              onChange={e => setJobType(e.target.value)}
              className="w-full bg-white dark:bg-[#0a0c12] border border-gray-300 dark:border-white/10 rounded-lg px-3 py-2 text-sm dark:text-gray-100 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/15"
            >
              <option>Full-time</option>
              <option>Contract</option>
              <option>Part-time</option>
              <option>Freelance</option>
            </select>
          </Field>
          <Field label="Department">
            <input
              type="text"
              value={department}
              onChange={e => setDepartment(e.target.value)}
              className="w-full bg-white dark:bg-[#0a0c12] border border-gray-300 dark:border-white/10 rounded-lg px-3.5 py-2 text-sm dark:text-gray-100 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/15"
            />
          </Field>
        </div>

        <Field
          label="Job description"
          hint={
            jdChanged
              ? 'You changed the job description. Saving will re-run Gemini analysis to update title, keywords and requirements.'
              : 'No JD change — analysis stays the same.'
          }
        >
          <textarea
            value={jobText}
            onChange={e => setJobText(e.target.value)}
            rows={10}
            className="w-full bg-white dark:bg-[#0a0c12] border border-gray-300 dark:border-white/10 rounded-lg px-3.5 py-2.5 text-sm dark:text-gray-100 font-mono leading-relaxed focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/15 resize-y"
          />
        </Field>

        <Field
          label="Outreach template (campaign-wide)"
          hint={
            outreachTemplate.trim()
              ? 'This template pre-fills the Outreach editor for every candidate in this campaign. Leave empty to let Gemini generate fresh per-candidate.'
              : 'Leave empty to let Gemini generate fresh per-candidate. Otherwise: first paragraph = subject (blank line then body). Placeholders: {{firstName}}, {{candidateTitle}}, {{candidateCompany}}, {{jobTitle}}, {{recruiterName}}, {{topStrength}}, {{topKeyword}}.'
          }
        >
          <textarea
            value={outreachTemplate}
            onChange={e => setOutreachTemplate(e.target.value)}
            placeholder={`{{jobTitle}} role at our client — quick chat?\n\nHi {{firstName}},\n\nI came across your work as {{candidateTitle}} @ {{candidateCompany}} — your background in {{topKeyword}} is exactly what we're looking for on a {{jobTitle}} role.\n\nOpen to a 15-minute chat next week?\n\nBest,\n{{recruiterName}}`}
            rows={9}
            className="w-full bg-white dark:bg-[#0a0c12] border border-gray-300 dark:border-white/10 rounded-lg px-3.5 py-2.5 text-sm dark:text-gray-100 font-mono leading-relaxed focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/15 resize-y"
          />
        </Field>

        {jdChanged && onResetCandidates && (
          <div className="bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-400/20 rounded-lg px-4 py-3 flex items-center justify-between gap-3">
            <p className="text-xs text-amber-800 dark:text-amber-300">
              Already-sourced candidates were scored against the old spec. Reset sourcing for a fresh batch.
            </p>
            <button
              type="button"
              onClick={handleReset}
              disabled={resetting}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-amber-700 dark:text-amber-300 bg-white dark:bg-amber-500/10 border border-amber-300 dark:border-amber-400/20 rounded-md hover:bg-amber-100 dark:hover:bg-amber-500/20 disabled:opacity-50 transition-colors shrink-0"
            >
              {resetting ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <RefreshCw className="w-3.5 h-3.5" />
              )}
              Reset candidates
            </button>
          </div>
        )}
      </form>
    </CenterModal>
  );
}

function Field({
  label,
  required,
  hint,
  children,
}: {
  label: string;
  required?: boolean;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-[11px] font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      {children}
      {hint && <p className="text-[11px] text-gray-500 dark:text-gray-400">{hint}</p>}
    </div>
  );
}
