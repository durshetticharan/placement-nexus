/**
 * ats.service.ts
 *
 * ATS (Applicant Tracking System) scoring service.
 *
 * Responsible for:
 *  1. Deterministic extraction of skills, experience, education, and sections
 *     from resume text and job-description text.
 *  2. Normalizing skill names via an alias map.
 *  3. Computing a 0–100 ATS score from a weighted, additive formula.
 *  4. Orchestrating AI-assisted extraction when the mode allows it, with
 *     automatic fallback to deterministic extraction.
 *
 * ── Score formula (7 components, base weights sum to 100) ────────────────────
 *
 *  | Component         | Base Weight |
 *  |-------------------|-------------|
 *  | Required Skills   |  40         |
 *  | Preferred Skills  |  15         |
 *  | Experience        |  15         |
 *  | Projects          |  10         |
 *  | Education         |  10         |
 *  | Keyword Coverage  |   5         |
 *  | Resume Structure  |   5         |
 *  | TOTAL             | 100         |
 *
 * When a category has no data to evaluate (e.g. JD has no preferred skills),
 * its weight is redistributed proportionally to categories that DO have data.
 * This prevents "empty array = full points" inflation.
 */

// ── Constants ────────────────────────────────────────────────────────────────

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:8000';
const AI_INTERNAL_KEY = process.env.AI_INTERNAL_KEY || '';

/** Score component base weights — sum to 100. */
export const SCORE_WEIGHTS = {
  requiredSkills: 40,
  preferredSkills: 15,
  experience: 15,
  projects: 10,
  education: 10,
  keywords: 5,
  structure: 5,
} as const;

/**
 * Maximum redistribution multiplier for any single component.
 * Prevents a JD with only required skills from giving 100 to someone
 * who matches all required skills but has no experience verification.
 */
const MAX_WEIGHT_MULTIPLIER = 2.0;

/**
 * Tech skills used ONLY for resume skill detection (searching resume text).
 * These are NOT injected into JD requirements — that was the old bug.
 */
export const COMMON_TECH_SKILLS: readonly string[] = [
  'Java', 'Python', 'C++', 'JavaScript', 'TypeScript', 'React', 'Angular',
  'Vue', 'Node.js', 'Express', 'Spring Boot', 'Django', 'Flask', 'SQL',
  'MySQL', 'PostgreSQL', 'MongoDB', 'AWS', 'Azure', 'GCP', 'Docker',
  'Kubernetes', 'Git', 'GitHub', 'CI/CD', 'REST API', 'GraphQL', 'Linux',
  'Data Structures', 'Algorithms', 'OOP', 'Microservices', 'JUnit', 'Redis',
  'React.js', 'TensorFlow', 'PyTorch', 'Kafka', 'Spark', 'Go', 'Rust',
  'Terraform', 'Prometheus', 'Grafana', 'gRPC', 'Next.js', 'Svelte',
  'Tailwind', 'SASS', 'Webpack', 'Vite',
];

/**
 * Canonical alias map — maps lowercase variants to a single canonical name.
 */
export const SKILL_ALIAS_MAP: Readonly<Record<string, string>> = {
  'react.js': 'React',
  'react js': 'React',
  'reactjs': 'React',
  'node.js': 'Node.js',
  'node js': 'Node.js',
  'nodejs': 'Node.js',
  'postgres': 'PostgreSQL',
  'postgresql database': 'PostgreSQL',
  'restful api': 'REST API',
  'rest apis': 'REST API',
  'restful apis': 'REST API',
  'restful': 'REST API',
  'vue.js': 'Vue',
  'vue js': 'Vue',
  'vuejs': 'Vue',
  'express.js': 'Express.js',
  'express js': 'Express.js',
  'expressjs': 'Express.js',
  'javascript': 'JavaScript',
  'typescript': 'TypeScript',
  'mongodb': 'MongoDB',
  'mysql': 'MySQL',
  'postgresql': 'PostgreSQL',
  'graphql': 'GraphQL',
  'nextjs': 'Next.js',
  'next.js': 'Next.js',
  'spring boot': 'Spring Boot',
  'springboot': 'Spring Boot',
  'angular js': 'Angular',
  'angularjs': 'Angular',
  'tensorflow': 'TensorFlow',
  'pytorch': 'PyTorch',
  'apache kafka': 'Kafka',
  'apache spark': 'Spark',
  'golang': 'Go',
  'amazon web services': 'AWS',
  'google cloud': 'GCP',
  'google cloud platform': 'GCP',
  'microsoft azure': 'Azure',
};

// ── Types ────────────────────────────────────────────────────────────────────

export interface ExperienceEntry {
  title: string;
  description: string;
  technologies?: string[];
}

