import { Prisma } from '@prisma/client';
import * as recruiterRepo from '../repositories/recruiter.repository';
import { ServiceError } from './company.service';

// ─── Recruiter Self-Service ───────────────────────────────────────────────────

export async function getMyProfile(userId: string) {
  const recruiter = await recruiterRepo.findRecruiterByUserId(userId);
  if (!recruiter) {
    throw new ServiceError('Recruiter profile not found.', 'NOT_FOUND', 404);
  }
  return recruiter;
}

export async function updateMyProfile(
  userId: string,
  data: {
    fullName?: string;
    designation?: string | null;
    department?: string | null;
    phone?: string | null;
    alternateEmail?: string | null;
  }
) {
  const recruiter = await recruiterRepo.findRecruiterByUserId(userId);
  if (!recruiter) {
    throw new ServiceError('Recruiter profile not found.', 'NOT_FOUND', 404);
  }

  const updated = await recruiterRepo.updateRecruiter(recruiter.id, data);

  // Audit log for profile update
  await recruiterRepo.createAuditLog({
    actorUserId: userId,
    action: 'RECRUITER_PROFILE_UPDATED',
    entityType: 'Recruiter',
    entityId: recruiter.id,
    metadata: { updatedFields: Object.keys(data) } as Prisma.InputJsonValue,
  });

  return updated;
}

// ─── Officer: List All Recruiters ─────────────────────────────────────────────

export async function listAllRecruiters(options: {
  verificationStatus?: any;
  search?: string;
} = {}) {
  return recruiterRepo.listAllRecruiters(options);
}

// ─── Officer: List Pending Recruiters ─────────────────────────────────────────

export async function listPendingRecruiters() {
  return recruiterRepo.findPendingRecruiters();
}

// ─── Officer: Get Recruiter Details ───────────────────────────────────────────

export async function getRecruiterDetails(id: string) {
  const recruiter = await recruiterRepo.findRecruiterWithDetails(id);
  if (!recruiter) {
    throw new ServiceError('Recruiter not found.', 'NOT_FOUND', 404);
  }
  return recruiter;
}

// ─── Officer: Approve ─────────────────────────────────────────────────────────

export async function approveRecruiter(recruiterId: string, officerUserId: string) {
  const recruiter = await recruiterRepo.findRecruiterById(recruiterId);

  if (!recruiter) {
    throw new ServiceError('Recruiter not found.', 'NOT_FOUND', 404);
  }

  // Idempotency guard — only PENDING records may be actioned
  if (recruiter.verificationStatus !== 'PENDING') {
    throw new ServiceError(
      `Cannot approve: recruiter is already ${recruiter.verificationStatus}. No further action taken.`,
      'CONFLICT',
      409
    );
  }

  // Mark recruiter as APPROVED
  await recruiterRepo.updateRecruiter(recruiterId, {
    verificationStatus: 'APPROVED',
    verifiedById: officerUserId,
    verifiedAt: new Date(),
  });

  // Second gate: activate the linked user account so they can log in
  await recruiterRepo.setUserActive(recruiter.user.id);

  // Auto-approve primary membership if pending
  const primaryMembership = recruiter.memberships.find(m => m.companyId === recruiter.companyId);
  if (primaryMembership && primaryMembership.status === 'PENDING') {
    await recruiterRepo.createAuditLog({
      actorUserId: officerUserId,
      action: 'COMPANY_MEMBERSHIP_APPROVED',
      entityType: 'RecruiterCompanyMembership',
      entityId: primaryMembership.id,
      metadata: { autoApprovedOnRecruiterApproval: true } as Prisma.InputJsonValue,
    });
  }

  // Audit trail
  await recruiterRepo.createAuditLog({
    actorUserId: officerUserId,
    action: 'RECRUITER_APPROVED',
    entityType: 'Recruiter',
    entityId: recruiterId,
  });

  return { message: 'Recruiter approved successfully. Their account is now active.' };
}

// ─── Officer: Reject ──────────────────────────────────────────────────────────

export async function rejectRecruiter(
  recruiterId: string,
  officerUserId: string,
  reason: string
) {
  const recruiter = await recruiterRepo.findRecruiterById(recruiterId);

  if (!recruiter) {
    throw new ServiceError('Recruiter not found.', 'NOT_FOUND', 404);
  }

  // Idempotency guard
  if (recruiter.verificationStatus !== 'PENDING') {
    throw new ServiceError(
      `Cannot reject: recruiter is already ${recruiter.verificationStatus}. No further action taken.`,
      'CONFLICT',
      409
    );
  }

  await recruiterRepo.updateRecruiter(recruiterId, {
    verificationStatus: 'REJECTED',
    rejectionReason: reason,
  });

  // Audit trail
  await recruiterRepo.createAuditLog({
    actorUserId: officerUserId,
    action: 'RECRUITER_REJECTED',
    entityType: 'Recruiter',
    entityId: recruiterId,
    metadata: { reason } as Prisma.InputJsonValue,
  });

  return { message: 'Recruiter rejected.' };
}

// ─── Officer: Suspend ─────────────────────────────────────────────────────────

export async function suspendRecruiter(
  recruiterId: string,
  officerUserId: string,
  reason?: string
) {
  const recruiter = await recruiterRepo.findRecruiterById(recruiterId);

  if (!recruiter) {
    throw new ServiceError('Recruiter not found.', 'NOT_FOUND', 404);
  }

  await recruiterRepo.updateRecruiter(recruiterId, {
    verificationStatus: 'SUSPENDED',
    rejectionReason: reason || null,
  });

  // Deactivate linked user account
  await recruiterRepo.setUserStatus(recruiter.user.id, 'SUSPENDED');

  // Audit trail
  await recruiterRepo.createAuditLog({
    actorUserId: officerUserId,
    action: 'RECRUITER_SUSPENDED',
    entityType: 'Recruiter',
    entityId: recruiterId,
    metadata: { reason } as Prisma.InputJsonValue,
  });

  return { message: 'Recruiter suspended.' };
}
