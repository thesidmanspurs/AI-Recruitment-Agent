/**
 * Promote (or demote) a user by email.
 * Usage: npx tsx backend/scripts/setAdmin.ts <email> [USER|ADMIN]
 */
import { prisma } from '../config/database.js';

async function main() {
  const email = process.argv[2];
  const role = (process.argv[3] ?? 'ADMIN') as 'USER' | 'ADMIN';
  if (!email) {
    console.error('Usage: tsx backend/scripts/setAdmin.ts <email> [USER|ADMIN]');
    process.exit(1);
  }
  if (role !== 'USER' && role !== 'ADMIN') {
    console.error('Role must be USER or ADMIN');
    process.exit(1);
  }
  const user = await prisma.user.update({
    where: { email },
    data: { role },
    select: { id: true, email: true, name: true, role: true },
  });
  console.log(`Updated ${user.email} → ${user.role}`);
}

main()
  .catch(err => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
