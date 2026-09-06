import * as referralRepo from '../repositories/referral.repository';
import * as alumniRepo from '../repositories/alumni.repository';
import { createAuditLog } from '../repositories/recruiter.repository'; // Reusing audit log helper
import { ReferralStatus, PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// ─── Opportunities ────────────────────────────────────────────────────────────

export async function createOpportunity(alumniUserId: string, data: any) {
  const profile = await alumniRepo.findAlumniProfileByUserId(alumniUserId);
  if (!profile || profile.verification?.status !== 'APPROVED') {
    throw Object.assign(new Error('Only verified alumni can create referral opportunities.'), {
      code: 'FORBIDDEN',
      statusCode: 403
    });
  }

  const opp = await referralRepo.createReferralOpportunity({
    alumniProfileId: profile.id,
    companyName: data.companyName,
    role: data.role,
    location: data.location || null,
    requiredSkills: data.requiredSkills || [],
    experienceReq: data.experienceReq || null,
    description: data.description,
    deadline: data.deadline ? new Date(data.deadline) : null,
    placementDriveId: data.placementDriveId || null
  });

  return opp;
}

export async function getActiveOpportunities() {
  return referralRepo.findActiveOpportunities();
}

export async function getMyOpportunities(alumniUserId: string) {
  const profile = await alumniRepo.findAlumniProfileByUserId(alumniUserId);
  if (!profile) return [];
  return referralRepo.findOpportunitiesByAlumni(profile.id);
}

// ─── Requests ─────────────────────────────────────────────────────────────────

export async function createRequest(studentUserId: string, oppId: string, message: string) {
  const student = await prisma.student.findUnique({ where: { userId: studentUserId } });
  if (!student) {
    throw Object.assign(new Error('Student profile not found.'), { statusCode: 404 });
  }

  const opp = await referralRepo.findOpportunityById(oppId);
  if (!opp || !opp.isActive) {
    throw Object.assign(new Error('Referral opportunity is not active or does not exist.'), { statusCode: 404 });
  }

  // Check for duplicate
  const existing = await prisma.referralRequest.findUnique({
    where: { studentId_referralOpportunityId: { studentId: student.id, referralOpportunityId: oppId } }
  });
  if (existing) {
    throw Object.assign(new Error('You have already requested a referral for this opportunity.'), { statusCode: 409 });
  }

  const request = await referralRepo.createReferralRequest({
    studentId: student.id,
    referralOpportunityId: oppId,
    studentMessage: message,
    status: 'REQUESTED'
  });

  await createAuditLog({
    actorUserId: studentUserId,
    action: 'REFERRAL_REQUEST_CREATED',
    entityType: 'ReferralRequest',
    entityId: request.id
  });

  return request;
}

export async function getStudentRequests(studentUserId: string) {
  const student = await prisma.student.findUnique({ where: { userId: studentUserId } });
  if (!student) return [];
  return referralRepo.findStudentRequests(student.id);
}

export async function getAlumniRequests(alumniUserId: string) {
  const profile = await alumniRepo.findAlumniProfileByUserId(alumniUserId);
  if (!profile) return [];
  return referralRepo.findAlumniRequests(profile.id);
}

export async function updateRequestStatus(alumniUserId: string, requestId: string, status: ReferralStatus, responseMsg?: string, proofNote?: string) {
  const profile = await alumniRepo.findAlumniProfileByUserId(alumniUserId);
  if (!profile) {
    throw Object.assign(new Error('Alumni profile not found.'), { statusCode: 404 });
  }

  const req = await referralRepo.findRequestById(requestId);
  if (!req) {
    throw Object.assign(new Error('Referral request not found.'), { statusCode: 404 });
  }

  // IDOR check
  if (req.referralOpportunity.alumniProfileId !== profile.id) {
    throw Object.assign(new Error('You do not have permission to manage this referral request.'), { statusCode: 403 });
  }

  const updated = await referralRepo.updateRequestStatus(requestId, {
    status,
    alumniResponse: responseMsg !== undefined ? responseMsg : req.alumniResponse
  });

  // If status is REFERRED, create immutable Referral record if not exists
  if (status === 'REFERRED') {
    const existingRef = await prisma.referral.findUnique({ where: { referralRequestId: requestId } });
    if (!existingRef) {
      await referralRepo.createReferralRecord(requestId, proofNote);
    }
  }

  await createAuditLog({
    actorUserId: alumniUserId,
    action: 'REFERRAL_STATUS_UPDATED',
    entityType: 'ReferralRequest',
    entityId: requestId,
    metadata: { newStatus: status, proofNote } as any
  });

  return updated;
}
