import type { RankedCandidate } from '../../api/rankingApi';
import { CenterModal } from '../shared/CenterModal';
import { MapPin, Briefcase, GraduationCap, Star, AlertCircle, FileText, Mail, Phone, ExternalLink } from 'lucide-react';

interface Props {
  open: boolean;
  onClose: () => void;
  candidate: RankedCandidate | null;
}

export function CandidateDetailModal({ open, onClose, candidate: c }: Props) {
  if (!c) return null;

  const medal = c.medal as 'gold' | 'silver' | 'bronze' | null;
  const trophyImg =
    medal === 'gold' || c.rankPosition === 1 ? '/cup.png' :
    medal === 'silver' || c.rankPosition === 2 ? '/silver-medal.png' :
    medal === 'bronze' || c.rankPosition === 3 ? '/bronze-medal.png' : null;

  return (
    <CenterModal
      open={open}
      onClose={onClose}
      title=""
      size="lg"
    >
      <div className="space-y-6">
        {/* Header Profile Section */}
        <div className="flex items-start justify-between gap-4 pb-5 border-b border-gray-100 dark:border-white/10">
          <div className="flex items-start gap-4">
            {trophyImg ? (
              <img
                src={trophyImg}
                alt={`Rank #${c.rankPosition}`}
                className="w-14 h-14 object-contain shrink-0 animate-blink-glow drop-shadow-md"
              />
            ) : (
              <div className="w-12 h-12 rounded-2xl bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-extrabold flex items-center justify-center text-lg shrink-0 shadow-md">
                #{c.rankPosition}
              </div>
            )}

            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-xl font-extrabold text-gray-900 dark:text-white leading-tight">
                  {c.name}
                </h2>
                {c.isNewBatch && (
                  <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-md bg-emerald-600 text-white shadow-xs">
                    ✨ NEW BATCH
                  </span>
                )}
              </div>
              <p className="text-sm font-semibold text-gray-600 dark:text-gray-300 mt-1">
                {c.currentTitle}{c.company ? ` • ${c.company}` : ''}
              </p>
              <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400 mt-2 flex-wrap font-medium">
                {c.experienceYears != null && (
                  <span className="flex items-center gap-1"><Briefcase size={13} className="text-gray-400" /> {c.experienceYears} Years Experience</span>
                )}
                {c.location && (
                  <span className="flex items-center gap-1"><MapPin size={13} className="text-gray-400" /> {c.location}</span>
                )}
                {c.educationLevel && (
                  <span className="flex items-center gap-1"><GraduationCap size={13} className="text-gray-400" /> {c.educationLevel}</span>
                )}
              </div>
            </div>
          </div>

          {/* Large Match Score Badge */}
          <div className="rounded-2xl p-3.5 bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-center shrink-0 shadow-md">
            <p className="text-2xl font-extrabold tabular-nums leading-none">{c.matchScore.toFixed(1)}</p>
            <p className="text-[9px] font-mono uppercase tracking-widest font-bold mt-1 opacity-80">Match Score</p>
          </div>
        </div>

        {/* AI Evaluation Rationale */}
        <div className="p-4 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10">
          <p className="text-xs font-bold text-gray-900 dark:text-white uppercase tracking-wider mb-1 flex items-center gap-1.5">
            <Star size={14} className="text-amber-500" /> AI Evaluation Rationale vs JD
          </p>
          <p className="text-xs text-gray-700 dark:text-gray-300 leading-relaxed font-medium">
            "{c.matchExplanation}"
          </p>
        </div>

        {/* Technical Skills Tag Cloud */}
        {c.skills.length > 0 && (
          <div>
            <p className="text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-2">
              Extracted Technical Skills
            </p>
            <div className="flex flex-wrap gap-1.5">
              {c.skills.map(skill => (
                <span key={skill} className="text-xs px-2.5 py-1 rounded-lg bg-gray-100 dark:bg-white/10 text-gray-800 dark:text-gray-200 font-semibold border border-gray-200 dark:border-white/10">
                  {skill}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Strengths & Gaps Breakdown */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {c.strengths.length > 0 && (
            <div className="bg-emerald-50/70 dark:bg-emerald-500/10 p-4 rounded-2xl border border-emerald-200 dark:border-emerald-500/20">
              <p className="text-xs font-bold text-emerald-900 dark:text-emerald-300 mb-2 flex items-center gap-1.5">
                <Star size={14} className="text-emerald-600 dark:text-emerald-400" /> Key Strengths vs JD
              </p>
              <ul className="space-y-1.5">
                {c.strengths.map((s, i) => (
                  <li key={i} className="text-xs text-emerald-950 dark:text-emerald-200 font-medium flex items-start gap-2">
                    <span className="text-emerald-600 dark:text-emerald-400 shrink-0 font-bold">•</span>
                    <span>{s}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {c.gaps.length > 0 && (
            <div className="bg-amber-50/70 dark:bg-amber-500/10 p-4 rounded-2xl border border-amber-200 dark:border-amber-500/20">
              <p className="text-xs font-bold text-amber-900 dark:text-amber-300 mb-2 flex items-center gap-1.5">
                <AlertCircle size={14} className="text-amber-600 dark:text-amber-400" /> Identified Gaps vs JD
              </p>
              <ul className="space-y-1.5">
                {c.gaps.map((g, i) => (
                  <li key={i} className="text-xs text-amber-950 dark:text-amber-200 font-medium flex items-start gap-2">
                    <span className="text-amber-600 dark:text-amber-400 shrink-0 font-bold">•</span>
                    <span>{g}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Footer Meta Details */}
        <div className="pt-3 border-t border-gray-100 dark:border-white/10 flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 font-mono">
          <span className="flex items-center gap-1.5"><FileText size={14} /> {c.originalFileName}</span>
          {c.email && <span className="flex items-center gap-1.5"><Mail size={14} /> {c.email}</span>}
          {c.phone && <span className="flex items-center gap-1.5"><Phone size={14} /> {c.phone}</span>}
        </div>
      </div>
    </CenterModal>
  );
}
