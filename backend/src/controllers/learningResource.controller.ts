import { Request, Response } from 'express';
import * as learningResourceService from '../services/learningResource.service';
import {
  createLearningResourceSchema,
  updateLearningResourceSchema,
} from '../validation/career.validation';

function getParamId(req: Request, param = 'id'): string {
  const val = req.params[param];
  return Array.isArray(val) ? val[0] : val;
}

function handleError(res: Response, err: any): void {
  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    success: false,
    error: {
      code: err.code || 'INTERNAL_ERROR',
      message: err.message || 'An unexpected error occurred.',
    },
  });
}

export async function listLearningResources(req: Request, res: Response): Promise<void> {
  try {
    const skillId = req.query.skillId as string | undefined;
    const resources = await learningResourceService.getAllLearningResources(skillId);
    res.status(200).json({ success: true, data: resources });
  } catch (err: any) {
    handleError(res, err);
  }
}

export async function getLearningResource(req: Request, res: Response): Promise<void> {
  try {
    const id = getParamId(req);
    const resource = await learningResourceService.getLearningResourceById(id);
    res.status(200).json({ success: true, data: resource });
  } catch (err: any) {
    handleError(res, err);
  }
}

export async function createLearningResource(req: Request, res: Response): Promise<void> {
  try {
    const parsed = createLearningResourceSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: parsed.error.issues[0].message,
        },
      });
      return;
    }

    const newResource = await learningResourceService.createLearningResource(parsed.data);
    res.status(201).json({ success: true, data: newResource });
  } catch (err: any) {
    handleError(res, err);
  }
}

export async function updateLearningResource(req: Request, res: Response): Promise<void> {
  try {
    const id = getParamId(req);
    const parsed = updateLearningResourceSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: parsed.error.issues[0].message,
        },
      });
      return;
    }

    const updated = await learningResourceService.updateLearningResource(id, parsed.data);
    res.status(200).json({ success: true, data: updated });
  } catch (err: any) {
    handleError(res, err);
  }
}

export async function deleteLearningResource(req: Request, res: Response): Promise<void> {
  try {
    const id = getParamId(req);
    await learningResourceService.deleteLearningResource(id);
    res.status(200).json({ success: true, message: 'Learning resource deleted successfully.' });
  } catch (err: any) {
    handleError(res, err);
  }
}
