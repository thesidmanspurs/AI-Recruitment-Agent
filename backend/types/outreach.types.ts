import type { OutreachChannel, OutreachStatus } from './candidate.types';

export interface GenerateMessageRequest {
  candidateId: string;
  originalSpec: string;
}

export interface OutreachMessage {
  candidateId: string;
  channel: OutreachChannel;
  subject?: string;
  body: string;
  sentAt?: string;
  status: OutreachStatus;
}

export interface AlertPayload {
  candidateId: string;
  candidateName: string;
  phone?: string;
  email?: string;
  outreachSentAt: string;
  daysSinceOutreach: number;
  triggeredAt: string;
}

export interface EnrichmentRequest {
  candidateId: string;
  name: string;
  company: string;
  linkedinUrl?: string;
}

export interface ApolloEnrichmentResult {
  email?: string;
  phone?: string;
  location?: string;
  found: boolean;
}

export interface ActivityLog {
  id: string;
  timestamp: string;
  candidateId?: string;
  candidateName?: string;
  message: string;
  type: 'info' | 'enrich' | 'outreach' | 'reply' | 'alert' | 'system';
}
