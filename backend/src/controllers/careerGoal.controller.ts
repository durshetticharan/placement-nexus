import { Request, Response } from 'express';
import * as careerGoalService from '../services/careerGoal.service';
import { setCareerGoalSchema } from '../validation/career.validation';

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

export async function getMyCareerGoal(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user!.userId;
    const goalData = await careerGoalService.getStudentCareerGoal(userId);
    res.status(200).json({ success: true, data: goalData });
  } catch (err: any) {
    handleError(res, err);
  }
}

export async function setMyCareerGoal(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user!.userId;
    const parsed = setCareerGoalSchema.safeParse(req.body);
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

    const updatedGoal = await careerGoalService.setStudentCareerGoal(userId, parsed.data.careerPathId);
    res.status(200).json({ success: true, data: updatedGoal });
  } catch (err: any) {
    handleError(res, err);
  }
}

export async function deleteMyCareerGoal(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user!.userId;
    const careerPathId = req.query.careerPathId as string | undefined;
    const result = await careerGoalService.deleteStudentCareerGoal(userId, careerPathId);
    res.status(200).json({ success: true, data: result });
  } catch (err: any) {
    handleError(res, err);
  }
}
