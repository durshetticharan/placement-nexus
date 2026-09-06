import { Router } from 'express';
import { updateProfile, getDirectory } from '../controllers/mentor.controller';
import { requireAuth } from '../middleware/auth.middleware';
import { requireRole } from '../middleware/rbac.middleware';

const router = Router();

router.get('/', requireAuth, requireRole('STUDENT', 'ALUMNI', 'PLACEMENT_OFFICER'), getDirectory);
router.patch('/me', requireAuth, requireRole('ALUMNI'), updateProfile);

export default router;
