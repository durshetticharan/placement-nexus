import { Request, Response } from 'express';
import * as selectionService from '../services/selection.service';

export async function recordSelection(req: Request, res: Response) {
  try {
    const recruiterUserId = req.user!.userId;
    const appId = req.params.appId as string;
    const data = req.body;

    const selection = await selectionService.recordSelection(recruiterUserId, appId, data);
    return res.status(201).json({ success: true, data: selection });
  } catch (error: any) {
    if (error.name === 'SelectionServiceError') {
      return res.status(error.statusCode).json({ success: false, error: { code: error.code, message: error.message } });
    }
    return res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: error.message } });
  }
}
