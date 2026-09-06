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

// ─── Profile Management & Directory ───────────────────────────────────────────

export async function createOrUpdateProfile(userId: string, data: any) {
  const existing = await alumniRepo.findAlumniProfileByUserId(userId);
  let studentId = undefined;

  if (!existing?.studentId && data.rollNumber) {
    // Optionally link to student account (import Prisma directly to check Student or add to repo)
    // For clean architecture, we can do it via a generic Prisma query here or add to repo.
    // Assuming simple Prisma use here for brevity since it's a domain boundary.
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();
    const student = await prisma.student.findUnique({ where: { rollNumber: data.rollNumber } });
    if (student) studentId = student.id;
  }

  const profileData = {
    fullName: data.fullName,
    degree: data.degree,
    branch: data.branch,
    graduationYear: Number(data.graduationYear),
    collegeName: data.collegeName,
    currentCompany: data.currentCompany || null,
    currentRole: data.currentRole || null,
    yearsExperience: data.yearsExperience ? Number(data.yearsExperience) : null,
    skills: data.skills || [],
    linkedinUrl: data.linkedinUrl || null,
  };

  if (existing) {
    return alumniRepo.updateAlumniProfile(existing.id, profileData);
  }

  // Create new
  const { PrismaClient } = require('@prisma/client');
  const prisma = new PrismaClient();
  const profile = await prisma.alumniProfile.create({
    data: {
      ...profileData,
      user: { connect: { id: userId } },
      ...(studentId ? { student: { connect: { id: studentId } } } : {}),
      verification: { create: { status: 'PENDING' } }
    },
    include: { verification: true }
  });

  await createAuditLog({
    actorUserId: userId,
    action: 'ALUMNI_PROFILE_CREATED',
    entityType: 'AlumniProfile',
    entityId: profile.id
  });

  return profile;
}

export async function getProfileByUserId(userId: string) {
  return alumniRepo.findAlumniProfileByUserId(userId);
}

export async function getDirectory(filters: { company?: string, branch?: string, graduationYear?: string }) {
  return alumniRepo.findVerifiedAlumni({
    company: filters.company,
    branch: filters.branch,
    graduationYear: filters.graduationYear ? Number(filters.graduationYear) : undefined
  });
}

export async function getPublicProfileById(id: string) {
  const profile = await alumniRepo.getPublicProfileById(id);
  if (!profile || profile.verification?.status !== 'APPROVED') {
    throw Object.assign(new Error('Alumni profile not found or not verified.'), {
      code: 'NOT_FOUND',
      statusCode: 404
    });
  }
  return profile;
}

