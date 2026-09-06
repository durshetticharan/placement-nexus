import { Router } from 'express';
import * as referralController from '../controllers/referral.controller';
import { requireAuth } from '../middleware/auth.middleware';
import { requireRole } from '../middleware/rbac.middleware';

const router = Router();

// ─── Opportunities ────────────────────────────────────────────────────────────

// Alumni creates an opportunity
router.post(
  '/opportunities',
  requireAuth,
  requireRole('ALUMNI'),
  referralController.createOpportunity
);

// Alumni views their own created opportunities
router.get(
  '/opportunities/me',
  requireAuth,
  requireRole('ALUMNI'),
  referralController.getMyOpportunities
);

// Students view active opportunities
router.get(
  '/opportunities',
  requireAuth,
  requireRole('STUDENT'),
  referralController.getActiveOpportunities
);

// ─── Requests ─────────────────────────────────────────────────────────────────

// Student creates a referral request
router.post(
  '/requests',
  requireAuth,
  requireRole('STUDENT'),
  referralController.createRequest
);

// Student views their sent requests
router.get(
  '/requests/student',
  requireAuth,
  requireRole('STUDENT'),
  referralController.getStudentRequests
);

// Alumni views received requests for their opportunities
router.get(
  '/requests/alumni',
  requireAuth,
  requireRole('ALUMNI'),
  referralController.getAlumniRequests
);

// Alumni updates status of a request (accept, reject, referred)
router.patch(
  '/requests/:id/status',
  requireAuth,
  requireRole('ALUMNI'),
  referralController.updateRequestStatus
);

export default router;
