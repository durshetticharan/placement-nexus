import { PrismaClient, ResourceStatus, ResourceCategory } from '@prisma/client';

const prisma = new PrismaClient();

// ─── Validation helpers ────────────────────────────────────────────────────────

const VALID_RESOURCE_TYPES = ['LINK', 'PDF', 'VIDEO', 'ARTICLE', 'GUIDE'];
const URL_REGEX = /^https?:\/\/.+/;
const DANGEROUS_URL_REGEX = /^(javascript:|data:|vbscript:|file:)/i;

function validateUrl(url: string): void {
  if (DANGEROUS_URL_REGEX.test(url)) {
    throw Object.assign(new Error('Unsafe URL scheme detected.'), { code: 'VALIDATION_ERROR', statusCode: 400 });
  }
  if (!URL_REGEX.test(url)) {
    throw Object.assign(new Error('URL must start with http:// or https://.'), { code: 'VALIDATION_ERROR', statusCode: 400 });
  }
}

// ─── Select shapes ────────────────────────────────────────────────────────────

const publicResourceSelect = {
  id: true,
  companyName: true,
  roundType: true,
  category: true,
  resourceType: true,
  title: true,
  description: true,
  externalUrl: true,
  fileUrl: true,
  status: true,
  createdAt: true,
  placementDrive: { select: { id: true, title: true } },
  alumniProfile: { select: { id: true, fullName: true, currentCompany: true } },
  student: { select: { id: true, fullName: true } },
} as const;

const ownResourceSelect = {
  ...publicResourceSelect,
  moderatedById: true,
  moderatedAt: true,
  rejectionReason: true,
} as const;

// ─── List Approved Resources ───────────────────────────────────────────────────

export async function listApprovedResources(filters: {
  category?: string;
  companyName?: string;
  driveId?: string;
  resourceType?: string;
}) {
  const where: any = { status: ResourceStatus.APPROVED };

  if (filters.category) where.category = filters.category as ResourceCategory;
  if (filters.companyName) where.companyName = { contains: filters.companyName, mode: 'insensitive' };
  if (filters.driveId) where.placementDriveId = filters.driveId;
  if (filters.resourceType) where.resourceType = filters.resourceType;

  return prisma.driveResource.findMany({
    where,
    select: publicResourceSelect,
    orderBy: { createdAt: 'desc' },
    take: 100,
  });
}

// ─── Get Single Approved Resource ─────────────────────────────────────────────

export async function getApprovedResourceById(id: string) {
  const res = await prisma.driveResource.findFirst({
    where: { id, status: ResourceStatus.APPROVED },
    select: publicResourceSelect,
  });

  if (!res) {
    throw Object.assign(new Error('Resource not found or not yet approved.'), { code: 'NOT_FOUND', statusCode: 404 });
  }
  return res;
}

// ─── Submit Resource ───────────────────────────────────────────────────────────

export async function submitResource(userId: string, role: string, data: {
  placementDriveId?: string;
  companyName?: string;
  roundType?: string;
  category: ResourceCategory;
  resourceType: string;
  title: string;
  description?: string;
  externalUrl?: string;
}) {
  // Validation
  if (!data.title || data.title.trim().length < 3) {
    throw Object.assign(new Error('Title must be at least 3 characters.'), { code: 'VALIDATION_ERROR', statusCode: 400 });
  }
  if (data.title.trim().length > 200) {
    throw Object.assign(new Error('Title must not exceed 200 characters.'), { code: 'VALIDATION_ERROR', statusCode: 400 });
  }
  if (!VALID_RESOURCE_TYPES.includes(data.resourceType)) {
    throw Object.assign(new Error(`Invalid resourceType. Must be one of: ${VALID_RESOURCE_TYPES.join(', ')}`), { code: 'VALIDATION_ERROR', statusCode: 400 });
  }
  if (!data.externalUrl) {
    throw Object.assign(new Error('externalUrl is required.'), { code: 'VALIDATION_ERROR', statusCode: 400 });
  }
  validateUrl(data.externalUrl);

  // Must have at least one context: company or drive
  if (!data.companyName && !data.placementDriveId && data.category === ResourceCategory.COMPANY_PREP) {
    throw Object.assign(new Error('Company-prep resources must specify a companyName or placementDriveId.'), { code: 'VALIDATION_ERROR', statusCode: 400 });
  }

  let alumniProfileId: string | undefined;
  let studentId: string | undefined;

  if (role === 'ALUMNI') {
    const profile = await prisma.alumniProfile.findUnique({
      where: { userId },
      select: { id: true, verification: { select: { status: true } } },
    });
    if (!profile || profile.verification?.status !== 'APPROVED') {
      throw Object.assign(new Error('Your alumni profile must be verified to submit resources.'), { code: 'FORBIDDEN', statusCode: 403 });
    }
    alumniProfileId = profile.id;
  } else if (role === 'STUDENT') {
    const student = await prisma.student.findUnique({ where: { userId }, select: { id: true } });
    if (!student) {
      throw Object.assign(new Error('Student profile not found.'), { code: 'NOT_FOUND', statusCode: 404 });
    }
    studentId = student.id;
  } else if (role === 'PLACEMENT_OFFICER') {
    // Officers bypass moderation and are immediately approved
  } else {
    throw Object.assign(new Error('Only students, verified alumni, and officers may submit resources.'), { code: 'FORBIDDEN', statusCode: 403 });
  }

  const isOfficer = role === 'PLACEMENT_OFFICER';

  return prisma.driveResource.create({
    data: {
      alumniProfileId: alumniProfileId ?? null,
      studentId: studentId ?? null,
      placementDriveId: data.placementDriveId ?? null,
      companyName: data.companyName?.trim() ?? null,
      roundType: data.roundType as any ?? null,
      category: data.category,
      resourceType: data.resourceType,
      title: data.title.trim(),
      description: data.description?.trim() ?? null,
      externalUrl: data.externalUrl.trim(),
      status: isOfficer ? ResourceStatus.APPROVED : ResourceStatus.PENDING,
      moderatedAt: isOfficer ? new Date() : null,
    },
    select: ownResourceSelect,
  });
}

