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
  department?: string;
  phone?: string;
  alternateEmail?: string;
}) {
  const recruiter = await prisma.recruiter.create({ data });
  // Also create initial membership for their primary company
  await prisma.recruiterCompanyMembership.create({
    data: {
      recruiterId: recruiter.id,
      companyId: data.companyId,
      role: 'COMPANY_ADMIN',
      status: 'PENDING',
    },
  });
  return recruiter;
}

export async function findRecruiterByUserId(userId: string) {
  return prisma.recruiter.findUnique({
    where: { userId },
    include: {
      user: { select: { id: true, email: true, status: true, emailVerified: true, lastLoginAt: true } },
      company: {
        include: { verification: true },
      },
      memberships: {
        include: {
          company: {
            include: { verification: true },
          },
        },
        orderBy: { createdAt: 'desc' },
      },
    },
  });
}

export async function findPendingRecruiters() {
  return prisma.recruiter.findMany({
    where: { verificationStatus: 'PENDING' },
    include: {
      user: { select: { id: true, email: true, status: true, createdAt: true } },
      company: { select: { id: true, name: true, verification: true } },
      memberships: {
        include: { company: true },
      },
    },
    orderBy: { createdAt: 'asc' },
  });
}

export async function listAllRecruiters(options: {
  verificationStatus?: any;
  search?: string;
} = {}) {
  const where: Prisma.RecruiterWhereInput = {};

  if (options.verificationStatus) {
    where.verificationStatus = options.verificationStatus;
  }

  if (options.search) {
    where.OR = [
      { fullName: { contains: options.search, mode: 'insensitive' } },
      { user: { email: { contains: options.search, mode: 'insensitive' } } },
      { company: { name: { contains: options.search, mode: 'insensitive' } } },
      { designation: { contains: options.search, mode: 'insensitive' } },
    ];
  }

  return prisma.recruiter.findMany({
    where,
    include: {
      user: { select: { id: true, email: true, status: true, createdAt: true, lastLoginAt: true } },
      company: { select: { id: true, name: true, website: true, status: true, verification: true } },
      memberships: {
        include: {
          company: { select: { id: true, name: true, status: true, verification: true } },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });
}

export async function findRecruiterById(id: string) {
  return prisma.recruiter.findUnique({
    where: { id },
    include: {
      user: { select: { id: true, email: true, status: true } },
      company: { select: { id: true, name: true, verification: true } },
      memberships: {
        include: {
          company: {
            include: { verification: true },
          },
        },
      },
    },
  });
}

export async function findRecruiterWithDetails(id: string) {
  return prisma.recruiter.findUnique({
    where: { id },
    include: {
      user: { select: { id: true, email: true, status: true, createdAt: true, lastLoginAt: true } },
      company: {
        include: { verification: true },
      },
      memberships: {
        include: {
          company: {
            include: { verification: true },
          },
        },
      },
    },
  });
}

export async function updateRecruiter(id: string, data: Prisma.RecruiterUpdateInput) {
  return prisma.recruiter.update({
    where: { id },
    data,
    include: {
      user: { select: { id: true, email: true, status: true } },
      company: { select: { id: true, name: true, verification: true } },
      memberships: {
        include: { company: true },
      },
    },
  });
}

// ─── Shared: set a User's status ──────────────────────────────────────────────

export async function setUserActive(userId: string) {
  return prisma.user.update({ where: { id: userId }, data: { status: 'ACTIVE' } });
}

export async function setUserStatus(userId: string, status: any) {
  return prisma.user.update({ where: { id: userId }, data: { status } });
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
