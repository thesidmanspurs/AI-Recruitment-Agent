import { prisma } from '../config/database.js';
import type { OutreachStatus, Platform, OutreachChannel } from '@prisma/client';
import { SUITABILITY_THRESHOLD } from '../config/constants.js';

export type CreateCandidateInput = {
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
};

export type UpdateCandidateInput = {
  name?: string;
  email?: string | null;
  phone?: string | null;
  location?: string;
  linkedinUrl?: string;
  apolloId?: string | null;
  apolloUpdatedAt?: Date | null;
  currentRoleSince?: Date | null;
  isCurrentRole?: boolean;
  emailEnriched?: boolean;
  phoneEnriched?: boolean;
  outreachStatus?: OutreachStatus;
  outreachMessage?: string;
  outreachChannel?: OutreachChannel;
  outreachSentAt?: Date;
  daysSinceOutreach?: number;
  alertTriggered?: boolean;
  notes?: string;
};

export const candidateRepository = {
  findAllByCampaign(campaignId: string) {
    return prisma.candidate.findMany({
      where: { campaignId },
      orderBy: { matchScore: 'desc' },
    });
  },

  findById(id: string, campaignId: string) {
    return prisma.candidate.findFirst({ where: { id, campaignId } });
  },

  // Candidates that passed the suitability threshold — go to Apollo enrichment
  findApprovedQueue(campaignId: string) {
    return prisma.candidate.findMany({
      where: { campaignId, matchScore: { gte: SUITABILITY_THRESHOLD } },
      orderBy: { matchScore: 'desc' },
    });
  },

  // Candidates that were sourced but screened out below threshold — useful
  // for the user to audit Phase 3 decisions.
  findBelowThreshold(campaignId: string) {
    return prisma.candidate.findMany({
      where: { campaignId, matchScore: { lt: SUITABILITY_THRESHOLD } },
      orderBy: { matchScore: 'desc' },
    });
  },

  // Candidates sent outreach with no reply yet — 48h alert check
  findPendingAlerts(campaignId: string) {
    return prisma.candidate.findMany({
      where: {
        campaignId,
        outreachStatus: 'OUTREACH_SENT',
        alertTriggered: false,
        outreachSentAt: { not: null },
      },
    });
  },

  // Inserts the batch; the (campaignId, name) unique constraint guarantees
  // no duplicates even under racing requests. `createManyAndReturn` does not
  // support `skipDuplicates`, so we use `createMany` + a follow-up read.
  // The app-level dedupe in the controller normally makes this a no-op,
  // but this is the safety net.
  async createMany(candidates: CreateCandidateInput[]) {
    if (candidates.length === 0) return [];
    const campaignId = candidates[0].campaignId;
    const names = candidates.map(c => c.name);
    await prisma.candidate.createMany({ data: candidates, skipDuplicates: true });
    return prisma.candidate.findMany({
      where: { campaignId, name: { in: names } },
      orderBy: { matchScore: 'desc' },
    });
  },

  // Used by the sourcing flow to filter out names already in the campaign,
  // so re-sourcing (especially on the fallback path) doesn't duplicate rows.
  async existingNames(campaignId: string): Promise<Set<string>> {
    const rows = await prisma.candidate.findMany({
      where: { campaignId },
      select: { name: true },
    });
    return new Set(rows.map(r => r.name.trim().toLowerCase()));
  },

  // Wipe every candidate (and cascade-delete their activity links) so the
  // recruiter can re-source from a clean slate.
  deleteByCampaign(campaignId: string) {
    return prisma.candidate.deleteMany({ where: { campaignId } });
  },

  update(id: string, data: UpdateCandidateInput) {
    return prisma.candidate.update({ where: { id }, data });
  },

  // Update the AI fit score + its rationale/strengths/gaps. Separate from
  // UpdateCandidateInput (contact fields) because rescoring touches the
  // assessment columns, not the contact ones.
  updateScore(
    id: string,
    data: { matchScore: number; matchExplanation: string; strengths: string[]; gaps: string[] }
  ) {
    return prisma.candidate.update({ where: { id }, data });
  },

  findByApolloId(apolloId: string) {
    return prisma.candidate.findUnique({ where: { apolloId } });
  },

  updateByApolloId(apolloId: string, data: UpdateCandidateInput) {
    return prisma.candidate.update({ where: { apolloId }, data });
  },

  delete(id: string) {
    return prisma.candidate.delete({ where: { id } });
  },
};