// ─── Get My Resources ─────────────────────────────────────────────────────────

export async function getMyResources(userId: string, role: string) {
  if (role === 'ALUMNI') {
    const profile = await prisma.alumniProfile.findUnique({ where: { userId }, select: { id: true } });
    if (!profile) return [];
    return prisma.driveResource.findMany({
      where: { alumniProfileId: profile.id },
      select: ownResourceSelect,
      orderBy: { createdAt: 'desc' },
    });
  } else {
    const student = await prisma.student.findUnique({ where: { userId }, select: { id: true } });
    if (!student) return [];
    return prisma.driveResource.findMany({
      where: { studentId: student.id },
      select: ownResourceSelect,
      orderBy: { createdAt: 'desc' },
    });
  }
}

// ─── Officer: List Pending ─────────────────────────────────────────────────────

export async function listPendingResources() {
  return prisma.driveResource.findMany({
    where: { status: ResourceStatus.PENDING },
    select: ownResourceSelect,
    orderBy: { createdAt: 'asc' },
  });
}

// ─── Officer: Approve ─────────────────────────────────────────────────────────

export async function approveResource(resourceId: string, officerUserId: string) {
  const res = await prisma.driveResource.findUnique({ where: { id: resourceId }, select: { id: true, status: true } });
  if (!res) throw Object.assign(new Error('Resource not found.'), { code: 'NOT_FOUND', statusCode: 404 });
  if (res.status !== ResourceStatus.PENDING) {
    throw Object.assign(new Error(`Cannot approve: resource is already ${res.status}.`), { code: 'CONFLICT', statusCode: 409 });
  }

  const updated = await prisma.driveResource.update({
    where: { id: resourceId },
    data: { status: ResourceStatus.APPROVED, moderatedById: officerUserId, moderatedAt: new Date() },
    select: ownResourceSelect,
  });

  await prisma.auditLog.create({ data: { actorUserId: officerUserId, action: 'RESOURCE_APPROVED', entityType: 'DriveResource', entityId: resourceId } });
  return updated;
}

// ─── Officer: Reject ──────────────────────────────────────────────────────────

export async function rejectResource(resourceId: string, officerUserId: string, reason: string) {
  const res = await prisma.driveResource.findUnique({ where: { id: resourceId }, select: { id: true, status: true } });
  if (!res) throw Object.assign(new Error('Resource not found.'), { code: 'NOT_FOUND', statusCode: 404 });
  if (res.status !== ResourceStatus.PENDING) {
    throw Object.assign(new Error(`Cannot reject: resource is already ${res.status}.`), { code: 'CONFLICT', statusCode: 409 });
  }

  const updated = await prisma.driveResource.update({
    where: { id: resourceId },
    data: { status: ResourceStatus.REJECTED, moderatedById: officerUserId, moderatedAt: new Date(), rejectionReason: reason },
    select: ownResourceSelect,
  });

  await prisma.auditLog.create({ data: { actorUserId: officerUserId, action: 'RESOURCE_REJECTED', entityType: 'DriveResource', entityId: resourceId, metadata: { reason } } });
  return updated;
}

// ─── Delete own resource ───────────────────────────────────────────────────────

export async function deleteOwnResource(userId: string, role: string, resourceId: string) {
  const res = await prisma.driveResource.findUnique({
    where: { id: resourceId },
    select: { id: true, alumniProfileId: true, studentId: true, status: true },
  });
  if (!res) throw Object.assign(new Error('Resource not found.'), { code: 'NOT_FOUND', statusCode: 404 });

  // Ownership check
  if (role === 'ALUMNI') {
    const profile = await prisma.alumniProfile.findUnique({ where: { userId }, select: { id: true } });
    if (!profile || res.alumniProfileId !== profile.id) {
      throw Object.assign(new Error('You can only delete your own resources.'), { code: 'FORBIDDEN', statusCode: 403 });
    }
  } else if (role === 'STUDENT') {
    const student = await prisma.student.findUnique({ where: { userId }, select: { id: true } });
    if (!student || res.studentId !== student.id) {
      throw Object.assign(new Error('You can only delete your own resources.'), { code: 'FORBIDDEN', statusCode: 403 });
    }
  }

  // Cannot delete already-approved resources (they are institutional content)
  if (res.status === ResourceStatus.APPROVED) {
    throw Object.assign(new Error('Approved resources cannot be deleted. Contact a Placement Officer.'), { code: 'CONFLICT', statusCode: 409 });
  }

  await prisma.driveResource.delete({ where: { id: resourceId } });
  return { message: 'Resource deleted.' };
}
