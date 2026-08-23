import { Request, Response } from 'express';
import * as resumeService from '../services/resume.service';

function getParamId(req: Request, paramName: string = 'id'): string {
  const param = req.params[paramName];
  if (Array.isArray(param)) return param[0];
  return param;
}

export async function uploadResume(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user!.userId;
    const file = req.file;

    if (!file) {
      res.status(400).json({
        success: false,
        error: { code: 'BAD_REQUEST', message: 'No resume file uploaded. Field name must be "resume".' },
      });
      return;
    }

    const result = await resumeService.uploadResume(userId, file);
    res.status(201).json({ success: true, data: result });
  } catch (err: any) {
    res.status(err.statusCode || 500).json({
      success: false,
      error: { code: err.code || 'INTERNAL_ERROR', message: err.message },
    });
  }
}

export async function listResumes(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user!.userId;
    const result = await resumeService.listResumes(userId);
    res.json({ success: true, data: result });
  } catch (err: any) {
    res.status(err.statusCode || 500).json({
      success: false,
      error: { code: err.code || 'INTERNAL_ERROR', message: err.message },
    });
  }
}

export async function setPrimaryResume(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user!.userId;
    const resumeId = getParamId(req);
    const result = await resumeService.setPrimaryResume(userId, resumeId);
    res.json({ success: true, data: result });
  } catch (err: any) {
    res.status(err.statusCode || 500).json({
      success: false,
      error: { code: err.code || 'INTERNAL_ERROR', message: err.message },
    });
  }
}

export async function deleteResume(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user!.userId;
    const resumeId = getParamId(req);
    const result = await resumeService.deleteResume(userId, resumeId);
    res.json({ success: true, data: result });
  } catch (err: any) {
    res.status(err.statusCode || 500).json({
      success: false,
      error: { code: err.code || 'INTERNAL_ERROR', message: err.message },
    });
  }
}
