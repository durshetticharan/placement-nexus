import { Request, Response } from 'express';
import * as profService from '../services/professionalProfile.service';

function getParamId(req: Request, paramName: string = 'id'): string {
  const param = req.params[paramName];
  if (Array.isArray(param)) return param[0];
  return param;
}

export async function addProfile(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user!.userId;
    const { platform, profileUrl } = req.body;
    const result = await profService.addProfile(userId, platform, profileUrl);
    res.status(201).json({ success: true, data: result });
  } catch (err: any) {
    res.status(err.statusCode || 500).json({
      success: false,
      error: { code: err.code || 'INTERNAL_ERROR', message: err.message },
    });
  }
}

export async function listProfiles(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user!.userId;
    const result = await profService.listProfiles(userId);
    res.json({ success: true, data: result });
  } catch (err: any) {
    res.status(err.statusCode || 500).json({
      success: false,
      error: { code: err.code || 'INTERNAL_ERROR', message: err.message },
    });
  }
}

export async function updateProfile(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user!.userId;
    const id = getParamId(req);
    const { profileUrl } = req.body;
    const result = await profService.updateProfile(userId, id, profileUrl);
    res.json({ success: true, data: result });
  } catch (err: any) {
    res.status(err.statusCode || 500).json({
      success: false,
      error: { code: err.code || 'INTERNAL_ERROR', message: err.message },
    });
  }
}

export async function deleteProfile(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user!.userId;
    const id = getParamId(req);
    const result = await profService.deleteProfile(userId, id);
    res.json({ success: true, data: result });
  } catch (err: any) {
    res.status(err.statusCode || 500).json({
      success: false,
      error: { code: err.code || 'INTERNAL_ERROR', message: err.message },
    });
  }
}
