import { Request, Response } from 'express';
import * as recruiterService from '../services/recruiter.service';

// GET /api/v1/recruiters/pending
export async function getPendingRecruiters(req: Request, res: Response): Promise<void> {
  try {
    const recruiters = await recruiterService.listPendingRecruiters();
    res.json({ success: true, data: recruiters });
  } catch (err: any) {
    res.status(err.statusCode || 500).json({
      success: false,
      error: { code: err.code || 'INTERNAL_ERROR', message: err.message },
    });
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
    res.status(err.statusCode || 500).json({
      success: false,
      error: { code: err.code || 'INTERNAL_ERROR', message: err.message },
    });
  }
}

// POST /api/v1/recruiters/:id/reject
export async function rejectRecruiter(req: Request, res: Response): Promise<void> {
  try {
    const id = req.params['id'] as string;
    const { reason } = req.body;

    if (!reason || typeof reason !== 'string' || reason.trim().length === 0) {
      res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Rejection reason is required in the request body.' },
      });
      return;
    }

    const officerUserId = req.user!.userId;
    const result = await recruiterService.rejectRecruiter(id, officerUserId, reason.trim());
    res.json({ success: true, data: result });
  } catch (err: any) {
    res.status(err.statusCode || 500).json({
      success: false,
      error: { code: err.code || 'INTERNAL_ERROR', message: err.message },
    });
  }
}
