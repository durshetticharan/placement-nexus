import { Prisma } from '@prisma/client';
import * as recruiterRepo from '../repositories/recruiter.repository';

// ─── List ─────────────────────────────────────────────────────────────────────

export async function listPendingRecruiters() {
  return recruiterRepo.findPendingRecruiters();
}

// ─── Approve ──────────────────────────────────────────────────────────────────

export async function approveRecruiter(recruiterId: string, officerUserId: string) {
  const recruiter = await recruiterRepo.findRecruiterById(recruiterId);

  if (!recruiter) {
    throw Object.assign(new Error('Recruiter not found.'), {
      code: 'NOT_FOUND',
      statusCode: 404,
    });
  }

  // Idempotency guard — only PENDING records may be actioned
  if (recruiter.verificationStatus !== 'PENDING') {
    throw Object.assign(
      new Error(
        `Cannot approve: recruiter is already ${recruiter.verificationStatus}. No further action taken.`,
      ),
      { code: 'CONFLICT', statusCode: 409 },
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

  // Audit trail
  await recruiterRepo.createAuditLog({
    actorUserId: officerUserId,
    action: 'RECRUITER_APPROVED',
    entityType: 'Recruiter',
    entityId: recruiterId,
  });

  return { message: 'Recruiter approved successfully. Their account is now active.' };
}

// ─── Reject ───────────────────────────────────────────────────────────────────

export async function rejectRecruiter(
  recruiterId: string,
  officerUserId: string,
  reason: string,
) {
  const recruiter = await recruiterRepo.findRecruiterById(recruiterId);

  if (!recruiter) {
    throw Object.assign(new Error('Recruiter not found.'), {
      code: 'NOT_FOUND',
      statusCode: 404,
    });
  }

  // Idempotency guard
  if (recruiter.verificationStatus !== 'PENDING') {
    throw Object.assign(
      new Error(
        `Cannot reject: recruiter is already ${recruiter.verificationStatus}. No further action taken.`,
      ),
      { code: 'CONFLICT', statusCode: 409 },
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
