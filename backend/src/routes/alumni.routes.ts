import { Router } from 'express';
import * as alumniController from '../controllers/alumni.controller';
import { requireAuth } from '../middleware/auth.middleware';
import { requireRole } from '../middleware/rbac.middleware';

const router = Router();

// All routes in this file are Officer-only.
// requireVerifiedAlumni is available for future alumni-only protected routes.

router.get(
  '/pending',
  requireAuth,
  requireRole('PLACEMENT_OFFICER'),
  alumniController.getPendingAlumni,
);

router.post(
  '/:id/approve',
  requireAuth,
  requireRole('PLACEMENT_OFFICER'),
  alumniController.approveAlumni,
);

router.post(
  '/:id/reject',
  requireAuth,
  requireRole('PLACEMENT_OFFICER'),
  alumniController.rejectAlumni,
);

export default router;
