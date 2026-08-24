/**
 * skillGapEngine.service.ts
 *
 * PURE COMPUTATION ENGINE — no database I/O, no side effects.
 * Takes pre-loaded data, returns deterministic SkillGapResult[].
 *
 * Design principles:
 * 1. Never fabricate evidence. If a source has no data, it is absent.
 * 2. Weight redistribution — if a source is absent, its weight flows to
 *    the remaining sources proportionally so the total always = 1.0.
 * 3. Every non-MISSING result includes full evidence so the student
 *    can see exactly why they received that classification.
 * 4. Assessment matching is case-insensitive fuzzy substring match on
 *    the Assessment.topic vs Skill.name to handle common naming
 *    variations (e.g. "DSA" matches "Data Structures & Algorithms").
 *
 * Gap Level Thresholds:
 *   MISSING  : score 0–24 (or zero evidence)
 *   WEAK     : score 25–49
 *   MODERATE : score 50–74
 *   STRONG   : score 75–100
 */

import { GapLevel, ProficiencyLevel, RequirementPriority } from '@prisma/client';

// ── Input Types ────────────────────────────────────────────────────────────────

export interface RequiredSkillInput {
  skillId: string;
  skillName: string;
  skillCategory: string | null;
  requiredLevel: ProficiencyLevel;
  priority: RequirementPriority;
}

export interface StudentSkillInput {
  skillId: string;
  skillName: string;
  selfRating: ProficiencyLevel;
}

export interface AssessmentAttemptInput {
  id: string;
  assessmentTitle: string;
  assessmentTopic: string;       // Assessment.topic — used for skill matching
  assessmentCategory: string;
  percentageScore: number;       // 0-100
  topicBreakdown: Record<string, number> | null;
}

export interface CodingProfileInput {
  platform: string;
  username: string;
  statistics: Record<string, unknown> | null;
  syncStatus: string;
}

// ── Output Types ───────────────────────────────────────────────────────────────

export interface AssessmentEvidence {
  assessmentId?: string;
  title: string;
  topic: string;
  percentage: number;
  matchType: 'exact' | 'fuzzy'; // how the topic was matched to the skill
}

export interface CodingEvidence {
  platform: string;
  username: string;
  signal: string;  // human-readable description of what was used
  rawValue: unknown;
  mappedScore: number;
}

export interface SkillEvidence {
  // Assessment source
  assessmentScore: number | null;  // best matching assessment score 0-100
  assessmentDetails: AssessmentEvidence[];
  assessmentAvailable: boolean;

  // Self-rating source
  selfRatingScore: number | null;  // mapped from ProficiencyLevel: BEGINNER=25...EXPERT=100
  selfRatingLevel: string | null;
  selfRatingAvailable: boolean;

  // Coding profile source
  codingScore: number | null;
  codingDetails: CodingEvidence[];
  codingAvailable: boolean;

  // Composite
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
  evidenceScore: number;          // 0-100
  gapLevel: GapLevel;
  evidence: SkillEvidence;
  contributingFactors: object;    // stored as JSON in DB
}

// ── Constants ─────────────────────────────────────────────────────────────────

const BASE_WEIGHTS = {
  assessment: 0.50,
  selfRating: 0.30,
  coding: 0.20,
};

const SELF_RATING_MAP: Record<ProficiencyLevel, number> = {
  BEGINNER: 25,
  INTERMEDIATE: 50,
  ADVANCED: 75,
  EXPERT: 100,
};

// ── Skill Matching ────────────────────────────────────────────────────────────

/**
 * Returns true if assessment topic matches skill name.
 * Uses bidirectional case-insensitive substring match.
 * e.g. topic="DSA" matches skill="Data Structures & Algorithms" because
 * "dsa" is contained in common abbreviation forms.
 *
 * Also checks simple normalization: remove special characters and spaces.
 */
