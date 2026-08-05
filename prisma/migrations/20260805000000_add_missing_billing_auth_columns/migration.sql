-- Add PlanType enum (idempotent)
DO $$ BEGIN
  CREATE TYPE "PlanType" AS ENUM ('NONE', 'SOURCING', 'RANKING', 'PRO');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Add password reset columns (idempotent)
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "passwordResetToken"   TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "passwordResetExpires" TIMESTAMP(3);

-- Add Google OAuth columns (idempotent)
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "googleId"   TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "avatarUrl"  TEXT;

-- Add planType column (idempotent)
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "planType" "PlanType" NOT NULL DEFAULT 'NONE';

-- Add new billing columns missing from earlier migration (idempotent)
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "cancelAtPeriodEnd"           BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "currentPeriodEnd"            TIMESTAMP(3);

-- Add ranking add-on columns (idempotent)
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "rankingAddonActive"              BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "rankingAddonSubscriptionId"      TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "rankingAddonStatus"               TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "rankingAddonCurrentPeriodEnd"    TIMESTAMP(3);

-- Add sourcing add-on columns (idempotent)
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "sourcingAddonActive"              BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "sourcingAddonSubscriptionId"      TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "sourcingAddonStatus"               TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "sourcingAddonCurrentPeriodEnd"    TIMESTAMP(3);

-- Unique indexes (idempotent)
CREATE UNIQUE INDEX IF NOT EXISTS "User_passwordResetToken_key" ON "User"("passwordResetToken");
CREATE UNIQUE INDEX IF NOT EXISTS "User_googleId_key"           ON "User"("googleId");
CREATE UNIQUE INDEX IF NOT EXISTS "User_rankingAddonSubscriptionId_key" ON "User"("rankingAddonSubscriptionId");
CREATE UNIQUE INDEX IF NOT EXISTS "User_sourcingAddonSubscriptionId_key" ON "User"("sourcingAddonSubscriptionId");
