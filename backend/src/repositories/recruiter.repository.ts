import { PrismaClient, Prisma } from '@prisma/client';

const prisma = new PrismaClient();

// ─── Company ──────────────────────────────────────────────────────────────────

/** Finds an existing company by exact name or creates one if it doesn't exist. */
export async function findOrCreateCompany(name: string) {
  const existing = await prisma.company.findFirst({ where: { name } });
  if (existing) return existing;
  return prisma.company.create({ data: { name } });
}

// ─── Recruiter ────────────────────────────────────────────────────────────────

export async function createRecruiter(data: {
  userId: string;
  companyId: string;
  fullName: string;
  designation?: string;
}) {
  return prisma.recruiter.create({ data });
}

export async function findPendingRecruiters() {
  return prisma.recruiter.findMany({
    where: { verificationStatus: 'PENDING' },
    include: {
      user: { select: { id: true, email: true, status: true, createdAt: true } },
      company: { select: { id: true, name: true } },
    },
    orderBy: { createdAt: 'asc' },
  });
}

export async function findRecruiterById(id: string) {
  return prisma.recruiter.findUnique({
    where: { id },
    include: {
      user: { select: { id: true, email: true, status: true } },
      company: { select: { id: true, name: true } },
    },
  });
}

export async function updateRecruiter(id: string, data: Prisma.RecruiterUpdateInput) {
  return prisma.recruiter.update({ where: { id }, data });
}

// ─── Shared: set a User's status to ACTIVE ────────────────────────────────────

export async function setUserActive(userId: string) {
  return prisma.user.update({ where: { id: userId }, data: { status: 'ACTIVE' } });
}

// ─── Shared: Audit Log ────────────────────────────────────────────────────────

/** Creates an AuditLog row. Shared between recruiter and alumni services. */
export async function createAuditLog(data: {
  actorUserId: string;
  action: string;
  entityType: string;
  entityId: string;
  metadata?: Prisma.InputJsonValue;
}) {
  return prisma.auditLog.create({ data });
}
