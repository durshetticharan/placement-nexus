import { z } from 'zod';
import { ProficiencyLevel } from '@prisma/client';

const dateSchema = z.string().transform((val, ctx) => {
  const d = new Date(val);
  if (isNaN(d.getTime())) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Invalid date format.',
    });
    return z.NEVER;
  }
  return d;
});

const optionalDateSchema = z
  .string()
  .optional()
  .nullable()
  .transform((val, ctx) => {
    if (!val) return undefined;
    const d = new Date(val);
    if (isNaN(d.getTime())) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Invalid date format.',
      });
      return z.NEVER;
    }
    return d;
  });

const optionalUrlSchema = z
  .string()
  .url('Must be a valid URL.')
  .optional()
  .nullable()
  .or(z.literal(''))
  .transform((val) => (val ? val : undefined));

// ── 1. Academic Schema ────────────────────────────────────────────────────────

export const academicSchema = z.object({
  degree: z.string().min(1, 'Degree is required.'),
  branch: z.string().min(1, 'Branch is required.'),
  collegeName: z.string().min(1, 'College name is required.'),
  graduationYear: z.number().int().min(1990).max(2100, 'Graduation year must be a valid year.'),
  cgpa: z.number().min(0, 'CGPA must be at least 0.').max(10, 'CGPA cannot exceed 10.'),
  backlogs: z.number().int().min(0, 'Backlogs cannot be negative.').default(0),
  tenthPercentage: z.number().min(0).max(100).optional().nullable(),
  twelfthPercentage: z.number().min(0).max(100).optional().nullable(),
});

// ── 2. Skill Schemas ──────────────────────────────────────────────────────────

export const addSkillSchema = z.object({
  name: z.string().min(1, 'Skill name is required.'),
  category: z.string().optional().nullable(),
  selfRating: z.nativeEnum(ProficiencyLevel, {
    message: 'Self rating must be one of: BEGINNER, INTERMEDIATE, ADVANCED, EXPERT.',
  }),
});

export const updateSkillSchema = z.object({
  selfRating: z.nativeEnum(ProficiencyLevel, {
    message: 'Self rating must be one of: BEGINNER, INTERMEDIATE, ADVANCED, EXPERT.',
  }),
});

// ── 3. Project Schemas ────────────────────────────────────────────────────────

export const projectSchema = z.object({
  title: z.string().min(1, 'Project title is required.'),
  description: z.string().min(1, 'Project description is required.'),
  techStack: z.array(z.string().min(1)).min(1, 'At least one tech stack item is required.'),
  repoUrl: optionalUrlSchema,
  liveUrl: optionalUrlSchema,
  startDate: optionalDateSchema,
  endDate: optionalDateSchema,
});

export const updateProjectSchema = projectSchema.partial();

// ── 4. Internship Schemas ─────────────────────────────────────────────────────

export const internshipSchema = z.object({
  companyName: z.string().min(1, 'Company name is required.'),
  role: z.string().min(1, 'Role is required.'),
  description: z.string().optional().nullable(),
  startDate: dateSchema,
  endDate: optionalDateSchema,
  isOngoing: z.boolean().default(false),
  certificateUrl: optionalUrlSchema,
});

export const updateInternshipSchema = internshipSchema.partial();

// ── 5. Certification Schemas ──────────────────────────────────────────────────

export const certificationSchema = z.object({
  title: z.string().min(1, 'Certification title is required.'),
  issuingOrg: z.string().min(1, 'Issuing organization is required.'),
  issueDate: dateSchema,
  expiryDate: optionalDateSchema,
  credentialUrl: optionalUrlSchema,
  fileUrl: z.string().optional().nullable(),
});

export const updateCertificationSchema = certificationSchema.partial();

// ── 6. Achievement Schemas ───────────────────────────────────────────────────

export const achievementSchema = z.object({
  title: z.string().min(1, 'Achievement title is required.'),
  description: z.string().optional().nullable(),
  category: z.string().optional().nullable(),
  date: optionalDateSchema,
  proofUrl: optionalUrlSchema,
});

export const updateAchievementSchema = achievementSchema.partial();

// ── 7. Professional Profile Schemas ──────────────────────────────────────────

export const professionalProfileSchema = z.object({
  platform: z.string().min(1, 'Platform is required.'),
  profileUrl: z.string().url('Must be a valid profile URL.'),
});

export const updateProfessionalProfileSchema = z.object({
  profileUrl: z.string().url('Must be a valid profile URL.'),
});

// ── 8. Coding Profile Schemas ────────────────────────────────────────────────

export const CODING_PLATFORMS = ['GITHUB', 'LEETCODE', 'CODECHEF', 'HACKERRANK', 'CODEFORCES', 'GFG'] as const;

export const codingProfileSchema = z.object({
  platform: z.enum(['GITHUB', 'LEETCODE', 'CODECHEF', 'HACKERRANK', 'CODEFORCES', 'GFG'] as [string, ...string[]], {
    message: 'Platform must be one of: GITHUB, LEETCODE, CODECHEF, HACKERRANK, CODEFORCES, GFG.',
  }),
  username: z.string().min(1, 'Username is required.'),
  profileUrl: z.string().url('Must be a valid profile URL.'),
  statistics: z.record(z.string(), z.any()).optional().nullable(),
});

export const updateCodingProfileSchema = codingProfileSchema.partial();

