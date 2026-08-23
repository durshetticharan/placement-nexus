import { PrismaClient, Prisma } from '@prisma/client';

const prisma = new PrismaClient();

// ─── Alumni Profile ───────────────────────────────────────────────────────────

/**
 * Creates an AlumniProfile and its linked AlumniVerification (status=PENDING)
 * in a single transaction.
 */
export async function createAlumniProfileWithVerification(data: {
  userId: string;
  fullName: string;
  degree: string;
  branch: string;
  graduationYear: number;
  collegeName: string;
}) {
  return prisma.alumniProfile.create({
    data: {
      ...data,
      verification: {
        create: { status: 'PENDING' },
      },
    },
    include: { verification: true },
  });
}

export async function findPendingAlumni() {
  return prisma.alumniProfile.findMany({
    where: { verification: { status: 'PENDING' } },
    include: {
      user: { select: { id: true, email: true, status: true, createdAt: true } },
      verification: true,
    },
    orderBy: { createdAt: 'asc' },
  });
}

export async function findAlumniProfileById(id: string) {
  return prisma.alumniProfile.findUnique({
    where: { id },
    include: {
      user: { select: { id: true, email: true, status: true } },
      verification: true,
    },
  });
}

export async function updateAlumniVerification(
  alumniProfileId: string,
  data: Prisma.AlumniVerificationUpdateInput,
) {
  return prisma.alumniVerification.update({
    where: { alumniProfileId },
    data,
  });
}

// ─── Shared: set a User's status to ACTIVE ────────────────────────────────────

export async function setUserActive(userId: string) {
  return prisma.user.update({ where: { id: userId }, data: { status: 'ACTIVE' } });
}
