/**
 * skillGap.repository.ts
 *
 * All database I/O for Phase 8 Skill Gap Analysis.
 * This layer is intentionally thin — no business logic lives here.
 * All computation happens in skillGapEngine.service.ts.
 */

import { PrismaClient, GapLevel, RequirementPriority } from '@prisma/client';

const prisma = new PrismaClient();

// ── Identity resolution ────────────────────────────────────────────────────────

export async function findStudentByUserId(userId: string) {
  return prisma.student.findUnique({
    where: { userId },
    select: { id: true, fullName: true },
  });
}

// ── Evidence loading ───────────────────────────────────────────────────────────

/**
 * Load all evidence needed for skill gap computation in a single round-trip.
 * Returns the student's skills, all completed assessment attempts with results,
 * and all coding profiles.
 */
export async function loadStudentEvidence(studentId: string) {
  return prisma.student.findUnique({
    where: { id: studentId },
    select: {
      id: true,
      fullName: true,

      // Self-rated skills (StudentSkill)
      skills: {
        select: {
          skillId: true,
          selfRating: true,
          evidenceScore: true,
          skill: {
            select: { id: true, name: true, category: true },
          },
        },
      },

      // Completed assessment attempts with full result + assessment topic
      assessmentAttempts: {
        where: { status: 'EVALUATED' },
        select: {
          id: true,
          assessment: {
            select: {
              id: true,
              title: true,
              topic: true,       // e.g. "DSA", "DBMS", "Java" — used for skill matching
              category: true,
            },
          },
          result: {
            select: {
              percentage: true,
              topicBreakdown: true,
            },
          },
        },
      },

      // Coding profiles with platform statistics JSON
      codingProfiles: {
        select: {
          platform: true,
          username: true,
          statistics: true,
          syncStatus: true,
        },
      },
    },
  });
}

// ── Career path requirements ───────────────────────────────────────────────────

export async function findCareerPathWithRequirements(careerPathId: string) {
  return prisma.careerPath.findUnique({
    where: { id: careerPathId },
    include: {
      skillRequirements: {
        include: {
          skill: {
            select: { id: true, name: true, category: true },
          },
        },
      },
    },
  });
}

export async function findStudentPrimaryGoal(studentId: string) {
  return prisma.studentCareerGoal.findFirst({
    where: { studentId, isPrimary: true },
    select: {
      careerPathId: true,
      careerPath: {
        select: { id: true, name: true, isActive: true },
      },
    },
  });
}

// ── Skill Gap persistence ──────────────────────────────────────────────────────

export interface SkillGapUpsertData {
  gapLevel: GapLevel;
  evidenceScore: number;
  priority: RequirementPriority;
  contributingFactors: object;
}

/**
 * Idempotent write — if a gap record already exists for this student+skill,
 * update it. Otherwise create it. Uses computedAt = now() on every write
 * so the consumer always knows when the analysis was last run.
 */
export async function upsertSkillGap(
  studentId: string,
  skillId: string,
  data: SkillGapUpsertData,
) {
  return prisma.skillGap.upsert({
    where: {
      studentId_skillId: { studentId, skillId },
    },
    create: {
      studentId,
      skillId,
      gapLevel: data.gapLevel,
      evidenceScore: data.evidenceScore,
      priority: data.priority,
      contributingFactors: data.contributingFactors,
      computedAt: new Date(),
    },
    update: {
      gapLevel: data.gapLevel,
      evidenceScore: data.evidenceScore,
      priority: data.priority,
      contributingFactors: data.contributingFactors,
      computedAt: new Date(),
    },
    include: {
      skill: {
        select: { id: true, name: true, category: true },
      },
    },
  });
}

/**
 * Read existing skill gap records for a student.
 * Optionally filtered to skills that belong to a specific career path.
 */
export async function getSkillGapsForStudent(studentId: string, careerPathId?: string) {
  if (careerPathId) {
    // Only return gaps that correspond to skills required by this career path
    const careerPath = await prisma.careerPath.findUnique({
      where: { id: careerPathId },
      select: {
        skillRequirements: {
          select: { skillId: true, priority: true, requiredLevel: true },
        },
      },
    });

    const requiredSkillIds = new Set(
      careerPath?.skillRequirements.map((r) => r.skillId) ?? [],
    );

    const gaps = await prisma.skillGap.findMany({
      where: { studentId },
      include: {
        skill: {
          select: { id: true, name: true, category: true },
        },
      },
      orderBy: { evidenceScore: 'asc' }, // weakest first
    });

    return gaps.filter((g) => requiredSkillIds.has(g.skillId));
  }

  return prisma.skillGap.findMany({
    where: { studentId },
    include: {
      skill: {
        select: { id: true, name: true, category: true },
      },
    },
    orderBy: { evidenceScore: 'asc' },
  });
}

// ── Learning resources per skill ───────────────────────────────────────────────

export async function getLearningResourcesForSkill(skillId: string) {
  return prisma.learningResource.findMany({
    where: {
      skills: {
        some: { skillId },
      },
    },
    select: {
      id: true,
      title: true,
      description: true,
      resourceType: true,
      url: true,
      provider: true,
    },
    take: 5, // cap to avoid over-fetching
  });
}
