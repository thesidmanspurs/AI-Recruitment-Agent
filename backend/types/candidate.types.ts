export type Platform = 'LinkedIn' | 'Upwork' | 'Reddit' | 'GitHub';

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

export interface RawCandidateProfile {
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
}
