import type { Prisma, CreditTransactionType } from '@prisma/client';
import { prisma } from '../../config/database.js';
import { createError } from '../../middleware/errorHandler.js';

/**
 * Credit balance management.
 *
 * Credits are spent ONLY on Apollo contact reveals (1 per email/phone unlock).
 * They're granted by Stripe purchases (Top-Up Pack) and subscription invoices
 * (Start Tier), or manually by an admin.
 *
 * Every movement is recorded as a CreditTransaction row (the unified ledger),
 * so the balance is always reconstructable and the user gets a full history.
 *
 * Concurrency: spend uses a conditional updateMany (decrement only if balance
 * is sufficient) so two parallel reveals can never drive the balance negative.
 */

interface GrantInput {
  userId: string;
  credits: number; // positive
  type: Extract<CreditTransactionType, 'SUBSCRIPTION_GRANT' | 'TOPUP_PURCHASE' | 'ADMIN_GRANT' | 'REFUND'>;
  amountCents?: number;
  currency?: string;
  reason?: string;
  packageId?: string;
  stripeSessionId?: string;
  stripePaymentIntentId?: string;
  stripeInvoiceId?: string;
}

export const creditService = {
  async getBalance(userId: string): Promise<number> {
    const u = await prisma.user.findUnique({
      where: { id: userId },
      select: { creditBalance: true },
    });
    return u?.creditBalance ?? 0;
  },

  /**
   * Add credits and record the grant. Idempotent when a Stripe id is provided:
   * the unique constraint on stripeSessionId / stripeInvoiceId makes a replayed
   * webhook throw P2002, which we treat as "already granted" and swallow.
   *
   * Pass an existing transaction client (`tx`) to compose with other writes.
   * Returns the new balance, or null if the grant was a duplicate (no-op).
   */
  async addCredits(input: GrantInput, tx?: Prisma.TransactionClient): Promise<number | null> {
    if (input.credits <= 0) throw new Error('addCredits requires a positive amount.');
    const run = async (db: Prisma.TransactionClient): Promise<number | null> => {
      const user = await db.user.update({
        where: { id: input.userId },
        data: { creditBalance: { increment: input.credits } },
        select: { creditBalance: true },
      });
      try {
        await db.creditTransaction.create({
          data: {
            userId: input.userId,
            type: input.type,
            status: 'COMPLETED',
            credits: input.credits,
            amountCents: input.amountCents ?? 0,
            currency: input.currency ?? 'usd',
            reason: input.reason,
            balanceAfter: user.creditBalance,
            packageId: input.packageId,
            stripeSessionId: input.stripeSessionId,
            stripePaymentIntentId: input.stripePaymentIntentId,
            stripeInvoiceId: input.stripeInvoiceId,
          },
        });
      } catch (err) {
        // Unique violation on a Stripe id = this payment was already credited.
        // Re-throw so the surrounding transaction rolls back the increment too,
        // leaving the balance untouched. Caller treats this as idempotent skip.
        if (isUniqueViolation(err)) {
          throw new DuplicateGrantError();
        }
        throw err;
      }
      return user.creditBalance;
    };

    try {
      if (tx) return await run(tx);
      return await prisma.$transaction(run);
    } catch (err) {
      if (err instanceof DuplicateGrantError) return null;
      throw err;
    }
  },

  /**
   * Spend credits atomically. Returns the new balance. Throws 402 if the user
   * doesn't have enough. The conditional updateMany guards against races and
   * negative balances.
   */
  async spend(userId: string, amount: number, reason: string): Promise<number> {
    if (amount <= 0) throw new Error('spend requires a positive amount.');
    return prisma.$transaction(async db => {
      const res = await db.user.updateMany({
        where: { id: userId, creditBalance: { gte: amount } },
        data: { creditBalance: { decrement: amount } },
      });
      if (res.count === 0) {
        const balance = await this.getBalance(userId);
        throw createError(
          `Not enough credits — this needs ${amount}, you have ${balance}. Buy more from the Credits tab.`,
          402
        );
      }
      const user = await db.user.findUniqueOrThrow({
        where: { id: userId },
        select: { creditBalance: true },
      });
      await db.creditTransaction.create({
        data: {
          userId,
          type: 'SPEND',
          status: 'COMPLETED',
          credits: -amount,
          reason,
          balanceAfter: user.creditBalance,
        },
      });
      return user.creditBalance;
    });
  },

  /**
   * Try to spend a single credit; returns true if it succeeded, false if the
   * user is out of credits. Never throws on insufficient balance — used inside
   * reveal loops to charge per-success and stop cleanly when the balance hits 0.
   */
  async trySpendOne(userId: string, reason: string): Promise<boolean> {
    const res = await prisma.$transaction(async db => {
      const upd = await db.user.updateMany({
        where: { id: userId, creditBalance: { gte: 1 } },
        data: { creditBalance: { decrement: 1 } },
      });
      if (upd.count === 0) return false;
      const user = await db.user.findUniqueOrThrow({
        where: { id: userId },
        select: { creditBalance: true },
      });
      await db.creditTransaction.create({
        data: { userId, type: 'SPEND', status: 'COMPLETED', credits: -1, reason, balanceAfter: user.creditBalance },
      });
      return true;
    });
    return res;
  },

  async assertHasCredits(userId: string, amount = 1): Promise<void> {
    const balance = await this.getBalance(userId);
    if (balance < amount) {
      throw createError(
        `Out of credits — revealing contacts costs ${amount} credit(s) and you have ${balance}. Buy credits from the Credits tab.`,
        402
      );
    }
  },

  async history(userId: string, limit = 50) {
    return prisma.creditTransaction.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: Math.min(100, Math.max(1, limit)),
    });
  },
};

class DuplicateGrantError extends Error {}

function isUniqueViolation(err: unknown): boolean {
  return (
    typeof err === 'object' &&
    err !== null &&
    'code' in err &&
    (err as { code?: string }).code === 'P2002'
  );
}
