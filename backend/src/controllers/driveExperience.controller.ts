import { Request, Response } from 'express';
import * as expService from '../services/driveExperience.service';

// ─── Public: Browse approved ───────────────────────────────────────────────────

export async function listExperiences(req: Request, res: Response): Promise<void> {
  try {
    const { company, driveId, difficulty, outcome, year } = req.query;
    const data = await expService.listApprovedExperiences({
      companyName: company as string | undefined,
      driveId: driveId as string | undefined,
      difficulty: difficulty as string | undefined,
      outcome: outcome as string | undefined,
      driveYear: year ? parseInt(year as string) : undefined,
    });
    res.json({ success: true, data });
  } catch (err: any) {
    res.status(err.statusCode || 500).json({ success: false, error: { code: err.code || 'INTERNAL_ERROR', message: err.message } });
  }
}

// ─── Public: Get one approved ──────────────────────────────────────────────────

export async function getExperience(req: Request, res: Response): Promise<void> {
  try {
    const data = await expService.getApprovedExperienceById(req.params['id'] as string);
    res.json({ success: true, data });
  } catch (err: any) {
    res.status(err.statusCode || 500).json({ success: false, error: { code: err.code || 'INTERNAL_ERROR', message: err.message } });
  }
}

// ─── Contributor: Submit ───────────────────────────────────────────────────────

export async function submitExperience(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user!.userId;
    const role = req.user!.role;
    const data = await expService.submitExperience(userId, role, req.body);
    res.status(201).json({ success: true, data });
  } catch (err: any) {
    res.status(err.statusCode || 500).json({ success: false, error: { code: err.code || 'INTERNAL_ERROR', message: err.message } });
  }
}

// ─── Contributor: My submissions ───────────────────────────────────────────────

export async function getMyExperiences(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user!.userId;
    const role = req.user!.role;
    const data = await expService.getMyExperiences(userId, role);
    res.json({ success: true, data });
  } catch (err: any) {
    res.status(err.statusCode || 500).json({ success: false, error: { code: err.code || 'INTERNAL_ERROR', message: err.message } });
  }
}

// ─── Officer: List pending ─────────────────────────────────────────────────────

export async function listPendingExperiences(req: Request, res: Response): Promise<void> {
  try {
    const data = await expService.listPendingExperiences();
    res.json({ success: true, data });
  } catch (err: any) {
    res.status(err.statusCode || 500).json({ success: false, error: { code: err.code || 'INTERNAL_ERROR', message: err.message } });
  }
}

// ─── Officer: Approve ─────────────────────────────────────────────────────────

export async function approveExperience(req: Request, res: Response): Promise<void> {
  try {
    const officerUserId = req.user!.userId;
    const data = await expService.approveExperience(req.params['id'] as string, officerUserId);
    res.json({ success: true, data });
  } catch (err: any) {
    res.status(err.statusCode || 500).json({ success: false, error: { code: err.code || 'INTERNAL_ERROR', message: err.message } });
  }
}

// ─── Officer: Reject ──────────────────────────────────────────────────────────

export async function rejectExperience(req: Request, res: Response): Promise<void> {
  try {
    const officerUserId = req.user!.userId;
    const { reason } = req.body;
    if (!reason || typeof reason !== 'string' || reason.trim().length === 0) {
      res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'Rejection reason is required.' } });
      return;
    }
    const data = await expService.rejectExperience(req.params['id'] as string, officerUserId, reason.trim());
    res.json({ success: true, data });
  } catch (err: any) {
    res.status(err.statusCode || 500).json({ success: false, error: { code: err.code || 'INTERNAL_ERROR', message: err.message } });
  }
}
