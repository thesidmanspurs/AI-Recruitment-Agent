import { useMemo, useState } from 'react';
import { X, Star, MapPin, Briefcase, Linkedin, Sparkles, Copy, Check, Eye, EyeOff } from 'lucide-react';
import type { Candidate } from '../../types';

/**
 * Client View popup — a curated, presentation-ready snapshot of the
 * shortlist that a recruiter can show to (or screen-share with) their
 * hiring-manager client.
 *
 * Curation rules:
 *   - Default to the candidates above the suitability threshold (≥ 9.0),
 *     sorted by match score desc. Recruiter can toggle "Show all".
 *   - Hide internal-only fields: full email/phone (we mask them), notes,
 *     outreach status, match explanation (the AI's internal reasoning).
 *   - Show: name, current title + company, location, match score, bio,
 *     skills, strengths. LinkedIn URL is shown because a client expects
 *     to click through to verify the profile.
 *
 * One-click "Copy as text" gives the recruiter a plain-text shortlist
 * they can paste straight into an email to the client.
 */

interface ClientViewModalProps {
  open: boolean;
  onClose: () => void;
  campaignTitle: string;
  candidates: Candidate[];
  threshold: number;
}

function maskEmail(email?: string): string {
  if (!email) return '—';
  const [user, domain] = email.split('@');
  if (!domain) return '—';
  const head = user.slice(0, 2);
  return `${head}${'•'.repeat(Math.max(2, user.length - 2))}@${domain}`;
}

function buildTextSnapshot(campaignTitle: string, list: Candidate[]): string {
  const lines = [`Shortlist — ${campaignTitle}`, ''];
  list.forEach((c, i) => {
    lines.push(`${i + 1}. ${c.name} — ${c.currentTitle} @ ${c.company}`);
    if (c.contact.location) lines.push(`   Location: ${c.contact.location}`);
    lines.push(`   Match score: ${c.matchScore.toFixed(1)}/10`);
    if (c.strengths.length) lines.push(`   Strengths: ${c.strengths.join('; ')}`);
    if (c.contact.linkedinUrl) lines.push(`   LinkedIn: ${c.contact.linkedinUrl}`);
    lines.push('');
  });
  return lines.join('\n');
}