export interface ProjectEntry {
  title: string;
  description: string;
  technologies?: string[];
}

export interface EducationEntry {
  degree: string;
  field: string;
}

/**
 * Shape returned by both the deterministic and AI-based extractors.
 */
export interface AtsExtractionResult {
  summary?: string;
  extractedSkills: string[];
  jdRequiredSkills: string[];
  jdPreferredSkills: string[];
  jdKeywords: string[];
  resumeKeywords: string[];
  resumeExperience: ExperienceEntry[];
  resumeProjects: ProjectEntry[];
  resumeEducation: EducationEntry[];
  resumeSections: string[];
  jdExperienceRequirements: string[];
  jdEducationRequirements: string[];
  /** Full resume text for year/field extraction in the scorer. */
  resumeTextRaw?: string;
}

/** The 7-component score breakdown. */
export interface AtsScoreBreakdown {
  requiredScore: number;
  preferredScore: number;
  experienceScore: number;
  projectScore: number;
  educationScore: number;
  keywordScore: number;
  structureScore: number;
}

/** Skill-matching details surfaced in the API response. */
export interface AtsMatchDetails {
  extractedSkills: string[];
  jdRequiredSkills: string[];
  jdPreferredSkills: string[];
  matchedRequiredSkills: string[];
  missingRequiredSkills: string[];
  matchedPreferredSkills: string[];
  missingPreferredSkills: string[];
  jdKeywords: string[];
  matchedKeywords: string[];
  resumeKeywords: string[];
  experienceRelevance: number;
  projectRelevance: number;
  educationMatch: number;
  resumeAtsStructure: number;
}

