import type { Candidate, OutreachStatus, OutreachChannel } from '../types';
import type { CandidateDto } from '../api/campaignApi';

const STATUS_MAP: Record<CandidateDto['outreachStatus'], OutreachStatus> = {
  SOURCED: 'Sourced',
  ENRICHED: 'Enriched',
  OUTREACH_SENT: 'Outreach Sent',
  OPENED: 'Opened',
  REPLIED: 'Replied',
  NO_RESPONSE: 'No Response',
};

const CHANNEL_MAP: Record<NonNullable<CandidateDto['outreachChannel']>, OutreachChannel> = {
  EMAIL: 'email',
  LINKEDIN_DM: 'linkedin_dm',
  PLATFORM_MESSAGE: 'platform_message',
};

export function toCandidate(c: CandidateDto): Candidate {
  return {
    id: c.id,
    name: c.name,
    currentTitle: c.currentTitle,
    company: c.company,
    bio: c.bio,
    openToWork: c.openToWork,
    platform: c.platform,
    matchScore: c.matchScore,
    matchExplanation: c.matchExplanation,
    skills: c.skills,
    strengths: c.strengths,
    gaps: c.gaps,
    contact: {
      email: c.email ?? undefined,
      phone: c.phone ?? undefined,
      location: c.location ?? undefined,
      linkedinUrl: c.linkedinUrl ?? undefined,
      emailEnriched: c.emailEnriched,
      phoneEnriched: c.phoneEnriched,
    },
    outreachStatus: STATUS_MAP[c.outreachStatus],
    outreachMessage: c.outreachMessage ?? undefined,
    outreachChannel: c.outreachChannel ? CHANNEL_MAP[c.outreachChannel] : undefined,
    outreachSentAt: c.outreachSentAt ?? undefined,
    apolloUpdatedAt: c.apolloUpdatedAt ?? undefined,
    currentRoleSince: c.currentRoleSince ?? undefined,
    isCurrentRole: c.isCurrentRole ?? false,
    createdAt: c.createdAt,
    daysSinceOutreach: c.daysSinceOutreach,
    alertTriggered: c.alertTriggered,
    notes: c.notes ?? undefined,
  };
}
