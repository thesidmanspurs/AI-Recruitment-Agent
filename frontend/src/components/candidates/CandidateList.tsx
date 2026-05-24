import type { Candidate } from '../../types';
import { CandidateCard } from './CandidateCard';
import { LoadingSpinner } from '../shared/LoadingSpinner';

interface CandidateListProps {
  candidates: Candidate[];
  loading?: boolean;
  emptyMessage?: string;
  onEnrich?: (candidate: Candidate) => void;
  onSendOutreach?: (candidate: Candidate) => void;
  onViewDetails?: (candidate: Candidate) => void;
}

export function CandidateList({
  candidates,
  loading,
  emptyMessage = 'No candidates found.',
  onEnrich,
  onSendOutreach,
  onViewDetails,
}: CandidateListProps) {
  if (loading) return <LoadingSpinner message="Sourcing candidates..." />;

  if (candidates.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500 text-sm">{emptyMessage}</div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
      {candidates.map(candidate => (
        <CandidateCard
          key={candidate.id}
          candidate={candidate}
          onEnrich={onEnrich}
          onSendOutreach={onSendOutreach}
          onViewDetails={onViewDetails}
        />
      ))}
    </div>
  );
}
