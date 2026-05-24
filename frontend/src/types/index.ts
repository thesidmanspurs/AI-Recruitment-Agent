export type Platform = 'LinkedIn' | 'Upwork' | 'Reddit';

export type OutreachStatus =
  | 'Sourced'
  | 'Enriched'
  | 'Outreach Sent'
  | 'Opened'
  | 'Replied'
  | 'No Response';

export type OutreachChannel = 'email' | 'linkedin_dm' | 'platform_message';

export interface CandidateContact {
  email?: string;
  phone?: string;
  location?: string;
  linkedinUrl?: string;
  emailEnriched: boolean;
  phoneEnriched: boolean;
}

export interface Candidate {
  id: string;
  name: string;
  currentTitle: string;
  company: string;
  bio: string;
  openToWork: boolean;
  platform: Platform;
  matchScore: number;
  matchExplanation: string;
  skills: string[];
  strengths: string[];
  gaps: string[];
  contact: CandidateContact;
  outreachStatus: OutreachStatus;
  outreachMessage?: string;
  outreachChannel?: OutreachChannel;
  outreachSentAt?: string;
  daysSinceOutreach: number;
  alertTriggered: boolean;
  notes?: string;
}

export interface JobAnalysis {
  title: string;
  alternateTitles: string[];
  extractedKeywords: string[];
  requirements: string[];
  preferredPlatforms: string[];
}

export interface JobSpec extends JobAnalysis {
  id: string;
  rawText: string;
  analyzedAt: string;
}

export interface ActivityLog {
  id: string;
  timestamp: string;
  candidateId?: string;
  candidateName?: string;
  message: string;
  type: 'info' | 'enrich' | 'outreach' | 'reply' | 'alert' | 'system';
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

export interface SourcingFilters {
  platform: 'all' | Platform;
  onlyOpenToWork: boolean;
  minScore: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  isSimulated?: boolean;
}
