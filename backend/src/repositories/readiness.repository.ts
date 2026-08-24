import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function getStudentReadinessData(studentId: string, careerPathId?: string) {
  // 1. Get primary career goal if no careerPathId provided
  let targetCareerPathId = careerPathId;
  if (!targetCareerPathId) {
    const goal = await prisma.studentCareerGoal.findFirst({
      where: { studentId, isPrimary: true },
    });
    if (!goal) return null; // no career goal
    targetCareerPathId = goal.careerPathId;
  }

  // 2. Fetch student profile and evidence
  const student = await prisma.student.findUnique({
    where: { id: studentId },
    include: {
      resumes: { take: 1 },
      codingProfiles: {
        where: {
          syncStatus: { in: ['SYNCED', 'MANUAL_ONLY'] }
        },
        take: 1
      },
      projects: { take: 1 },
      assessmentAttempts: {
        where: { status: 'EVALUATED', result: { isNot: null } },
        include: { assessment: true, result: true }
      }
    }
  });

  if (!student) return null;

  // 3. Fetch Skill Gaps specifically for the target career path
  // Since skill gaps are mapped per skill, and career path dictates which skills are required,
  // Phase 8 saves gaps for required skills. We fetch gaps where skill is required by careerPathId.
  const requiredSkills = await prisma.careerSkillRequirement.findMany({
    where: { careerPathId: targetCareerPathId },
    select: { skillId: true, priority: true }
  });

  const skillIds = requiredSkills.map(r => r.skillId);

  const skillGaps = await prisma.skillGap.findMany({
    where: {
      studentId,
      skillId: { in: skillIds }
    },
    include: { skill: true }
  });

  // Map priority from requirements
  const priorityMap = new Map(requiredSkills.map(r => [r.skillId, r.priority]));

  return {
    student,
    careerPathId: targetCareerPathId,
    skillGaps: skillGaps.map(g => ({
      skillName: g.skill.name,
      gapLevel: g.gapLevel,
      evidenceScore: g.evidenceScore,
      priority: priorityMap.get(g.skillId)!
    }))
  };
}

export async function saveReadinessScore(
  studentId: string,
  careerPathId: string,
  overallScore: number,
  breakdown: any
) {
  // We upsert based on the first record that matches studentId and careerPathId
  // But ReadinessScore doesn't have a unique constraint on [studentId, careerPathId].
  // So we manually find and update, or create.
  const existing = await prisma.readinessScore.findFirst({
    where: { studentId, careerPathId, placementDriveId: null }
  });

  if (existing) {
    return prisma.readinessScore.update({
      where: { id: existing.id },
      data: {
        overallScore,
        breakdown,
        computedAt: new Date()
      }
    });
  }

  return prisma.readinessScore.create({
    data: {
      studentId,
      careerPathId,
      overallScore,
      breakdown
    }
  });
}

export async function getLatestReadinessScore(studentId: string, careerPathId?: string) {
  if (careerPathId) {
    return prisma.readinessScore.findFirst({
      where: { studentId, careerPathId, placementDriveId: null },
      orderBy: { computedAt: 'desc' }
    });
  } else {
    // If no specific path, just get the most recent overall score
    return prisma.readinessScore.findFirst({
      where: { studentId, placementDriveId: null },
      orderBy: { computedAt: 'desc' }
    });
  }
}
