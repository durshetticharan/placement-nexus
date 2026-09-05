import { Router } from 'express';
import * as officerController from '../controllers/officer.controller';
import * as driveController from '../controllers/drive.controller';
import { requireAuth } from '../middleware/auth.middleware';
import { requireRole } from '../middleware/rbac.middleware';
import { validate } from '../validation/auth.validation';
import {
  createCompanySchema,
  updateCompanySchema,
  updateMembershipRoleSchema,
  reviewActionSchema,
} from '../validation/company.validation';

const router = Router();

// Protect all routes: strictly require PLACEMENT_OFFICER role
router.use(requireAuth, requireRole('PLACEMENT_OFFICER'));

// ─── Placement Drives Management ─────────────────────────────────────────────
router.get('/drives', driveController.listOfficerDrives);
router.get('/drives/:id', driveController.getDriveDetails);
router.post('/drives/:id/approve', driveController.officerApproveDrive);
router.post('/drives/:id/reject', validate(reviewActionSchema), driveController.officerRejectDrive);
router.post('/drives/:id/publish', driveController.officerApproveDrive); // Maps to same as approve for now
router.post('/drives/:id/close', driveController.officerCloseDrive);
router.post('/drives/:id/cancel', driveController.officerCancelDrive);
router.post('/drives/:id/complete', driveController.officerCompleteDrive);

// ─── Company Management ───────────────────────────────────────────────────────
router.get('/companies', officerController.listCompanies);
router.get('/companies/:id', officerController.getCompany);
router.post('/companies', validate(createCompanySchema), officerController.createCompany);
router.patch('/companies/:id', validate(updateCompanySchema), officerController.updateCompany);
router.post('/companies/:id/approve', officerController.approveCompany);
router.post('/companies/:id/reject', validate(reviewActionSchema), officerController.rejectCompany);
router.post('/companies/:id/suspend', validate(reviewActionSchema), officerController.suspendCompany);

// ─── Recruiter Management ─────────────────────────────────────────────────────
router.get('/recruiters', officerController.listRecruiters);
router.get('/recruiters/:id', officerController.getRecruiter);
router.post('/recruiters/:id/approve', officerController.approveRecruiter);
router.post('/recruiters/:id/reject', validate(reviewActionSchema), officerController.rejectRecruiter);
router.post('/recruiters/:id/suspend', validate(reviewActionSchema), officerController.suspendRecruiter);

// ─── Membership Management ────────────────────────────────────────────────────
router.get('/company-memberships', officerController.listCompanyMemberships);
router.post('/company-memberships/:id/approve', officerController.approveMembership);
router.post('/company-memberships/:id/reject', validate(reviewActionSchema), officerController.rejectMembership);
router.patch(
  '/company-memberships/:id/role',
  validate(updateMembershipRoleSchema),
  officerController.updateMembershipRole
);

export default router;
