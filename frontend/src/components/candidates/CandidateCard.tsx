import { Briefcase, Building2, Globe, CheckCircle, AlertCircle } from 'lucide-react';
import type { Key } from 'react';
import type { Candidate } from '../../types';
import { ScoreBar } from './ScoreBar';
import { Badge } from '../shared/Badge';
import { Button } from '../shared/Button';

interface CandidateCardProps {
  candidate: Candidate;
  onEnrich?: (candidate: Candidate) => void;
  onSendOutreach?: (candidate: Candidate) => void;
  onViewDetails?: (candidate: Candidate) => void;
  key?: Key;
}

const platformVariant: Record<string, 'blue' | 'purple' | 'yellow'> = {
  LinkedIn: 'blue',
  Upwork: 'green' as any,
  Reddit: 'yellow',
};

export function CandidateCard({
  candidate,
  onEnrich,
  onSendOutreach,
  onViewDetails,
}: CandidateCardProps) {
  const isApproved = candidate.matchScore >= 9.5;

  return (
    <div className={[
      'bg-gray-900 border rounded-xl p-5 flex flex-col gap-4 transition-colors',
      isApproved ? 'border-green-700/50' : 'border-gray-700/50',
    ].join(' ')}>
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-sm font-semibold text-white truncate">{candidate.name}</h3>
            {candidate.openToWork && (
              <Badge variant="green" size="sm">Open to Work</Badge>
            )}
          </div>
          <p className="text-xs text-gray-400 mt-0.5 flex items-center gap-1">
            <Briefcase className="w-3 h-3 shrink-0" />
            {candidate.currentTitle}
          </p>
          <p className="text-xs text-gray-500 flex items-center gap-1">
            <Building2 className="w-3 h-3 shrink-0" />
            {candidate.company}
          </p>
        </div>
        <Badge variant={platformVariant[candidate.platform] ?? 'gray'}>
          {candidate.platform}
        </Badge>
      </div>

      {/* Score */}
      <ScoreBar score={candidate.matchScore} />

      {/* Bio */}
      <p className="text-xs text-gray-400 line-clamp-2">{candidate.bio}</p>

      {/* Skills */}
      <div className="flex flex-wrap gap-1.5">
        {candidate.skills.slice(0, 5).map(skill => (
          <Badge key={skill} variant="gray" size="sm">{skill}</Badge>
        ))}
      </div>

      {/* Contact status */}
      <div className="flex items-center gap-2 text-xs">
        {candidate.contact.emailEnriched ? (
          <span className="flex items-center gap-1 text-green-400">
            <CheckCircle className="w-3 h-3" /> Email enriched
          </span>
        ) : (
          <span className="flex items-center gap-1 text-gray-500">
            <AlertCircle className="w-3 h-3" /> Email pending
          </span>
        )}
        <Badge variant="gray" size="sm">{candidate.outreachStatus}</Badge>
      </div>

      {/* Actions */}
      <div className="flex gap-2 pt-1">
        {onEnrich && isApproved && !candidate.contact.emailEnriched && (
          <Button size="sm" variant="secondary" onClick={() => onEnrich(candidate)}>
            Enrich
          </Button>
        )}
        {onSendOutreach && isApproved && (
          <Button size="sm" onClick={() => onSendOutreach(candidate)}>
            Send Outreach
          </Button>
        )}
        {onViewDetails && (
          <Button size="sm" variant="ghost" onClick={() => onViewDetails(candidate)}>
            Details
          </Button>
        )}
      </div>
    </div>
  );
}
