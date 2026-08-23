import { z } from 'zod';

/**
 * Answer submission schema.
 *
 * We accept a flexible shape here and defer question-type-specific validation
 * to the service layer (where we have access to the actual Question record).
 * Reasons:
 *   1. The route handler doesn't have the question's type at validation time.
 *   2. A Zod discriminated union would require the client to send a `type`
 *      discriminant — adding coupling between client and DB enum.
 *   3. Service-layer validation gives us better error messages referencing
 *      the actual question type.
 *
 * Accepted shapes per question type:
 *   MCQ_SINGLE   → { questionId, selectedOptionId: string }
 *   MCQ_MULTIPLE → { questionId, selectedOptionIds: string[] }
 *   DESCRIPTIVE  → { questionId, freeTextAnswer: string }
 *   CODING       → { questionId, freeTextAnswer: string }  (code as text)
 */
export const answerSchema = z.object({
  questionId: z.string().min(1, 'questionId is required.'),

  // MCQ_SINGLE: the ID of the chosen option
  selectedOptionId: z.string().optional().nullable(),

  // MCQ_MULTIPLE: array of chosen option IDs
  selectedOptionIds: z.array(z.string()).optional().nullable(),

  // DESCRIPTIVE / CODING: free-form text (or code)
  freeTextAnswer: z.string().optional().nullable(),
});

export const startAttemptSchema = z.object({
  assessmentId: z.string().min(1, 'assessmentId is required.'),
});

export type AnswerInput = z.infer<typeof answerSchema>;
export type StartAttemptInput = z.infer<typeof startAttemptSchema>;
