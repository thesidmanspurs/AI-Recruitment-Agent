/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface JobSpec {
  id: string;
  title: string;
  rawText: string;
  analyzedDate?: string;
  extractedKeywords: string[];
  alternateTitles: string[];
  preferredPlatforms: string[];
  requirements: string[];
}

export interface CandidateContact {
  email?: string;
  phone?: string;
  location?: string;
  linkedinUrl?: string;
  githubUrl?: string;
  emailEnriched: boolean;
  phoneEnriched: boolean;
}

export type OutreachStatus =
  | 'Sourced'
  | 'Enriched'
  | 'Outreach Sent'
  | 'Opened'
  | 'Replied'
  | 'No Response';

export interface Candidate {
  id: string;
  name: string;
  avatarUrl?: string;
  currentTitle: string;
  company: string;
  bio: string;
  openToWork: boolean;
  platform: 'LinkedIn' | 'Upwork' | 'Reddit';
  matchScore: number; // 0 - 10
  matchExplanation: string;
  skills: string[];
  contact: CandidateContact;
  outreachStatus: OutreachStatus;
  outreachMessage?: string;
  daysSinceOutreach: number;
  alertTriggered: boolean;
  notes?: string;
  strengths: string[];
  gaps: string[];
}

export interface ActivityLog {
  id: string;
  timestamp: string;
  candidateId?: string;
  candidateName?: string;
  message: string;
  type: 'info' | 'enrich' | 'outreach' | 'reply' | 'alert' | 'system';
}

export interface SourcingFilters {
  platform: 'all' | 'LinkedIn' | 'Upwork' | 'Reddit';
  onlyOpenToWork: boolean;
  minScore: number;
}
