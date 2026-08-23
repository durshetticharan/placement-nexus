import { Router } from 'express';
import * as recruiterController from '../controllers/recruiter.controller';
import { requireAuth } from '../middleware/auth.middleware';
import { requireRole } from '../middleware/rbac.middleware';

const router = Router();

// All routes in this file are Officer-only.
// requireVerifiedRecruiter is intentionally NOT applied here — Officers call these,
// not Recruiters. Recruiter-specific protected routes in future phases will use it.

router.get(
  '/pending',
  requireAuth,
  requireRole('PLACEMENT_OFFICER'),
  recruiterController.getPendingRecruiters,
);

router.post(
  '/:id/approve',
  requireAuth,
  requireRole('PLACEMENT_OFFICER'),
  recruiterController.approveRecruiter,
);

router.post(
  '/:id/reject',
  requireAuth,
  requireRole('PLACEMENT_OFFICER'),
  recruiterController.rejectRecruiter,
);

export default router;