export function topicMatchesSkill(assessmentTopic: string, skillName: string): {
  matches: boolean;
  matchType: 'exact' | 'fuzzy';
} {
  const topicLower = assessmentTopic.trim().toLowerCase();
  const skillLower = skillName.trim().toLowerCase();

  // Exact match
  if (topicLower === skillLower) {
    return { matches: true, matchType: 'exact' };
  }

  // Substring match (bidirectional)
  if (topicLower.includes(skillLower) || skillLower.includes(topicLower)) {
    return { matches: true, matchType: 'fuzzy' };
  }

  // Normalised match: remove spaces, punctuation, '&'
  const normalise = (s: string) => s.replace(/[\s&,.-]+/g, '').toLowerCase();
  const normTopic = normalise(assessmentTopic);
  const normSkill = normalise(skillName);

  if (normTopic === normSkill || normTopic.includes(normSkill) || normSkill.includes(normTopic)) {
    return { matches: true, matchType: 'fuzzy' };
  }

  return { matches: false, matchType: 'fuzzy' };
}

// ── Assessment Score Extraction ───────────────────────────────────────────────

/**
 * Finds all completed assessment attempts relevant to a skill by matching
 * the assessment topic against the skill name.
 * Returns the BEST (highest) percentage score, not an average, because
 * we want to measure the student's demonstrated peak competency.
 * Also returns the full list of matching assessments as evidence.
 */
export function extractAssessmentScore(
  skillName: string,
  attempts: AssessmentAttemptInput[],
): { score: number | null; details: AssessmentEvidence[] } {
  const matchingDetails: AssessmentEvidence[] = [];

  for (const attempt of attempts) {
    const { matches, matchType } = topicMatchesSkill(attempt.assessmentTopic, skillName);
    if (matches) {
      matchingDetails.push({
        title: attempt.assessmentTitle,
        topic: attempt.assessmentTopic,
        percentage: attempt.percentageScore,
        matchType,
      });
    }
  }

  if (matchingDetails.length === 0) {
    return { score: null, details: [] };
  }

  // Best score among all matching assessments
  const bestScore = Math.max(...matchingDetails.map((d) => d.percentage));
  return {
    score: Math.round(bestScore), // round to integer for clean display
    details: matchingDetails,
  };
}

// ── Coding Score Extraction ───────────────────────────────────────────────────

/**
 * Maps coding platform statistics to a 0-100 score.
 *
 * Strategy per platform:
 *   LEETCODE:    problemsSolved → 0-300 → linear scale to 0-80, rating → 0-3500 → linear to 0-100
 *   CODECHEF:    rating → 0-3000 → linear to 0-100
 *   CODEFORCES:  rating → 0-3500 → linear to 0-100
 *   GFG:         score → raw GFG score → maps to 0-100 (rough linear)
 *   HACKERRANK:  stars (1-5) → * 20
 *   GITHUB:      publicRepos + followers → rough vitality signal
 *
 * Only platforms with SYNCED status are considered. NOT_SYNCED / FAILED
 * profiles are ignored because their statistics may be stale or absent.
 *
 * Returns the BEST score across all platforms (not averaged) so one strong
 * signal from any platform counts.
 */
