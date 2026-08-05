import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const hash = await bcrypt.hash('Password123!', 12);

  // Account 1: PRO Plan (Supports both Sourcing & Ranking modes)
  const proUser = await prisma.user.upsert({
    where: { email: 'pro.user@talentscanr.com' },
    update: {
      name: 'Pro Tester (Both Modes)',
      passwordHash: hash,
      role: 'USER',
      planType: 'PRO',
      subscriptionStatus: 'active',
      subscriptionPlan: 'pro-plan',
      creditBalance: 5000,
      sourcingAddonActive: false,
      rankingAddonActive: false,
    },
    create: {
      email: 'pro.user@talentscanr.com',
      name: 'Pro Tester (Both Modes)',
      passwordHash: hash,
      role: 'USER',
      planType: 'PRO',
      subscriptionStatus: 'active',
      subscriptionPlan: 'pro-plan',
      creditBalance: 5000,
    },
  });

  // Account 2: RANKING Plan (Ranking mode only)
  const rankingUser = await prisma.user.upsert({
    where: { email: 'ranking.user@talentscanr.com' },
    update: {
      name: 'Ranking Tester (Ranking Only)',
      passwordHash: hash,
      role: 'USER',
      planType: 'RANKING',
      subscriptionStatus: 'active',
      subscriptionPlan: 'ranking-plan',
      creditBalance: 0,
      sourcingAddonActive: false,
      rankingAddonActive: false,
    },
    create: {
      email: 'ranking.user@talentscanr.com',
      name: 'Ranking Tester (Ranking Only)',
      passwordHash: hash,
      role: 'USER',
      planType: 'RANKING',
      subscriptionStatus: 'active',
      subscriptionPlan: 'ranking-plan',
      creditBalance: 0,
    },
  });

  console.log('✅ SEEDED TEST ACCOUNTS:');
  console.log('1. PRO User (Both Modes):', proUser.email);
  console.log('2. RANKING User (Ranking Only):', rankingUser.email);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
