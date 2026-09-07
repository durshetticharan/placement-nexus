import { Router } from 'express';
import { requireAuth } from '../middleware/auth.middleware';
import { requireRole } from '../middleware/rbac.middleware';
import {
  aiHealth,
  resumeAnalyze,
  careerGuidance,
  interviewGenerateQuestions,
  interviewEvaluateAnswer,
  drivePreparationAdvice,
  listInterviewSessions,
} from '../controllers/ai.controller';

const router = Router();

// Health (authenticated, any role)
router.get('/health', requireAuth, aiHealth);

// Student-only AI features
router.post('/resume/analyze', requireAuth, requireRole('STUDENT'), resumeAnalyze);
router.post('/career/guidance', requireAuth, requireRole('STUDENT'), careerGuidance);
router.post('/interview/questions', requireAuth, requireRole('STUDENT'), interviewGenerateQuestions);
router.post('/interview/evaluate', requireAuth, requireRole('STUDENT'), interviewEvaluateAnswer);
router.get('/interview/sessions', requireAuth, requireRole('STUDENT'), listInterviewSessions);

// Drive preparation (student-only, drive-specific)
router.post('/drives/:drive_id/preparation', requireAuth, requireRole('STUDENT'), drivePreparationAdvice);

export default router;
