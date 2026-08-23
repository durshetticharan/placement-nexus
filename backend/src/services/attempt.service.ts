import { AttemptStatus, QuestionType } from '@prisma/client';
import * as attemptRepo from '../repositories/attempt.repository';
import * as assessmentRepo from '../repositories/assessment.repository';
import * as studentService from './student.service';
import * as scoringService from './scoring.service';

function createError(message: string, code: string, statusCode: number) {
  return Object.assign(new Error(message), { code, statusCode });
}

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Strips answer-key data from questions before sending to a student.
 * Reuses the same logic as getAssessmentForStudent in assessment.service.ts.
 */
function stripAnswerKeys(questions: any[]): any[] {
  return questions.map((q) => ({
    ...q,
    options: q.options.map(({ isCorrect: _stripped, ...safe }: any) => safe),
    testCases:
      q.type === QuestionType.CODING && q.testCases
        ? (q.testCases as Array<{ isHidden: boolean }>)
            .filter((tc) => !tc.isHidden)
            .map(({ isHidden: _h, ...safe }) => safe)
        : undefined,
  }));
}

// ── startAttempt ──────────────────────────────────────────────────────────────

/**
 * Creates a new IN_PROGRESS attempt — or resumes an existing one.
 *
 * Resume behaviour: if an IN_PROGRESS attempt already exists for this
 * student+assessment pair, we return it instead of creating a duplicate.
 * This handles browser refreshes and session drops gracefully.
 */
export async function startAttempt(userId: string, assessmentId: string) {
  const studentId = await studentService.getStudentIdByUserId(userId);

  // 1. Assessment must exist and be PUBLISHED
  const assessment = await assessmentRepo.findAssessmentById(assessmentId);
  if (!assessment || assessment.status !== 'PUBLISHED') {
    throw createError('Assessment not found or is not available.', 'NOT_FOUND', 404);
  }

  // 2. Check for an existing IN_PROGRESS attempt (resume behaviour)
  const existing = await attemptRepo.findActiveAttempt(studentId, assessmentId);
  if (existing) {
    return {
      attempt: existing,
      questions: stripAnswerKeys(existing.assessment.questions),
      resumed: true,
    };
  }

  // 3. Create a fresh attempt
  const attempt = await attemptRepo.createAttempt(assessmentId, studentId);

  return {
    attempt,
    questions: stripAnswerKeys(assessment.questions),
    resumed: false,
  };
}

// ── saveAnswer ────────────────────────────────────────────────────────────────

/**
 * Upserts an answer for one question within an IN_PROGRESS attempt.
 *
 * MCQ_MULTIPLE storage note:
 *   The Answer model has a single selectedOptionId column.  For MCQ_MULTIPLE
 *   we serialise the array of selected option IDs as JSON into freeTextAnswer.
 *   This is a deliberate schema-conservative approach — no migration needed.
 */
export async function saveAnswer(
  attemptId: string,
  userId: string,
  questionId: string,
  answerData: {
    selectedOptionId?: string | null;
    selectedOptionIds?: string[] | null; // MCQ_MULTIPLE
    freeTextAnswer?: string | null;      // DESCRIPTIVE / CODING
  },
) {
  const studentId = await studentService.getStudentIdByUserId(userId);

  // Verify the attempt belongs to this student and is still open
  const attempt = await attemptRepo.findAttemptById(attemptId);
  if (!attempt || attempt.studentId !== studentId) {
    throw createError('Attempt not found.', 'NOT_FOUND', 404);
  }
  if (attempt.status !== AttemptStatus.IN_PROGRESS) {
    throw createError(
      'This attempt has already been submitted. Answers cannot be changed.',
      'CONFLICT',
      409,
    );
  }

  // Resolve the correct DB columns
  const selectedOptionId = answerData.selectedOptionId ?? null;

  // For MCQ_MULTIPLE, serialise the array to JSON in freeTextAnswer
  const freeText =
    answerData.selectedOptionIds != null
      ? JSON.stringify(answerData.selectedOptionIds)
      : (answerData.freeTextAnswer ?? null);

  return attemptRepo.upsertAnswer(attemptId, questionId, {
    selectedOptionId,
    freeTextAnswer: freeText,
    // isCorrect and marksAwarded are null until scoring at submission time
    isCorrect: null,
    marksAwarded: null,
  });
}

function formatResult(result: any) {
  if (!result) return null;
  return {
    ...result,
    percentage:
      typeof result.percentage === 'string' || typeof result.percentage === 'object'
        ? Number(result.percentage)
        : result.percentage,
    percentile:
      result.percentile !== null && result.percentile !== undefined
        ? Number(result.percentile)
        : null,
  };
}

