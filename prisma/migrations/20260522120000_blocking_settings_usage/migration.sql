-- User: block + per-user override
ALTER TABLE "User"
  ADD COLUMN "isBlocked"          BOOLEAN     NOT NULL DEFAULT false,
  ADD COLUMN "blockedAt"          TIMESTAMP(3),
  ADD COLUMN "blockedReason"      TEXT,
  ADD COLUMN "dailyLimitOverride" INTEGER;

-- Global settings (singleton key/value table)
CREATE TABLE "AppSetting" (
  "key"       TEXT         NOT NULL PRIMARY KEY,
  "value"     TEXT         NOT NULL,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "updatedBy" TEXT
);

-- Per-user daily usage counter
CREATE TABLE "UsageDaily" (
  "id"        TEXT         NOT NULL PRIMARY KEY,
  "userId"    TEXT         NOT NULL,
  "date"      TEXT         NOT NULL,
  "count"     INTEGER      NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "UsageDaily_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE
);
CREATE UNIQUE INDEX "UsageDaily_userId_date_key" ON "UsageDaily"("userId", "date");
CREATE INDEX "UsageDaily_userId_idx" ON "UsageDaily"("userId");
CREATE INDEX "UsageDaily_date_idx" ON "UsageDaily"("date");

-- Seed the default daily free limit
INSERT INTO "AppSetting" ("key", "value", "updatedAt") VALUES ('daily_free_limit', '50', CURRENT_TIMESTAMP)
ON CONFLICT ("key") DO NOTHING;
