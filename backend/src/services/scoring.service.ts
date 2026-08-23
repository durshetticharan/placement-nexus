/**
 * scoring.service.ts
 *
 * Responsible for evaluating individual answers and aggregating a full
 * attempt score.  This is the most logic-dense part of Phase 6; every
 * decision is documented inline.
 *
 * ── Limitations (Phase 6 scope) ──────────────────────────────────────────────
 *  • DESCRIPTIVE questions cannot be auto-scored.  They are left with
 *    isCorrect = null / marksAwarded = null.  A human grader would need a
 *    separate "manual grading" UI (out of scope).
 *  • CODING questions have no execution sandbox in this phase.  Submitted
 *    code is stored as freeTextAnswer but is NOT executed or evaluated.
 *    They are also left with isCorrect = null / marksAwarded = null, same as
 *    DESCRIPTIVE.  A judge0/piston integration would be Phase 8+ work.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { QuestionType } from '@prisma/client';
import * as attemptRepo from '../repositories/attempt.repository';

// ── Types ─────────────────────────────────────────────────────────────────────

interface QuestionWithOptions {
  id: string;
  type: QuestionType;
  marks: number;
  topic: string | null;
  options: Array<{ id: string; isCorrect: boolean }>;
}

interface AnswerRecord {
  questionId: string;
  selectedOptionId: string | null;
  freeTextAnswer: string | null; // also used to hold JSON-serialised multi-select IDs
  isCorrect: boolean | null;
  marksAwarded: number | null;
}

interface ScoredAnswer {
  questionId: string;
  isCorrect: boolean | null;   // null = not auto-scorable
  marksAwarded: number | null; // null = pending human review
}

interface AttemptScoreResult {
  /**
   * Sum of marks for ALL questions in the assessment (auto + manual).
   * Stored in AssessmentResult.totalMarks to give a "full picture" denominator.
   */
  totalMarks: number;
  /**
   * Sum of marks earned from AUTO-SCORABLE (MCQ) questions only.
   */
  scoredMarks: number;
  /**
   * Percentage = scoredMarks / autoScorable total marks * 100.
   * If there are NO auto-scorable questions at all, defaults to 0.
   * Never NaN or Infinity.
   */
  percentage: number;
  /**
   * Number of questions that could NOT be auto-scored and need human review.
   * The API surface always exposes this so callers know the score is partial.
   */
  pendingManualReviewCount: number;
  /**
   * True when pendingManualReviewCount > 0.  Surfaced explicitly so the
   * front-end can display a "partial score" banner instead of showing a
   * potentially misleading "100%" for a half-answered CODING assessment.
   */
  hasUngradedQuestions: boolean;
  /**
   * Per-answer scoring decisions, stored back to DB.
   */
  scoredAnswers: ScoredAnswer[];
}

// ── scoreAnswer ───────────────────────────────────────────────────────────────

/**
 * Scores one answer against its question.
 *
 * MCQ_SINGLE:
 *   The student selects exactly one option via selectedOptionId.
 *   Correct ⟺ selectedOptionId === the option with isCorrect = true.
 *   Marks: full marks or zero (no partial credit).
 *
 * MCQ_MULTIPLE:
 *   The student's selections are stored as a JSON array in freeTextAnswer
 *   because the Answer schema only has ONE selectedOptionId column.
 *   Correct ⟺ the set of selected IDs EXACTLY equals the set of isCorrect IDs.
 *   Rationale: partial credit would require a careful rubric (e.g. -1 per wrong);
 *   keeping it all-or-nothing is simpler, less error-prone, and avoids
 *   negative-score edge cases in Phase 6.
 *
 * CODING / DESCRIPTIVE:
 *   Returned as isCorrect = null, marksAwarded = null.
 *   See module-level limitation note above.
 */
export function scoreAnswer(
  question: QuestionWithOptions,
  answer: Pick<AnswerRecord, 'selectedOptionId' | 'freeTextAnswer'>,
): ScoredAnswer {
  const { id: questionId, type, marks, options } = question;

  switch (type) {
    case QuestionType.MCQ_SINGLE: {
      // Identify the single correct option
      const correctOption = options.find((o) => o.isCorrect);
      if (!correctOption) {
        // Malformed question — no correct option defined.  Treat as unscored.
        return { questionId, isCorrect: null, marksAwarded: null };
      }
      const isCorrect = answer.selectedOptionId === correctOption.id;
      return {
        questionId,
        isCorrect,
        marksAwarded: isCorrect ? marks : 0,
      };
    }

    case QuestionType.MCQ_MULTIPLE: {
      // Correct IDs = sorted set of options with isCorrect = true
      const correctIds = options
        .filter((o) => o.isCorrect)
        .map((o) => o.id)
        .sort();

      // Student's selections are stored as a JSON array in freeTextAnswer
      let selectedIds: string[] = [];
      if (answer.freeTextAnswer) {
        try {
          const parsed = JSON.parse(answer.freeTextAnswer);
          if (Array.isArray(parsed)) selectedIds = parsed.map(String).sort();
        } catch {
          // Malformed JSON — treat as no selection, score = 0
          selectedIds = [];
        }
      }

      // Exact-match comparison: every selected ID must be in correctIds
      // and lengths must match (no extras, no missing)
      const isCorrect =
        selectedIds.length === correctIds.length &&
        selectedIds.every((id, i) => id === correctIds[i]);

      return {
        questionId,
        isCorrect,
        marksAwarded: isCorrect ? marks : 0,
      };
    }

    case QuestionType.CODING:
    // ── Phase 6 limitation ──
    // No code execution sandbox available.  The submitted code is stored in
    // freeTextAnswer for future evaluation.  marksAwarded = null signals
    // "pending review" to downstream consumers.
    case QuestionType.DESCRIPTIVE:
    // ── Phase 6 limitation ──
    // Free-text grading requires human review.  Out of scope for this phase.
    default:
      return { questionId, isCorrect: null, marksAwarded: null };
  }
}

