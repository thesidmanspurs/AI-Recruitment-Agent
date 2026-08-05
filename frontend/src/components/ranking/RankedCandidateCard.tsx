import type { RankedCandidate } from '../../api/rankingApi';
import { Briefcase, MapPin, ChevronRight, Star } from 'lucide-react';

interface Props {
  key?: string | number;
  candidate: RankedCandidate;
  onSelect: (candidate: RankedCandidate) => void;
}

export function RankedCandidateCard({ candidate: c, onSelect }: Props) {
  const medal = c.medal as 'gold' | 'silver' | 'bronze' | null;

  const trophyImg =
    medal === 'gold' || c.rankPosition === 1 ? '/cup.png' :
    medal === 'silver' || c.rankPosition === 2 ? '/silver-medal.png' :
    medal === 'bronze' || c.rankPosition === 3 ? '/bronze-medal.png' : null;

  const rowBgClass =
    c.rankPosition === 1
      ? 'gold-shimmer-bg border-amber-300 dark:border-amber-500/60 shadow-md ring-1 ring-amber-400/20 dark:ring-amber-500/30'
      : c.rankPosition === 2
      ? 'bg-gradient-to-r from-slate-50 to-gray-100 dark:from-[#131929] dark:to-[#0d101d] border-slate-300 dark:border-slate-700/60 shadow-xs'
      : c.rankPosition === 3
      ? 'bg-gradient-to-r from-amber-50/60 to-orange-50/30 dark:from-[#1f1712] dark:to-[#0d101d] border-amber-200/80 dark:border-amber-900/60 shadow-xs'
      : 'bg-white dark:bg-[#10131c] border-gray-200 dark:border-white/10 hover:border-gray-300 dark:hover:border-white/20';

  const scoreColorClass =
    c.matchScore >= 8.0
      ? 'bg-emerald-600 dark:bg-emerald-500 text-white'
      : c.matchScore >= 6.0
      ? 'bg-amber-500 text-white'
      : 'bg-red-500 text-white';

  return (
    <div
      onClick={() => onSelect(c)}
      className={`group cursor-pointer rounded-2xl p-4 sm:p-5 border transition-all duration-200 hover:scale-[1.008] hover:shadow-lg flex items-center justify-between gap-4 flex-wrap sm:flex-nowrap relative overflow-hidden ${rowBgClass}`}
    >
      {/* Left section: Trophy Image + Large Candidate Name */}
      <div className="flex items-center gap-4 min-w-0 flex-1">
        {/* Trophy / Medal Image */}
        {trophyImg ? (
          <div className="relative shrink-0">
            <img
              src={trophyImg}
              alt={`Rank #${c.rankPosition}`}
              className={`w-12 h-12 sm:w-14 sm:h-14 object-contain ${
                c.rankPosition === 1 ? 'animate-blink-glow' : 'drop-shadow-sm'
              }`}
            />
          </div>
        ) : (
          <div className="w-12 h-12 flex items-center justify-center shrink-0">
            <span className="font-script-number text-4xl sm:text-5xl text-gray-800 dark:text-amber-300 drop-shadow-sm select-none font-bold leading-none">
              {c.rankPosition}
            </span>
          </div>
        )}

        {/* Candidate Identity */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2.5 flex-wrap">
            <h3 className="text-base sm:text-lg font-extrabold text-gray-900 dark:text-white truncate tracking-tight group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
              {c.name}
            </h3>
            {c.isNewBatch && (
              <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-md bg-emerald-600 text-white shadow-xs">
                ✨ NEW BATCH
              </span>
            )}
          </div>

          <p className="text-xs sm:text-sm font-semibold text-gray-600 dark:text-gray-300 truncate mt-0.5">
            {c.currentTitle}{c.company ? ` • ${c.company}` : ''}
          </p>

          <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400 mt-1.5 flex-wrap font-medium">
            {c.experienceYears != null && (
              <span className="flex items-center gap-1"><Briefcase size={12} className="text-gray-400" /> {c.experienceYears}y exp</span>
            )}
            {c.location && (
              <span className="flex items-center gap-1 truncate max-w-[140px]"><MapPin size={12} className="text-gray-400" /> {c.location}</span>
            )}
            {c.skills.length > 0 && (
              <span className="hidden md:inline-flex items-center gap-1 text-[11px] text-gray-400">
                • {c.skills.slice(0, 3).join(', ')}{c.skills.length > 3 ? ` +${c.skills.length - 3} skills` : ''}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Right section: Match Score + Click CTA arrow */}
      <div className="flex items-center gap-4 shrink-0 ml-auto sm:ml-0">
        <div className="text-right">
          <div className={`px-3 py-1.5 rounded-xl text-sm sm:text-base font-extrabold tabular-nums tracking-tight shadow-xs ${scoreColorClass}`}>
            {c.matchScore.toFixed(1)} / 10
          </div>
          <p className="text-[10px] text-gray-400 font-mono font-bold mt-1 text-center uppercase tracking-wider">
            Match Score
          </p>
        </div>

        <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-white/5 group-hover:bg-gray-900 group-hover:text-white dark:group-hover:bg-white dark:group-hover:text-gray-900 flex items-center justify-center transition-colors">
          <ChevronRight size={18} />
        </div>
      </div>
    </div>
  );
}
