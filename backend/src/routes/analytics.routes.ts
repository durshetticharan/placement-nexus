import { Router } from 'express';
import { requireAuth } from '../middleware/auth.middleware';
import { requireRole } from '../middleware/rbac.middleware';
import { AnalyticsController } from '../controllers/analytics.controller';

const router = Router();

// Student Analytics
router.get(
  '/student',
  requireAuth,
  requireRole('STUDENT'),
  AnalyticsController.getStudentAnalytics
);

// Recruiter Analytics
router.get(
  '/recruiter',
  requireAuth,
  requireRole('RECRUITER'),
  AnalyticsController.getRecruiterAnalytics
);

// Officer Analytics
router.get(
  '/officer',
  requireAuth,
  requireRole('PLACEMENT_OFFICER'),
  AnalyticsController.getOfficerAnalytics
);

export default router;
