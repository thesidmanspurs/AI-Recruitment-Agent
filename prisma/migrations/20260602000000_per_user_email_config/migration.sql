-- Per-user outreach email configuration. Each recruiter sends from their own
-- mailbox (Gmail App Password or Resend). No shared mailbox. Credentials are
-- stored AES-256-GCM encrypted (the *_Enc columns).
CREATE TYPE "EmailProvider" AS ENUM ('GMAIL', 'RESEND');

ALTER TABLE "User" ADD COLUMN "emailProvider" "EmailProvider";
ALTER TABLE "User" ADD COLUMN "emailFromAddress" TEXT;
ALTER TABLE "User" ADD COLUMN "emailFromName" TEXT;
ALTER TABLE "User" ADD COLUMN "gmailAppPasswordEnc" TEXT;
ALTER TABLE "User" ADD COLUMN "resendApiKeyEnc" TEXT;
ALTER TABLE "User" ADD COLUMN "emailVerifiedAt" TIMESTAMP(3);
