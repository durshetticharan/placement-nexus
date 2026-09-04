import { PrismaClient, Prisma, MembershipStatus, CompanyRole } from '@prisma/client';

const prisma = new PrismaClient();

export async function createMembership(data: {
  recruiterId: string;
  companyId: string;
  role?: CompanyRole;
  status?: MembershipStatus;
  approvedById?: string | null;
  approvedAt?: Date | null;
}) {
  return prisma.recruiterCompanyMembership.create({
    data: {
      recruiterId: data.recruiterId,
      companyId: data.companyId,
      role: data.role || 'RECRUITER',
      status: data.status || 'PENDING',
      approvedById: data.approvedById || null,
      approvedAt: data.approvedAt || null,
    },
    include: {
      company: {
        include: { verification: true },
      },
      recruiter: {
        include: {
          user: { select: { id: true, email: true, status: true } },
        },
      },
    },
  });
}

export async function findMembershipById(id: string) {
  return prisma.recruiterCompanyMembership.findUnique({
    where: { id },
    include: {
      company: {
        include: { verification: true },
      },
      recruiter: {
        include: {
          user: { select: { id: true, email: true, status: true } },
        },
      },
    },
  });
}

export async function findMembership(recruiterId: string, companyId: string) {
  return prisma.recruiterCompanyMembership.findUnique({
    where: {
      recruiterId_companyId: {
        recruiterId,
        companyId,
      },
    },
    include: {
      company: {
        include: { verification: true },
      },
      recruiter: {
        include: {
          user: { select: { id: true, email: true, status: true } },
        },
      },
    },
  });
}

export async function listMembershipsByRecruiter(recruiterId: string) {
  return prisma.recruiterCompanyMembership.findMany({
    where: { recruiterId },
    include: {
      company: {
        include: { verification: true },
      },
    },
    orderBy: { createdAt: 'desc' },
  });
}

export async function listMembershipsByCompany(companyId: string) {
  return prisma.recruiterCompanyMembership.findMany({
    where: { companyId },
    include: {
      recruiter: {
        include: {
          user: { select: { id: true, email: true, status: true } },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });
}

export async function listPendingMemberships() {
  return prisma.recruiterCompanyMembership.findMany({
    where: { status: 'PENDING' },
    include: {
      company: {
        include: { verification: true },
      },
      recruiter: {
        include: {
          user: { select: { id: true, email: true, status: true } },
        },
      },
    },
    orderBy: { createdAt: 'asc' },
  });
}

export async function listAllMemberships(options: { status?: MembershipStatus; companyId?: string; recruiterId?: string } = {}) {
  const where: Prisma.RecruiterCompanyMembershipWhereInput = {};
  if (options.status) where.status = options.status;
  if (options.companyId) where.companyId = options.companyId;
  if (options.recruiterId) where.recruiterId = options.recruiterId;

  return prisma.recruiterCompanyMembership.findMany({
    where,
    include: {
      company: {
        include: { verification: true },
      },
      recruiter: {
        include: {
          user: { select: { id: true, email: true, status: true } },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });
}

export async function updateMembershipStatus(
  id: string,
  data: {
    status: MembershipStatus;
    approvedById: string;
    rejectionReason?: string | null;
  }
) {
  return prisma.recruiterCompanyMembership.update({
    where: { id },
    data: {
      status: data.status,
      approvedById: data.approvedById,
      approvedAt: data.status === 'APPROVED' ? new Date() : null,
      rejectionReason: data.rejectionReason || null,
    },
    include: {
      company: true,
      recruiter: {
        include: { user: { select: { id: true, email: true } } },
      },
    },
  });
}

export async function updateMembershipRole(id: string, role: CompanyRole) {
  return prisma.recruiterCompanyMembership.update({
    where: { id },
    data: { role },
    include: {
      company: true,
      recruiter: {
        include: { user: { select: { id: true, email: true } } },
      },
    },
  });
}
