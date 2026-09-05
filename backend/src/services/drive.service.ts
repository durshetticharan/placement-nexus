import { PrismaClient, DriveStatus, Prisma } from '@prisma/client';
import { logAudit } from './audit.service';

const prisma = new PrismaClient();

export class DriveServiceError extends Error {
  constructor(public statusCode: number, public code: string, message: string) {
    super(message);
    this.name = 'DriveServiceError';
  }
}

export async function createDrive(userId: string, data: any) {
  const recruiter = await prisma.recruiter.findUnique({
    where: { userId },
    include: { memberships: { where: { status: 'APPROVED' } } }
  });

  if (!recruiter || recruiter.verificationStatus !== 'APPROVED') {
    throw new DriveServiceError(403, 'UNAUTHORIZED', 'Only approved recruiters can create drives');
  }

  // Use the company from the recruiter's approved membership
  if (recruiter.memberships.length === 0) {
    throw new DriveServiceError(403, 'UNAUTHORIZED', 'Recruiter does not belong to any approved company');
  }

  // Default to the first approved company they belong to (assuming one for now, or passing companyId)
  const companyId = data.companyId || recruiter.memberships[0].companyId;
  const isMember = recruiter.memberships.some(m => m.companyId === companyId);
  
  if (!isMember) {
    throw new DriveServiceError(403, 'FORBIDDEN', 'You do not have access to create drives for this company');
  }

  const driveData = {
    title: data.title,
    jobTitle: data.jobTitle,
    description: data.description,
    employmentType: data.employmentType,
    jobType: data.jobType,
    location: data.location,
    workMode: data.workMode,
    salaryMin: data.salaryMin,
    salaryMax: data.salaryMax,
    salaryCurrency: data.salaryCurrency,
    salaryPeriod: data.salaryPeriod,
    openingCount: data.openingCount,
    graduationYear: data.graduationYear,
    applicationStartAt: new Date(data.applicationStartAt),
    applicationEndAt: new Date(data.applicationEndAt),
    driveDate: data.driveDate ? new Date(data.driveDate) : null,
    selectionProcess: data.selectionProcess,
    companyId: companyId,
    createdByRecruiterId: recruiter.id,
    status: DriveStatus.DRAFT,
  };

  const drive = await prisma.placementDrive.create({
    data: driveData,
  });

  await logAudit({
    actorUserId: userId,
    action: 'DRIVE_CREATED',
    entityType: 'PlacementDrive',
    entityId: drive.id,
    metadata: { title: drive.title }
  });

  return drive;
}

export async function updateDrive(userId: string, driveId: string, data: any) {
  const recruiter = await prisma.recruiter.findUnique({
    where: { userId },
    include: { memberships: { where: { status: 'APPROVED' } } }
  });

  if (!recruiter) {
    throw new DriveServiceError(403, 'UNAUTHORIZED', 'Unauthorized');
  }

  const drive = await prisma.placementDrive.findUnique({ where: { id: driveId } });
  if (!drive) {
    throw new DriveServiceError(404, 'NOT_FOUND', 'Drive not found');
  }

  if (drive.companyId !== recruiter.companyId && !recruiter.memberships.some(m => m.companyId === drive.companyId)) {
    throw new DriveServiceError(403, 'FORBIDDEN', 'Not authorized to edit this drive');
  }

  if (drive.status !== 'DRAFT') {
    throw new DriveServiceError(400, 'INVALID_STATE', 'Only draft drives can be edited');
  }

  const updatedData: any = { ...data };
  if (data.applicationStartAt) updatedData.applicationStartAt = new Date(data.applicationStartAt);
  if (data.applicationEndAt) updatedData.applicationEndAt = new Date(data.applicationEndAt);
  if (data.driveDate) updatedData.driveDate = new Date(data.driveDate);

  const updated = await prisma.placementDrive.update({
    where: { id: driveId },
    data: updatedData,
  });

  await logAudit({
    actorUserId: userId,
    action: 'DRIVE_UPDATED',
    entityType: 'PlacementDrive',
    entityId: driveId,
    metadata: { title: updated.title }
  });

  return updated;
}

