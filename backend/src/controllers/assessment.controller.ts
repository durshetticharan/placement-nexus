import { Request, Response } from 'express';
import * as assessmentService from '../services/assessment.service';
import { AssessmentCategory, AssessmentStatus } from '@prisma/client';

function getParamId(req: Request, param = 'id'): string {
  const val = req.params[param];
  return Array.isArray(val) ? val[0] : val;
}

function handleError(res: Response, err: any): void {
  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    success: false,
    error: { code: err.code || 'INTERNAL_ERROR', message: err.message || 'An unexpected error occurred.' },
  });
}

// ── Assessment CRUD ───────────────────────────────────────────────────────────

export async function createAssessment(req: Request, res: Response): Promise<void> {
  try {
    const officerId = req.user!.userId;
    const result = await assessmentService.createAssessment(officerId, req.body);
    res.status(201).json({ success: true, data: result });
  } catch (err: any) {
    handleError(res, err);
  }
}

export async function listAssessments(req: Request, res: Response): Promise<void> {
  try {
    const role = req.user!.role;
    const { category, topic, status } = req.query as Record<string, string | undefined>;

    // Students can only ever see PUBLISHED assessments
    const effectiveStatus =
      role === 'STUDENT' ? AssessmentStatus.PUBLISHED : (status as AssessmentStatus | undefined);

    const filters = {
      ...(category ? { category: category as AssessmentCategory } : {}),
      ...(topic ? { topic } : {}),
      ...(effectiveStatus ? { status: effectiveStatus } : {}),
    };

    const result = await assessmentService.listAssessments(filters);
    res.json({ success: true, data: result });
  } catch (err: any) {
    handleError(res, err);
  }
}

export async function getAssessment(req: Request, res: Response): Promise<void> {
  try {
    const id = getParamId(req);
    const role = req.user!.role;

    const result =
      role === 'PLACEMENT_OFFICER'
        ? await assessmentService.getAssessmentForOfficer(id)
        : await assessmentService.getAssessmentForStudent(id);

    res.json({ success: true, data: result });
  } catch (err: any) {
    handleError(res, err);
  }
}

export async function updateAssessment(req: Request, res: Response): Promise<void> {
  try {
    const id = getParamId(req);
    const result = await assessmentService.updateAssessmentMeta(id, req.body);
    res.json({ success: true, data: result });
  } catch (err: any) {
    handleError(res, err);
  }
}

export async function deleteAssessment(req: Request, res: Response): Promise<void> {
  try {
    const id = getParamId(req);
    await assessmentService.hardDeleteAssessment(id);
    res.json({ success: true, data: { message: 'Assessment deleted successfully.' } });
  } catch (err: any) {
    handleError(res, err);
  }
}

export async function publishAssessment(req: Request, res: Response): Promise<void> {
  try {
    const id = getParamId(req);
    const result = await assessmentService.publishAssessment(id);
    res.json({ success: true, data: result });
  } catch (err: any) {
    handleError(res, err);
  }
}

export async function archiveAssessment(req: Request, res: Response): Promise<void> {
  try {
    const id = getParamId(req);
    const result = await assessmentService.archiveAssessment(id);
    res.json({ success: true, data: result });
  } catch (err: any) {
    handleError(res, err);
  }
}

// ── Question Management ───────────────────────────────────────────────────────

export async function addQuestion(req: Request, res: Response): Promise<void> {
  try {
    const assessmentId = getParamId(req);
    const result = await assessmentService.addQuestion(assessmentId, req.body);
    res.status(201).json({ success: true, data: result });
  } catch (err: any) {
    handleError(res, err);
  }
}

export async function updateQuestion(req: Request, res: Response): Promise<void> {
  try {
    const questionId = getParamId(req);
    const result = await assessmentService.updateQuestion(questionId, req.body);
    res.json({ success: true, data: result });
  } catch (err: any) {
    handleError(res, err);
  }
}

export async function deleteQuestion(req: Request, res: Response): Promise<void> {
  try {
    const questionId = getParamId(req);
    const result = await assessmentService.deleteQuestion(questionId);
    res.json({ success: true, data: result });
  } catch (err: any) {
    handleError(res, err);
  }
}
