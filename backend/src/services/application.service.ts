import { PrismaClient, ApplicationStatus } from '@prisma/client';
import { logAudit } from './audit.service';
import { EligibilityService } from './eligibility.service';
import { JobMatchService } from './job-match.service';
import { NotificationService } from './notification.service';

const prisma = new PrismaClient();

export class ApplicationServiceError extends Error {
  constructor(public statusCode: number, public code: string, message: string) {
    super(message);
    this.name = 'ApplicationServiceError';
  }
}

export async function applyToDrive(studentUserId: string, driveId: string) {
  const student = await prisma.student.findUnique({ where: { userId: studentUserId } });
  if (!student) {
    throw new ApplicationServiceError(404, 'NOT_FOUND', 'Student not found');
  }

  const drive = await prisma.placementDrive.findUnique({
    where: { id: driveId }
  });

  if (!drive) {
    throw new ApplicationServiceError(404, 'NOT_FOUND', 'Drive not found');
  }

  if (drive.status !== 'PUBLISHED') {
    throw new ApplicationServiceError(400, 'BAD_REQUEST', 'Cannot apply to a drive that is not published');
  }

  // Check if already applied
  const existingApp = await prisma.application.findUnique({
    where: { studentId_placementDriveId: { studentId: student.id, placementDriveId: driveId } }
  });

  if (existingApp) {
    throw new ApplicationServiceError(409, 'CONFLICT', 'You have already applied to this drive');
  }

  // Check Eligibility
  // Note: evaluateStudentEligibility expects the userId, not the student.id
  const eligibility = await EligibilityService.evaluateStudentEligibility(studentUserId, driveId);
  if (!eligibility.eligible) {
    throw new ApplicationServiceError(403, 'FORBIDDEN', 'You are not eligible for this drive: ' + eligibility.reasons.join(', '));
  }

  // Calculate Job Match Snapshot
  const jobMatch = await JobMatchService.calculateJobMatch(student.id, driveId);

  const application = await prisma.application.create({
    data: {
      studentId: student.id,
      placementDriveId: driveId,
      status: 'APPLIED',
      eligibleAtApply: true,
      jobMatchPct: jobMatch.normalizedScore
    }
  });

  await logAudit({ action: 'STUDENT_APPLIED', userId: student.id, userType: 'Student', message: `Student applied to drive ${driveId}`, metadata: { applicationId: application.id } });

  return application;
}

export async function getApplicationMatchBreakdown(userId: string, userRole: string, applicationId: string) {
  const application = await prisma.application.findUnique({
    where: { id: applicationId },
    include: {
      placementDrive: true
    }
  });

  if (!application) {
    throw new ApplicationServiceError(404, 'NOT_FOUND', 'Application not found');
  }

  // IDOR / RBAC check
  if (userRole === 'RECRUITER') {
    const recruiter = await prisma.recruiter.findUnique({ where: { userId } });
    if (!recruiter) throw new ApplicationServiceError(404, 'NOT_FOUND', 'Recruiter not found');

    if (application.placementDrive.companyId !== recruiter.companyId) {
      const membership = await prisma.recruiterCompanyMembership.findUnique({
        where: { recruiterId_companyId: { recruiterId: recruiter.id, companyId: application.placementDrive.companyId } }
      });
      if (!membership || membership.status !== 'APPROVED') {
        throw new ApplicationServiceError(403, 'FORBIDDEN', 'You do not have access to this application');
      }
    }
  }

  // Calculate the breakdown dynamically
  const matchResult = await JobMatchService.calculateJobMatch(application.studentId, application.placementDriveId);
  return matchResult;
}

export async function withdrawApplication(studentUserId: string, applicationId: string) {
  const student = await prisma.student.findUnique({ where: { userId: studentUserId } });
  if (!student) throw new ApplicationServiceError(404, 'NOT_FOUND', 'Student not found');

  const application = await prisma.application.findUnique({ where: { id: applicationId } });
  if (!application) throw new ApplicationServiceError(404, 'NOT_FOUND', 'Application not found');

  if (application.studentId !== student.id) {
    throw new ApplicationServiceError(403, 'FORBIDDEN', 'Not your application');
  }

  if (application.status === 'WITHDRAWN') {
    throw new ApplicationServiceError(400, 'BAD_REQUEST', 'Application already withdrawn');
  }

  const updated = await prisma.application.update({
    where: { id: applicationId },
    data: { status: 'WITHDRAWN' }
  });

  await logAudit({ action: 'APPLICATION_WITHDRAWN', userId: student.id, userType: 'Student', message: `Student withdrew application ${applicationId}`, metadata: { applicationId } });

  return updated;
}