/** Full result returned by `analyzeResume`. */
export interface AtsAnalysisResult extends AtsMatchDetails {
  atsScore: number;
  scoreBreakdown: AtsScoreBreakdown;
  isAiGenerated: boolean;
  ai: { used: boolean; available: boolean };
  resumeExperience: ExperienceEntry[];
  resumeProjects: ProjectEntry[];
  resumeEducation: EducationEntry[];
  resumeSections: string[];
  jdExperienceRequirements: string[];
  jdEducationRequirements: string[];
  summary?: string;
  strengths?: string[];
  improvements?: string[];
  missingSections?: string[];
  confidence?: string;
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function escapeRegExp(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Normalize a skill name to its canonical form.
 */
export function normalizeSkill(skill: string): string {
  const trimmed = skill.trim();
  const lower = trimmed.toLowerCase();

  if (SKILL_ALIAS_MAP[lower]) return SKILL_ALIAS_MAP[lower];

  if (trimmed === trimmed.toUpperCase() && /^[A-Z0-9.#+\s]+$/.test(trimmed)) {
    return trimmed;
  }

  if (/[A-Z]/.test(trimmed) && /[a-z]/.test(trimmed)) {
    return trimmed;
  }

  return trimmed
    .split(/\s+/)
    .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ');
}

/**
 * Determine if a line looks like a standalone skill/technology name
 * rather than a sentence or paragraph.
 *
 * A "skill-like" line is:
 * - Non-empty, trimmed length < 50
 * - Has fewer than 6 words (skills are typically 1-3 words)
 * - Doesn't end with a period (sentences do)
 * - Doesn't start with common sentence starters
 */
function isSkillLikeLine(line: string): boolean {
  const trimmed = line.trim();
  if (trimmed.length === 0 || trimmed.length >= 50) return false;

  const words = trimmed.split(/\s+/);
  if (words.length > 5) return false;

  // Sentences end with periods (but "Node.js" is fine)
  if (trimmed.endsWith('.') && !trimmed.match(/\.\w+$/)) return false;

  // Skip lines that look like section headers we haven't categorized
  const looksLikeHeader = /^(about|who|what|our|the|we|this|join|apply|company|responsibilities|duties|role|overview|description|summary|location|salary|compensation|benefits|type|deadline)/i.test(trimmed);
  if (looksLikeHeader) return false;

  return true;
}

/**
 * Extract years from a text string. Returns the first number found
 * near a "year" keyword, or null.
 *
 * Matches: "5+ years", "3 years", "5-7 years", "minimum 3 years"
 */
function extractYearsFromText(text: string): number | null {
  const match = text.match(/(\d+)\s*\+?\s*(?:-\s*\d+\s*)?years?/i);
  return match ? parseInt(match[1], 10) : null;
}

/**
 * Extract years of experience mentioned in resume text.
 * Returns estimated years or 0 for freshers.
 */
function extractResumeYears(resumeText: string): number {
  const lower = resumeText.toLowerCase();

  // Explicit fresher/intern/student indicators → 0 years
  if (/\b(fresher|fresh graduate|no experience|entry level|seeking first|student|intern(?:ship)?)\b/i.test(lower)) {
    // But if they also mention years elsewhere, use that
    const yearsMatch = lower.match(/(\d+)\s*\+?\s*years?\s*(?:of\s+)?(?:experience|professional|work)/i);
    if (yearsMatch) return parseInt(yearsMatch[1], 10);
    return 0;
  }

  // Look for explicit experience mentions: "3 years of experience"
  const expMatch = lower.match(/(\d+)\s*\+?\s*years?\s*(?:of\s+)?(?:experience|professional|work)/i);
  if (expMatch) return parseInt(expMatch[1], 10);

  // Look for date ranges and estimate (e.g. "2020-2023" = 3 years)
  const dateRanges = lower.match(/20\d{2}\s*[-–]\s*(?:20\d{2}|present|current)/gi) || [];
  let totalYears = 0;
  for (const range of dateRanges) {
    const years = range.match(/(\d{4})\s*[-–]\s*(\d{4}|present|current)/i);
    if (years) {
      const start = parseInt(years[1], 10);
      const end = years[2].match(/\d{4}/) ? parseInt(years[2], 10) : new Date().getFullYear();
      totalYears += Math.max(end - start, 0);
    }
  }
  if (totalYears > 0) return totalYears;

  // Look for "(N years)" or "N years" anywhere
  const anyYears = lower.match(/(\d+)\s*\+?\s*years?/i);
  if (anyYears) return parseInt(anyYears[1], 10);

  return 0;
}

/**
 * Extract actual education details from resume text.
 * Returns structured entries with real degree/field info.
 */
function extractResumeEducation(resumeText: string): EducationEntry[] {
  const entries: EducationEntry[] = [];
  const lower = resumeText.toLowerCase();

  // Detect degree types
  const degreePatterns: Array<{ pattern: RegExp; degree: string }> = [
    { pattern: /\b(ph\.?d|doctorate|doctor of philosophy)\b/i, degree: 'PhD' },
    { pattern: /\b(m\.?tech|m\.?s|m\.?e|master|msc|m\.sc)\b/i, degree: 'Master' },
    { pattern: /\b(b\.?tech|b\.?e|b\.?s|bachelor|bsc|b\.sc|b\.?eng|undergraduate)\b/i, degree: 'Bachelor' },
    { pattern: /\b(diploma)\b/i, degree: 'Diploma' },
  ];

  // Detect field of study
  const fieldPatterns: Array<{ pattern: RegExp; field: string }> = [
    { pattern: /\b(computer science|cs|cse)\b/i, field: 'Computer Science' },
    { pattern: /\b(information technology|it)\b/i, field: 'Information Technology' },
    { pattern: /\b(electrical|ece|electronics)\b/i, field: 'Electronics/Electrical' },
    { pattern: /\b(mechanical)\b/i, field: 'Mechanical Engineering' },
    { pattern: /\b(software engineering)\b/i, field: 'Software Engineering' },
    { pattern: /\b(data science)\b/i, field: 'Data Science' },
    { pattern: /\b(mathematics|math|maths)\b/i, field: 'Mathematics' },
  ];

  let foundDegree = '';
  let foundField = '';

  for (const dp of degreePatterns) {
    if (dp.pattern.test(lower)) {
      foundDegree = dp.degree;
      break;
    }
  }

  for (const fp of fieldPatterns) {
    if (fp.pattern.test(lower)) {
      foundField = fp.field;
      break;
    }
  }

  if (foundDegree || foundField) {
    entries.push({
      degree: foundDegree || 'Degree',
      field: foundField || 'Engineering',
    });
  }

  return entries;
}

// ── Deterministic Extraction ─────────────────────────────────────────────────

/**
 * Parse a JD and resume deterministically — no LLM call.
 *
 * FIX 2: Reads both bulleted AND plain-text lines under section headers.
 * FIX 3: Does NOT inject commonTechSkills into JD requirements.
 * FIX 4: Parses experience/education requirements from JD and resume.
 * FIX 5: Per-section technology lists, not global skill dump.
 */
export function deterministicExtract(
  resumeText: string,
  jdText: string,
): AtsExtractionResult {
  const jdKeywords: string[] = [];
  const jdRequiredSkills: string[] = [];
  const jdPreferredSkills: string[] = [];
  const jdExperienceRequirements: string[] = [];
  const jdEducationRequirements: string[] = [];

  // ── Parse JD sections (FIX 2: supports plain text lines) ───────────────
  const lines = jdText.split('\n').map(l => l.trim());
  let currentSection = '';

  for (const line of lines) {
    const lower = line.toLowerCase();

    // Detect section headers
    if (
      lower.includes('required skills') ||
      lower.includes('requirements:') ||
      lower.includes('must have') ||
      (lower === 'required:') ||
      (lower === 'required')
    ) {
      currentSection = 'required';
      continue;
    } else if (
      lower.includes('preferred skills') ||
      lower.includes('nice to have') ||
      lower.includes('bonus') ||
      lower.includes('preferred:') ||
      (lower === 'preferred')
    ) {
      currentSection = 'preferred';
      continue;
    } else if (
      lower.includes('experience required') ||
      (lower === 'experience') ||
      lower.startsWith('experience:')
    ) {
      currentSection = 'experience';
      // Capture inline content (e.g. "Experience: 3+ years Software Engineering")
      const inlineContent = line.replace(/^experience\s*:\s*/i, '').trim();
      if (inlineContent.length > 0) {
        jdExperienceRequirements.push(inlineContent);
      }
      continue;
    } else if (
      lower.includes('education required') ||
      lower.includes('qualifications') ||
      (lower === 'education') ||
      lower.startsWith('education:')
    ) {
      currentSection = 'education';
      // Capture inline content (e.g. "Education: Bachelor degree")
      const inlineContent = line.replace(/^education\s*:\s*/i, '').trim();
      if (inlineContent.length > 0) {
        jdEducationRequirements.push(inlineContent);
      }
      continue;
    } else if (
      lower.includes('responsibilities') ||
      lower.includes('about the role') ||
      lower.includes('job description') ||
      lower.includes('what you') ||
      lower.includes('who we')
    ) {
      // Reset section — we don't extract from description/responsibilities
      currentSection = '';
      continue;
    }

    // Skip empty lines (don't change section)
    if (line.length === 0) continue;

    // Detect if line is bulleted
    const isBulleted = line.startsWith('-') || line.startsWith('•') || line.startsWith('*');
    const cleanLine = isBulleted
      ? line.replace(/^[•\-\*]\s*/, '').trim()
      : line;

    if (cleanLine.length === 0) continue;

    // FIX 2: Accept both bulleted lines AND plain skill-like lines
    const isAcceptable = isBulleted || isSkillLikeLine(cleanLine);

    if (currentSection === 'required' && isAcceptable && cleanLine.length < 50) {
      jdRequiredSkills.push(cleanLine);
      jdKeywords.push(cleanLine);
    } else if (currentSection === 'preferred' && isAcceptable && cleanLine.length < 50) {
      jdPreferredSkills.push(cleanLine);
      jdKeywords.push(cleanLine);
    } else if (currentSection === 'experience') {
      // FIX 4: Capture experience requirement lines
      jdExperienceRequirements.push(cleanLine);
    } else if (currentSection === 'education') {
      // FIX 4: Capture education requirement lines
      jdEducationRequirements.push(cleanLine);
    }
  }

  // FIX 3: REMOVED — commonTechSkills are NOT injected into JD requirements.
  // They are only used below for resume skill detection.

  // ── Extract skills from resume ─────────────────────────────────────────
  // Search the resume for any skills mentioned in the JD + common tech skills.
  // This gives the resume a fair scan even if the JD format is unusual.
  const extractedSkills: string[] = [];
  const resumeKeywords: string[] = [];
  const allSearchSkills = [...new Set([...jdKeywords, ...COMMON_TECH_SKILLS])];

  for (const skill of allSearchSkills) {
    if (skill.length < 2) continue;

    let searchRegexStr = `\\b${escapeRegExp(skill)}\\b`;
    if (skill.toLowerCase() === 'react.js' || skill.toLowerCase() === 'react') {
      searchRegexStr = `\\breact(?:\\.js| js)?\\b`;
    } else if (skill.toLowerCase() === 'node.js') {
      searchRegexStr = `\\bnode(?:\\.js| js)?\\b`;
    }

    const regex = new RegExp(searchRegexStr, 'i');
    if (regex.test(resumeText)) {
      extractedSkills.push(skill);
      resumeKeywords.push(skill);
    }
  }

  // ── Detect resume sections ─────────────────────────────────────────────
  const resumeSections: string[] = [];
  if (/\b(experience|employment|work history)\b/i.test(resumeText)) resumeSections.push('Experience');
  if (/\b(education|academic|university|college|degree|b\.?tech|m\.?tech)\b/i.test(resumeText)) resumeSections.push('Education');
  if (/\b(skills|technologies|technical skills)\b/i.test(resumeText)) resumeSections.push('Skills');
  if (/\b(projects|portfolio)\b/i.test(resumeText)) resumeSections.push('Projects');
  if (/\b(contact|email|phone|profile|personal|linkedin)\b/i.test(resumeText)) resumeSections.push('Contact');

  // ── FIX 5: Build per-section structured entries ────────────────────────
  // Instead of dumping ALL extractedSkills into every section,
  // extract skills that appear near each section's content.
  const resumeExperience: ExperienceEntry[] = [];
  const resumeProjects: ProjectEntry[] = [];

  if (resumeSections.includes('Experience')) {
    const expSection = extractSectionText(resumeText, ['experience', 'employment', 'work history']);
    const expTechs = findSkillsInText(expSection, allSearchSkills);
    resumeExperience.push({
      title: 'Experience',
      description: expSection.slice(0, 200),
      technologies: expTechs,
    });
  }

  if (resumeSections.includes('Projects')) {
    const projSection = extractSectionText(resumeText, ['projects', 'portfolio']);
    const projTechs = findSkillsInText(projSection, allSearchSkills);
    resumeProjects.push({
      title: 'Projects',
      description: projSection.slice(0, 200),
      technologies: projTechs,
    });
  }

  // FIX 4: Extract real education data from resume
  const resumeEducation = extractResumeEducation(resumeText);

  return {
    summary: 'Deterministic analysis completed.',
    extractedSkills,
    jdRequiredSkills,
    jdPreferredSkills,
    jdKeywords,
    resumeKeywords,
    resumeTextRaw: resumeText,
    resumeExperience,
    resumeProjects,
    resumeEducation,
    resumeSections,
    jdExperienceRequirements,
    jdEducationRequirements,
  };
}

/**
 * Extract approximate section text from a resume.
 * Finds the section header and returns text until the next section header.
 */
function extractSectionText(resumeText: string, sectionKeywords: string[]): string {
  const lines = resumeText.split('\n');
  let capturing = false;
  const captured: string[] = [];
  const sectionHeaderPattern = /^(experience|education|skills|projects|contact|profile|academic|employment|portfolio|work history|certifications|achievements|objective|summary|technical skills)/i;

  for (const line of lines) {
    const trimmed = line.trim().toLowerCase();

    // Check if this line is the start of our target section
    if (!capturing && sectionKeywords.some(kw => trimmed.includes(kw))) {
      capturing = true;
      // Also capture inline content after colon (e.g. "Projects: Web App using React")
      const colonIdx = line.indexOf(':');
      if (colonIdx >= 0) {
        const inlineContent = line.slice(colonIdx + 1).trim();
        if (inlineContent.length > 0) {
          captured.push(inlineContent);
        }
      }
      continue;
    }

    // If we're capturing and hit another section header, stop
    if (capturing && trimmed.length > 0 && sectionHeaderPattern.test(trimmed)) {
      break;
    }

    if (capturing) {
      captured.push(line);
    }
  }

  return captured.join(' ').trim();
}

/**
 * Find which skills from a list appear in a given text.
 */
function findSkillsInText(text: string, skills: string[]): string[] {
  const found: string[] = [];
  for (const skill of skills) {
    if (skill.length < 2) continue;
    const regex = new RegExp(`\\b${escapeRegExp(skill)}\\b`, 'i');
    if (regex.test(text)) {
      found.push(skill);
    }
  }
  return found;
}

// ── Score Calculation ────────────────────────────────────────────────────────

interface ScoreResult {
  atsScore: number;
  scoreBreakdown: AtsScoreBreakdown;
  matchDetails: AtsMatchDetails;
}

/**
 * Compute the ATS score from extraction data.
 *
 * FIX 1: Weight redistribution. When a category has no data, its weight is
 * redistributed to categories that DO have data — never awarded as free points.
 *
 * Pure function — no I/O. Deterministic for a given `AtsExtractionResult`.
 */
export function calculateAtsScore(extraction: AtsExtractionResult): ScoreResult {
  // ── Normalize & deduplicate ────────────────────────────────────────────
  const extractedSkills = Array.from(
    new Set(extraction.extractedSkills.map(s => normalizeSkill(String(s)))),
  );
  const jdRequiredSkills = Array.from(
    new Set(extraction.jdRequiredSkills.map(s => normalizeSkill(String(s)))),
  );
  const jdPreferredSkills = Array.from(
    new Set(extraction.jdPreferredSkills.map(s => normalizeSkill(String(s)))),
  );

  const resumeKeywordsLower = new Set(
    extraction.resumeKeywords.map(k => String(k).trim().toLowerCase()),
  );
  const jdKeywordsLower = Array.from(
    new Set(extraction.jdKeywords.map(k => String(k).trim().toLowerCase())),
  );

  // ── Skill matching ────────────────────────────────────────────────────
  const matchedRequiredSkills = jdRequiredSkills.filter(s => extractedSkills.includes(s));
  const missingRequiredSkills = jdRequiredSkills.filter(s => !extractedSkills.includes(s));
  const matchedPreferredSkills = jdPreferredSkills.filter(s => extractedSkills.includes(s));
  const missingPreferredSkills = jdPreferredSkills.filter(s => !extractedSkills.includes(s));

  const matchedKeywordsLower = jdKeywordsLower.filter(k => resumeKeywordsLower.has(k));
  const matchedKeywords = extraction.jdKeywords.filter(k =>
    resumeKeywordsLower.has(String(k).trim().toLowerCase()),
  );

  // ── Compute raw ratios for each component ──────────────────────────────

  // Required skills ratio (0–1)
  const hasRequired = jdRequiredSkills.length > 0;
  const requiredRatio = hasRequired
    ? matchedRequiredSkills.length / jdRequiredSkills.length
    : -1; // -1 = no data

  // Preferred skills ratio (0–1)
  const hasPreferred = jdPreferredSkills.length > 0;
  const preferredRatio = hasPreferred
    ? matchedPreferredSkills.length / jdPreferredSkills.length
    : -1;

  // ── Experience relevance (FIX 4: real comparison) ──────────────────────
  let experienceRelevance = -1; // -1 = no data
  const jdExpReqs = extraction.jdExperienceRequirements;
  if (jdExpReqs.length > 0) {
    const resumeExp = extraction.resumeExperience;
    if (resumeExp.length === 0) {
      experienceRelevance = 0;
    } else {
      // Extract required years from JD
      const jdExpText = jdExpReqs.join(' ');
      const requiredYears = extractYearsFromText(jdExpText);

      if (requiredYears && requiredYears > 0) {
        // Compare against resume years — use full resume text if available
        const textForYears = extraction.resumeTextRaw
          || resumeExp.map(e => `${e.title} ${e.description} ${(e.technologies || []).join(' ')}`).join(' ');
        const resumeYears = extractResumeYears(textForYears);

        if (resumeYears >= requiredYears) {
          experienceRelevance = 1;
        } else if (resumeYears > 0) {
          experienceRelevance = Math.min(resumeYears / requiredYears, 1);
        } else {
          experienceRelevance = 0;
        }
      } else {
        // JD mentions experience but no specific years — check skill overlap
        const allJdSkills = [...jdRequiredSkills, ...jdPreferredSkills].map(s => s.toLowerCase());
        if (allJdSkills.length === 0) {
          experienceRelevance = 0.5; // Has experience section but no skills to match
        } else {
          const expText = resumeExp
            .map(e => `${e.title} ${e.description} ${(e.technologies || []).join(' ')}`)
            .join(' ')
            .toLowerCase();
          const matchedInExp = allJdSkills.filter(skill => expText.includes(skill));
          experienceRelevance = Math.min(matchedInExp.length / Math.max(allJdSkills.length * 0.5, 1), 1);
        }
      }
    }
  }

  // ── Project relevance ──────────────────────────────────────────────────
  let projectRelevance: number;
  const resumeProj = extraction.resumeProjects;
  if (resumeProj.length === 0) {
    projectRelevance = 0;
  } else {
    const allJdSkills = [...jdRequiredSkills, ...jdPreferredSkills].map(s => s.toLowerCase());
    if (allJdSkills.length === 0) {
      projectRelevance = 0.5; // Projects exist but nothing to match against
    } else {
      // FIX 5: Use per-section technologies, not global list
      const projText = resumeProj
        .map(p => `${p.title} ${p.description} ${(p.technologies || []).join(' ')}`)
        .join(' ')
        .toLowerCase();
      const matchedInProj = allJdSkills.filter(skill => projText.includes(skill));
      projectRelevance = Math.min(matchedInProj.length / Math.max(allJdSkills.length * 0.5, 1), 1);
    }
  }

  // ── Education match (FIX 4: real comparison) ───────────────────────────
  let educationMatch = -1; // -1 = no data
  const jdEduReqs = extraction.jdEducationRequirements;
  if (jdEduReqs.length > 0) {
    const resumeEdu = extraction.resumeEducation;
    if (resumeEdu.length === 0) {
      educationMatch = 0;
    } else {
      const eduText = resumeEdu.map(e => `${e.degree} ${e.field}`).join(' ').toLowerCase();
      const jdEduText = jdEduReqs.join(' ').toLowerCase();

      let score = 0.5;

      const isBachelorReq = /(bachelor|b\.tech|b\.e|b\.s|undergrad|degree)/i.test(jdEduText);
      const isMasterReq = /(master|m\.tech|m\.e|m\.s|postgrad)/i.test(jdEduText);
      const hasBachelor = /(bachelor|b\.tech|b\.e|b\.s|undergrad)/i.test(eduText);
      const hasMaster = /(master|m\.tech|m\.e|m\.s|postgrad)/i.test(eduText);

      if (isMasterReq) {
        if (hasMaster) score = 1;
        else if (hasBachelor) score = 0.5;
        else score = 0;
      } else if (isBachelorReq) {
        if (hasBachelor || hasMaster) score = 1;
        else score = 0;
      } else {
        score = 1;
      }
      educationMatch = score;
    }
  }

  // ── Keyword coverage (stopwords removed) ───────────────────────────────
  const stopWords = new Set([
    'the', 'and', 'or', 'with', 'for', 'a', 'an', 'to', 'of', 'in', 'on', 'is', 'are',
  ]);
  const filteredJdKeywordsLower = jdKeywordsLower.filter(k => !stopWords.has(k));
  const matchedFilteredKeywordsLower = matchedKeywordsLower.filter(k => !stopWords.has(k));

  const hasKeywords = filteredJdKeywordsLower.length > 0;
  const keywordRatio = hasKeywords
    ? matchedFilteredKeywordsLower.length / filteredJdKeywordsLower.length
    : -1;

  // ── Resume structure ───────────────────────────────────────────────────
  const sections = extraction.resumeSections.map(s => s.toLowerCase());
  const hasContact = sections.some(s => s.includes('contact') || s.includes('profile') || s.includes('personal'));
  const hasSkills = sections.some(s => s.includes('skill'));
  const hasEducation = sections.some(s => s.includes('education') || s.includes('academic'));
  const hasExperience = sections.some(s => s.includes('experience') || s.includes('work') || s.includes('employment'));
  const hasProjects = sections.some(s => s.includes('project'));

  let structureRaw = 0;
  if (hasContact) structureRaw += 0.25;
  if (hasSkills) structureRaw += 0.25;
  if (hasEducation) structureRaw += 0.25;
  if (hasExperience || hasProjects) structureRaw += 0.25;

  // ── FIX 1: Weight redistribution ──────────────────────────────────────
  // Determine which categories have data and which don't.
  // Categories without data get 0 weight — their base weight is redistributed.

  interface ComponentDef {
    key: string;
    baseWeight: number;
    ratio: number;  // 0–1 score, or -1 if no data
    hasData: boolean;
  }

  const components: ComponentDef[] = [
    { key: 'required', baseWeight: SCORE_WEIGHTS.requiredSkills, ratio: requiredRatio, hasData: hasRequired },
    { key: 'preferred', baseWeight: SCORE_WEIGHTS.preferredSkills, ratio: preferredRatio, hasData: hasPreferred },
    { key: 'experience', baseWeight: SCORE_WEIGHTS.experience, ratio: experienceRelevance, hasData: experienceRelevance >= 0 },
    { key: 'projects', baseWeight: SCORE_WEIGHTS.projects, ratio: projectRelevance, hasData: true }, // always evaluable
    { key: 'education', baseWeight: SCORE_WEIGHTS.education, ratio: educationMatch, hasData: educationMatch >= 0 },
    { key: 'keywords', baseWeight: SCORE_WEIGHTS.keywords, ratio: keywordRatio, hasData: hasKeywords },
    { key: 'structure', baseWeight: SCORE_WEIGHTS.structure, ratio: structureRaw, hasData: true }, // always evaluable
  ];

  const activeWeight = components.filter(c => c.hasData).reduce((sum, c) => sum + c.baseWeight, 0);

  // Redistribution multiplier: scale active components so total = 100
  const redistributionMultiplier = activeWeight > 0
    ? Math.min(100 / activeWeight, MAX_WEIGHT_MULTIPLIER)
    : 1;

  // Compute final component scores with redistributed weights
  let requiredScore = 0;
  let preferredScore = 0;
  let experienceScore = 0;
  let projectScore = 0;
  let educationScore = 0;
  let keywordScore = 0;
  let structureScore = 0;

  for (const comp of components) {
    if (!comp.hasData) continue;
    const effectiveWeight = comp.baseWeight * redistributionMultiplier;
    const score = Math.max(comp.ratio, 0) * effectiveWeight;

    switch (comp.key) {
      case 'required': requiredScore = score; break;
      case 'preferred': preferredScore = score; break;
      case 'experience': experienceScore = score; break;
      case 'projects': projectScore = score; break;
      case 'education': educationScore = score; break;
      case 'keywords': keywordScore = score; break;
      case 'structure': structureScore = score; break;
    }
  }

  const rawScore = Math.round(
    requiredScore + preferredScore + keywordScore + experienceScore + projectScore + educationScore + structureScore,
  );
  const atsScore = Math.min(Math.max(rawScore, 0), 100);

  // For display, show the effective max per component (with redistribution)
  return {
    atsScore,
    scoreBreakdown: {
      requiredScore: Math.round(requiredScore),
      preferredScore: Math.round(preferredScore),
      experienceScore: Math.round(experienceScore),
      projectScore: Math.round(projectScore),
      educationScore: Math.round(educationScore),
      keywordScore: Math.round(keywordScore),
      structureScore: Math.round(structureScore),
    },
    matchDetails: {
      extractedSkills,
      jdRequiredSkills,
      jdPreferredSkills,
      matchedRequiredSkills,
      missingRequiredSkills,
      matchedPreferredSkills,
      missingPreferredSkills,
      jdKeywords: extraction.jdKeywords,
      matchedKeywords,
      resumeKeywords: Array.from(resumeKeywordsLower),
      experienceRelevance: Math.max(experienceRelevance, 0),
      projectRelevance,
      educationMatch: Math.max(educationMatch, 0),
      resumeAtsStructure: structureRaw,
    },
  };
}

// ── AI-Assisted Extraction ───────────────────────────────────────────────────

/**
 * Normalize the raw AI response into the standard `AtsExtractionResult` shape.
 */
function normalizeAiResponse(aiData: Record<string, any>): AtsExtractionResult {
  return {
    summary: aiData.summary,
    extractedSkills: aiData.extractedSkills || aiData.extracted_skills || [],
    jdRequiredSkills: aiData.jdRequiredSkills || aiData.jd_required_skills || [],
    jdPreferredSkills: aiData.jdPreferredSkills || aiData.jd_preferred_skills || [],
    jdKeywords: aiData.jdKeywords || aiData.jd_keywords || [],
    resumeKeywords: aiData.resumeKeywords || aiData.resume_keywords || [],
    resumeExperience: aiData.resumeExperience || aiData.resume_experience || [],
    resumeProjects: aiData.resumeProjects || aiData.resume_projects || [],
    resumeEducation: aiData.resumeEducation || aiData.resume_education || [],
    resumeSections: aiData.resumeSections || aiData.resume_sections || [],
    jdExperienceRequirements: aiData.jdExperienceRequirements || aiData.jd_experience_requirements || [],
    jdEducationRequirements: aiData.jdEducationRequirements || aiData.jd_education_requirements || [],
  };
}

/**
 * Attempt AI-based extraction. Returns null if the AI service is unavailable.
 */
async function tryAiExtraction(
  resumeText: string,
  jobDescription: string,
  userId: string,
  mode: string,
): Promise<{ extraction: AtsExtractionResult; aiPassthrough: Record<string, any> } | null> {
  if (mode !== 'hybrid' && mode !== 'ai') return null;

  try {
    const payload = {
      resume_text: resumeText,
      job_description: jobDescription,
      student_id: userId,
    };
    const aiRes = await fetch(`${AI_SERVICE_URL}/ai/resume/analyze`, {
      method: 'POST',
      headers: {
        'X-Internal-Key': AI_INTERNAL_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(45000),
    });

    if (aiRes.ok) {
      const aiData = await aiRes.json();
      return {
        extraction: normalizeAiResponse(aiData),
        aiPassthrough: aiData,
      };
    }
    return null;
  } catch (e) {
    console.warn('AI Extraction Failed, falling back to deterministic', e);
    return null;
  }
}

// ── Orchestrator ─────────────────────────────────────────────────────────────

/**
 * Full ATS analysis pipeline.
 */
export async function analyzeResume(
  resumeText: string,
  jobDescription: string,
  userId: string,
  mode: string,
  _version: string,
): Promise<AtsAnalysisResult> {
  let extraction: AtsExtractionResult;
  let aiUsed = false;
  let aiAvailable = false;
  let aiPassthrough: Record<string, any> = {};

  const aiResult = await tryAiExtraction(resumeText, jobDescription, userId, mode);
  if (aiResult) {
    extraction = aiResult.extraction;
    aiPassthrough = aiResult.aiPassthrough;
    aiUsed = true;
    aiAvailable = true;
  } else {
    extraction = deterministicExtract(resumeText, jobDescription);
  }

  const { atsScore, scoreBreakdown, matchDetails } = calculateAtsScore(extraction);

  return {
    ...matchDetails,
    atsScore,
    scoreBreakdown,
    isAiGenerated: aiUsed,
    ai: { used: aiUsed, available: aiAvailable },
    resumeExperience: extraction.resumeExperience,
    resumeProjects: extraction.resumeProjects,
    resumeEducation: extraction.resumeEducation,
    resumeSections: extraction.resumeSections,
    jdExperienceRequirements: extraction.jdExperienceRequirements,
    jdEducationRequirements: extraction.jdEducationRequirements,
    summary: extraction.summary,
    strengths: aiPassthrough.strengths,
    improvements: aiPassthrough.improvements,
    missingSections: aiPassthrough.missingSections || aiPassthrough.missing_sections,
    confidence: aiPassthrough.confidence,
  };
}
