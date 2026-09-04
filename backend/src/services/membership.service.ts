import { CompanyRole, Prisma } from '@prisma/client';
import * as membershipRepo from '../repositories/membership.repository';
import * as recruiterRepo from '../repositories/recruiter.repository';
import * as companyRepo from '../repositories/company.repository';
import { ServiceError } from './company.service';

// ─── Recruiter: Request Company Association ───────────────────────────────────

export async function requestAssociation(
  userId: string,
  data: {
    companyId?: string;
    companyName?: string;
    designation?: string;
    department?: string;
    role?: CompanyRole;
  }
) {
  const recruiter = await recruiterRepo.findRecruiterByUserId(userId);
  if (!recruiter) {
    throw new ServiceError('Recruiter profile not found.', 'NOT_FOUND', 404);
  }

  let targetCompanyId = data.companyId;

  // If companyName was provided instead of companyId, find or create the company
  if (!targetCompanyId && data.companyName) {
    let existing = await companyRepo.findCompanyByName(data.companyName);
    if (!existing) {
      existing = await companyRepo.createCompany({
        name: data.companyName,
        initialVerificationStatus: 'PENDING',
      });
    }
    targetCompanyId = existing.id;
  }

  if (!targetCompanyId) {
    throw new ServiceError('Target company could not be resolved.', 'BAD_REQUEST', 400);
  }

  // Check if membership already exists
  const existingMembership = await membershipRepo.findMembership(recruiter.id, targetCompanyId);
  if (existingMembership) {
    throw new ServiceError(
      `An association request with this company already exists (Status: ${existingMembership.status}).`,
      'CONFLICT',
      409
    );
  }

  // Update recruiter designation/department if provided
  if (data.designation || data.department) {
    await recruiterRepo.updateRecruiter(recruiter.id, {
      designation: data.designation || recruiter.designation,
      department: data.department || recruiter.department,
    });
  }

  const membership = await membershipRepo.createMembership({
    recruiterId: recruiter.id,
    companyId: targetCompanyId,
    role: data.role || 'RECRUITER',
    status: 'PENDING',
  });

  // Audit trail
  await recruiterRepo.createAuditLog({
    actorUserId: userId,
    action: 'COMPANY_MEMBERSHIP_REQUESTED',
    entityType: 'RecruiterCompanyMembership',
    entityId: membership.id,
    metadata: {
      companyId: targetCompanyId,
      role: membership.role,
    } as Prisma.InputJsonValue,
  });

  return membership;
}

// ─── List Memberships for Recruiter ──────────────────────────────────────────

export async function listRecruiterMemberships(userId: string) {
  const recruiter = await recruiterRepo.findRecruiterByUserId(userId);
  if (!recruiter) {
    throw new ServiceError('Recruiter profile not found.', 'NOT_FOUND', 404);
  }
  return membershipRepo.listMembershipsByRecruiter(recruiter.id);
}

// ─── Officer: List Pending Memberships ────────────────────────────────────────

export async function listPendingMemberships() {
  return membershipRepo.listPendingMemberships();
}

export async function listAllMemberships(options: { status?: any; companyId?: string; recruiterId?: string } = {}) {
  return membershipRepo.listAllMemberships(options);
}

// ─── Officer: Approve Membership ──────────────────────────────────────────────

export async function approveMembership(membershipId: string, officerUserId: string) {
  const membership = await membershipRepo.findMembershipById(membershipId);
  if (!membership) {
    throw new ServiceError('Membership record not found.', 'NOT_FOUND', 404);
  }

  if (membership.status === 'APPROVED') {
    throw new ServiceError('Membership is already approved.', 'CONFLICT', 409);
  }

  const updated = await membershipRepo.updateMembershipStatus(membershipId, {
    status: 'APPROVED',
    approvedById: officerUserId,
  });

  // Audit trail
  await recruiterRepo.createAuditLog({
    actorUserId: officerUserId,
    action: 'COMPANY_MEMBERSHIP_APPROVED',
    entityType: 'RecruiterCompanyMembership',
    entityId: membershipId,
    metadata: {
      recruiterId: membership.recruiterId,
      companyId: membership.companyId,
      role: membership.role,
    } as Prisma.InputJsonValue,
  });

  return { message: 'Membership approved successfully.' };
}

// ─── Officer: Reject Membership ───────────────────────────────────────────────

export async function rejectMembership(
  membershipId: string,
  officerUserId: string,
  reason?: string
) {
  const membership = await membershipRepo.findMembershipById(membershipId);
  if (!membership) {
    throw new ServiceError('Membership record not found.', 'NOT_FOUND', 404);
  }

  if (membership.status === 'REJECTED') {
    throw new ServiceError('Membership is already rejected.', 'CONFLICT', 409);
  }

  await membershipRepo.updateMembershipStatus(membershipId, {
    status: 'REJECTED',
    approvedById: officerUserId,
    rejectionReason: reason || null,
  });

  // Audit trail
  await recruiterRepo.createAuditLog({
    actorUserId: officerUserId,
    action: 'COMPANY_MEMBERSHIP_REJECTED',
    entityType: 'RecruiterCompanyMembership',
    entityId: membershipId,
    metadata: {
      recruiterId: membership.recruiterId,
      companyId: membership.companyId,
      reason,
    } as Prisma.InputJsonValue,
  });

  return { message: 'Membership rejected.' };
}

// ─── Officer: Update Membership Role ──────────────────────────────────────────

export async function updateMembershipRole(
  membershipId: string,
  role: CompanyRole,
  officerUserId: string
) {
  const membership = await membershipRepo.findMembershipById(membershipId);
  if (!membership) {
    throw new ServiceError('Membership record not found.', 'NOT_FOUND', 404);
  }

  const updated = await membershipRepo.updateMembershipRole(membershipId, role);

  // Audit trail
  await recruiterRepo.createAuditLog({
    actorUserId: officerUserId,
    action: 'COMPANY_MEMBERSHIP_ROLE_UPDATED',
    entityType: 'RecruiterCompanyMembership',
    entityId: membershipId,
    metadata: {
      recruiterId: membership.recruiterId,
      companyId: membership.companyId,
      newRole: role,
    } as Prisma.InputJsonValue,
  });

  return updated;
}

// ─── Access Authorization Check ───────────────────────────────────────────────

export async function checkRecruiterCompanyAccess(
  userId: string,
  companyId: string,
  requiredRole?: CompanyRole
): Promise<boolean> {
  const recruiter = await recruiterRepo.findRecruiterByUserId(userId);
  if (!recruiter || recruiter.verificationStatus !== 'APPROVED') {
    return false;
  }

  const membership = await membershipRepo.findMembership(recruiter.id, companyId);
  if (!membership || membership.status !== 'APPROVED') {
    return false;
  }

  if (requiredRole === 'COMPANY_ADMIN' && membership.role !== 'COMPANY_ADMIN') {
    return false;
  }

  return true;
}
