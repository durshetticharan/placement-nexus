/**
 * skillGap.service.ts
 *
 * Orchestration layer for Skill Gap Analysis (Phase 8).
 * Handles I/O: resolves student identity, loads evidence from DB,
 * calls the pure engine, persists results, and returns structured output.
 *
 * This is the only service that touches the database AND the engine.
 * Controllers call this layer — never the engine directly.
 */

import { ServiceError } from './careerPath.service';
import * as skillGapRepo from '../repositories/skillGap.repository';
import * as skillGapEngine from './skillGapEngine.service';
import type {
  AssessmentAttemptInput,
  CodingProfileInput,
  RequiredSkillInput,
  StudentSkillInput,
  SkillGapResult,
} from './skillGapEngine.service';

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Safely parse a Prisma Json field into a plain object.
 * Returns null if the value is null, undefined, or not parseable.
 */
function safeParseJson(value: unknown): Record<string, unknown> | null {
  if (value === null || value === undefined) return null;
  if (typeof value === 'object') return value as Record<string, unknown>;
  if (typeof value === 'string') {
    try {
      return JSON.parse(value) as Record<string, unknown>;
    } catch {
      return null;
    }
  }
  return null;
}

// ── Main: compute and save ────────────────────────────────────────────────────

/**
 * Trigger (or re-trigger) skill gap computation for a student.
 *
 * Steps:
 *  1. Resolve student identity from userId
 *  2. Resolve target career path (explicit param or primary goal)
 *  3. Load all evidence from DB in a single query
 *  4. Call pure engine to compute gaps
 *  5. Upsert all gap records (idempotent)
 *  6. Return full structured results
 *
 * @param userId       - From JWT (req.user.userId)
 * @param careerPathId - Optional override; if absent, uses student's primary goal
 */
export async function computeAndSaveGaps(
  userId: string,
  careerPathId?: string,
): Promise<{
  careerPath: { id: string; name: string };
  gaps: SkillGapResult[];
  computedAt: string;
  totalSkills: number;
  summary: { STRONG: number; MODERATE: number; WEAK: number; MISSING: number };
}> {
  // Step 1: Resolve student
  const student = await skillGapRepo.findStudentByUserId(userId);
  if (!student) {
    throw new ServiceError(404, 'NOT_FOUND', 'Student profile not found.');
  }

  // Step 2: Resolve career path
  let resolvedCareerPathId = careerPathId;
  if (!resolvedCareerPathId) {
    const primaryGoal = await skillGapRepo.findStudentPrimaryGoal(student.id);
    if (!primaryGoal) {
      throw new ServiceError(
        400,
        'NO_CAREER_GOAL',
        'No career goal set. Please set a primary career goal before running skill gap analysis.',
      );
    }
    resolvedCareerPathId = primaryGoal.careerPathId;
  }

  const careerPath = await skillGapRepo.findCareerPathWithRequirements(resolvedCareerPathId);
  if (!careerPath) {
    throw new ServiceError(404, 'NOT_FOUND', 'Career path not found.');
  }
  if (!careerPath.isActive) {
    throw new ServiceError(400, 'BAD_REQUEST', 'Cannot analyze gaps for an inactive career path.');
  }
  if (careerPath.skillRequirements.length === 0) {
    throw new ServiceError(
      400,
      'NO_SKILL_REQUIREMENTS',
      'This career path has no skill requirements defined. Ask a Placement Officer to add required skills first.',
    );
  }

  // Step 3: Load all student evidence
  const studentData = await skillGapRepo.loadStudentEvidence(student.id);
  if (!studentData) {
    throw new ServiceError(404, 'NOT_FOUND', 'Student data not found.');
  }

  // Step 4: Shape data for engine

  const requiredSkills: RequiredSkillInput[] = careerPath.skillRequirements.map((req) => ({
    skillId: req.skillId,
    skillName: req.skill.name,
    skillCategory: req.skill.category,
    requiredLevel: req.requiredLevel,
    priority: req.priority,
  }));

  const studentSkills: StudentSkillInput[] = studentData.skills.map((ss) => ({
    skillId: ss.skillId,
    skillName: ss.skill.name,
    selfRating: ss.selfRating,
  }));

  const assessmentAttempts: AssessmentAttemptInput[] = studentData.assessmentAttempts
    .filter((a) => a.result !== null)
    .map((a) => ({
      id: a.id,
      assessmentTitle: a.assessment.title,
      assessmentTopic: a.assessment.topic,
      assessmentCategory: a.assessment.category,
      percentageScore: Number(a.result!.percentage),
      topicBreakdown: safeParseJson(a.result!.topicBreakdown) as Record<string, number> | null,
    }));

  const codingProfiles: CodingProfileInput[] = studentData.codingProfiles.map((cp) => ({
    platform: cp.platform,
    username: cp.username,
    statistics: safeParseJson(cp.statistics),
    syncStatus: cp.syncStatus,
  }));

  // Step 5: Run pure engine
  const gaps = skillGapEngine.computeAllGaps(
    requiredSkills,
    studentSkills,
    assessmentAttempts,
    codingProfiles,
  );

  // Step 6: Persist results (upsert — idempotent)
  await Promise.all(
    gaps.map((gap) =>
      skillGapRepo.upsertSkillGap(student.id, gap.skillId, {
        gapLevel: gap.gapLevel,
        evidenceScore: gap.evidenceScore,
        priority: gap.priority,
        contributingFactors: gap.contributingFactors,
      }),
    ),
  );

  // Build summary
  const summary = { STRONG: 0, MODERATE: 0, WEAK: 0, MISSING: 0 };
  for (const gap of gaps) {
    summary[gap.gapLevel]++;
  }

  return {
    careerPath: { id: careerPath.id, name: careerPath.name },
    gaps,
    computedAt: new Date().toISOString(),
    totalSkills: gaps.length,
    summary,
  };
}

// ── Read existing gaps ────────────────────────────────────────────────────────

/**
 * Returns previously computed skill gaps from the database.
 * Does NOT recompute — use computeAndSaveGaps for that.
 * Returns null careerPath if no gaps are found.
 */
export async function getGapAnalysis(userId: string, careerPathId?: string) {
  const student = await skillGapRepo.findStudentByUserId(userId);
  if (!student) {
    throw new ServiceError(404, 'NOT_FOUND', 'Student profile not found.');
  }

  const gaps = await skillGapRepo.getSkillGapsForStudent(student.id, careerPathId);

  // Attach learning resources for non-STRONG skills
  const gapsWithResources = await Promise.all(
    gaps.map(async (gap) => {
      const suggestedResources =
        gap.gapLevel !== 'STRONG'
          ? await skillGapRepo.getLearningResourcesForSkill(gap.skillId)
          : [];

      return {
        ...gap,
        // Parse JSON fields (Prisma returns them as unknown)
        contributingFactors: safeParseJson(gap.contributingFactors) ?? {},
        suggestedResources,
      };
    }),
  );

  // Summary
  const summary = { STRONG: 0, MODERATE: 0, WEAK: 0, MISSING: 0 };
  for (const gap of gapsWithResources) {
    summary[gap.gapLevel as keyof typeof summary]++;
  }

  return {
    studentId: student.id,
    gaps: gapsWithResources,
    totalSkills: gapsWithResources.length,
    summary,
    hasBeenComputed: gapsWithResources.length > 0,
  };
}
