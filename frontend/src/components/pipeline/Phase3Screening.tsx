import { ShieldCheck } from 'lucide-react';
import type { Candidate } from '../../types';
import { SUITABILITY_THRESHOLD } from '../../config/constants';
import { CandidateList } from '../candidates/CandidateList';
import { Badge } from '../shared/Badge';

interface Phase3ScreeningProps {
  candidates: Candidate[];
  onEnrich: (candidate: Candidate) => void;
  onViewDetails: (candidate: Candidate) => void;
}

export function Phase3Screening({ candidates, onEnrich, onViewDetails }: Phase3ScreeningProps) {
  const approved = candidates.filter(c => c.matchScore >= SUITABILITY_THRESHOLD);
  const rejected = candidates.filter(c => c.matchScore < SUITABILITY_THRESHOLD);

  return (
    <section className="flex flex-col gap-5">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-green-700 flex items-center justify-center shrink-0">
          <span className="text-xs font-bold text-white">3</span>
        </div>
        <div>
          <h2 className="text-sm font-semibold text-white">Screening & Ranking</h2>
          <p className="text-xs text-gray-400">
            Candidates scoring ≥ {SUITABILITY_THRESHOLD} enter the Approved Queue.
          </p>
        </div>
      </div>

      {candidates.length > 0 && (
        <>
          <div className="flex gap-3">
            <div className="flex items-center gap-2 bg-green-900/30 border border-green-700/50 rounded-lg px-3 py-2">
              <ShieldCheck className="w-4 h-4 text-green-400" />
              <span className="text-xs text-green-300 font-medium">
                {approved.length} Approved
              </span>
            </div>
            <div className="flex items-center gap-2 bg-red-900/30 border border-red-700/50 rounded-lg px-3 py-2">
              <span className="text-xs text-red-300 font-medium">
                {rejected.length} Rejected
              </span>
            </div>
          </div>

          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
            Approved Queue
          </h3>
          <CandidateList
            candidates={approved}
            onEnrich={onEnrich}
            onViewDetails={onViewDetails}
            emptyMessage="No approved candidates yet."
          />
        </>
      )}
    </section>
  );
}
