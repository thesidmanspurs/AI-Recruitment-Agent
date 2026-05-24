-- Apollo phone reveal is async: Apollo POSTs the revealed phone to our webhook
-- minutes/hours after the enrichment call. To correlate the webhook payload
-- (which carries Apollo's person id) back to our Candidate row, we persist the
-- id at enrichment time.
ALTER TABLE "Candidate" ADD COLUMN "apolloId" TEXT;
CREATE UNIQUE INDEX "Candidate_apolloId_key" ON "Candidate"("apolloId");
