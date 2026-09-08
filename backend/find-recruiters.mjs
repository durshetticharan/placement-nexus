import { PrismaClient } from '@prisma/client';
const p = new PrismaClient();

// Check p8 recruiter details
const p8 = await p.user.findFirst({
  where: { email: { contains: 'p8_recruiter' } },
  select: {
    id: true, email: true, status: true, emailVerified: true,
    recruiter: {
      select: {
        id: true, fullName: true, verificationStatus: true,
        placementDrives: {
          select: {
            id: true, title: true, status: true,
            _count: { select: { applications: true } }
          }
        }
      }
    }
  }
});
console.log('P8 Recruiter:', JSON.stringify(p8, null, 2));

// Also check phase10 recruiter
const p10 = await p.user.findFirst({
  where: { email: { contains: 'p10_rec1' } },
  select: {
    id: true, email: true, status: true, emailVerified: true,
    recruiter: {
      select: {
        id: true, fullName: true, verificationStatus: true,
        placementDrives: {
          select: {
            id: true, title: true, status: true,
            _count: { select: { applications: true } }
          }
        }
      }
    }
  }
});
console.log('P10 Recruiter:', JSON.stringify(p10, null, 2));

await p.$disconnect();
