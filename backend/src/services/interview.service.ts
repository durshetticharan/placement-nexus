import { PrismaClient, InterviewOutcome, InterviewType } from '@prisma/client';
import { logAudit } from './audit.service';

const prisma = new PrismaClient();

export class InterviewServiceError extends Error {
  constructor(public statusCode: number, public code: string, message: string) {
    super(message);
    this.name = 'InterviewServiceError';
  }
}

export async function scheduleInterview(
  recruiterUserId: string,
  applicationId: string,
  data: {
    roundNumber: number;
    type: InterviewType;
    scheduledAt: string;
    meetingLink?: string;
    location?: string;
  }
) {
  const application = await prisma.application.findUnique({
    where: { id: applicationId },
    include: { placementDrive: true }
  });
  if (!application) throw new InterviewServiceError(404, 'NOT_FOUND', 'Application not found');

  const recruiter = await prisma.recruiter.findUnique({ where: { userId: recruiterUserId } });
  if (!recruiter) throw new InterviewServiceError(404, 'NOT_FOUND', 'Recruiter not found');

  const membership = await prisma.recruiterCompanyMembership.findUnique({
    where: { recruiterId_companyId: { recruiterId: recruiter.id, companyId: application.placementDrive.companyId } }
  });
  if (!membership || membership.status !== 'APPROVED') {
    throw new InterviewServiceError(403, 'FORBIDDEN', 'You do not have access to schedule interviews for this drive');
  }

  // Create the interview
  const interview = await prisma.interview.create({
    data: {
      applicationId,
      interviewerId: recruiter.id,
      roundNumber: data.roundNumber,
      type: data.type,
      scheduledAt: new Date(data.scheduledAt),
      meetingLink: data.meetingLink,
      location: data.location,
      outcome: 'PENDING'
    }
  });

  // Update application status
  await prisma.application.update({
    where: { id: applicationId },
    data: { status: 'INTERVIEW_STAGE' }
  });

  await logAudit({ action: 'INTERVIEW_SCHEDULED', userId: recruiter.id, userType: 'Recruiter', message: `Interview round ${data.roundNumber} scheduled for application ${applicationId}`, metadata: { interviewId: interview.id } });

  return interview;
}

export async function updateInterviewOutcome(
  recruiterUserId: string,
  interviewId: string,
  data: {
    outcome: InterviewOutcome;
    score?: number;
    feedback?: string;
  }
) {
  const interview = await prisma.interview.findUnique({
    where: { id: interviewId },
    include: { application: { include: { placementDrive: true } } }
  });
  if (!interview) throw new InterviewServiceError(404, 'NOT_FOUND', 'Interview not found');

  const recruiter = await prisma.recruiter.findUnique({ where: { userId: recruiterUserId } });
  if (!recruiter) throw new InterviewServiceError(404, 'NOT_FOUND', 'Recruiter not found');

  const membership = await prisma.recruiterCompanyMembership.findUnique({
    where: { recruiterId_companyId: { recruiterId: recruiter.id, companyId: interview.application.placementDrive.companyId } }
  });
  if (!membership || membership.status !== 'APPROVED') {
    throw new InterviewServiceError(403, 'FORBIDDEN', 'You do not have access to this interview');
  }

  const updated = await prisma.interview.update({
    where: { id: interviewId },
    data: {
      outcome: data.outcome,
      score: data.score,
      feedback: data.feedback
    }
  });

  await logAudit({ action: 'INTERVIEW_UPDATED', userId: recruiter.id, userType: 'Recruiter', message: `Interview ${interviewId} outcome updated to ${data.outcome}`, metadata: { interviewId, outcome: data.outcome } });

  return updated;
}

export async function getInterviewsForStudent(studentUserId: string) {
  const student = await prisma.student.findUnique({ where: { userId: studentUserId } });
  if (!student) throw new InterviewServiceError(404, 'NOT_FOUND', 'Student not found');

  return prisma.interview.findMany({
    where: { application: { studentId: student.id } },
    include: {
      application: {
        include: { placementDrive: { select: { title: true, company: { select: { name: true } } } } }
      }
    },
    orderBy: { scheduledAt: 'asc' }
  });
}