export async function updateDriveRequirements(userId: string, driveId: string, data: any) {
  const recruiter = await prisma.recruiter.findUnique({
    where: { userId },
    include: { memberships: { where: { status: 'APPROVED' } } }
  });

  if (!recruiter) {
    throw new DriveServiceError(403, 'UNAUTHORIZED', 'Unauthorized');
  }

  const drive = await prisma.placementDrive.findUnique({ where: { id: driveId } });
  if (!drive) {
    throw new DriveServiceError(404, 'NOT_FOUND', 'Drive not found');
  }

  if (drive.companyId !== recruiter.companyId && !recruiter.memberships.some(m => m.companyId === drive.companyId)) {
    throw new DriveServiceError(403, 'FORBIDDEN', 'Not authorized to edit this drive');
  }

  if (drive.status !== 'DRAFT') {
    throw new DriveServiceError(400, 'INVALID_STATE', 'Only draft drives can have requirements edited');
  }

  const { requiredSkills, preferredSkills, ...rest } = data;

  const reqData: Prisma.DriveRequirementCreateInput = {
    ...rest,
    placementDrive: { connect: { id: driveId } },
  };

  if (requiredSkills && requiredSkills.length > 0) {
    reqData.requiredSkills = { connect: requiredSkills.map((id: string) => ({ id })) };
  }
  if (preferredSkills && preferredSkills.length > 0) {
    reqData.preferredSkills = { connect: preferredSkills.map((id: string) => ({ id })) };
  }

  const updated = await prisma.driveRequirement.upsert({
    where: { placementDriveId: driveId },
    update: {
      ...rest,
      requiredSkills: reqData.requiredSkills,
      preferredSkills: reqData.preferredSkills
    },
    create: reqData,
  });

  await logAudit({
    actorUserId: userId,
    action: 'DRIVE_REQUIREMENTS_UPDATED',
    entityType: 'PlacementDrive',
    entityId: driveId,
    metadata: {}
  });

  return updated;
}

export async function updateDriveStatus(userId: string, driveId: string, status: DriveStatus, reason?: string, isOfficer = false) {
  const drive = await prisma.placementDrive.findUnique({ where: { id: driveId } });
  if (!drive) throw new DriveServiceError(404, 'NOT_FOUND', 'Drive not found');

  if (!isOfficer) {
    const recruiter = await prisma.recruiter.findUnique({ where: { userId }, include: { memberships: true }});
    if (!recruiter || (drive.companyId !== recruiter.companyId && !recruiter.memberships.some(m => m.companyId === drive.companyId))) {
      throw new DriveServiceError(403, 'FORBIDDEN', 'Not authorized');
    }
  }

  // Status Machine Logic
  if (status === 'PENDING_APPROVAL') {
    if (drive.status !== 'DRAFT') throw new DriveServiceError(400, 'INVALID_TRANSITION', 'Only DRAFT drives can be submitted');
    if (isOfficer) throw new DriveServiceError(403, 'FORBIDDEN', 'Officers cannot submit drafts');
  }
  
  if (status === 'PUBLISHED') {
    if (!isOfficer) throw new DriveServiceError(403, 'FORBIDDEN', 'Only officers can publish drives');
    if (drive.status !== 'PENDING_APPROVAL') throw new DriveServiceError(400, 'INVALID_TRANSITION', 'Only pending drives can be published');
  }

  if (status === 'DRAFT') { // Rejection
    if (!isOfficer) throw new DriveServiceError(403, 'FORBIDDEN', 'Only officers can reject drives');
    if (drive.status !== 'PENDING_APPROVAL') throw new DriveServiceError(400, 'INVALID_TRANSITION', 'Only pending drives can be rejected');
  }

  const updated = await prisma.placementDrive.update({
    where: { id: driveId },
    data: { status }
  });

  await logAudit({
    actorUserId: userId,
    action: `DRIVE_STATUS_CHANGED_TO_${status}`,
    entityType: 'PlacementDrive',
    entityId: driveId,
    metadata: { previousStatus: drive.status, reason }
  });

  return updated;
}

export async function getDriveById(driveId: string) {
  const drive = await prisma.placementDrive.findUnique({
    where: { id: driveId },
    include: {
      company: true,
      requirements: {
        include: { requiredSkills: true, preferredSkills: true }
      }
    }
  });
  if (!drive) throw new DriveServiceError(404, 'NOT_FOUND', 'Drive not found');
  return drive;
}

export async function listRecruiterDrives(userId: string) {
  const recruiter = await prisma.recruiter.findUnique({
    where: { userId },
    include: { memberships: true }
  });
  if (!recruiter) return [];

  const companyIds = recruiter.memberships.map(m => m.companyId);
  companyIds.push(recruiter.companyId);

  return prisma.placementDrive.findMany({
    where: { companyId: { in: companyIds } },
    include: { company: true },
    orderBy: { createdAt: 'desc' }
  });
}

export async function listOfficerDrives() {
  return prisma.placementDrive.findMany({
    include: { company: true },
    orderBy: { createdAt: 'desc' }
  });
}

export async function listStudentDrives() {
  return prisma.placementDrive.findMany({
    where: { status: 'PUBLISHED' },
    include: { company: true },
    orderBy: { applicationStartAt: 'desc' }
  });
}
