import { Router } from 'express';
import { requireAuth } from '../middleware/auth.middleware';
import { requireRole } from '../middleware/rbac.middleware';
import { validate } from '../validation/auth.validation';
import { startAttemptSchema, answerSchema } from '../validation/attempt.validation';
import * as attemptController from '../controllers/attempt.controller';

const router = Router();

// All attempt routes are Student-only
router.use(requireAuth);
router.use(requireRole('STUDENT'));

/**
 * POST /api/v1/attempts/start
 * Body: { assessmentId }
 * Creates a new IN_PROGRESS attempt, or returns an existing one (resume).
 * Returns the assessment questions WITHOUT correct-answer data.
 *
 * IMPORTANT: this static path MUST be declared before /:id routes to
 * prevent Express from matching "start" as an :id parameter.
 */
router.post('/start', validate(startAttemptSchema), attemptController.startAttempt);

/**
 * GET /api/v1/attempts/history
 * Returns all past attempts (with results) for the authenticated student.
 *
 * Declared before /:id/result to prevent "history" being matched as :id.
 */
router.get('/history', attemptController.getAttemptHistory);

/**
 * PATCH /api/v1/attempts/:id/answers
 * Body: { questionId, selectedOptionId? | selectedOptionIds[]? | freeTextAnswer? }
 * Upserts an answer. Rejected if attempt is already SUBMITTED.
 */
router.patch('/:id/answers', validate(answerSchema), attemptController.saveAnswer);

/**
 * POST /api/v1/attempts/:id/submit
 * Submits the attempt, runs scoring engine, persists AssessmentResult.
 */
router.post('/:id/submit', attemptController.submitAttempt);

/**
 * GET /api/v1/attempts/:id/result
 * Full result breakdown for one attempt. Ownership-verified.
 */
router.get('/:id/result', attemptController.getResultDetail);

export default router;
