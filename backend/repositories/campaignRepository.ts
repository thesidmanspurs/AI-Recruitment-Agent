import { prisma } from '../config/database.js';
import type { CampaignStatus } from '@prisma/client';

export type CreateCampaignInput = {
  userId: string;
  name: string;
  jobTitle: string;
  rawJobText: string;
  location?: string;
  jobType?: string;
  department?: string;
  alternateTitles?: string[];
  extractedKeywords?: string[];
  requirements?: string[];
  preferredPlatforms?: string[];
  status?: CampaignStatus;
  analyzedAt?: Date;
};

export type UpdateCampaignInput = Partial<Omit<CreateCampaignInput, 'userId'>>;

export const campaignRepository = {
  // Always scoped to userId — strict tenant isolation
  findAll(userId: string) {
    return prisma.campaign.findMany({
      where: { userId },
      orderBy: { updatedAt: 'desc' },
      include: { _count: { select: { candidates: true } } },
    });
  },

  findById(id: string, userId: string) {
    return prisma.campaign.findFirst({ where: { id, userId } });
  },

  create(data: CreateCampaignInput) {
    return prisma.campaign.create({ data });
  },

  update(id: string, userId: string, data: UpdateCampaignInput) {
    return prisma.campaign.update({ where: { id }, data, });
  },

  delete(id: string, userId: string) {
    return prisma.campaign.delete({ where: { id } });
  },

  // Activity logs scoped to a campaign (which belongs to a user)
  addLog(campaignId: string, entry: {
    candidateId?: string;
    candidateName?: string;
    message: string;
    type: 'INFO' | 'ENRICH' | 'OUTREACH' | 'REPLY' | 'ALERT' | 'SYSTEM';
  }) {
    return prisma.activityLog.create({ data: { campaignId, ...entry } });
  },

  getRecentLogs(campaignId: string, limit = 50) {
    return prisma.activityLog.findMany({
      where: { campaignId },
      orderBy: { timestamp: 'desc' },
      take: limit,
    });
  },
};
