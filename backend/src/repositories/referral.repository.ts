import { PrismaClient, Prisma } from '@prisma/client';

const prisma = new PrismaClient();

// ─── Referral Opportunities ─────────────────────────────────────────────────────

export async function createReferralOpportunity(data: Prisma.ReferralOpportunityUncheckedCreateInput) {
  return prisma.referralOpportunity.create({ data });
}

export async function findActiveOpportunities() {
  return prisma.referralOpportunity.findMany({
    where: { isActive: true, alumniProfile: { verification: { status: 'APPROVED' } } },
    include: {
      alumniProfile: {
        select: { id: true, fullName: true, currentCompany: true, currentRole: true }
      }
    },
    orderBy: { createdAt: 'desc' }
  });
}

export async function findOpportunitiesByAlumni(alumniProfileId: string) {
  return prisma.referralOpportunity.findMany({
    where: { alumniProfileId },
    orderBy: { createdAt: 'desc' }
  });
}

export async function findOpportunityById(id: string) {
  return prisma.referralOpportunity.findUnique({
    where: { id },
    include: { alumniProfile: true }
  });
}

// ─── Referral Requests ────────────────────────────────────────────────────────

export async function createReferralRequest(data: Prisma.ReferralRequestUncheckedCreateInput) {
  return prisma.referralRequest.create({ data });
}

export async function findStudentRequests(studentId: string) {
  return prisma.referralRequest.findMany({
    where: { studentId },
    include: {
      referralOpportunity: {
        select: { companyName: true, role: true, alumniProfile: { select: { fullName: true } } }
      },
      referral: true
    },
    orderBy: { createdAt: 'desc' }
  });
}

export async function findAlumniRequests(alumniProfileId: string) {
  return prisma.referralRequest.findMany({
    where: { referralOpportunity: { alumniProfileId } },
    include: {
      student: { select: { id: true, fullName: true, rollNumber: true } },
      referralOpportunity: { select: { companyName: true, role: true } },
      referral: true
    },
    orderBy: { createdAt: 'desc' }
  });
}

export async function findRequestById(id: string) {
  return prisma.referralRequest.findUnique({
    where: { id },
    include: { referralOpportunity: true, student: true }
  });
}

export async function updateRequestStatus(id: string, data: Prisma.ReferralRequestUpdateInput) {
  return prisma.referralRequest.update({
    where: { id },
    data
  });
}

export async function createReferralRecord(requestId: string, proofNote?: string) {
  return prisma.referral.create({
    data: {
      referralRequestId: requestId,
      proofNote
    }
  });
}
