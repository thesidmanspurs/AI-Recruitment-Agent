-- CreateEnum
CREATE TYPE "CampaignStatus" AS ENUM ('DRAFT', 'RUNNING', 'PAUSED', 'COMPLETED');

-- CreateEnum
CREATE TYPE "Platform" AS ENUM ('LinkedIn', 'Upwork', 'Reddit');

-- CreateEnum
CREATE TYPE "OutreachStatus" AS ENUM ('SOURCED', 'ENRICHED', 'OUTREACH_SENT', 'OPENED', 'REPLIED', 'NO_RESPONSE');

-- CreateEnum
CREATE TYPE "OutreachChannel" AS ENUM ('EMAIL', 'LINKEDIN_DM', 'PLATFORM_MESSAGE');

-- CreateEnum
CREATE TYPE "ActivityLogType" AS ENUM ('INFO', 'ENRICH', 'OUTREACH', 'REPLY', 'ALERT', 'SYSTEM');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Campaign" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "jobTitle" TEXT NOT NULL,
    "rawJobText" TEXT NOT NULL,
    "location" TEXT,
    "jobType" TEXT,
    "department" TEXT,
    "status" "CampaignStatus" NOT NULL DEFAULT 'DRAFT',
    "code" TEXT,
    "analyzedAt" TIMESTAMP(3),
    "alternateTitles" TEXT[],
    "extractedKeywords" TEXT[],
    "requirements" TEXT[],
    "preferredPlatforms" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Campaign_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Candidate" (
    "id" TEXT NOT NULL,
    "campaignId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "currentTitle" TEXT NOT NULL,
    "company" TEXT NOT NULL,
    "bio" TEXT NOT NULL,
    "openToWork" BOOLEAN NOT NULL DEFAULT false,
    "platform" "Platform" NOT NULL,
    "matchScore" DOUBLE PRECISION NOT NULL,
    "matchExplanation" TEXT NOT NULL,
    "skills" TEXT[],
    "strengths" TEXT[],
    "gaps" TEXT[],
    "email" TEXT,
    "phone" TEXT,
    "location" TEXT,
    "linkedinUrl" TEXT,
    "emailEnriched" BOOLEAN NOT NULL DEFAULT false,
    "phoneEnriched" BOOLEAN NOT NULL DEFAULT false,
    "outreachStatus" "OutreachStatus" NOT NULL DEFAULT 'SOURCED',
    "outreachMessage" TEXT,
    "outreachChannel" "OutreachChannel",
    "outreachSentAt" TIMESTAMP(3),
    "daysSinceOutreach" INTEGER NOT NULL DEFAULT 0,
    "alertTriggered" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Candidate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ActivityLog" (
    "id" TEXT NOT NULL,
    "campaignId" TEXT NOT NULL,
    "candidateId" TEXT,
    "candidateName" TEXT,
    "message" TEXT NOT NULL,
    "type" "ActivityLogType" NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ActivityLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_email_idx" ON "User"("email");

-- CreateIndex
CREATE INDEX "Campaign_userId_idx" ON "Campaign"("userId");

-- CreateIndex
CREATE INDEX "Campaign_userId_status_idx" ON "Campaign"("userId", "status");

-- CreateIndex
CREATE INDEX "Candidate_campaignId_idx" ON "Candidate"("campaignId");

-- CreateIndex
CREATE INDEX "Candidate_campaignId_matchScore_idx" ON "Candidate"("campaignId", "matchScore");

-- CreateIndex
CREATE INDEX "Candidate_campaignId_outreachStatus_idx" ON "Candidate"("campaignId", "outreachStatus");

-- CreateIndex
CREATE INDEX "ActivityLog_campaignId_idx" ON "ActivityLog"("campaignId");

-- CreateIndex
CREATE INDEX "ActivityLog_campaignId_timestamp_idx" ON "ActivityLog"("campaignId", "timestamp");

-- AddForeignKey
ALTER TABLE "Campaign" ADD CONSTRAINT "Campaign_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Candidate" ADD CONSTRAINT "Candidate_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "Campaign"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActivityLog" ADD CONSTRAINT "ActivityLog_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "Campaign"("id") ON DELETE CASCADE ON UPDATE CASCADE;
