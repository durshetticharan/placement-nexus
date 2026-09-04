import { Prisma } from '@prisma/client';
import * as companyRepo from '../repositories/company.repository';
import * as recruiterRepo from '../repositories/recruiter.repository';
import * as membershipRepo from '../repositories/membership.repository';

export class ServiceError extends Error {
  constructor(message: string, public code: string, public statusCode: number) {
    super(message);
    this.name = 'ServiceError';
  }
}

// ─── List Companies ──────────────────────────────────────────────────────────

export async function listCompanies(options: companyRepo.CompanyFilterOptions = {}) {
  return companyRepo.listCompanies(options);
}

// ─── Get Company ──────────────────────────────────────────────────────────────

export async function getCompany(id: string) {
  const company = await companyRepo.findCompanyById(id);
  if (!company) {
    throw new ServiceError('Company not found.', 'NOT_FOUND', 404);
  }
  return company;
}

// ─── Create Company ───────────────────────────────────────────────────────────

export async function createCompany(
  data: {
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
  },
  actorUserId: string,
  isOfficer: boolean = false
) {
  // Check for duplicate company name
  const existing = await companyRepo.findCompanyByName(data.name);
  if (existing) {
    throw new ServiceError(
      `A company with the name "${data.name}" already exists.`,
      'CONFLICT',
      409
    );
  }

  const company = await companyRepo.createCompany({
    ...data,
    initialVerificationStatus: isOfficer ? 'APPROVED' : 'PENDING',
    verifiedById: isOfficer ? actorUserId : null,
  });

  // Audit trail
  await recruiterRepo.createAuditLog({
    actorUserId,
    action: 'COMPANY_CREATED',
    entityType: 'Company',
    entityId: company.id,
    metadata: {
      companyName: company.name,
      verifiedDirectly: isOfficer,
    } as Prisma.InputJsonValue,
  });

  return company;
}

// ─── Update Company ───────────────────────────────────────────────────────────

export async function updateCompany(
  id: string,
  data: Prisma.CompanyUpdateInput,
  actorUserId: string,
  isOfficer: boolean = false
) {
  const company = await companyRepo.findCompanyById(id);
  if (!company) {
    throw new ServiceError('Company not found.', 'NOT_FOUND', 404);
  }

  // If name is changing, check uniqueness
  if (data.name && typeof data.name === 'string' && data.name.toLowerCase() !== company.name.toLowerCase()) {
    const existing = await companyRepo.findCompanyByName(data.name);
    if (existing && existing.id !== id) {
      throw new ServiceError(
        `A company with the name "${data.name}" already exists.`,
        'CONFLICT',
        409
      );
    }
  }

  const updated = await companyRepo.updateCompany(id, data);

  // Audit trail
  await recruiterRepo.createAuditLog({
    actorUserId,
    action: 'COMPANY_UPDATED',
    entityType: 'Company',
    entityId: id,
    metadata: { changes: Object.keys(data) } as Prisma.InputJsonValue,
  });

  return updated;
}

// ─── Officer: Approve Company ─────────────────────────────────────────────────

export async function approveCompany(companyId: string, officerUserId: string) {
  const company = await companyRepo.findCompanyById(companyId);
  if (!company) {
    throw new ServiceError('Company not found.', 'NOT_FOUND', 404);
  }

  if (company.verification?.status === 'APPROVED') {
    throw new ServiceError('Company is already approved.', 'CONFLICT', 409);
  }

  await companyRepo.updateCompanyVerification(companyId, {
    status: 'APPROVED',
    verifiedById: officerUserId,
  });

  await companyRepo.updateCompany(companyId, {
    status: 'ACTIVE',
  });

  // Audit trail
  await recruiterRepo.createAuditLog({
    actorUserId: officerUserId,
    action: 'COMPANY_APPROVED',
    entityType: 'Company',
    entityId: companyId,
    metadata: { companyName: company.name } as Prisma.InputJsonValue,
  });

  return { message: 'Company approved successfully.' };
}

// ─── Officer: Reject Company ──────────────────────────────────────────────────

export async function rejectCompany(
  companyId: string,
  officerUserId: string,
  reason?: string
) {
  const company = await companyRepo.findCompanyById(companyId);
  if (!company) {
    throw new ServiceError('Company not found.', 'NOT_FOUND', 404);
  }

  if (company.verification?.status === 'REJECTED') {
    throw new ServiceError('Company is already rejected.', 'CONFLICT', 409);
  }

  await companyRepo.updateCompanyVerification(companyId, {
    status: 'REJECTED',
    verifiedById: officerUserId,
    rejectionReason: reason || null,
  });

  await companyRepo.updateCompany(companyId, {
    status: 'INACTIVE',
  });

  // Audit trail
  await recruiterRepo.createAuditLog({
    actorUserId: officerUserId,
    action: 'COMPANY_REJECTED',
    entityType: 'Company',
    entityId: companyId,
    metadata: { companyName: company.name, reason } as Prisma.InputJsonValue,
  });

  return { message: 'Company rejected.' };
}

// ─── Officer: Suspend Company ─────────────────────────────────────────────────

export async function suspendCompany(
  companyId: string,
  officerUserId: string,
  reason?: string
) {
  const company = await companyRepo.findCompanyById(companyId);
  if (!company) {
    throw new ServiceError('Company not found.', 'NOT_FOUND', 404);
  }

  await companyRepo.updateCompanyVerification(companyId, {
    status: 'SUSPENDED',
    verifiedById: officerUserId,
    rejectionReason: reason || null,
  });

  await companyRepo.updateCompany(companyId, {
    status: 'SUSPENDED',
  });

  // Audit trail
  await recruiterRepo.createAuditLog({
    actorUserId: officerUserId,
    action: 'COMPANY_SUSPENDED',
    entityType: 'Company',
    entityId: companyId,
    metadata: { companyName: company.name, reason } as Prisma.InputJsonValue,
  });

  return { message: 'Company suspended.' };
}
