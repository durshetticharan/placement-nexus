import { Router } from 'express';
import * as recruiterController from '../controllers/recruiter.controller';
import * as driveController from '../controllers/drive.controller';
import { requireAuth } from '../middleware/auth.middleware';
import { requireRole } from '../middleware/rbac.middleware';
import { validate } from '../validation/auth.validation';
import { updateRecruiterProfileSchema } from '../validation/recruiter.validation';
import { requestCompanyAssociationSchema, reviewActionSchema } from '../validation/company.validation';

const router = Router();

// All routes require authentication
router.use(requireAuth);

// ─── Recruiter Self-Service Routes (Role: RECRUITER) ──────────────────────────
router.get('/drives', requireRole('RECRUITER'), driveController.listRecruiterDrives);
router.post('/drives', requireRole('RECRUITER'), driveController.createDrive);
router.put('/drives/:id', requireRole('RECRUITER'), driveController.updateDrive);
router.put('/drives/:id/requirements', requireRole('RECRUITER'), driveController.updateDriveRequirements);
router.post('/drives/:id/submit', requireRole('RECRUITER'), driveController.submitDrive);
router.post('/drives/:id/close', requireRole('RECRUITER'), driveController.closeDriveRecruiter);
router.post('/drives/:id/cancel', requireRole('RECRUITER'), driveController.cancelDriveRecruiter);

router.get('/me', requireRole('RECRUITER'), recruiterController.getMyProfile);
router.put(
  '/me',
  requireRole('RECRUITER'),
  validate(updateRecruiterProfileSchema),
  recruiterController.updateMyProfile
);
router.get('/me/companies', requireRole('RECRUITER'), recruiterController.getMyCompanies);
router.post(
  '/me/company-requests',
  requireRole('RECRUITER'),
  validate(requestCompanyAssociationSchema),
  recruiterController.requestCompanyAssociation
);

// ─── Placement Officer Management Routes (Role: PLACEMENT_OFFICER) ───────────
router.get('/pending', requireRole('PLACEMENT_OFFICER'), recruiterController.getPendingRecruiters);
router.get('/', requireRole('PLACEMENT_OFFICER'), recruiterController.listRecruiters);
router.get('/:id', requireRole('PLACEMENT_OFFICER'), recruiterController.getRecruiterById);
router.post('/:id/approve', requireRole('PLACEMENT_OFFICER'), recruiterController.approveRecruiter);
router.post(
  '/:id/reject',
  requireRole('PLACEMENT_OFFICER'),
  validate(reviewActionSchema),
  recruiterController.rejectRecruiter
);
router.post(
  '/:id/suspend',
  requireRole('PLACEMENT_OFFICER'),
  validate(reviewActionSchema),
  recruiterController.suspendRecruiter
);

export default router;