export function extractCodingScore(profiles: CodingProfileInput[]): {
  score: number | null;
  details: CodingEvidence[];
} {
  const details: CodingEvidence[] = [];

  for (const profile of profiles) {
    // Skip un-synced profiles — their statistics are unreliable
    if (profile.syncStatus !== 'SYNCED' && profile.syncStatus !== 'MANUAL_ONLY') continue;
    if (!profile.statistics) continue;

    const stats = profile.statistics;
    let mappedScore: number | null = null;
    let signal = '';

    switch (profile.platform.toUpperCase()) {
      case 'LEETCODE': {
        const solved = typeof stats['problemsSolved'] === 'number' ? stats['problemsSolved'] : null;
        const rating = typeof stats['rating'] === 'number' ? stats['rating'] : null;
        if (solved !== null) {
          // 0→0, 150→50, 300+→80
          const fromSolved = Math.min(80, Math.round((solved / 300) * 80));
          // If rating is also available, take the better of the two
          const fromRating = rating !== null ? Math.min(100, Math.round((rating / 3500) * 100)) : 0;
          mappedScore = Math.max(fromSolved, fromRating);
          signal = `${solved} problems solved${rating ? `, rating ${rating}` : ''}`;
        } else if (rating !== null) {
          mappedScore = Math.min(100, Math.round((rating / 3500) * 100));
          signal = `rating ${rating}`;
        }
        break;
      }
      case 'CODECHEF': {
        const rating = typeof stats['rating'] === 'number' ? stats['rating'] : null;
        if (rating !== null) {
          mappedScore = Math.min(100, Math.round((rating / 3000) * 100));
          signal = `rating ${rating}`;
        }
        break;
      }
      case 'CODEFORCES': {
        const rating = typeof stats['rating'] === 'number' ? stats['rating'] : null;
        if (rating !== null) {
          mappedScore = Math.min(100, Math.round((rating / 3500) * 100));
          signal = `rating ${rating}`;
        }
        break;
      }
      case 'GFG': {
        const score = typeof stats['score'] === 'number' ? stats['score'] : null;
        const solved = typeof stats['problemsSolved'] === 'number' ? stats['problemsSolved'] : null;
        if (score !== null) {
          mappedScore = Math.min(100, Math.round((score / 3000) * 100));
          signal = `GFG score ${score}`;
        } else if (solved !== null) {
          mappedScore = Math.min(100, Math.round((solved / 500) * 80));
          signal = `${solved} problems solved`;
        }
        break;
      }
      case 'HACKERRANK': {
        const stars = typeof stats['stars'] === 'number' ? stats['stars'] : null;
        if (stars !== null) {
          mappedScore = Math.min(100, stars * 20);
          signal = `${stars} star(s)`;
        }
        break;
      }
      case 'GITHUB': {
        const repos = typeof stats['publicRepos'] === 'number' ? stats['publicRepos'] : 0;
        const followers = typeof stats['followers'] === 'number' ? stats['followers'] : 0;
        // Very rough signal: repos contribute more than followers
        const vitality = Math.min(100, Math.round((repos * 2 + followers) / 3));
        if (repos > 0) {
          mappedScore = vitality;
          signal = `${repos} public repos, ${followers} followers`;
        }
        break;
      }
      default:
        // Unknown platform — skip
        break;
    }

    if (mappedScore !== null) {
      details.push({
        platform: profile.platform,
        username: profile.username,
        signal,
        rawValue: stats,
        mappedScore,
      });
    }
  }

  if (details.length === 0) {
    return { score: null, details: [] };
  }

  // Best score across all platforms
  const bestScore = Math.max(...details.map((d) => d.mappedScore));
  return { score: bestScore, details };
}

// ── Weighted Score Computation ────────────────────────────────────────────────

/**
 * Computes the final weighted evidence score from 0-100.
 *
 * Weight redistribution algorithm:
 *   1. Start with BASE_WEIGHTS
 *   2. For each absent source (score === null), mark its weight as "available"
 *   3. Redistribute available weight proportionally to present sources
 *   4. Compute weighted sum from present sources only
 */
export function computeWeightedScore(
  assessmentScore: number | null,
  selfRatingScore: number | null,
  codingScore: number | null,
): { finalScore: number; weightsUsed: { assessment: number; selfRating: number; coding: number } } {
  // Determine which sources are available
  const sources = [
    { key: 'assessment' as const, score: assessmentScore, baseWeight: BASE_WEIGHTS.assessment },
    { key: 'selfRating' as const, score: selfRatingScore, baseWeight: BASE_WEIGHTS.selfRating },
    { key: 'coding' as const, score: codingScore, baseWeight: BASE_WEIGHTS.coding },
  ];

  const presentSources = sources.filter((s) => s.score !== null);
  const absentWeight = sources
    .filter((s) => s.score === null)
    .reduce((sum, s) => sum + s.baseWeight, 0);

  if (presentSources.length === 0) {
    // No evidence at all
    return {
      finalScore: 0,
      weightsUsed: { assessment: 0, selfRating: 0, coding: 0 },
    };
  }

  // Total base weight of present sources (used for redistribution)
  const presentBaseTotal = presentSources.reduce((sum, s) => sum + s.baseWeight, 0);

  // Adjusted weights: base weight + proportional share of absent weight
  const adjustedWeights = new Map<string, number>();
  for (const source of presentSources) {
    const redistributedShare = absentWeight * (source.baseWeight / presentBaseTotal);
    adjustedWeights.set(source.key, source.baseWeight + redistributedShare);
  }

  // Compute weighted sum
  let finalScore = 0;
  for (const source of presentSources) {
    finalScore += (source.score as number) * (adjustedWeights.get(source.key) ?? 0);
  }

  return {
    finalScore: Math.round(finalScore),
    weightsUsed: {
      assessment: Math.round((adjustedWeights.get('assessment') ?? 0) * 100) / 100,
      selfRating: Math.round((adjustedWeights.get('selfRating') ?? 0) * 100) / 100,
      coding: Math.round((adjustedWeights.get('coding') ?? 0) * 100) / 100,
    },
  };
}

