/**
 * readinessEngine.service.ts
 *
 * PURE COMPUTATION ENGINE — no database I/O, no side effects.
 * Computes Placement Readiness based on evidence from Phases 4, 5, 6, and 8.
 *
 * Design principles:
 * 1. Deterministic output.
 * 2. Evidence-backed explanations (strengths, weaknesses, recommendations).
 * 3. Base weights: Skill Gap (40%), Assessments (30%), Profile (10%), Resume (10%), Coding/Projects (10%).
 * 4. Missing required evidence (like no assessments taken) yields 0 points,
 *    but if a career has NO skills defined, the skill gap weight is redistributed.
 */

import { RequirementPriority } from '@prisma/client';

export type ReadinessState = 'READY' | 'NEARLY_READY' | 'DEVELOPING' | 'NOT_READY';

export interface ReadinessInput {
  hasCareerGoal: boolean;
  skillGaps: {
    skillName: string;
    gapLevel: string; // 'STRONG' | 'MODERATE' | 'WEAK' | 'MISSING'
    evidenceScore: number;
    priority: RequirementPriority;
  }[];
  assessments: {
    title: string;
    percentage: number;
  }[];
  profileCompletionPct: number;
  hasResume: boolean;
  hasCodingProfile: boolean;
  hasProjects: boolean;
}

export interface ReadinessComponent {
  score: number;
  maxScore: number;
}

export interface ReadinessResult {
  overallScore: number;
  status: ReadinessState;
  strengths: string[];
  weaknesses: string[];
  recommendations: string[];
  components: {
    skillGap: ReadinessComponent;
    assessment: ReadinessComponent;
    profile: ReadinessComponent;
    resume: ReadinessComponent;
    practical: ReadinessComponent; // Coding + Projects
  };
}

const PRIORITY_WEIGHTS: Record<RequirementPriority, number> = {
  CRITICAL: 3,
  HIGH: 2,
  MEDIUM: 1,
  LOW: 0.5,
};

export function computeReadiness(input: ReadinessInput): ReadinessResult {
  if (!input.hasCareerGoal) {
    return {
      overallScore: 0,
      status: 'NOT_READY',
      strengths: [],
      weaknesses: ['No active career goal selected.'],
      recommendations: ['Select a career goal to calculate placement readiness.'],
      components: {
        skillGap: { score: 0, maxScore: 0 },
        assessment: { score: 0, maxScore: 0 },
        profile: { score: 0, maxScore: 0 },
        resume: { score: 0, maxScore: 0 },
        practical: { score: 0, maxScore: 0 },
      },
    };
  }

  const strengths: string[] = [];
  const weaknesses: string[] = [];
  const recommendations: string[] = [];

  // Base Weights
  let maxSkillGap = 40;
  let maxAssessment = 30;
  let maxProfile = 10;
  let maxResume = 10;
  let maxPractical = 10;

  // 1. Skill Gap Component (40%)
  let skillGapScore = 0;
  if (input.skillGaps.length === 0) {
    // Redistribute weight if NO skills are required for the career path
    weaknesses.push('Skill-gap analysis is not yet available (No required skills).');
    const redistributed = maxSkillGap / 4;
    maxAssessment += redistributed;
    maxProfile += redistributed;
    maxResume += redistributed;
    maxPractical += redistributed;
    maxSkillGap = 0;
  } else {
    let totalPriorityWeight = 0;
    let weightedScoreSum = 0;

    for (const gap of input.skillGaps) {
      const pWeight = PRIORITY_WEIGHTS[gap.priority];
      totalPriorityWeight += pWeight;
      weightedScoreSum += gap.evidenceScore * pWeight;

      if (gap.gapLevel === 'STRONG') {
        strengths.push(`Strong evidence in ${gap.skillName}`);
      } else if (gap.gapLevel === 'MISSING') {
        weaknesses.push(`Missing skill: ${gap.skillName} (${gap.priority} priority)`);
        if (gap.priority === 'HIGH' || gap.priority === 'CRITICAL') {
          recommendations.push(`Learn ${gap.skillName}.`);
        }
      } else if (gap.gapLevel === 'WEAK') {
        weaknesses.push(`Weak skill: ${gap.skillName} (${gap.priority} priority)`);
        if (gap.priority === 'HIGH' || gap.priority === 'CRITICAL') {
          recommendations.push(`Improve ${gap.skillName} through the associated learning path.`);
        }
      }
    }

    const averageSkillPct = totalPriorityWeight > 0 ? (weightedScoreSum / totalPriorityWeight) : 0;
    skillGapScore = (averageSkillPct / 100) * maxSkillGap;
  }

  // 2. Assessment Component (30%)
  let assessmentScore = 0;
  if (input.assessments.length === 0) {
    weaknesses.push('No assessment evidence available.');
    recommendations.push('Complete relevant assessments to build readiness evidence.');
  } else {
    // Best assessment score
    const bestPct = Math.max(...input.assessments.map(a => a.percentage));
    assessmentScore = (bestPct / 100) * maxAssessment;

    if (bestPct >= 75) {
      strengths.push(`Strong assessment performance (${bestPct.toFixed(0)}%)`);
    } else if (bestPct < 50) {
      weaknesses.push(`Low assessment performance (${bestPct.toFixed(0)}%)`);
      recommendations.push('Retake technical assessment to improve score.');
    }
  }

  // 3. Profile Component (10%)
  const profileScore = (input.profileCompletionPct / 100) * maxProfile;
  if (input.profileCompletionPct >= 90) {
    strengths.push(`Profile is highly complete (${input.profileCompletionPct}%)`);
  } else {
    weaknesses.push(`Profile is incomplete (${input.profileCompletionPct}%)`);
    recommendations.push('Complete missing profile sections.');
  }

  // 4. Resume Component (10%)
  let resumeScore = 0;
  if (input.hasResume) {
    resumeScore = maxResume;
    strengths.push('Resume uploaded');
  } else {
    weaknesses.push('Resume not uploaded.');
    recommendations.push('Upload a resume.');
  }

  // 5. Practical Evidence Component (10%)
  let practicalScore = 0;
  const codingPoints = maxPractical / 2;
  const projectPoints = maxPractical / 2;

  if (input.hasCodingProfile) {
    practicalScore += codingPoints;
    strengths.push('Coding profile configured');
  } else {
    weaknesses.push('No coding profile configured.');
    recommendations.push('Link a coding profile (e.g. GitHub, LeetCode).');
  }

  if (input.hasProjects) {
    practicalScore += projectPoints;
    strengths.push('Project evidence available');
  } else {
    weaknesses.push('No project evidence available.');
    recommendations.push('Add academic or personal projects to your profile.');
  }

  // Overall Score
  const totalScoreRaw = skillGapScore + assessmentScore + profileScore + resumeScore + practicalScore;
  const overallScore = Math.round(totalScoreRaw);

  // Status Classification
  let status: ReadinessState = 'NOT_READY';
  if (overallScore >= 85) status = 'READY';
  else if (overallScore >= 65) status = 'NEARLY_READY';
  else if (overallScore >= 40) status = 'DEVELOPING';

  return {
    overallScore,
    status,
    strengths,
    weaknesses,
    recommendations,
    components: {
      skillGap: { score: Math.round(skillGapScore), maxScore: maxSkillGap },
      assessment: { score: Math.round(assessmentScore), maxScore: maxAssessment },
      profile: { score: Math.round(profileScore), maxScore: maxProfile },
      resume: { score: Math.round(resumeScore), maxScore: maxResume },
      practical: { score: Math.round(practicalScore), maxScore: maxPractical },
    },
  };
}
