import { Router } from 'express';
import { createRequest, updateStatus, postGuidance, getDetails, listMyMentorships } from '../controllers/mentorship.controller';
import { requireAuth } from '../middleware/auth.middleware';
import { requireRole } from '../middleware/rbac.middleware';

const router = Router();

router.post('/', requireAuth, requireRole('STUDENT'), createRequest);
router.get('/', requireAuth, requireRole('STUDENT', 'ALUMNI'), listMyMentorships);
router.get('/:id', requireAuth, requireRole('STUDENT', 'ALUMNI'), getDetails);
router.patch('/:id/status', requireAuth, requireRole('STUDENT', 'ALUMNI', 'PLACEMENT_OFFICER'), updateStatus);
router.post('/:id/guidance', requireAuth, requireRole('STUDENT', 'ALUMNI'), postGuidance);

export default router;
