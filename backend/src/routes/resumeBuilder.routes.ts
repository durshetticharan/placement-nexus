import { Router } from 'express';
import { requireAuth, requireRole } from '../middleware/auth.middleware';
import * as resumeBuilderController from '../controllers/resumeBuilder.controller';

const router = Router();

// Only students can access the resume builder
router.use(requireAuth, requireRole(['STUDENT']));

router.get('/', resumeBuilderController.getResume);
router.put('/', resumeBuilderController.upsertResume);

export default router;
