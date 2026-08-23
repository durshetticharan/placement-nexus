import { z } from 'zod';
import { AssessmentCategory, QuestionType } from '@prisma/client';

// ── Assessment Schemas ────────────────────────────────────────────────────────

export const createAssessmentSchema = z.object({
  title: z.string().min(1, 'Title is required.').max(255, 'Title must be at most 255 characters.'),
  description: z.string().optional().nullable(),
  category: z.nativeEnum(AssessmentCategory, {
    message: 'Category must be one of: APTITUDE, TECHNICAL, CODING.',
  }),
  topic: z.string().min(1, 'Topic is required.').max(100, 'Topic must be at most 100 characters.'),
  difficulty: z
    .enum(['EASY', 'MEDIUM', 'HARD'], {
      message: 'Difficulty must be one of: EASY, MEDIUM, HARD.',
    })
    .optional()
    .nullable(),
  durationMins: z
    .number({ message: 'Duration must be a number.' })
    .int('Duration must be a whole number.')
    .positive('Duration must be a positive integer.'),
  passPercentage: z
    .number({ message: 'Pass percentage must be a number.' })
    .min(0, 'Pass percentage cannot be below 0.')
    .max(100, 'Pass percentage cannot exceed 100.')
    .optional()
    .nullable(),
});

export const updateAssessmentSchema = createAssessmentSchema.partial();

// ── Question Option Schema ────────────────────────────────────────────────────

const questionOptionSchema = z.object({
  text: z.string().min(1, 'Option text is required.'),
  isCorrect: z.boolean().default(false),
});

// ── Test Case Schema (for CODING questions) ───────────────────────────────────

const testCaseSchema = z.object({
  input: z.string(),
  expectedOutput: z.string(),
  isHidden: z.boolean().default(false),
});

// ── Question Schema ───────────────────────────────────────────────────────────

export const questionSchema = z.object({
  type: z.nativeEnum(QuestionType, {
    message: 'Question type must be one of: MCQ_SINGLE, MCQ_MULTIPLE, CODING, DESCRIPTIVE.',
  }),
  text: z.string().min(1, 'Question text is required.'),
  topic: z.string().optional().nullable(),
  difficulty: z
    .enum(['EASY', 'MEDIUM', 'HARD'], {
      message: 'Difficulty must be one of: EASY, MEDIUM, HARD.',
    })
    .optional()
    .nullable(),
  marks: z
    .number({ message: 'Marks must be a number.' })
    .int('Marks must be a whole number.')
    .positive('Marks must be a positive integer.')
    .default(1),
  // MCQ options — required for MCQ_SINGLE and MCQ_MULTIPLE
  options: z.array(questionOptionSchema).optional(),
  // CODING fields
  testCases: z.array(testCaseSchema).optional(),
  starterCode: z.string().optional().nullable(),
});

export const updateQuestionSchema = questionSchema.partial();

export type CreateAssessmentInput = z.infer<typeof createAssessmentSchema>;
export type UpdateAssessmentInput = z.infer<typeof updateAssessmentSchema>;
export type QuestionInput = z.infer<typeof questionSchema>;
export type UpdateQuestionInput = z.infer<typeof updateQuestionSchema>;
