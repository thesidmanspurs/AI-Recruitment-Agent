-- Per-campaign outreach template. When set, the outreach editor pre-fills
-- from this instead of calling Gemini per-candidate. Stored as
-- "Subject\n\nBody" with {{placeholders}} that the backend substitutes.
ALTER TABLE "Campaign" ADD COLUMN "outreachTemplate" TEXT;
