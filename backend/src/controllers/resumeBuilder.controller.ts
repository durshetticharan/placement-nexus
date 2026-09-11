import { Request, Response } from 'express';
import * as resumeBuilderService from '../services/resumeBuilder.service';

export async function getResume(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user!.userId;
    const result = await resumeBuilderService.getResume(userId);
    res.status(200).json({ success: true, data: result });
  } catch (err: any) {
    res.status(err.statusCode || 500).json({
      success: false,
      error: { code: err.code || 'INTERNAL_ERROR', message: err.message },
    });
  }
}

export async function upsertResume(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user!.userId;
    const payload = req.body;
    const result = await resumeBuilderService.upsertResume(userId, payload);
    res.status(200).json({ success: true, data: result });
  } catch (err: any) {
    res.status(err.statusCode || 500).json({
      success: false,
      error: { code: err.code || 'INTERNAL_ERROR', message: err.message },
    });
  }
}