// ── scoreAttempt ──────────────────────────────────────────────────────────────

/**
 * Scores all answers for an attempt.
 *
 * Percentage calculation rationale:
 *   - totalMarks        = sum of marks across ALL questions (full assessment weight)
 *   - autoScoredTotal   = sum of marks across MCQ questions only
 *   - scoredMarks       = marks earned from MCQ questions
 *   - percentage        = scoredMarks / autoScoredTotal * 100
 *
 *   If autoScoredTotal == 0 (all CODING/DESCRIPTIVE), percentage = 0 and
 *   hasUngradedQuestions = true, making it obvious the score is meaningless
 *   until human review is done.
 *
 *   This keeps AssessmentResult.percentage honest: it only reflects what was
 *   auto-graded, never silently inflating or deflating the true score.
 */
export async function scoreAttempt(attemptId: string): Promise<AttemptScoreResult> {
  const attempt = await attemptRepo.findAttemptById(attemptId);
  if (!attempt) throw new Error(`Attempt ${attemptId} not found during scoring.`);

  const questions = attempt.assessment.questions;
  const answers: AnswerRecord[] = attempt.answers as AnswerRecord[];

  // Build a lookup map: questionId → answer (may be absent if student skipped)
  const answerMap = new Map<string, AnswerRecord>();
  for (const ans of answers) answerMap.set(ans.questionId, ans);

  let totalMarks = 0;
  let autoScoredTotalMarks = 0; // denominator for percentage
  let scoredMarks = 0;
  let pendingManualReviewCount = 0;
  const scoredAnswers: ScoredAnswer[] = [];

  for (const question of questions) {
    totalMarks += question.marks;

    const answer = answerMap.get(question.id) ?? {
      selectedOptionId: null,
      freeTextAnswer: null,
    };

    const result = scoreAnswer(question, answer);
    scoredAnswers.push(result);

    if (result.marksAwarded === null) {
      // Not auto-scorable
      pendingManualReviewCount++;
    } else {
      // Auto-scorable (MCQ type)
      autoScoredTotalMarks += question.marks;
      scoredMarks += result.marksAwarded;
    }
  }

  // Safe percentage — never NaN or Infinity
  const percentage =
    autoScoredTotalMarks > 0
      ? Math.round((scoredMarks / autoScoredTotalMarks) * 10000) / 100 // 2 d.p.
      : 0;

  return {
    totalMarks,
    scoredMarks,
    percentage,
    pendingManualReviewCount,
    hasUngradedQuestions: pendingManualReviewCount > 0,
    scoredAnswers,
  };
}

// ── computeTopicBreakdown ─────────────────────────────────────────────────────

/**
 * Groups AUTO-SCORED answers by question.topic and returns the % correct
 * per topic.
 *
 * Only MCQ questions contribute — CODING/DESCRIPTIVE questions with
 * marksAwarded = null are excluded to keep the breakdown meaningful.
 *
 * Questions without a topic are grouped under the key "__untagged__".
 *
 * Example output: { "Graphs": 40, "Trees": 100, "__untagged__": 0 }
 */
export async function computeTopicBreakdown(attemptId: string): Promise<Record<string, number>> {
  const attempt = await attemptRepo.findAttemptById(attemptId);
  if (!attempt) return {};

  const answerMap = new Map<string, AnswerRecord>();
  for (const ans of attempt.answers as AnswerRecord[]) {
    answerMap.set(ans.questionId, ans);
  }

  // topic → { earned, total }
  const topicStats: Record<string, { earned: number; total: number }> = {};

  for (const question of attempt.assessment.questions) {
    // Skip CODING and DESCRIPTIVE — they aren't auto-scored
    if (
      question.type === QuestionType.CODING ||
      question.type === QuestionType.DESCRIPTIVE
    ) continue;

    const topicKey = question.topic ?? '__untagged__';
    if (!topicStats[topicKey]) topicStats[topicKey] = { earned: 0, total: 0 };

    topicStats[topicKey].total += question.marks;

    const answer = answerMap.get(question.id) ?? {
      selectedOptionId: null,
      freeTextAnswer: null,
    };
    const scored = scoreAnswer(question, answer);
    topicStats[topicKey].earned += scored.marksAwarded ?? 0;
  }

  // Convert to percentages, rounded to 2 d.p.
  const breakdown: Record<string, number> = {};
  for (const [topic, { earned, total }] of Object.entries(topicStats)) {
    breakdown[topic] = total > 0 ? Math.round((earned / total) * 10000) / 100 : 0;
  }

  return breakdown;
}
