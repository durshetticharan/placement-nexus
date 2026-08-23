import { Prisma } from '@prisma/client';
import * as alumniRepo from '../repositories/alumni.repository';
// Reuse the shared audit log helper from recruiter repository — no duplication
import { createAuditLog } from '../repositories/recruiter.repository';

// ─── List ─────────────────────────────────────────────────────────────────────

export async function listPendingAlumni() {
  return alumniRepo.findPendingAlumni();
}

// ─── Approve ──────────────────────────────────────────────────────────────────

export async function approveAlumni(alumniProfileId: string, officerUserId: string) {
  const profile = await alumniRepo.findAlumniProfileById(alumniProfileId);

  if (!profile) {
    throw Object.assign(new Error('Alumni profile not found.'), {
      code: 'NOT_FOUND',
      statusCode: 404,
    });
  }

  // Idempotency guard — only PENDING records may be actioned
  const currentStatus = profile.verification?.status;
  if (!profile.verification || currentStatus !== 'PENDING') {
    throw Object.assign(
      new Error(
        `Cannot approve: alumni verification is already ${currentStatus ?? 'unknown'}. No further action taken.`,
      ),
      { code: 'CONFLICT', statusCode: 409 },
    );
  }

  // Mark alumni verification as APPROVED
  await alumniRepo.updateAlumniVerification(alumniProfileId, {
    status: 'APPROVED',
    verifiedById: officerUserId,
    verifiedAt: new Date(),
  });

  // Second gate: activate the linked user account so they can log in
  await alumniRepo.setUserActive(profile.user.id);

  // Audit trail
  await createAuditLog({
    actorUserId: officerUserId,
    action: 'ALUMNI_APPROVED',
    entityType: 'AlumniProfile',
    entityId: alumniProfileId,
  });

  return { message: 'Alumni approved successfully. Their account is now active.' };
}

// ─── Reject ───────────────────────────────────────────────────────────────────

export async function rejectAlumni(
  alumniProfileId: string,
  officerUserId: string,
  reason: string,
) {
  const profile = await alumniRepo.findAlumniProfileById(alumniProfileId);

  if (!profile) {
    throw Object.assign(new Error('Alumni profile not found.'), {
      code: 'NOT_FOUND',
      statusCode: 404,
    });
  }

  // Idempotency guard
  const currentStatus = profile.verification?.status;
  if (!profile.verification || currentStatus !== 'PENDING') {
    throw Object.assign(
      new Error(
        `Cannot reject: alumni verification is already ${currentStatus ?? 'unknown'}. No further action taken.`,
      ),
      { code: 'CONFLICT', statusCode: 409 },
    );
  }

  await alumniRepo.updateAlumniVerification(alumniProfileId, {
    status: 'REJECTED',
    rejectionReason: reason,
  });

  // Audit trail
  await createAuditLog({
    actorUserId: officerUserId,
    action: 'ALUMNI_REJECTED',
    entityType: 'AlumniProfile',
    entityId: alumniProfileId,
    metadata: { reason } as Prisma.InputJsonValue,
  });

  return { message: 'Alumni rejected.' };
}
