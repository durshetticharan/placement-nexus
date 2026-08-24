/**
 * skillGapService.ts
 *
 * Frontend API client for Phase 8 Skill Gap Analysis endpoints.
 * Provides typed access to:
 *   POST /api/v1/career/me/skill-gap  — trigger analysis
 *   GET  /api/v1/career/me/skill-gap  — read saved results
 */

import api from './api';

// ── Types ─────────────────────────────────────────────────────────────────────

export type GapLevel = 'STRONG' | 'MODERATE' | 'WEAK' | 'MISSING';
export type RequirementPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type ProficiencyLevel = 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED' | 'EXPERT';

export interface AssessmentEvidence {
  title: string;
  topic: string;
  percentage: number;
  matchType: 'exact' | 'fuzzy';
}

export interface CodingEvidence {
  platform: string;
  username: string;
  signal: string;
  mappedScore: number;
}

export interface SkillEvidence {
  assessmentScore: number | null;
  assessmentDetails: AssessmentEvidence[];
  assessmentAvailable: boolean;
  selfRatingScore: number | null;
  selfRatingLevel: string | null;
  selfRatingAvailable: boolean;
  codingScore: number | null;
  codingDetails: CodingEvidence[];
  codingAvailable: boolean;
  finalScore: number;
  weightsUsed: {
    assessment: number;
    selfRating: number;
    coding: number;
  };
}

export interface SkillGapResult {
  skillId: string;
  skillName: string;
  skillCategory: string | null;
  requiredLevel: ProficiencyLevel;
  priority: RequirementPriority;
  evidenceScore: number;
  gapLevel: GapLevel;
  evidence: SkillEvidence;
  contributingFactors: Record<string, unknown>;
}

export interface SuggestedResource {
  id: string;
  title: string;
  description?: string | null;
  resourceType: string;
  url: string;
  provider?: string | null;
}

export interface SavedSkillGap {
  id: string;
  skillId: string;
  skill: { id: string; name: string; category: string | null };
  gapLevel: GapLevel;
  evidenceScore: number;
  priority: RequirementPriority;
  contributingFactors: Record<string, unknown>;
  computedAt: string;
  suggestedResources: SuggestedResource[];
}

export interface GapSummary {
  STRONG: number;
  MODERATE: number;
  WEAK: number;
  MISSING: number;
}

// Response from POST (fresh computation — includes full evidence)
export interface ComputeGapResponse {
  careerPath: { id: string; name: string };
  gaps: SkillGapResult[];
  computedAt: string;
  totalSkills: number;
  summary: GapSummary;
}

// Response from GET (saved results — lighter, includes suggested resources)
export interface GetGapResponse {
  studentId: string;
  gaps: SavedSkillGap[];
  totalSkills: number;
  summary: GapSummary;
  hasBeenComputed: boolean;
}

// ── API Functions ─────────────────────────────────────────────────────────────

function getAuthHeader() {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

/**
 * Trigger (or re-trigger) skill gap computation.
 * Returns the full structured results with evidence details.
 *
 * @param careerPathId - Optional; if omitted, uses the student's primary goal
 */
export async function triggerSkillGapAnalysis(careerPathId?: string): Promise<ComputeGapResponse> {
  const res = await api.post(
    '/career/me/skill-gap',
    {},
    {
      headers: getAuthHeader(),
      params: careerPathId ? { careerPathId } : {},
    },
  );
  return res.data.data as ComputeGapResponse;
}

/**
 * Read previously computed skill gaps from the database.
 * Does NOT trigger recomputation.
 *
 * @param careerPathId - Optional filter
 */
export async function getSkillGapAnalysis(careerPathId?: string): Promise<GetGapResponse> {
  const res = await api.get('/career/me/skill-gap', {
    headers: getAuthHeader(),
    params: careerPathId ? { careerPathId } : {},
  });
  return res.data.data as GetGapResponse;
}
