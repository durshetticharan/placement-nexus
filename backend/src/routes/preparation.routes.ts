import { Router } from 'express';
import { initDrivePreparation, getDrivePlan, addTask, updateTask } from '../controllers/preparation.controller';
import { requireAuth } from '../middleware/auth.middleware';
import { requireRole } from '../middleware/rbac.middleware';

const router = Router();

router.post('/drives/:driveId', requireAuth, requireRole('STUDENT'), initDrivePreparation);
router.get('/drives/:driveId', requireAuth, requireRole('STUDENT'), getDrivePlan);
router.post('/tasks', requireAuth, requireRole('STUDENT'), addTask);
router.patch('/tasks/:taskId/status', requireAuth, requireRole('STUDENT'), updateTask);

export default router;
