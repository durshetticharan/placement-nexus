import { Router } from 'express';
import * as resController from '../controllers/driveResource.controller';
import { requireAuth } from '../middleware/auth.middleware';
import { requireRole } from '../middleware/rbac.middleware';

const router = Router();

// ─── Public (authenticated): Browse approved resources ─────────────────────────

router.get(
  '/',
  requireAuth,
  resController.listResources,
);

router.get(
  '/me',
  requireAuth,
  requireRole('STUDENT', 'ALUMNI'),
  resController.getMyResources,
);

// ─── Officer: Moderation ───────────────────────────────────────────────────────

router.get(
  '/pending',
  requireAuth,
  requireRole('PLACEMENT_OFFICER'),
  resController.listPendingResources,
);

router.post(
  '/:id/approve',
  requireAuth,
  requireRole('PLACEMENT_OFFICER'),
  resController.approveResource,
);

router.post(
  '/:id/reject',
  requireAuth,
  requireRole('PLACEMENT_OFFICER'),
  resController.rejectResource,
);

// ─── Contributor: Submit + Delete ──────────────────────────────────────────────

router.post(
  '/',
  requireAuth,
  requireRole('STUDENT', 'ALUMNI', 'PLACEMENT_OFFICER'),
  resController.submitResource,
);

router.delete(
  '/:id',
  requireAuth,
  requireRole('STUDENT', 'ALUMNI'),
  resController.deleteResource,
);

// ─── Public: Get single ────────────────────────────────────────────────────────

router.get(
  '/:id',
  requireAuth,
  resController.getResource,
);

export default router;
