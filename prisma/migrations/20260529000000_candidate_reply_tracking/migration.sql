-- Reply tracking — populated by the inbox poller when a candidate
-- responds to an outreach we sent.
ALTER TABLE "Candidate" ADD COLUMN "repliedAt" TIMESTAMP(3);
ALTER TABLE "Candidate" ADD COLUMN "replyPreview" TEXT;