function formatAttempt(attempt: any) {
  if (!attempt) return null;

  const pendingManualReviewCount = attempt.assessment?.questions
    ? attempt.assessment.questions.filter(
        (q: any) => q.type === QuestionType.CODING || q.type === QuestionType.DESCRIPTIVE
      ).length
    : 0;

  return {
    ...attempt,
    result: attempt.result ? formatResult(attempt.result) : null,
    hasUngradedQuestions: pendingManualReviewCount > 0,
    pendingManualReviewCount,
  };
}

// ── submitAttempt ─────────────────────────────────────────────────────────────

/**
 * Submits the attempt, runs the scoring engine, and persists an
 * AssessmentResult.
 *
 * Status flow decision:
 *   SUBMITTED → EVALUATED for MCQ-only assessments (all auto-scored).
 *   SUBMITTED → SUBMITTED (kept) when hasUngradedQuestions = true, because
 *   the score is incomplete until human review.  This makes the status a
 *   reliable signal of "fully graded" vs "partially graded".
 */
export async function submitAttempt(attemptId: string, userId: string) {
  const studentId = await studentService.getStudentIdByUserId(userId);

  const attempt = await attemptRepo.findAttemptById(attemptId);
  if (!attempt || attempt.studentId !== studentId) {
    throw createError('Attempt not found.', 'NOT_FOUND', 404);
  }
  if (attempt.status !== AttemptStatus.IN_PROGRESS) {
    throw createError(
      'This attempt has already been submitted.',
      'CONFLICT',
      409,
    );
  }

  const now = new Date();
  const timeTakenSecs = Math.floor(
    (now.getTime() - attempt.startedAt.getTime()) / 1000,
  );

  // Mark as SUBMITTED immediately so concurrent requests are blocked
  await attemptRepo.updateAttemptStatus(attemptId, {
    status: AttemptStatus.SUBMITTED,
    submittedAt: now,
    timeTakenSecs,
  });

  // Run the scoring engine
  const scoreResult = await scoringService.scoreAttempt(attemptId);

  // Persist individual answer scores back to the DB
  for (const sa of scoreResult.scoredAnswers) {
    await attemptRepo.upsertAnswer(attemptId, sa.questionId, {
      isCorrect: sa.isCorrect,
      marksAwarded: sa.marksAwarded,
    });
  }

  // Compute clean topic-level breakdown (flat object with ONLY topic names)
  const topicBreakdown = await scoringService.computeTopicBreakdown(attemptId);

  // Persist the result
  const result = await attemptRepo.createResult(attemptId, {
    totalMarks: scoreResult.totalMarks,
    scoredMarks: scoreResult.scoredMarks,
    percentage: scoreResult.percentage,
    topicBreakdown,
  });

  // Advance status to EVALUATED only when all questions were auto-scored
  const finalStatus = scoreResult.hasUngradedQuestions
    ? AttemptStatus.SUBMITTED  // awaiting human review — leave as SUBMITTED
    : AttemptStatus.EVALUATED; // fully graded

  await attemptRepo.updateAttemptStatus(attemptId, { status: finalStatus });

  return {
    result: formatResult(result),
    hasUngradedQuestions: scoreResult.hasUngradedQuestions,
    pendingManualReviewCount: scoreResult.pendingManualReviewCount,
    status: finalStatus,
  };
}

// ── getAttemptHistory ─────────────────────────────────────────────────────────

export async function getAttemptHistory(userId: string) {
  const studentId = await studentService.getStudentIdByUserId(userId);
  const attempts = await attemptRepo.findAttemptsByStudent(studentId);
  return attempts.map((a) => formatAttempt(a));
}

// ── getResultDetail ───────────────────────────────────────────────────────────

export async function getResultDetail(attemptId: string, userId: string) {
  const studentId = await studentService.getStudentIdByUserId(userId);

  const attempt = await attemptRepo.findAttemptById(attemptId);
  if (!attempt || attempt.studentId !== studentId) {
    throw createError('Attempt not found.', 'NOT_FOUND', 404);
  }

  // Strip answer keys from question data before returning to student
  const safeQuestions = stripAnswerKeys(attempt.assessment.questions);
  const formatted = formatAttempt(attempt);

  return {
    ...formatted,
    assessment: {
      ...attempt.assessment,
      questions: safeQuestions,
    },
  };
}