export function ClientViewModal({
  open,
  onClose,
  campaignTitle,
  candidates,
  threshold,
}: ClientViewModalProps) {
  const [showAll, setShowAll] = useState(false);
  const [revealContact, setRevealContact] = useState(false);
  const [copied, setCopied] = useState(false);

  const list = useMemo(() => {
    const sorted = [...candidates].sort((a, b) => b.matchScore - a.matchScore);
    return showAll ? sorted : sorted.filter(c => c.matchScore >= threshold);
  }, [candidates, showAll, threshold]);

  async function copyText() {
    try {
      await navigator.clipboard.writeText(buildTextSnapshot(campaignTitle, list));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard blocked — silent */
    }
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-4xl bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <header className="px-6 py-4 border-b border-gray-100 flex items-center justify-between gap-3 shrink-0 flex-wrap">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-indigo-700 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded-full">
                <Sparkles className="w-3 h-3" /> Client view
              </span>
            </div>
            <h2 className="text-base font-bold text-gray-900 mt-1 truncate">
              Shortlist — {campaignTitle}
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">
              {list.length} {showAll ? 'candidate' : `top match${list.length === 1 ? '' : 'es'}`} ·
              {' '}AI fit score ≥ {threshold.toFixed(1)}
            </p>
          </div>
          <div className="flex items-center gap-2 ml-auto">
            <button
              onClick={() => setShowAll(s => !s)}
              className="inline-flex items-center gap-1.5 text-[11.5px] font-semibold text-gray-700 bg-white border border-gray-300 px-3 py-1.5 rounded-full hover:bg-gray-50 transition-colors"
            >
              {showAll ? 'Show top only' : 'Show all'}
            </button>
            <button
              onClick={() => setRevealContact(v => !v)}
              title={revealContact ? 'Hide contact details' : 'Reveal contact details'}
              className="inline-flex items-center gap-1.5 text-[11.5px] font-semibold text-gray-700 bg-white border border-gray-300 px-3 py-1.5 rounded-full hover:bg-gray-50 transition-colors"
            >
              {revealContact ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              {revealContact ? 'Hide contact' : 'Reveal contact'}
            </button>
            <button
              onClick={copyText}
              className="inline-flex items-center gap-1.5 text-[11.5px] font-semibold text-white bg-gray-900 hover:bg-gray-800 px-3 py-1.5 rounded-full transition-colors"
            >
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? 'Copied' : 'Copy as text'}
            </button>
            <button
              onClick={onClose}
              aria-label="Close"
              className="w-8 h-8 rounded-md flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto px-6 py-5">
          {list.length === 0 ? (
            <div className="text-center py-12 text-sm text-gray-500">
              No candidates {showAll ? 'sourced yet.' : `at or above the ${threshold.toFixed(1)} threshold yet.`}
            </div>
          ) : (
            <ol className="flex flex-col gap-4">
              {list.map((c, idx) => (
                <li
                  key={c.id}
                  className="bg-white border border-gray-200 rounded-2xl p-5 shadow-xs"
                >
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white text-sm font-bold shrink-0">
                      {idx + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-3 flex-wrap">
                        <div className="min-w-0">
                          <h3 className="text-base font-bold text-gray-900 truncate">{c.name}</h3>
                          <p className="text-sm text-gray-600 mt-0.5 truncate">
                            {c.currentTitle} · {c.company}
                          </p>
                          {c.contact.location && (
                            <p className="inline-flex items-center gap-1 text-xs text-gray-500 mt-1">
                              <MapPin className="w-3 h-3" /> {c.contact.location}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 shrink-0">
                          <Star className="w-3.5 h-3.5 text-emerald-700 fill-emerald-400" />
                          <span className="text-xs font-bold text-emerald-800">
                            {c.matchScore.toFixed(1)}
                          </span>
                          <span className="text-[10px] text-emerald-700">/ 10</span>
                        </div>
                      </div>

                      {c.bio && (
                        <p className="text-[13px] text-gray-700 leading-relaxed mt-3 line-clamp-4">
                          {c.bio}
                        </p>
                      )}

                      {c.strengths.length > 0 && (
                        <div className="mt-3 flex flex-wrap gap-1.5">
                          {c.strengths.slice(0, 6).map(s => (
                            <span
                              key={s}
                              className="inline-flex items-center gap-1 text-[10.5px] font-medium text-indigo-700 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded-full"
                            >
                              {s}
                            </span>
                          ))}
                        </div>
                      )}

                      <div className="flex items-center gap-4 mt-3 pt-3 border-t border-gray-100 text-xs flex-wrap">
                        {c.contact.linkedinUrl && (
                          <a
                            href={c.contact.linkedinUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-indigo-700 hover:text-indigo-800 font-medium"
                          >
                            <Linkedin className="w-3.5 h-3.5" /> LinkedIn profile
                          </a>
                        )}
                        <span className="inline-flex items-center gap-1 text-gray-500">
                          <Briefcase className="w-3.5 h-3.5" /> {c.platform}
                        </span>
                        {c.contact.email && (
                          <span className="inline-flex items-center gap-1 text-gray-500">
                            ✉ {revealContact ? c.contact.email : maskEmail(c.contact.email)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ol>
          )}
        </div>

        <footer className="px-6 py-3 border-t border-gray-100 flex items-center justify-between gap-3 shrink-0 bg-gray-50">
          <p className="text-[11px] text-gray-500">
            Internal recruiter view · Not yet sent to the client. Contact details are masked by default.
          </p>
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-semibold text-white bg-gray-900 rounded-lg hover:bg-gray-800 transition-colors"
          >
            Done
          </button>
        </footer>
      </div>
    </div>
  );
}
