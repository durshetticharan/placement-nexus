import { Request, Response } from 'express';
import * as careerPathService from '../services/careerPath.service';
import {
  createCareerPathSchema,
  updateCareerPathSchema,
  addSkillRequirementSchema,
  updateSkillRequirementSchema,
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

// ── Career Paths ─────────────────────────────────────────────────────────────

export async function listCareerPaths(req: Request, res: Response): Promise<void> {
  try {
    const isStudent = req.user?.role === 'STUDENT';
    const paths = await careerPathService.getAllCareerPaths(isStudent);
    res.status(200).json({ success: true, data: paths });
  } catch (err: any) {
    handleError(res, err);
  }
}

export async function getCareerPath(req: Request, res: Response): Promise<void> {
  try {
    const id = getParamId(req);
    const isStudent = req.user?.role === 'STUDENT';
    const path = await careerPathService.getCareerPathById(id, isStudent);
    res.status(200).json({ success: true, data: path });
  } catch (err: any) {
    handleError(res, err);
  }
}

export async function createCareerPath(req: Request, res: Response): Promise<void> {
  try {
    const parsed = createCareerPathSchema.safeParse(req.body);
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

    const newPath = await careerPathService.createCareerPath(parsed.data);
    res.status(201).json({ success: true, data: newPath });
  } catch (err: any) {
    handleError(res, err);
  }
}

export async function updateCareerPath(req: Request, res: Response): Promise<void> {
  try {
    const id = getParamId(req);
    const parsed = updateCareerPathSchema.safeParse(req.body);
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

    const updated = await careerPathService.updateCareerPath(id, parsed.data);
    res.status(200).json({ success: true, data: updated });
  } catch (err: any) {
    handleError(res, err);
  }
}

export async function activateCareerPath(req: Request, res: Response): Promise<void> {
  try {
    const id = getParamId(req);
    const updated = await careerPathService.setCareerPathStatus(id, true);
    res.status(200).json({ success: true, data: updated });
  } catch (err: any) {
    handleError(res, err);
  }
}

export async function deactivateCareerPath(req: Request, res: Response): Promise<void> {
  try {
    const id = getParamId(req);
    const updated = await careerPathService.setCareerPathStatus(id, false);
    res.status(200).json({ success: true, data: updated });
  } catch (err: any) {
    handleError(res, err);
  }
}

// ── Skill Requirements ───────────────────────────────────────────────────────

export async function addSkillRequirement(req: Request, res: Response): Promise<void> {
  try {
    const careerPathId = getParamId(req, 'id');
    const parsed = addSkillRequirementSchema.safeParse(req.body);
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

    const requirement = await careerPathService.addSkillRequirement(
      careerPathId,
      parsed.data.skillId,
      parsed.data.requiredLevel,
      parsed.data.priority,
    );
    res.status(201).json({ success: true, data: requirement });
  } catch (err: any) {
    handleError(res, err);
  }
}

export async function updateSkillRequirement(req: Request, res: Response): Promise<void> {
  try {
    const careerPathId = getParamId(req, 'id');
    const skillId = getParamId(req, 'skillId');
    const parsed = updateSkillRequirementSchema.safeParse(req.body);
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

    const updated = await careerPathService.updateSkillRequirement(
      careerPathId,
      skillId,
      parsed.data,
    );
    res.status(200).json({ success: true, data: updated });
  } catch (err: any) {
    handleError(res, err);
  }
}

export async function removeSkillRequirement(req: Request, res: Response): Promise<void> {
  try {
    const careerPathId = getParamId(req, 'id');
    const skillId = getParamId(req, 'skillId');
    await careerPathService.removeSkillRequirement(careerPathId, skillId);
    res.status(200).json({ success: true, message: 'Skill requirement removed successfully.' });
  } catch (err: any) {
    handleError(res, err);
  }
}

// ── Skills Catalog ───────────────────────────────────────────────────────────

export async function listSkills(req: Request, res: Response): Promise<void> {
  try {
    const skills = await careerPathService.getAllSkills();
    res.status(200).json({ success: true, data: skills });
  } catch (err: any) {
    handleError(res, err);
  }
}
