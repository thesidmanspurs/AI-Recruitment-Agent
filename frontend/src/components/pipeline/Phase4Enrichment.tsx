import { Database, CheckCircle, AlertCircle } from 'lucide-react';
import type { Candidate } from '../../types';
import { Button } from '../shared/Button';
import { Badge } from '../shared/Badge';

interface Phase4EnrichmentProps {
  candidates: Candidate[];
  isEnriching: boolean;
  onEnrichAll: () => void;
  onEnrich: (candidate: Candidate) => void;
}

export function Phase4Enrichment({
  candidates,
  isEnriching,
  onEnrichAll,
  onEnrich,
}: Phase4EnrichmentProps) {
  const approved = candidates.filter(c => c.matchScore >= 9.5);
  const enriched = approved.filter(c => c.contact.emailEnriched);
  const pending = approved.filter(c => !c.contact.emailEnriched);

  return (
    <section className="flex flex-col gap-5">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-purple-700 flex items-center justify-center shrink-0">
          <span className="text-xs font-bold text-white">4</span>
        </div>
        <div>
          <h2 className="text-sm font-semibold text-white">Apollo Data Enrichment</h2>
          <p className="text-xs text-gray-400">
            Resolve email + phone for approved candidates. Direct email prioritised over LinkedIn DM.
          </p>
        </div>
      </div>

      {approved.length > 0 && (
        <>
          <div className="flex gap-3">
            <Badge variant="green">{enriched.length} Enriched</Badge>
            <Badge variant="yellow">{pending.length} Pending</Badge>
          </div>

          <Button
            variant="secondary"
            icon={<Database className="w-4 h-4" />}
            loading={isEnriching}
            disabled={pending.length === 0}
            onClick={onEnrichAll}
          >
            Enrich All via Apollo
          </Button>

          <div className="flex flex-col divide-y divide-gray-800">
            {approved.map(candidate => (
              <div key={candidate.id} className="flex items-center justify-between py-3">
                <div>
                  <p className="text-sm text-white font-medium">{candidate.name}</p>
                  <p className="text-xs text-gray-400">{candidate.currentTitle}</p>
                </div>
                <div className="flex items-center gap-3">
                  {candidate.contact.emailEnriched ? (
                    <span className="flex items-center gap-1 text-xs text-green-400">
                      <CheckCircle className="w-3.5 h-3.5" />
                      {candidate.contact.email}
                    </span>
                  ) : (
                    <Button
                      size="sm"
                      variant="secondary"
                      loading={isEnriching}
                      onClick={() => onEnrich(candidate)}
                    >
                      Enrich
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {approved.length === 0 && (
        <p className="text-sm text-gray-500 text-center py-6">
          No approved candidates to enrich. Complete Phase 3 first.
        </p>
      )}
    </section>
  );
}
