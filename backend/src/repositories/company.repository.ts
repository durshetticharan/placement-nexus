import { PrismaClient, Prisma, CompanyStatus, VerificationStatus } from '@prisma/client';

const prisma = new PrismaClient();

export interface CompanyFilterOptions {
  status?: CompanyStatus;
  verificationStatus?: VerificationStatus;
  search?: string;
  industry?: string;
}

export async function createCompany(data: {
  name: string;
  legalName?: string | null;
  website?: string | null;
  industry?: string | null;
  companyType?: string | null;
  description?: string | null;
  headquarters?: string | null;
  country?: string | null;
  state?: string | null;
  city?: string | null;
  contactEmail?: string | null;
  contactPhone?: string | null;
  companySize?: string | null;
  foundedYear?: number | null;
  logoUrl?: string | null;
  status?: CompanyStatus;
  initialVerificationStatus?: VerificationStatus;
  verifiedById?: string | null;
}) {
  const { initialVerificationStatus, verifiedById, ...companyData } = data;
  return prisma.company.create({
    data: {
      ...companyData,
      verification: {
        create: {
          status: initialVerificationStatus || 'PENDING',
          verifiedById: verifiedById || null,
          verifiedAt: initialVerificationStatus === 'APPROVED' ? new Date() : null,
        },
      },
    },
    include: {
      verification: true,
      _count: { select: { recruiters: true, memberships: true, placementDrives: true } },
    },
  });
}

export async function findCompanyById(id: string) {
  return prisma.company.findUnique({
    where: { id },
    include: {
      verification: true,
      memberships: {
        include: {
          recruiter: {
            select: {
              id: true,
              fullName: true,
              designation: true,
              user: { select: { id: true, email: true } },
            },
          },
        },
      },
      _count: { select: { recruiters: true, memberships: true, placementDrives: true } },
    },
  });
}

export async function findCompanyByName(name: string) {
  return prisma.company.findFirst({
    where: {
      name: { equals: name, mode: 'insensitive' },
    },
    include: {
      verification: true,
    },
  });
}

export async function listCompanies(options: CompanyFilterOptions = {}) {
  const where: Prisma.CompanyWhereInput = {};

  if (options.status) {
    where.status = options.status;
  }

  if (options.industry) {
    where.industry = { equals: options.industry, mode: 'insensitive' };
  }

  if (options.verificationStatus) {
    where.verification = {
      status: options.verificationStatus,
    };
  }

  if (options.search) {
    where.OR = [
      { name: { contains: options.search, mode: 'insensitive' } },
      { legalName: { contains: options.search, mode: 'insensitive' } },
      { industry: { contains: options.search, mode: 'insensitive' } },
      { city: { contains: options.search, mode: 'insensitive' } },
    ];
  }

  return prisma.company.findMany({
    where,
    include: {
      verification: true,
      _count: { select: { recruiters: true, memberships: true, placementDrives: true } },
    },
    orderBy: { name: 'asc' },
  });
}

export async function updateCompany(id: string, data: Prisma.CompanyUpdateInput) {
  return prisma.company.update({
    where: { id },
    data,
    include: {
      verification: true,
      _count: { select: { recruiters: true, memberships: true, placementDrives: true } },
    },
  });
}

export async function updateCompanyVerification(
  companyId: string,
  data: {
    status: VerificationStatus;
    verifiedById: string;
    rejectionReason?: string | null;
  }
) {
  return prisma.companyVerification.upsert({
    where: { companyId },
    create: {
      companyId,
      status: data.status,
      verifiedById: data.verifiedById,
      verifiedAt: new Date(),
      rejectionReason: data.rejectionReason || null,
    },
    update: {
      status: data.status,
      verifiedById: data.verifiedById,
      verifiedAt: new Date(),
      rejectionReason: data.rejectionReason || null,
    },
  });
}
