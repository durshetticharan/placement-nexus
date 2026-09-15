import { Router } from 'express';
import * as recruiterController from '../controllers/recruiter.controller';
import * as driveController from '../controllers/drive.controller';
import * as applicationController from '../controllers/application.controller';
import * as interviewController from '../controllers/interview.controller';
import * as selectionController from '../controllers/selection.controller';
import { requireAuth } from '../middleware/auth.middleware';
import { requireRole, requireVerifiedRecruiter } from '../middleware/rbac.middleware';
import { validate } from '../validation/auth.validation';
import { updateRecruiterProfileSchema } from '../validation/recruiter.validation';
import { requestCompanyAssociationSchema, reviewActionSchema } from '../validation/company.validation';

const router = Router();

// All routes require authentication
router.use(requireAuth);

// ─── Recruiter Self-Service Routes (Role: RECRUITER) ──────────────────────────
router.get('/drives', requireRole('RECRUITER'), requireVerifiedRecruiter, driveController.listRecruiterDrives);
router.get('/drives/:id', requireRole('RECRUITER'), requireVerifiedRecruiter, driveController.getRecruiterDrive);
router.post('/drives', requireRole('RECRUITER'), requireVerifiedRecruiter, driveController.createDrive);
router.put('/drives/:id', requireRole('RECRUITER'), requireVerifiedRecruiter, driveController.updateDrive);
router.put('/drives/:id/requirements', requireRole('RECRUITER'), requireVerifiedRecruiter, driveController.updateDriveRequirements);
router.post('/drives/:id/submit', requireRole('RECRUITER'), requireVerifiedRecruiter, driveController.submitDrive);
router.post('/drives/:id/close', requireRole('RECRUITER'), requireVerifiedRecruiter, driveController.closeDriveRecruiter);
router.post('/drives/:id/cancel', requireRole('RECRUITER'), requireVerifiedRecruiter, driveController.cancelDriveRecruiter);

// Applications & Interviews (Recruiter context)
router.get('/me/drives/:id/applications', requireRole('RECRUITER'), requireVerifiedRecruiter, applicationController.getDriveApplications);
router.patch('/me/applications/:id/status', requireRole('RECRUITER'), requireVerifiedRecruiter, applicationController.updateApplicationStatus);
router.get('/me/applications/:id/match-breakdown', requireRole('RECRUITER'), requireVerifiedRecruiter, applicationController.getMatchBreakdown);
router.post('/me/applications/:appId/interviews', requireRole('RECRUITER'), requireVerifiedRecruiter, interviewController.scheduleInterview);
router.patch('/me/interviews/:id', requireRole('RECRUITER'), requireVerifiedRecruiter, interviewController.updateInterviewOutcome);
router.post('/me/applications/:appId/selection', requireRole('RECRUITER'), requireVerifiedRecruiter, selectionController.recordSelection);

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
