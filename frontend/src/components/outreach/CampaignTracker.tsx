import { Clock, Bell, Mail, MessageSquare } from 'lucide-react';
import type { ActivityLog } from '../../types';
import { Badge } from '../shared/Badge';

interface CampaignTrackerProps {
  logs: ActivityLog[];
}

const typeIcon: Record<ActivityLog['type'], typeof Bell> = {
  info: Bell,
  enrich: Mail,
  outreach: MessageSquare,
  reply: MessageSquare,
  alert: Bell,
  system: Clock,
};

const typeBadgeVariant: Record<ActivityLog['type'], 'blue' | 'green' | 'yellow' | 'red' | 'gray' | 'purple'> = {
  info: 'blue',
  enrich: 'purple',
  outreach: 'green',
  reply: 'green',
  alert: 'red',
  system: 'gray',
};

export function CampaignTracker({ logs }: CampaignTrackerProps) {
  if (logs.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500 text-sm">
        No activity yet. Run the pipeline to see logs here.
      </div>
    );
  }

  return (
    <div className="flex flex-col divide-y divide-gray-800">
      {logs.map(log => {
        const Icon = typeIcon[log.type];
        return (
          <div key={log.id} className="flex items-start gap-3 py-3">
            <Icon className="w-4 h-4 mt-0.5 text-gray-500 shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-xs text-gray-300">{log.message}</p>
              {log.candidateName && (
                <p className="text-xs text-gray-500 mt-0.5">{log.candidateName}</p>
              )}
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Badge variant={typeBadgeVariant[log.type]} size="sm">{log.type}</Badge>
              <span className="text-xs text-gray-600">
                {new Date(log.timestamp).toLocaleTimeString()}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
