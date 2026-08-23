import { Request, Response } from 'express';
import * as codingService from '../services/codingProfile.service';

function getParamId(req: Request, paramName: string = 'id'): string {
  const param = req.params[paramName];
  if (Array.isArray(param)) return param[0];
  return param;
}

export async function addCodingProfile(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user!.userId;
    const { platform, username, profileUrl, statistics } = req.body;
    const result = await codingService.addCodingProfile(userId, platform, username, profileUrl, statistics);
    res.status(201).json({ success: true, data: result });
  } catch (err: any) {
    res.status(err.statusCode || 500).json({
      success: false,
      error: { code: err.code || 'INTERNAL_ERROR', message: err.message },
    });
  }
}

export async function listCodingProfiles(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user!.userId;
    const result = await codingService.listCodingProfiles(userId);
    res.json({ success: true, data: result });
  } catch (err: any) {
    res.status(err.statusCode || 500).json({
      success: false,
      error: { code: err.code || 'INTERNAL_ERROR', message: err.message },
    });
  }
}

export async function updateCodingProfile(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user!.userId;
    const id = getParamId(req);
    const { username, profileUrl, statistics } = req.body;
    const result = await codingService.updateCodingProfile(userId, id, { username, profileUrl, statistics });
    res.json({ success: true, data: result });
  } catch (err: any) {
    res.status(err.statusCode || 500).json({
      success: false,
      error: { code: err.code || 'INTERNAL_ERROR', message: err.message },
    });
  }
}

export async function deleteCodingProfile(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user!.userId;
    const id = getParamId(req);
    const result = await codingService.deleteCodingProfile(userId, id);
    res.json({ success: true, data: result });
  } catch (err: any) {
    res.status(err.statusCode || 500).json({
      success: false,
      error: { code: err.code || 'INTERNAL_ERROR', message: err.message },
    });
  }
}
