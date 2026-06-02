-- Resend setup requests. Users submit a form (name, whatsapp, email, domain)
-- and an admin configures their Resend sending from the admin console.
CREATE TYPE "EmailRequestStatus" AS ENUM ('PENDING', 'CONFIGURED', 'REJECTED');

CREATE TABLE "EmailRequest" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "contactName" TEXT NOT NULL,
  "whatsapp" TEXT NOT NULL,
  "emailAccount" TEXT NOT NULL,
  "domain" TEXT NOT NULL,
  "status" "EmailRequestStatus" NOT NULL DEFAULT 'PENDING',
  "adminNote" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "handledAt" TIMESTAMP(3),
  CONSTRAINT "EmailRequest_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "EmailRequest_status_idx" ON "EmailRequest"("status");
CREATE INDEX "EmailRequest_userId_idx" ON "EmailRequest"("userId");

ALTER TABLE "EmailRequest" ADD CONSTRAINT "EmailRequest_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
