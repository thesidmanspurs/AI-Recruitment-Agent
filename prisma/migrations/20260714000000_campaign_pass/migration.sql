-- Campaign Pass: one-time $299 unlock granting unlimited reveals for one campaign.
ALTER TABLE "Campaign" ADD COLUMN IF NOT EXISTS "unlimited" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Campaign" ADD COLUMN IF NOT EXISTS "unlimitedAt" TIMESTAMP(3);
