import * as readinessRepo from '../repositories/readiness.repository';
import * as readinessEngine from './readinessEngine.service';

/**
 * Computes readiness for a student, saving it to the database,
 * and returning the fully structured response.
 */
export async function computeAndSaveReadiness(studentId: string, careerPathId?: string) {
  const data = await readinessRepo.getStudentReadinessData(studentId, careerPathId);
  
  if (!data) {
    // This happens if the student does not have a career goal and no careerPathId is passed
    // We run the engine in a forced "no goal" state to get the empty state response.
    const emptyResult = readinessEngine.computeReadiness({
      hasCareerGoal: false,
      skillGaps: [],
      assessments: [],
      profileCompletionPct: 0,
      hasResume: false,
      hasCodingProfile: false,
      hasProjects: false
    });
    return {
      careerPathId: null,
      ...emptyResult
    };
  }

  const { student, careerPathId: targetPathId, skillGaps } = data;

  // Prepare input for engine
  const assessments = student.assessmentAttempts.map(a => ({
    title: a.assessment.title,
    percentage: Number(a.result!.percentage)
  }));

  const input: readinessEngine.ReadinessInput = {
    hasCareerGoal: true,
    skillGaps,
    assessments,
    profileCompletionPct: student.profileCompletionPct,
    hasResume: student.resumes.length > 0,
    hasCodingProfile: student.codingProfiles.length > 0,
    hasProjects: student.projects.length > 0
  };

  const result = readinessEngine.computeReadiness(input);

  // Save the result
  await readinessRepo.saveReadinessScore(
    student.id,
    targetPathId,
    result.overallScore,
    result
  );

  return {
    careerPathId: targetPathId,
    ...result
  };
}

/**
 * Retrieves the latest readiness score from DB without recomputing.
 */
export async function getReadinessScore(studentId: string, careerPathId?: string) {
  const record = await readinessRepo.getLatestReadinessScore(studentId, careerPathId);
  if (!record) {
    // If no computed score exists, we can return null or trigger a computation.
    // Standard is to let the frontend know it's not computed.
    return null;
  }

  // The DB stores the full result in the `breakdown` JSON field.
  const breakdown = typeof record.breakdown === 'string' 
    ? JSON.parse(record.breakdown) 
    : record.breakdown;

  return {
    careerPathId: record.careerPathId,
    overallScore: record.overallScore,
    computedAt: record.computedAt,
    ...(breakdown as Omit<readinessEngine.ReadinessResult, 'overallScore'>)
  };
}
