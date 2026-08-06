-- CreateEnum RankingSessionStatus (idempotent)
DO $$ BEGIN
  CREATE TYPE "RankingSessionStatus" AS ENUM ('PROCESSING', 'COMPLETED', 'FAILED');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- CreateTable RankingSession
CREATE TABLE IF NOT EXISTS "RankingSession" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "jobTitle" TEXT NOT NULL,
    "rawJobText" TEXT NOT NULL,
    "status" "RankingSessionStatus" NOT NULL DEFAULT 'PROCESSING',
    "totalUploaded" INTEGER NOT NULL DEFAULT 0,
    "totalProcessed" INTEGER NOT NULL DEFAULT 0,
    "totalSaved" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RankingSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable RankedCandidate
CREATE TABLE IF NOT EXISTS "RankedCandidate" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "currentTitle" TEXT NOT NULL,
    "company" TEXT,
    "location" TEXT,
    "experienceYears" DOUBLE PRECISION,
    "educationLevel" TEXT,
    "matchScore" DOUBLE PRECISION NOT NULL,
    "rankPosition" INTEGER NOT NULL,
    "matchExplanation" TEXT NOT NULL,
    "skills" TEXT[],
    "strengths" TEXT[],
    "gaps" TEXT[],
    "originalFileName" TEXT NOT NULL,
    "isSaved" BOOLEAN NOT NULL DEFAULT false,
    "medal" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RankedCandidate_pkey" PRIMARY KEY ("id")
);

-- CreateIndex (idempotent)
CREATE INDEX IF NOT EXISTS "RankingSession_userId_idx" ON "RankingSession"("userId");
CREATE INDEX IF NOT EXISTS "RankingSession_userId_status_idx" ON "RankingSession"("userId", "status");
CREATE INDEX IF NOT EXISTS "RankingSession_userId_createdAt_idx" ON "RankingSession"("userId", "createdAt");

CREATE INDEX IF NOT EXISTS "RankedCandidate_sessionId_idx" ON "RankedCandidate"("sessionId");
CREATE INDEX IF NOT EXISTS "RankedCandidate_sessionId_matchScore_idx" ON "RankedCandidate"("sessionId", "matchScore");
CREATE INDEX IF NOT EXISTS "RankedCandidate_sessionId_rankPosition_idx" ON "RankedCandidate"("sessionId", "rankPosition");
CREATE INDEX IF NOT EXISTS "RankedCandidate_sessionId_isSaved_idx" ON "RankedCandidate"("sessionId", "isSaved");

-- AddForeignKey (idempotent via DO block)
DO $$ BEGIN
  ALTER TABLE "RankingSession" ADD CONSTRAINT "RankingSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE "RankedCandidate" ADD CONSTRAINT "RankedCandidate_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "RankingSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;
