import { Request, Response } from 'express';
import * as alumniService from '../services/alumni.service';

// GET /api/v1/alumni/pending
export async function getPendingAlumni(req: Request, res: Response): Promise<void> {
  try {
    const alumni = await alumniService.listPendingAlumni();
    res.json({ success: true, data: alumni });
  } catch (err: any) {
    res.status(err.statusCode || 500).json({
      success: false,
      error: { code: err.code || 'INTERNAL_ERROR', message: err.message },
    });
  }
}

// POST /api/v1/alumni/:id/approve
export async function approveAlumni(req: Request, res: Response): Promise<void> {
  try {
    const id = req.params['id'] as string;
    const officerUserId = req.user!.userId;
    const result = await alumniService.approveAlumni(id, officerUserId);
    res.json({ success: true, data: result });
  } catch (err: any) {
    res.status(err.statusCode || 500).json({
      success: false,
      error: { code: err.code || 'INTERNAL_ERROR', message: err.message },
    });
  }
}

// POST /api/v1/alumni/:id/reject
export async function rejectAlumni(req: Request, res: Response): Promise<void> {
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
    const result = await alumniService.rejectAlumni(id, officerUserId, reason.trim());
    res.json({ success: true, data: result });
  } catch (err: any) {
    res.status(err.statusCode || 500).json({
      success: false,
      error: { code: err.code || 'INTERNAL_ERROR', message: err.message },
    });
  }
}
