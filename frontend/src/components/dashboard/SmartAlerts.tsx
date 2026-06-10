import { Phone, MessageSquare, Mail } from 'lucide-react';
import type { AlertItem } from '../../api/campaignApi';

interface SmartAlertsProps {
  alerts: AlertItem[];
  onMarkReplied?: (candidateId: string) => void | Promise<void>;
}

export function SmartAlerts({ alerts, onMarkReplied }: SmartAlertsProps) {
  return (
    <div className="bg-white dark:bg-[#10131c] border border-gray-200 dark:border-white/10 rounded-xl overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-100 dark:border-white/10">
        <h3 className="text-xs font-bold tracking-widest text-gray-700 dark:text-gray-200 uppercase">Smart Alerts</h3>
      </div>
      <div className="p-4 flex flex-col gap-3">
        {alerts.length === 0 && (
          <p className="text-xs text-gray-400 dark:text-gray-500 text-center py-4">No active alerts.</p>
        )}
        {alerts.map(alert => (
          <div key={alert.id}>
            <AlertCard alert={alert} onMarkReplied={onMarkReplied} />
          </div>
        ))}
      </div>
    </div>
  );
}

function AlertCard({
  alert,
  onMarkReplied,
}: {
  alert: AlertItem;
  onMarkReplied?: (candidateId: string) => void | Promise<void>;
}) {
  if (alert.type === 'no-response') {
    return (
      <div className="rounded-lg p-3.5 border-l-4 bg-red-50 dark:bg-red-500/10 border-red-400 dark:border-red-400/20">
        <div className="flex items-center gap-1.5 mb-1.5">
          {alert.phone ? (
            <Phone className="w-3.5 h-3.5 text-red-500 shrink-0" />
          ) : (
            <Mail className="w-3.5 h-3.5 text-red-500 shrink-0" />
          )}
          <p className="text-xs font-bold text-red-700 dark:text-red-300">
            No response ({alert.daysSinceOutreach}d)
          </p>
        </div>
        <p className="text-xs text-gray-700 dark:text-gray-200 leading-relaxed mb-2">{alert.message}</p>
        <div className="flex items-center gap-3">
          {alert.phone && (
            <a
              href={`tel:${alert.phone}`}
              className="text-xs font-bold text-red-600 dark:text-red-300 hover:text-red-700 dark:hover:text-red-200 uppercase tracking-wide"
            >
              Call {alert.phone}
            </a>
          )}
          {onMarkReplied && (
            <button
              onClick={() => onMarkReplied(alert.candidateId)}
              className="text-xs font-bold text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 uppercase tracking-wide"
            >
              Mark replied
            </button>
          )}
        </div>
      </div>
    );
  }

  // new-response
  return (
    <div className="rounded-lg p-3.5 border-l-4 bg-emerald-50 dark:bg-emerald-500/10 border-emerald-400 dark:border-emerald-400/20">
      <div className="flex items-center gap-1.5 mb-1.5">
        <MessageSquare className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
        <p className="text-xs font-bold text-emerald-700 dark:text-emerald-300">New response</p>
      </div>
      <p className="text-xs text-gray-700 dark:text-gray-200 leading-relaxed">{alert.message}</p>
    </div>
  );
}
