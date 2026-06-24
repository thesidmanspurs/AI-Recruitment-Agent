import { Search } from 'lucide-react';
import type { JobAnalysis, Candidate } from '../../types';
import { Button } from '../shared/Button';
import { CandidateList } from '../candidates/CandidateList';

interface Phase2SourcingProps {
  analysis: JobAnalysis | null;
  candidates: Candidate[];
  isSourcing: boolean;
  onSource: () => void;
  onEnrich: (candidate: Candidate) => void;
  onViewDetails: (candidate: Candidate) => void;
}

export function Phase2Sourcing({
  analysis,
  candidates,
  isSourcing,
  onSource,
  onEnrich,
  onViewDetails,
}: Phase2SourcingProps) {
  return (
    <section className="flex flex-col gap-5">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-gray-900 dark:bg-gray-700 flex items-center justify-center shrink-0">
          <span className="text-xs font-bold text-white">2</span>
        </div>
        <div>
          <h2 className="text-sm font-semibold text-white">Automated Sourcing</h2>
          <p className="text-xs text-gray-400">Execute search across LinkedIn, Upwork, Reddit and score each profile.</p>
        </div>
      </div>

      <Button
        icon={<Search className="w-4 h-4" />}
        loading={isSourcing}
        disabled={!analysis}
        onClick={onSource}
        variant="secondary"
      >
        Source Candidates
      </Button>

      {candidates.length > 0 && (
        <CandidateList
          candidates={candidates}
          loading={isSourcing}
          onEnrich={onEnrich}
          onViewDetails={onViewDetails}
          emptyMessage="No candidates sourced yet."
        />
      )}
    </section>
  );
}
