/**
 * Seed script — creates the initial Placement Officer account.
 * Run with: npm run seed  (uses tsx, which is already a dev dependency)
 *
 * This is a trusted, one-time operation — bypasses OTP flow intentionally.
 * Do NOT expose the seeded credentials in logs in production environments.
 */

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import * as dotenv from 'dotenv';

// Load .env so DATABASE_URL is available when running outside of tsx watch
dotenv.config();

const prisma = new PrismaClient();

const OFFICER_EMAIL = 'officer@placementnexus.dev';
const OFFICER_PASSWORD = 'Officer@2024';

async function main() {
  const existing = await prisma.user.findUnique({ where: { email: OFFICER_EMAIL } });

  if (existing) {
    console.log('\n⚠️  Placement Officer account already exists — skipping seed.');
    console.log(`   Email:    ${OFFICER_EMAIL}`);
    console.log(`   User ID:  ${existing.id}\n`);
    return;
  }

  const passwordHash = await bcrypt.hash(OFFICER_PASSWORD, 10);

  const user = await prisma.user.create({
    data: {
      email: OFFICER_EMAIL,
      passwordHash,
      role: 'PLACEMENT_OFFICER',
      status: 'ACTIVE',
      emailVerified: true,
      emailVerifiedAt: new Date(),
      placementOfficer: {
        create: {
          fullName: 'Placement Officer',
          designation: 'Placement Officer',
          department: 'Placement Cell',
        },
      },
    },
    select: { id: true, email: true, role: true, status: true },
  });

  console.log('\n✅  Placement Officer seeded successfully!');
  console.log('────────────────────────────────────────');
  console.log(`   Email:    ${user.email}`);
  console.log(`   Password: ${OFFICER_PASSWORD}`);
  console.log(`   Role:     ${user.role}`);
  console.log(`   Status:   ${user.status}`);
  console.log(`   User ID:  ${user.id}`);
  console.log('────────────────────────────────────────\n');
}

main()
  .catch((e) => {
    console.error('❌  Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
