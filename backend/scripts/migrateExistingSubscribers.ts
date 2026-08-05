/**
 * One-time migration script: upgrade existing `start-tier` subscribers to
 * the new planType system.
 *
 * What it does:
 *   For every User that has:
 *     - stripeSubscriptionId IS NOT NULL (has an active Stripe subscription)
 *     - subscriptionStatus IN ('active', 'trialing')
 *     - planType = 'NONE' (not yet migrated)
 *
 *   → Set planType = 'SOURCING'
 *     → Also update subscriptionPlan to 'sourcing-plan' if currently 'start-tier'
 *
 * Safe to run multiple times (idempotent — WHERE planType = 'NONE' guard).
 *
 * Usage:
 *   npx tsx backend/scripts/migrateExistingSubscribers.ts
 *   or
 *   node --loader ts-node/esm backend/scripts/migrateExistingSubscribers.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('[Migration] Starting: migrate start-tier users to planType=SOURCING');

  // Find all users with active subscriptions not yet migrated
  const users = await prisma.user.findMany({
    where: {
      planType: 'NONE',
      subscriptionStatus: { in: ['active', 'trialing'] },
      stripeSubscriptionId: { not: null },
    },
    select: {
      id: true,
      email: true,
      subscriptionPlan: true,
      subscriptionStatus: true,
    },
  });

  console.log(`[Migration] Found ${users.length} user(s) to migrate.`);

  if (users.length === 0) {
    console.log('[Migration] Nothing to do. Exiting.');
    return;
  }

  let migrated = 0;
  for (const user of users) {
    const updateData: Record<string, unknown> = { planType: 'SOURCING' };

    // Rename 'start-tier' plan id to 'sourcing-plan' for consistency
    if (user.subscriptionPlan === 'start-tier') {
      updateData.subscriptionPlan = 'sourcing-plan';
    }

    await prisma.user.update({
      where: { id: user.id },
      data: updateData,
    });

    console.log(
      `[Migration] ✅ ${user.email} → planType=SOURCING` +
      (user.subscriptionPlan === 'start-tier' ? ', subscriptionPlan=sourcing-plan' : ''),
    );
    migrated++;
  }

  console.log(`[Migration] Done. Migrated ${migrated}/${users.length} users.`);
}

main()
  .catch(err => {
    console.error('[Migration] Fatal error:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
