import { PrismaClient, ExperienceStatus, ExperienceDifficulty, ExperienceOutcome } from '@prisma/client';

const prisma = new PrismaClient();

// ─── Select shapes ────────────────────────────────────────────────────────────

const publicExperienceSelect = {
  id: true,
  companyName: true,
  role: true,
  driveYear: true,
  difficulty: true,
  outcome: true,
  isAnonymous: true,
  overallRating: true,
  overallTips: true,
  narrative: true,
  status: true,
  createdAt: true,
  placementDrive: { select: { id: true, title: true, jobTitle: true } },
  // Author identity respects anonymity flag
  alumniProfile: { select: { id: true, fullName: true, graduationYear: true, currentCompany: true } },
  student: { select: { id: true, fullName: true } },
  rounds: {
    select: {
      id: true,
      roundNumber: true,
      roundType: true,
      topics: true,
      difficulty: true,
      questionsAsked: true,
      tips: true,
    },
    orderBy: { roundNumber: 'asc' as const },
  },
} as const;

const ownExperienceSelect = {
  ...publicExperienceSelect,
  moderatedById: true,
  moderatedAt: true,
  rejectionReason: true,
  applicationId: true,
} as const;

// ─── List Approved (Student discovery) ────────────────────────────────────────

export async function listApprovedExperiences(filters: {
  companyName?: string;
  driveId?: string;
  difficulty?: string;
  outcome?: string;
  driveYear?: number;
}) {
  const where: any = { status: ExperienceStatus.APPROVED };

  if (filters.companyName) where.companyName = { contains: filters.companyName, mode: 'insensitive' };
  if (filters.driveId) where.placementDriveId = filters.driveId;
  if (filters.difficulty) where.difficulty = filters.difficulty as ExperienceDifficulty;
  if (filters.outcome) where.outcome = filters.outcome as ExperienceOutcome;
  if (filters.driveYear) where.driveYear = filters.driveYear;

  const experiences = await prisma.driveExperience.findMany({
    where,
    select: publicExperienceSelect,
    orderBy: { createdAt: 'desc' },
    take: 50,
  });

  // Enforce anonymity: strip author identity if anonymous
  return experiences.map(exp => maskAnonymous(exp));
}

// ─── Get Single Approved ───────────────────────────────────────────────────────

export async function getApprovedExperienceById(id: string) {
  const exp = await prisma.driveExperience.findFirst({
    where: { id, status: ExperienceStatus.APPROVED },
    select: publicExperienceSelect,
  });

  if (!exp) {
    throw Object.assign(new Error('Experience not found or not yet approved.'), { code: 'NOT_FOUND', statusCode: 404 });
  }

  return maskAnonymous(exp);
}

// ─── Submit (Student or Alumni) ────────────────────────────────────────────────

export async function submitExperience(userId: string, role: string, data: {
  placementDriveId?: string;
  applicationId?: string;
  companyName: string;
  role: string;
  driveYear: number;
  difficulty?: ExperienceDifficulty;
  outcome?: ExperienceOutcome;
  isAnonymous?: boolean;
  overallRating?: number;
  overallTips?: string;
  narrative?: string;
  rounds?: Array<{
    roundNumber: number;
    roundType: string;
    topics?: string[];
    difficulty?: string;
    questionsAsked?: string;
    tips?: string;
  }>;
}) {
  // Validate rating bounds
  if (data.overallRating !== undefined && (data.overallRating < 1 || data.overallRating > 5)) {
    throw Object.assign(new Error('overallRating must be between 1 and 5.'), { code: 'VALIDATION_ERROR', statusCode: 400 });
  }

  // Validate driveYear is reasonable
  const currentYear = new Date().getFullYear();
  if (data.driveYear < 1990 || data.driveYear > currentYear + 1) {
    throw Object.assign(new Error('Invalid driveYear.'), { code: 'VALIDATION_ERROR', statusCode: 400 });
  }

  let alumniProfileId: string | undefined;
  let studentId: string | undefined;

  if (role === 'ALUMNI') {
    const profile = await prisma.alumniProfile.findUnique({
      where: { userId },
      select: { id: true, verification: { select: { status: true } } },
    });
    if (!profile || profile.verification?.status !== 'APPROVED') {
      throw Object.assign(new Error('Your alumni profile must be verified to submit experiences.'), { code: 'FORBIDDEN', statusCode: 403 });
    }
    alumniProfileId = profile.id;
  } else if (role === 'STUDENT') {
    const student = await prisma.student.findUnique({ where: { userId }, select: { id: true } });
    if (!student) {
      throw Object.assign(new Error('Student profile not found.'), { code: 'NOT_FOUND', statusCode: 404 });
    }
    studentId = student.id;

    // If applicationId provided, verify ownership
    if (data.applicationId) {
      const app = await prisma.application.findFirst({
        where: { id: data.applicationId, studentId: student.id },
        select: { id: true, placementDriveId: true },
      });
      if (!app) {
        throw Object.assign(new Error('Application not found or does not belong to you.'), { code: 'FORBIDDEN', statusCode: 403 });
      }
      // Enforce one experience per application
      const existing = await prisma.driveExperience.findUnique({ where: { applicationId: data.applicationId } });
      if (existing) {
        throw Object.assign(new Error('An experience already exists for this application.'), { code: 'CONFLICT', statusCode: 409 });
      }
    }
  } else {
    throw Object.assign(new Error('Only students and verified alumni may submit experiences.'), { code: 'FORBIDDEN', statusCode: 403 });
  }

  const exp = await prisma.driveExperience.create({
    data: {
      alumniProfileId,
      studentId,
      placementDriveId: data.placementDriveId ?? null,
      applicationId: data.applicationId ?? null,
      companyName: data.companyName.trim(),
      role: data.role.trim(),
      driveYear: data.driveYear,
      difficulty: data.difficulty ?? null,
      outcome: data.outcome ?? ExperienceOutcome.PREFER_NOT_TO_SAY,
      isAnonymous: data.isAnonymous ?? false,
      overallRating: data.overallRating ?? null,
      overallTips: data.overallTips?.trim() ?? null,
      narrative: data.narrative?.trim() ?? null,
      status: ExperienceStatus.PENDING,
      rounds: data.rounds ? {
        create: data.rounds.map(r => ({
          roundNumber: r.roundNumber,
          roundType: r.roundType as any,
          topics: r.topics ?? [],
          difficulty: r.difficulty ?? null,
          questionsAsked: r.questionsAsked?.trim() ?? null,
          tips: r.tips?.trim() ?? null,
        })),
      } : undefined,
    },
    select: ownExperienceSelect,
  });

  return exp;
}

