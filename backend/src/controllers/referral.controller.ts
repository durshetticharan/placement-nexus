import { Request, Response } from 'express';
import * as referralService from '../services/referral.service';
import { ReferralStatus } from '@prisma/client';

export async function createOpportunity(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user!.userId;
    const opp = await referralService.createOpportunity(userId, req.body);
    res.json({ success: true, data: opp });
  } catch (err: any) {
    res.status(err.statusCode || 500).json({
      success: false,
      error: { code: err.code || 'INTERNAL_ERROR', message: err.message },
    });
  }
}

export async function getActiveOpportunities(req: Request, res: Response): Promise<void> {
  try {
    const opps = await referralService.getActiveOpportunities();
    res.json({ success: true, data: opps });
  } catch (err: any) {
    res.status(err.statusCode || 500).json({
      success: false,
      error: { code: err.code || 'INTERNAL_ERROR', message: err.message },
    });
  }
}

export async function getMyOpportunities(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user!.userId;
    const opps = await referralService.getMyOpportunities(userId);
    res.json({ success: true, data: opps });
  } catch (err: any) {
    res.status(err.statusCode || 500).json({
      success: false,
      error: { code: err.code || 'INTERNAL_ERROR', message: err.message },
    });
  }
}

export async function createRequest(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user!.userId;
    const { referralOpportunityId, studentMessage } = req.body;
    
    if (!referralOpportunityId) {
      res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'referralOpportunityId is required' } });
      return;
    }

    const request = await referralService.createRequest(userId, referralOpportunityId, studentMessage);
    res.json({ success: true, data: request });
  } catch (err: any) {
    res.status(err.statusCode || 500).json({
      success: false,
      error: { code: err.code || 'INTERNAL_ERROR', message: err.message },
    });
  }
}

export async function getStudentRequests(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user!.userId;
    const requests = await referralService.getStudentRequests(userId);
    res.json({ success: true, data: requests });
  } catch (err: any) {
    res.status(err.statusCode || 500).json({
      success: false,
      error: { code: err.code || 'INTERNAL_ERROR', message: err.message },
    });
  }
}

export async function getAlumniRequests(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user!.userId;
    const requests = await referralService.getAlumniRequests(userId);
    res.json({ success: true, data: requests });
  } catch (err: any) {
    res.status(err.statusCode || 500).json({
      success: false,
      error: { code: err.code || 'INTERNAL_ERROR', message: err.message },
    });
  }
}

export async function updateRequestStatus(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user!.userId;
    const requestId = req.params['id'] as string;
    const { status, alumniResponse, proofNote } = req.body;
    
    if (!status || !Object.values(ReferralStatus).includes(status)) {
      res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'Invalid status' } });
      return;
    }

    const updated = await referralService.updateRequestStatus(userId, requestId, status as ReferralStatus, alumniResponse, proofNote);
    res.json({ success: true, data: updated });
  } catch (err: any) {
    res.status(err.statusCode || 500).json({
      success: false,
      error: { code: err.code || 'INTERNAL_ERROR', message: err.message },
    });
  }
}
