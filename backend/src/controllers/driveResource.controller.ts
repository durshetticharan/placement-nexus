import { Request, Response } from 'express';
import * as resService from '../services/driveResource.service';

// ─── Public: Browse approved ───────────────────────────────────────────────────

export async function listResources(req: Request, res: Response): Promise<void> {
  try {
    const { category, company, driveId, resourceType } = req.query;
    const data = await resService.listApprovedResources({
      category: category as string | undefined,
      companyName: company as string | undefined,
      driveId: driveId as string | undefined,
      resourceType: resourceType as string | undefined,
    });
    res.json({ success: true, data });
  } catch (err: any) {
    res.status(err.statusCode || 500).json({ success: false, error: { code: err.code || 'INTERNAL_ERROR', message: err.message } });
  }
}

// ─── Public: Get one approved ──────────────────────────────────────────────────

export async function getResource(req: Request, res: Response): Promise<void> {
  try {
    const data = await resService.getApprovedResourceById(req.params['id'] as string);
    res.json({ success: true, data });
  } catch (err: any) {
    res.status(err.statusCode || 500).json({ success: false, error: { code: err.code || 'INTERNAL_ERROR', message: err.message } });
  }
}

// ─── Contributor: Submit ───────────────────────────────────────────────────────

export async function submitResource(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user!.userId;
    const role = req.user!.role;
    const data = await resService.submitResource(userId, role, req.body);
    res.status(201).json({ success: true, data });
  } catch (err: any) {
    res.status(err.statusCode || 500).json({ success: false, error: { code: err.code || 'INTERNAL_ERROR', message: err.message } });
  }
}

// ─── Contributor: My submissions ───────────────────────────────────────────────

export async function getMyResources(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user!.userId;
    const role = req.user!.role;
    const data = await resService.getMyResources(userId, role);
    res.json({ success: true, data });
  } catch (err: any) {
    res.status(err.statusCode || 500).json({ success: false, error: { code: err.code || 'INTERNAL_ERROR', message: err.message } });
  }
}

// ─── Contributor: Delete own ───────────────────────────────────────────────────

export async function deleteResource(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user!.userId;
    const role = req.user!.role;
    const data = await resService.deleteOwnResource(userId, role, req.params['id'] as string);
    res.json({ success: true, data });
  } catch (err: any) {
    res.status(err.statusCode || 500).json({ success: false, error: { code: err.code || 'INTERNAL_ERROR', message: err.message } });
  }
}

// ─── Officer: List pending ─────────────────────────────────────────────────────

export async function listPendingResources(req: Request, res: Response): Promise<void> {
  try {
    const data = await resService.listPendingResources();
    res.json({ success: true, data });
  } catch (err: any) {
    res.status(err.statusCode || 500).json({ success: false, error: { code: err.code || 'INTERNAL_ERROR', message: err.message } });
  }
}

// ─── Officer: Approve ─────────────────────────────────────────────────────────

export async function approveResource(req: Request, res: Response): Promise<void> {
  try {
    const officerUserId = req.user!.userId;
    const data = await resService.approveResource(req.params['id'] as string, officerUserId);
    res.json({ success: true, data });
  } catch (err: any) {
    res.status(err.statusCode || 500).json({ success: false, error: { code: err.code || 'INTERNAL_ERROR', message: err.message } });
  }
}

// ─── Officer: Reject ──────────────────────────────────────────────────────────

export async function rejectResource(req: Request, res: Response): Promise<void> {
  try {
    const officerUserId = req.user!.userId;
    const { reason } = req.body;
    if (!reason || typeof reason !== 'string' || reason.trim().length === 0) {
      res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'Rejection reason is required.' } });
      return;
    }
    const data = await resService.rejectResource(req.params['id'] as string, officerUserId, reason.trim());
    res.json({ success: true, data });
  } catch (err: any) {
    res.status(err.statusCode || 500).json({ success: false, error: { code: err.code || 'INTERNAL_ERROR', message: err.message } });
  }
}
