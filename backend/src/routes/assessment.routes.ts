import { Router } from 'express';
import { requireAuth } from '../middleware/auth.middleware';
import { requireRole } from '../middleware/rbac.middleware';
import { validate } from '../validation/auth.validation';
import {
  createAssessmentSchema,
  updateAssessmentSchema,
  questionSchema,
  updateQuestionSchema,
} from '../validation/assessment.validation';
import * as assessmentController from '../controllers/assessment.controller';

const router = Router();

// All routes require authentication
router.use(requireAuth);

// ── Assessment routes ─────────────────────────────────────────────────────────

/**
 * POST /api/v1/assessments
 * Officer only — create a new DRAFT assessment
 */
router.post(
  '/',
  requireRole('PLACEMENT_OFFICER'),
  validate(createAssessmentSchema),
  assessmentController.createAssessment,
);

/**
 * GET /api/v1/assessments
 * Officer: all assessments (any status), with _count
 * Student: only PUBLISHED assessments, answer keys stripped
 * Query params: ?category=&topic=&status= (status ignored for students)
 */
router.get(
  '/',
  requireRole('PLACEMENT_OFFICER', 'STUDENT'),
  assessmentController.listAssessments,
);

/**
 * GET /api/v1/assessments/:id
 * Officer: full detail including isCorrect flags
 * Student: PUBLISHED only, isCorrect and hidden test cases stripped
 */
router.get(
  '/:id',
  requireRole('PLACEMENT_OFFICER', 'STUDENT'),
  assessmentController.getAssessment,
);

/**
 * PATCH /api/v1/assessments/:id
 * Officer only — update assessment metadata
 * Blocked if status=PUBLISHED and there are existing attempts
 */
router.patch(
  '/:id',
  requireRole('PLACEMENT_OFFICER'),
  validate(updateAssessmentSchema),
  assessmentController.updateAssessment,
);

/**
 * DELETE /api/v1/assessments/:id
 * Officer only — hard delete; only allowed if status=DRAFT and no attempts
 */
router.delete(
  '/:id',
  requireRole('PLACEMENT_OFFICER'),
  assessmentController.deleteAssessment,
);

/**
 * POST /api/v1/assessments/:id/publish
 * Officer only — publish the assessment (requires at least 1 question)
 */
router.post(
  '/:id/publish',
  requireRole('PLACEMENT_OFFICER'),
  assessmentController.publishAssessment,
);

/**
 * POST /api/v1/assessments/:id/archive
 * Officer only — soft archive (never hard-deletes)
 */
router.post(
  '/:id/archive',
  requireRole('PLACEMENT_OFFICER'),
  assessmentController.archiveAssessment,
);

// ── Question routes ───────────────────────────────────────────────────────────

/**
 * POST /api/v1/assessments/:id/questions
 * Officer only — add a question to an assessment
 */
router.post(
  '/:id/questions',
  requireRole('PLACEMENT_OFFICER'),
  validate(questionSchema),
  assessmentController.addQuestion,
);

/**
 * PATCH /api/v1/assessments/questions/:id
 * Officer only — update a question (blocked if assessment published + has attempts)
 */
router.patch(
  '/questions/:id',
  requireRole('PLACEMENT_OFFICER'),
  validate(updateQuestionSchema),
  assessmentController.updateQuestion,
);

/**
 * DELETE /api/v1/assessments/questions/:id
 * Officer only — delete a question (blocked if assessment published + has attempts)
 */
router.delete(
  '/questions/:id',
  requireRole('PLACEMENT_OFFICER'),
  assessmentController.deleteQuestion,
);

export default router;
