import { Request, Response } from 'express';
import * as companyService from '../services/company.service';
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

// ─── Company Management ───────────────────────────────────────────────────────

export async function listCompanies(req: Request, res: Response): Promise<void> {
  try {
    const { status, verificationStatus, search, industry } = req.query;
    const companies = await companyService.listCompanies({
      status: status as any,
      verificationStatus: verificationStatus as any,
      search: search as string,
      industry: industry as string,
    });
    res.json({ success: true, data: companies });
  } catch (err: any) {
    handleError(res, err);
  }
}

export async function getCompany(req: Request, res: Response): Promise<void> {
  try {
    const id = req.params['id'] as string;
    const company = await companyService.getCompany(id);
    res.json({ success: true, data: company });
  } catch (err: any) {
    handleError(res, err);
  }
}

export async function createCompany(req: Request, res: Response): Promise<void> {
  try {
    const officerUserId = req.user!.userId;
    const company = await companyService.createCompany(req.body, officerUserId, true);
    res.status(201).json({ success: true, data: company });
  } catch (err: any) {
    handleError(res, err);
  }
}

export async function updateCompany(req: Request, res: Response): Promise<void> {
  try {
    const id = req.params['id'] as string;
    const officerUserId = req.user!.userId;
    const updated = await companyService.updateCompany(id, req.body, officerUserId);
    res.json({ success: true, data: updated });
  } catch (err: any) {
    handleError(res, err);
  }
}

export async function approveCompany(req: Request, res: Response): Promise<void> {
  try {
    const id = req.params['id'] as string;
    const officerUserId = req.user!.userId;
    const result = await companyService.approveCompany(id, officerUserId);
    res.json({ success: true, data: result });
  } catch (err: any) {
    handleError(res, err);
  }
}

export async function rejectCompany(req: Request, res: Response): Promise<void> {
  try {
    const id = req.params['id'] as string;
    const officerUserId = req.user!.userId;
    const { reason } = req.body;
    const result = await companyService.rejectCompany(id, officerUserId, reason);
    res.json({ success: true, data: result });
  } catch (err: any) {
    handleError(res, err);
  }
}

export async function suspendCompany(req: Request, res: Response): Promise<void> {
  try {
    const id = req.params['id'] as string;
    const officerUserId = req.user!.userId;
    const { reason } = req.body;
    const result = await companyService.suspendCompany(id, officerUserId, reason);
    res.json({ success: true, data: result });
  } catch (err: any) {
    handleError(res, err);
  }
}

// ─── Recruiter Management ─────────────────────────────────────────────────────

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

export async function getRecruiter(req: Request, res: Response): Promise<void> {
  try {
    const id = req.params['id'] as string;
    const recruiter = await recruiterService.getRecruiterDetails(id);
    res.json({ success: true, data: recruiter });
  } catch (err: any) {
    handleError(res, err);
  }
}

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

export async function rejectRecruiter(req: Request, res: Response): Promise<void> {
  try {
    const id = req.params['id'] as string;
    const officerUserId = req.user!.userId;
    const { reason } = req.body;
    const result = await recruiterService.rejectRecruiter(id, officerUserId, reason);
    res.json({ success: true, data: result });
  } catch (err: any) {
    handleError(res, err);
  }
}

export async function suspendRecruiter(req: Request, res: Response): Promise<void> {
  try {
    const id = req.params['id'] as string;
    const officerUserId = req.user!.userId;
    const { reason } = req.body;
    const result = await recruiterService.suspendRecruiter(id, officerUserId, reason);
    res.json({ success: true, data: result });
  } catch (err: any) {
    handleError(res, err);
  }
}

// ─── Membership Management ────────────────────────────────────────────────────

export async function listCompanyMemberships(req: Request, res: Response): Promise<void> {
  try {
    const { status, companyId, recruiterId } = req.query;
    const memberships = await membershipService.listAllMemberships({
      status: status as any,
      companyId: companyId as string,
      recruiterId: recruiterId as string,
    });
    res.json({ success: true, data: memberships });
  } catch (err: any) {
    handleError(res, err);
  }
}

export async function approveMembership(req: Request, res: Response): Promise<void> {
  try {
    const id = req.params['id'] as string;
    const officerUserId = req.user!.userId;
    const result = await membershipService.approveMembership(id, officerUserId);
    res.json({ success: true, data: result });
  } catch (err: any) {
    handleError(res, err);
  }
}

export async function rejectMembership(req: Request, res: Response): Promise<void> {
  try {
    const id = req.params['id'] as string;
    const officerUserId = req.user!.userId;
    const { reason } = req.body;
    const result = await membershipService.rejectMembership(id, officerUserId, reason);
    res.json({ success: true, data: result });
  } catch (err: any) {
    handleError(res, err);
  }
}

export async function updateMembershipRole(req: Request, res: Response): Promise<void> {
  try {
    const id = req.params['id'] as string;
    const officerUserId = req.user!.userId;
    const { role } = req.body;
    const result = await membershipService.updateMembershipRole(id, role, officerUserId);
    res.json({ success: true, data: result });
  } catch (err: any) {
    handleError(res, err);
  }
}
