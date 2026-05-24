import { Send, Bell } from 'lucide-react';
import type { Candidate } from '../../types';
import { Button } from '../shared/Button';
import { CampaignTracker } from '../outreach/CampaignTracker';
import { MessageComposer } from '../outreach/MessageComposer';
import { Modal } from '../shared/Modal';
import { useState } from 'react';
import type { ActivityLog } from '../../types';

interface Phase5OutreachProps {
  candidates: Candidate[];
  activityLogs: ActivityLog[];
  originalSpec: string;
  isSending: boolean;
  onSendOutreach: (candidate: Candidate, originalSpec: string) => void;
}

export function Phase5Outreach({
  candidates,
  activityLogs,
  originalSpec,
  isSending,
  onSendOutreach,
}: Phase5OutreachProps) {
  const [composingFor, setComposingFor] = useState<Candidate | null>(null);
  const approved = candidates.filter(c => c.matchScore >= 9.5 && c.contact.emailEnriched);
  const alerts = candidates.filter(c => c.alertTriggered);

  return (
    <section className="flex flex-col gap-5">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-orange-700 flex items-center justify-center shrink-0">
          <span className="text-xs font-bold text-white">5</span>
        </div>
        <div>
          <h2 className="text-sm font-semibold text-white">Multichannel Outreach</h2>
          <p className="text-xs text-gray-400">
            AI-drafted personalised messages. 48h no-response triggers recruiter alert.
          </p>
        </div>
      </div>

      {alerts.length > 0 && (
        <div className="bg-red-900/20 border border-red-700/50 rounded-xl p-4 flex items-start gap-3">
          <Bell className="w-4 h-4 text-red-400 mt-0.5 shrink-0" />
          <div>
            <p className="text-sm text-red-300 font-medium">
              {alerts.length} candidate(s) require follow-up call
            </p>
            <p className="text-xs text-red-400 mt-0.5">No response after 48h. Phone numbers available below.</p>
          </div>
        </div>
      )}

      <div className="flex flex-col divide-y divide-gray-800">
        {approved.map(candidate => (
          <div key={candidate.id} className="flex items-center justify-between py-3">
            <div>
              <p className="text-sm text-white font-medium">{candidate.name}</p>
              <p className="text-xs text-gray-400">{candidate.outreachStatus}</p>
            </div>
            <Button
              size="sm"
              icon={<Send className="w-3.5 h-3.5" />}
              loading={isSending}
              onClick={() => setComposingFor(candidate)}
            >
              Compose
            </Button>
          </div>
        ))}
      </div>

      {approved.length === 0 && (
        <p className="text-sm text-gray-500 text-center py-6">
          Enrich approved candidates first (Phase 4) to enable outreach.
        </p>
      )}

      <div className="flex flex-col gap-2">
        <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Activity Log</h3>
        <CampaignTracker logs={activityLogs} />
      </div>

      {composingFor && (
        <Modal
          open
          title={`Outreach — ${composingFor.name}`}
          onClose={() => setComposingFor(null)}
          maxWidth="lg"
        >
          <MessageComposer
            candidate={composingFor}
            originalSpec={originalSpec}
            onSend={(msg, channel) => {
              onSendOutreach(composingFor, originalSpec);
              setComposingFor(null);
            }}
          />
        </Modal>
      )}
    </section>
  );
}
