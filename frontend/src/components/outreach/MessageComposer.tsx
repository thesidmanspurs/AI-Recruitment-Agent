import { useState } from 'react';
import { Sparkles, Send } from 'lucide-react';
import type { Candidate } from '../../types';
import { Button } from '../shared/Button';

interface MessageComposerProps {
  candidate: Candidate;
  originalSpec: string;
  onSend?: (message: string, channel: string) => void;
}

export function MessageComposer({ candidate, originalSpec, onSend }: MessageComposerProps) {
  const [message, setMessage] = useState(candidate.outreachMessage || '');
  const [generating, setGenerating] = useState(false);

  // Phase 5: wire up to outreachApi.generateMessage

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <p className="text-xs text-gray-400">
          Channel:{' '}
          <span className="text-white font-medium">
            {candidate.contact.emailEnriched ? 'Email' : 'LinkedIn DM'}
          </span>
        </p>
        <Button
          size="sm"
          variant="secondary"
          icon={<Sparkles className="w-3.5 h-3.5" />}
          loading={generating}
          onClick={() => {/* Phase 5 */}}
        >
          Generate with AI
        </Button>
      </div>

      <textarea
        className="w-full h-40 bg-gray-800 border border-gray-600 rounded-lg p-3 text-sm text-gray-200 resize-none focus:outline-none focus:border-blue-500"
        placeholder="Outreach message will appear here..."
        value={message}
        onChange={e => setMessage(e.target.value)}
      />

      <Button
        icon={<Send className="w-4 h-4" />}
        disabled={!message.trim()}
        onClick={() => onSend?.(message, candidate.contact.emailEnriched ? 'email' : 'linkedin_dm')}
      >
        Send Outreach
      </Button>
    </div>
  );
}