// ─── Get Own Experiences ───────────────────────────────────────────────────────

export async function getMyExperiences(userId: string, role: string) {
  if (role === 'ALUMNI') {
    const profile = await prisma.alumniProfile.findUnique({ where: { userId }, select: { id: true } });
    if (!profile) return [];
    return prisma.driveExperience.findMany({
      where: { alumniProfileId: profile.id },
      select: ownExperienceSelect,
      orderBy: { createdAt: 'desc' },
    });
  } else {
    const student = await prisma.student.findUnique({ where: { userId }, select: { id: true } });
    if (!student) return [];
    return prisma.driveExperience.findMany({
      where: { studentId: student.id },
      select: ownExperienceSelect,
      orderBy: { createdAt: 'desc' },
    });
  }
}

// ─── Officer: List Pending ─────────────────────────────────────────────────────

export async function listPendingExperiences() {
  return prisma.driveExperience.findMany({
    where: { status: ExperienceStatus.PENDING },
    select: ownExperienceSelect,
    orderBy: { createdAt: 'asc' },
  });
}

// ─── Officer: Approve ─────────────────────────────────────────────────────────

export async function approveExperience(experienceId: string, officerUserId: string) {
  const exp = await prisma.driveExperience.findUnique({ where: { id: experienceId }, select: { id: true, status: true } });
  if (!exp) throw Object.assign(new Error('Experience not found.'), { code: 'NOT_FOUND', statusCode: 404 });
  if (exp.status !== ExperienceStatus.PENDING) {
    throw Object.assign(new Error(`Cannot approve: experience is already ${exp.status}.`), { code: 'CONFLICT', statusCode: 409 });
  }

  const updated = await prisma.driveExperience.update({
    where: { id: experienceId },
    data: { status: ExperienceStatus.APPROVED, moderatedById: officerUserId, moderatedAt: new Date() },
    select: ownExperienceSelect,
  });

  // Audit
  await prisma.auditLog.create({ data: { actorUserId: officerUserId, action: 'EXPERIENCE_APPROVED', entityType: 'DriveExperience', entityId: experienceId } });
  return updated;
}

// ─── Officer: Reject ──────────────────────────────────────────────────────────

export async function rejectExperience(experienceId: string, officerUserId: string, reason: string) {
  const exp = await prisma.driveExperience.findUnique({ where: { id: experienceId }, select: { id: true, status: true } });
  if (!exp) throw Object.assign(new Error('Experience not found.'), { code: 'NOT_FOUND', statusCode: 404 });
  if (exp.status !== ExperienceStatus.PENDING) {
    throw Object.assign(new Error(`Cannot reject: experience is already ${exp.status}.`), { code: 'CONFLICT', statusCode: 409 });
  }

  const updated = await prisma.driveExperience.update({
    where: { id: experienceId },
    data: { status: ExperienceStatus.REJECTED, moderatedById: officerUserId, moderatedAt: new Date(), rejectionReason: reason },
    select: ownExperienceSelect,
  });

  await prisma.auditLog.create({ data: { actorUserId: officerUserId, action: 'EXPERIENCE_REJECTED', entityType: 'DriveExperience', entityId: experienceId, metadata: { reason } } });
  return updated;
}

// ─── Helper: mask anonymous authors ───────────────────────────────────────────

function maskAnonymous<T extends { isAnonymous: boolean; alumniProfile?: any; student?: any }>(exp: T): T {
  if (exp.isAnonymous) {
    return { ...exp, alumniProfile: null, student: null };
  }
  return exp;
}
