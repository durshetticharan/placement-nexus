import { Router } from 'express';
import * as companyController from '../controllers/company.controller';
import { requireAuth } from '../middleware/auth.middleware';
import { requireRole } from '../middleware/rbac.middleware';
import { validate } from '../validation/auth.validation';
import { updateCompanySchema } from '../validation/company.validation';

const router = Router();

// All company routes require authentication
router.use(requireAuth);

// GET /api/v1/companies — list active/approved companies (Officer can filter all)
router.get('/', companyController.listCompanies);

// GET /api/v1/companies/:id — view company details
router.get('/:id', companyController.getCompany);

// PUT /api/v1/companies/:id — update company (Officer or verified Company Admin recruiter)
router.put(
  '/:id',
  requireRole('PLACEMENT_OFFICER', 'RECRUITER'),
  validate(updateCompanySchema),
  companyController.updateCompany
);

export default router;
