import { apiClient } from './client';

export type CampaignStatus = 'DRAFT' | 'RUNNING' | 'PAUSED' | 'COMPLETED';
export type Platform = 'LinkedIn' | 'Upwork' | 'Reddit';
export type OutreachStatus =
  | 'SOURCED'
  | 'ENRICHED'
  | 'OUTREACH_SENT'
  | 'OPENED'
  | 'REPLIED'
  | 'NO_RESPONSE';
export type OutreachChannel = 'EMAIL' | 'LINKEDIN_DM' | 'PLATFORM_MESSAGE';

export interface CampaignDto {
  id: string;
  userId: string;
  name: string;
  jobTitle: string;
  rawJobText: string;
  location: string | null;
  jobType: string | null;
  department: string | null;
  status: CampaignStatus;
  code: string | null;
  analyzedAt: string | null;
  alternateTitles: string[];
  extractedKeywords: string[];
  requirements: string[];
  preferredPlatforms: string[];
  outreachTemplate?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CandidateDto {
  id: string;
  campaignId: string;
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
  email: string | null;
  phone: string | null;
  location: string | null;
  linkedinUrl: string | null;
  emailEnriched: boolean;
  phoneEnriched: boolean;
  outreachStatus: OutreachStatus;
  outreachMessage: string | null;
  outreachChannel: OutreachChannel | null;
  outreachSentAt: string | null;
  repliedAt: string | null;
  replyPreview: string | null;
  daysSinceOutreach: number;
  alertTriggered: boolean;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ScreeningSummary {
  total: number;
  approved: number;
  rejected: number;
  belowThreshold: number;
  duplicatesMerged: number;
  invalidScores: number;
  threshold: number;
}

export interface JobAnalysisDto {
  title: string;
  alternateTitles: string[];
  extractedKeywords: string[];
  requirements: string[];
  preferredPlatforms: string[];
}

export interface CreateCampaignInput {
  name: string;
  jobText: string;
  location?: string;
  jobType?: string;
  department?: string;
}

export const campaignApi = {
  // Phase 1
  create(input: CreateCampaignInput) {
    return apiClient.post<{
      success: boolean;
      campaign: CampaignDto;
      analysis: JobAnalysisDto;
      isSimulated: boolean;
      simulationReason?: string;
    }>('/campaigns', input);
  },

  list() {
    return apiClient.get<{ success: boolean; data: CampaignDto[] }>('/campaigns');
  },

  get(id: string) {
    return apiClient.get<{ success: boolean; data: CampaignDto }>(`/campaigns/${id}`);
  },

  update(
    id: string,
    input: {
      name?: string;
      location?: string;
      jobType?: string;
      department?: string;
      status?: CampaignStatus;
      jobText?: string;
      outreachTemplate?: string | null;
    }
  ) {
    return apiClient.put<{
      success: boolean;
      data: CampaignDto;
      isSimulated: boolean;
      simulationReason?: string;
    }>(`/campaigns/${id}`, input);
  },

  delete(id: string) {
    return apiClient.delete<{ success: boolean }>(`/campaigns/${id}`);
  },

  resetCandidates(id: string) {
    return apiClient.delete<{ success: boolean; deleted: number }>(`/campaigns/${id}/candidates`);
  },

  // Phase 2 / 3
  source(
    campaignId: string,
    opts: { page?: number; pageSize?: number; locations?: string[] } = {}
  ) {
    const params = new URLSearchParams();
    if (opts.page != null) params.set('page', String(opts.page));
    if (opts.pageSize != null) params.set('pageSize', String(opts.pageSize));
    const q = params.toString() ? `?${params.toString()}` : '';
    return apiClient.post<{
      success: boolean;
      candidates: CandidateDto[];
      approvedCount: number;
      screening: ScreeningSummary;
      isSimulated: boolean;
      simulationReason?: string;
      usage: {
        date: string;
        used: number;
        limit: number;
        remaining: number;
        exceeded: boolean;
      };
      pagination: {
        page: number;
        pageSize: number;
        totalEntries: number;
        totalPages: number;
        hasMore: boolean;
        nextPageCreditEstimate: number;
      };
    }>(`/campaigns/${campaignId}/candidates/source${q}`, {
      locations: opts.locations && opts.locations.length > 0 ? opts.locations : undefined,
    });
  },

  listCandidates(campaignId: string) {
    return apiClient.get<{ success: boolean; data: CandidateDto[] }>(
      `/campaigns/${campaignId}/candidates`
    );
  },

  listApproved(campaignId: string) {
    return apiClient.get<{ success: boolean; data: CandidateDto[] }>(
      `/campaigns/${campaignId}/candidates/approved`
    );
  },

  // Real-data sourcing — paste LinkedIn URLs, Apollo Match resolves each.
  addFromLinkedIn(campaignId: string, linkedinUrls: string[]) {
    return apiClient.post<{
      success: boolean;
      added: CandidateDto[];
      addedCount: number;
      skipped: Array<{ url: string; reason: string }>;
      skippedCount: number;
      usage: {
        date: string;
        used: number;
        limit: number;
        remaining: number;
        exceeded: boolean;
      };
    }>(`/campaigns/${campaignId}/candidates/from-linkedin`, { linkedinUrls });
  },

  // Phase 4 — pass force=true to bypass the "already has email" cache and
  // spend an Apollo credit anyway (used by the explicit Re-enrich button).
  enrichCandidate(campaignId: string, candidateId: string, opts: { force?: boolean } = {}) {
    const q = opts.force ? '?force=1' : '';
    return apiClient.post<{
      success: boolean;
      candidate: CandidateDto;
      result: { found: boolean; email?: string; phone?: string; location?: string };
      isSimulated: boolean;
      simulationReason?: string;
      fromCache: boolean;
    }>(`/campaigns/${campaignId}/outreach/enrich/${candidateId}${q}`, {});
  },

  // Phase 5
  draftMessage(campaignId: string, candidateId: string) {
    return apiClient.post<{
      success: boolean;
      subject: string;
      body: string;
      isSimulated: boolean;
      simulationReason?: string;
    }>(`/campaigns/${campaignId}/outreach/generate-message`, { candidateId });
  },

  sendOutreach(
    campaignId: string,
    candidateId: string,
    payload: { subject?: string; body?: string; channel?: OutreachChannel } = {}
  ) {
    return apiClient.post<{
      success: boolean;
      candidate: CandidateDto;
      subject: string;
      body: string;
      channel: OutreachChannel;
      isSimulated: boolean;
      simulationReason?: string;
      usage: {
        date: string;
        used: number;
        limit: number;
        remaining: number;
        exceeded: boolean;
      };
    }>(`/campaigns/${campaignId}/outreach/send/${candidateId}`, payload);
  },

  markReplied(campaignId: string, candidateId: string) {
    return apiClient.post<{ success: boolean; candidate: CandidateDto }>(
      `/campaigns/${campaignId}/outreach/mark-replied/${candidateId}`,
      {}
    );
  },

  getAlerts(campaignId: string) {
    return apiClient.get<{ success: boolean; data: AlertItem[] }>(
      `/campaigns/${campaignId}/outreach/alerts`
    );
  },
};

export type AlertItem =
  | {
      id: string;
      type: 'no-response';
      candidateId: string;
      candidateName: string;
      email: string | null;
      phone: string | null;
      outreachSentAt: string;
      daysSinceOutreach: number;
      message: string;
    }
  | {
      id: string;
      type: 'new-response';
      candidateId: string;
      candidateName: string;
      message: string;
      repliedAt: string;
    };
