-- CreateEnum
CREATE TYPE "CreditTransactionType" AS ENUM ('SUBSCRIPTION_GRANT', 'TOPUP_PURCHASE', 'SPEND', 'ADMIN_GRANT', 'REFUND');

-- CreateEnum
CREATE TYPE "CreditTransactionStatus" AS ENUM ('PENDING', 'COMPLETED', 'FAILED');

-- AlterTable
ALTER TABLE "User"
  ADD COLUMN "creditBalance" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "stripeCustomerId" TEXT,
  ADD COLUMN "stripeSubscriptionId" TEXT,
  ADD COLUMN "subscriptionStatus" TEXT,
  ADD COLUMN "subscriptionPlan" TEXT,
  ADD COLUMN "subscriptionCurrentPeriodEnd" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "CreditTransaction" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "CreditTransactionType" NOT NULL,
    "status" "CreditTransactionStatus" NOT NULL DEFAULT 'COMPLETED',
    "credits" INTEGER NOT NULL,
    "amountCents" INTEGER NOT NULL DEFAULT 0,
    "currency" TEXT NOT NULL DEFAULT 'usd',
    "reason" TEXT,
    "balanceAfter" INTEGER,
    "packageId" TEXT,
    "stripeSessionId" TEXT,
    "stripePaymentIntentId" TEXT,
    "stripeInvoiceId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CreditTransaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StripeWebhookEvent" (
    "eventId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StripeWebhookEvent_pkey" PRIMARY KEY ("eventId")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_stripeCustomerId_key" ON "User"("stripeCustomerId");

-- CreateIndex
CREATE UNIQUE INDEX "CreditTransaction_stripeSessionId_key" ON "CreditTransaction"("stripeSessionId");

-- CreateIndex
CREATE UNIQUE INDEX "CreditTransaction_stripeInvoiceId_key" ON "CreditTransaction"("stripeInvoiceId");

-- CreateIndex
CREATE INDEX "CreditTransaction_userId_idx" ON "CreditTransaction"("userId");

-- CreateIndex
CREATE INDEX "CreditTransaction_userId_createdAt_idx" ON "CreditTransaction"("userId", "createdAt");

-- AddForeignKey
ALTER TABLE "CreditTransaction" ADD CONSTRAINT "CreditTransaction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
