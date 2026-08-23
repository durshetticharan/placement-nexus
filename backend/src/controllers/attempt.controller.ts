import { Request, Response } from 'express';
import * as attemptService from '../services/attempt.service';

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

function getParamId(req: Request, param = 'id'): string {
  const val = req.params[param];
  return Array.isArray(val) ? val[0] : val;
}

// ── POST /api/v1/attempts/start ───────────────────────────────────────────────

export async function startAttempt(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user!.userId;
    const { assessmentId } = req.body;
    const result = await attemptService.startAttempt(userId, assessmentId);
    res.status(result.resumed ? 200 : 201).json({ success: true, data: result });
  } catch (err: any) {
    handleError(res, err);
  }
}

// ── PATCH /api/v1/attempts/:id/answers ───────────────────────────────────────

export async function saveAnswer(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user!.userId;
    const attemptId = getParamId(req);
    const { questionId, selectedOptionId, selectedOptionIds, freeTextAnswer } = req.body;

    const result = await attemptService.saveAnswer(attemptId, userId, questionId, {
      selectedOptionId,
      selectedOptionIds,
      freeTextAnswer,
    });
    res.json({ success: true, data: result });
  } catch (err: any) {
    handleError(res, err);
  }
}

// ── POST /api/v1/attempts/:id/submit ─────────────────────────────────────────

export async function submitAttempt(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user!.userId;
    const attemptId = getParamId(req);
    const result = await attemptService.submitAttempt(attemptId, userId);
    res.json({ success: true, data: result });
  } catch (err: any) {
    handleError(res, err);
  }
}

// ── GET /api/v1/attempts/history ──────────────────────────────────────────────

export async function getAttemptHistory(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user!.userId;
    const result = await attemptService.getAttemptHistory(userId);
    res.json({ success: true, data: result });
  } catch (err: any) {
    handleError(res, err);
  }
}

// ── GET /api/v1/attempts/:id/result ──────────────────────────────────────────

export async function getResultDetail(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user!.userId;
    const attemptId = getParamId(req);
    const result = await attemptService.getResultDetail(attemptId, userId);
    res.json({ success: true, data: result });
  } catch (err: any) {
    handleError(res, err);
  }
}
