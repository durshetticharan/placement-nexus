import { Router } from 'express';
import * as expController from '../controllers/driveExperience.controller';
import { requireAuth } from '../middleware/auth.middleware';
import { requireRole } from '../middleware/rbac.middleware';

const router = Router();

// ─── Public (authenticated): Browse approved experiences ───────────────────────
// Any authenticated user can browse approved experiences

router.get(
  '/',
  requireAuth,
  expController.listExperiences,
);

router.get(
  '/me',
  requireAuth,
  requireRole('STUDENT', 'ALUMNI'),
  expController.getMyExperiences,
);

// ─── Officer: Moderation ───────────────────────────────────────────────────────

router.get(
  '/pending',
  requireAuth,
  requireRole('PLACEMENT_OFFICER'),
  expController.listPendingExperiences,
);

router.post(
  '/:id/approve',
  requireAuth,
  requireRole('PLACEMENT_OFFICER'),
  expController.approveExperience,
);

router.post(
  '/:id/reject',
  requireAuth,
  requireRole('PLACEMENT_OFFICER'),
  expController.rejectExperience,
);

// ─── Contributor: Submit ───────────────────────────────────────────────────────

router.post(
  '/',
  requireAuth,
  requireRole('STUDENT', 'ALUMNI'),
  expController.submitExperience,
);

// ─── Public: Get single approved ──────────────────────────────────────────────
// NOTE: placed after specific routes to avoid /:id catching /me /pending etc.

router.get(
  '/:id',
  requireAuth,
  expController.getExperience,
);

export default router;