// ── Gap Level Classification ──────────────────────────────────────────────────

export function classifyGapLevel(score: number, hasAnyEvidence: boolean): GapLevel {
  if (!hasAnyEvidence || score < 25) return GapLevel.MISSING;
  if (score < 50) return GapLevel.WEAK;
  if (score < 75) return GapLevel.MODERATE;
  return GapLevel.STRONG;
}

// ── Main Engine Entry Point ───────────────────────────────────────────────────

/**
 * Computes skill gap analysis for all required skills in a career path.
 *
 * @param requiredSkills  - Skills required by the target career path
 * @param studentSkills   - Student's self-rated skills from StudentSkill table
 * @param assessmentAttempts - Completed assessment attempts with scores
 * @param codingProfiles  - Student's registered coding platform profiles
 */
export function computeAllGaps(
  requiredSkills: RequiredSkillInput[],
  studentSkills: StudentSkillInput[],
  assessmentAttempts: AssessmentAttemptInput[],
  codingProfiles: CodingProfileInput[],
): SkillGapResult[] {
  // Pre-index student skills by skillId for O(1) lookup
  const studentSkillMap = new Map<string, StudentSkillInput>();
  for (const ss of studentSkills) {
    studentSkillMap.set(ss.skillId, ss);
  }

  const results: SkillGapResult[] = [];

  for (const required of requiredSkills) {
    // ── Source 1: Assessment ──
    const { score: assessmentScore, details: assessmentDetails } = extractAssessmentScore(
      required.skillName,
      assessmentAttempts,
    );

    // ── Source 2: Self-rating ──
    const studentSkill = studentSkillMap.get(required.skillId);
    const selfRatingScore = studentSkill
      ? SELF_RATING_MAP[studentSkill.selfRating]
      : null;
    const selfRatingLevel = studentSkill ? studentSkill.selfRating : null;

    // ── Source 3: Coding activity ──
    // Only relevant for technical/programming skills, but we compute for all
    // skills — the engine doesn't know the domain, and a coding signal is
    // still valid evidence even for broad technical skills.
    const { score: codingScore, details: codingDetails } = extractCodingScore(codingProfiles);

    // ── Weighted composition ──
    const { finalScore, weightsUsed } = computeWeightedScore(
      assessmentScore,
      selfRatingScore,
      codingScore,
    );

    const hasAnyEvidence =
      assessmentScore !== null || selfRatingScore !== null || codingScore !== null;

    const gapLevel = classifyGapLevel(finalScore, hasAnyEvidence);

    const evidence: SkillEvidence = {
      assessmentScore,
      assessmentDetails,
      assessmentAvailable: assessmentScore !== null,
      selfRatingScore,
      selfRatingLevel,
      selfRatingAvailable: selfRatingScore !== null,
      codingScore,
      codingDetails,
      codingAvailable: codingScore !== null,
      finalScore,
      weightsUsed,
    };

    // contributingFactors stored in DB as JSON — simplified for storage
    const contributingFactors = {
      assessmentPct: assessmentScore,
      selfRating: selfRatingLevel,
      codingActivity: codingScore !== null
        ? (codingScore >= 60 ? 'strong' : codingScore >= 30 ? 'moderate' : 'low')
        : 'none',
      matchedAssessments: assessmentDetails.map((d) => d.title),
      weightsUsed,
    };

    results.push({
      skillId: required.skillId,
      skillName: required.skillName,
      skillCategory: required.skillCategory,
      requiredLevel: required.requiredLevel,
      priority: required.priority,
      evidenceScore: finalScore,
      gapLevel,
      evidence,
      contributingFactors,
    });
  }

  // Sort: weakest gaps first (MISSING → WEAK → MODERATE → STRONG)
  const ORDER: Record<GapLevel, number> = {
    MISSING: 0,
    WEAK: 1,
    MODERATE: 2,
    STRONG: 3,
  };
  results.sort((a, b) => ORDER[a.gapLevel] - ORDER[b.gapLevel] || a.evidenceScore - b.evidenceScore);

  return results;
}
