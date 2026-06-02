-- The same Apollo person can be sourced into multiple campaigns / re-sourced,
-- so apolloId must not be globally unique. Drop the unique index, add a plain
-- index for lookups (phone webhook + enrichment).
DROP INDEX IF EXISTS "Candidate_apolloId_key";
CREATE INDEX IF NOT EXISTS "Candidate_apolloId_idx" ON "Candidate"("apolloId");
