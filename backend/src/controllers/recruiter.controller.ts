import { Request, Response } from 'express';
import * as recruiterService from '../services/recruiter.service';
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

// ─── Recruiter Self-Service Endpoints ─────────────────────────────────────────

// GET /api/v1/recruiters/me
export async function getMyProfile(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user!.userId;
    const profile = await recruiterService.getMyProfile(userId);
    res.json({ success: true, data: profile });
  } catch (err: any) {
    handleError(res, err);
  }
}

// PUT /api/v1/recruiters/me
export async function updateMyProfile(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user!.userId;
    const updated = await recruiterService.updateMyProfile(userId, req.body);
    res.json({ success: true, data: updated });
  } catch (err: any) {
    handleError(res, err);
  }
}

// GET /api/v1/recruiters/me/companies
export async function getMyCompanies(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user!.userId;
    const memberships = await membershipService.listRecruiterMemberships(userId);
    res.json({ success: true, data: memberships });
  } catch (err: any) {
    handleError(res, err);
  }
}

// POST /api/v1/recruiters/me/company-requests
export async function requestCompanyAssociation(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user!.userId;
    const membership = await membershipService.requestAssociation(userId, req.body);
    res.status(201).json({ success: true, data: membership });
  } catch (err: any) {
    handleError(res, err);
  }
}

// ─── Officer / Management Endpoints (Backward compatible) ─────────────────────

// GET /api/v1/recruiters
export async function listRecruiters(req: Request, res: Response): Promise<void> {
  try {
    const { verificationStatus, search } = req.query;
    const recruiters = await recruiterService.listAllRecruiters({
      verificationStatus: verificationStatus as any,
      search: search as string,
    });
    res.json({ success: true, data: recruiters });
  } catch (err: any) {
    handleError(res, err);
  }
}

// GET /api/v1/recruiters/pending
export async function getPendingRecruiters(req: Request, res: Response): Promise<void> {
  try {
    const recruiters = await recruiterService.listPendingRecruiters();
    res.json({ success: true, data: recruiters });
  } catch (err: any) {
    handleError(res, err);
  }
}

// GET /api/v1/recruiters/:id
export async function getRecruiterById(req: Request, res: Response): Promise<void> {
  try {
    const id = req.params['id'] as string;
    const recruiter = await recruiterService.getRecruiterDetails(id);
    res.json({ success: true, data: recruiter });
  } catch (err: any) {
    handleError(res, err);
  }
}

// POST /api/v1/recruiters/:id/approve
export async function approveRecruiter(req: Request, res: Response): Promise<void> {
  try {
    const id = req.params['id'] as string;
    const officerUserId = req.user!.userId;
    const result = await recruiterService.approveRecruiter(id, officerUserId);
    res.json({ success: true, data: result });
  } catch (err: any) {
    handleError(res, err);
  }
}

// POST /api/v1/recruiters/:id/reject
export async function rejectRecruiter(req: Request, res: Response): Promise<void> {
  try {
    const id = req.params['id'] as string;
    const { reason } = req.body;
    const officerUserId = req.user!.userId;
    const result = await recruiterService.rejectRecruiter(id, officerUserId, reason || 'Rejected by officer');
    res.json({ success: true, data: result });
  } catch (err: any) {
    handleError(res, err);
  }
}

// POST /api/v1/recruiters/:id/suspend
export async function suspendRecruiter(req: Request, res: Response): Promise<void> {
  try {
    const id = req.params['id'] as string;
    const { reason } = req.body;
    const officerUserId = req.user!.userId;
    const result = await recruiterService.suspendRecruiter(id, officerUserId, reason);
    res.json({ success: true, data: result });
  } catch (err: any) {
    handleError(res, err);
  }
}
