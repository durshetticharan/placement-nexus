import { Request, Response } from 'express';
import * as companyService from '../services/company.service';
import * as membershipService from '../services/membership.service';
import { ServiceError } from '../services/company.service';

function handleError(res: Response, err: any): void {
  if (err instanceof ServiceError) {
    res.status(err.statusCode).json({
      success: false,
      error: { code: err.code, message: err.message },
    });
    return;
  }
  res.status(err.statusCode || 500).json({
    success: false,
    error: { code: err.code || 'INTERNAL_ERROR', message: err.message || 'An unexpected error occurred.' },
  });
}

// GET /api/v1/companies
export async function listCompanies(req: Request, res: Response): Promise<void> {
  try {
    const { status, industry, search, verificationStatus } = req.query;
    const userRole = req.user?.role;

    // By default, non-officers only see ACTIVE & APPROVED companies unless searching
    const options: any = {
      search: search as string | undefined,
      industry: industry as string | undefined,
    };

    if (userRole === 'PLACEMENT_OFFICER') {
      if (status) options.status = status;
      if (verificationStatus) options.verificationStatus = verificationStatus;
    } else {
      options.status = 'ACTIVE';
      options.verificationStatus = 'APPROVED';
    }

    const companies = await companyService.listCompanies(options);
    res.json({ success: true, data: companies });
  } catch (err: any) {
    handleError(res, err);
  }
}

// GET /api/v1/companies/:id
export async function getCompany(req: Request, res: Response): Promise<void> {
  try {
    const id = req.params['id'] as string;
    const company = await companyService.getCompany(id);
    res.json({ success: true, data: company });
  } catch (err: any) {
    handleError(res, err);
  }
}

// PUT /api/v1/companies/:id
export async function updateCompany(req: Request, res: Response): Promise<void> {
  try {
    const id = req.params['id'] as string;
    const userId = req.user!.userId;
    const userRole = req.user!.role;

    // If recruiter, check that they are a verified COMPANY_ADMIN of this company
    if (userRole === 'RECRUITER') {
      const hasAccess = await membershipService.checkRecruiterCompanyAccess(userId, id, 'COMPANY_ADMIN');
      if (!hasAccess) {
        res.status(403).json({
          success: false,
          error: {
            code: 'FORBIDDEN',
            message: 'You do not have company admin permissions to modify this company profile.',
          },
        });
        return;
      }
    }

    const updated = await companyService.updateCompany(
      id,
      req.body,
      userId,
      userRole === 'PLACEMENT_OFFICER'
    );
    res.json({ success: true, data: updated });
  } catch (err: any) {
    handleError(res, err);
  }
}
