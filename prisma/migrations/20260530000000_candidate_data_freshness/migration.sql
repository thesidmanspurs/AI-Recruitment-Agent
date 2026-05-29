-- Apollo data-freshness fields. Lets ARIES display "Data verified MMM YYYY"
-- and prefer current employment_history entries over stale top-level title.
ALTER TABLE "Candidate" ADD COLUMN "apolloUpdatedAt" TIMESTAMP(3);
ALTER TABLE "Candidate" ADD COLUMN "currentRoleSince" TIMESTAMP(3);
ALTER TABLE "Candidate" ADD COLUMN "isCurrentRole" BOOLEAN NOT NULL DEFAULT false;