export async function getStudentApplications(studentUserId: string) {
  const student = await prisma.student.findUnique({ where: { userId: studentUserId } });
  if (!student) throw new ApplicationServiceError(404, 'NOT_FOUND', 'Student not found');

  return prisma.application.findMany({
    where: { studentId: student.id },
    include: {
      placementDrive: {
        select: { id: true, title: true, company: { select: { id: true, name: true, logoUrl: true } } }
      },
      interviews: { orderBy: { roundNumber: 'asc' } },
      selection: true
    },
    orderBy: { appliedAt: 'desc' }
  });
}

export async function getDriveApplications(userId: string, userRole: string, driveId: string) {
  const drive = await prisma.placementDrive.findUnique({ where: { id: driveId } });
  if (!drive) throw new ApplicationServiceError(404, 'NOT_FOUND', 'Drive not found');

  if (userRole === 'RECRUITER') {
    const recruiter = await prisma.recruiter.findUnique({ where: { userId } });
    if (!recruiter) throw new ApplicationServiceError(404, 'NOT_FOUND', 'Recruiter not found');

    if (drive.companyId !== recruiter.companyId) {
        // Wait, recruiter can have multiple memberships. Let's check if they belong to the drive's company.
        const membership = await prisma.recruiterCompanyMembership.findUnique({
            where: { recruiterId_companyId: { recruiterId: recruiter.id, companyId: drive.companyId } }
        });
        if (!membership || membership.status !== 'APPROVED') {
            throw new ApplicationServiceError(403, 'FORBIDDEN', 'You do not have access to this drive');
        }
    }
  }

  const applications = await prisma.application.findMany({
    where: { placementDriveId: driveId },
    include: {
      student: {
        select: {
          id: true,
          userId: true,
          rollNumber: true,
          fullName: true,
          user: { select: { email: true } },
          academics: { select: { branch: true, cgpa: true } },
          readinessScores: { orderBy: { computedAt: 'desc' }, take: 1 }
        }
      },
      interviews: { orderBy: { roundNumber: 'asc' } },
      selection: true
    },
    orderBy: { appliedAt: 'desc' }
  });

  // Inject dynamic Job Match for recruiter sorting
  const enriched = await Promise.all(applications.map(async (app) => {
    try {
      const match = await JobMatchService.calculateJobMatch(app.studentId, driveId);
      return {
        ...app,
        dynamicJobMatch: match.normalizedScore
      };
    } catch (e) {
      return { ...app, dynamicJobMatch: app.jobMatchPct }; // fallback to snapshot
    }
  }));

  return enriched;
}

export async function updateApplicationStatus(recruiterUserId: string, applicationId: string, status: ApplicationStatus) {
  const application = await prisma.application.findUnique({ 
    where: { id: applicationId },
    include: { placementDrive: { include: { company: true } }, student: { include: { user: true } } }
  });
  if (!application) throw new ApplicationServiceError(404, 'NOT_FOUND', 'Application not found');

  const recruiter = await prisma.recruiter.findUnique({ where: { userId: recruiterUserId } });
  if (!recruiter) throw new ApplicationServiceError(404, 'NOT_FOUND', 'Recruiter not found');

  const membership = await prisma.recruiterCompanyMembership.findUnique({
    where: { recruiterId_companyId: { recruiterId: recruiter.id, companyId: application.placementDrive.companyId } }
  });
  if (!membership || membership.status !== 'APPROVED') {
    throw new ApplicationServiceError(403, 'FORBIDDEN', 'You do not have access to this application');
  }

  const updated = await prisma.application.update({
    where: { id: applicationId },
    data: { status }
  });

  await logAudit({ action: 'APPLICATION_STATUS_UPDATED', userId: recruiter.id, userType: 'Recruiter', message: `Updated application ${applicationId} to ${status}`, metadata: { applicationId, status } });

  // Send Notification
  let notifType: 'APPLICATION_STATUS' | 'SHORTLISTED' = 'APPLICATION_STATUS';
  if (status === 'SHORTLISTED') notifType = 'SHORTLISTED';

  await NotificationService.sendNotification({
    userId: application.student.userId,
    type: notifType,
    title: `Application Status Updated`,
    message: `Your application for ${application.placementDrive.title} at ${application.placementDrive.company.name || 'the company'} is now ${status}.`,
    metadata: { applicationId, driveId: application.placementDriveId }
  });

  return updated;
}
