-- 1. Dedupe existing rows.
--    For each (campaignId, lower(name)) group, keep the earliest createdAt
--    row and delete the rest. We prefer the earliest because it's likely the
--    most "real" data (the user's first sourcing pass) — subsequent identical
--    rows came from fallback re-sources.
DELETE FROM "Candidate"
WHERE id IN (
  SELECT id FROM (
    SELECT
      id,
      ROW_NUMBER() OVER (
        PARTITION BY "campaignId", LOWER(TRIM(name))
        ORDER BY "createdAt" ASC, id ASC
      ) AS rn
    FROM "Candidate"
  ) ranked
  WHERE rn > 1
);

-- 2. Enforce uniqueness going forward.
--    The constraint is on the exact stored `name`; if you ever want it to be
--    case-insensitive at the DB level, change to `LOWER(name)` via a functional
--    index. For now the app already lowercases when comparing, so identical
--    names with different casing collapse at the service layer.
CREATE UNIQUE INDEX "Candidate_campaignId_name_key"
  ON "Candidate"("campaignId", "name");
