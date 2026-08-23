import { Request, Response } from 'express';
import * as studentService from '../services/student.service';

function handleError(res: Response, err: any) {
  const statusCode = err.statusCode || 500;
  const code = err.code || 'INTERNAL_ERROR';
  const message = err.message || 'An unexpected error occurred.';
  res.status(statusCode).json({
    success: false,
    error: { code, message },
  });
}

function getParamId(req: Request): string {
  const { id } = req.params;
  return Array.isArray(id) ? id[0] : id;
}

export async function getProfile(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user!.userId;
    const profile = await studentService.getStudentProfile(userId);
    res.json({
      success: true,
      data: profile,
    });
  } catch (err) {
    handleError(res, err);
  }
}

export async function upsertAcademics(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user!.userId;
    const academics = await studentService.upsertAcademic(userId, req.body);
    res.json({
      success: true,
      data: academics,
    });
  } catch (err) {
    handleError(res, err);
  }
}

// ── Skills ────────────────────────────────────────────────────────────────────

export async function addSkill(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user!.userId;
    const skill = await studentService.addSkill(userId, req.body);
    res.status(201).json({
      success: true,
      data: skill,
    });
  } catch (err) {
    handleError(res, err);
  }
}

export async function updateSkill(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user!.userId;
    const id = getParamId(req);
    const skill = await studentService.updateSkill(userId, id, req.body);
    res.json({
      success: true,
      data: skill,
    });
  } catch (err) {
    handleError(res, err);
  }
}

export async function removeSkill(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user!.userId;
    const id = getParamId(req);
    await studentService.removeSkill(userId, id);
    res.json({
      success: true,
      data: { message: 'Skill removed successfully.' },
    });
  } catch (err) {
    handleError(res, err);
  }
}

// ── Projects ──────────────────────────────────────────────────────────────────

export async function addProject(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user!.userId;
    const project = await studentService.addProject(userId, req.body);
    res.status(201).json({
      success: true,
      data: project,
    });
  } catch (err) {
    handleError(res, err);
  }
}

export async function updateProject(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user!.userId;
    const id = getParamId(req);
    const project = await studentService.updateProject(userId, id, req.body);
    res.json({
      success: true,
      data: project,
    });
  } catch (err) {
    handleError(res, err);
  }
}

export async function deleteProject(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user!.userId;
    const id = getParamId(req);
    await studentService.deleteProject(userId, id);
    res.json({
      success: true,
      data: { message: 'Project deleted successfully.' },
    });
  } catch (err) {
    handleError(res, err);
  }
}

// ── Internships ──────────────────────────────────────────────────────────────

export async function addInternship(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user!.userId;
    const internship = await studentService.addInternship(userId, req.body);
    res.status(201).json({
      success: true,
      data: internship,
    });
  } catch (err) {
    handleError(res, err);
  }
}

export async function updateInternship(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user!.userId;
    const id = getParamId(req);
    const internship = await studentService.updateInternship(userId, id, req.body);
    res.json({
      success: true,
      data: internship,
    });
  } catch (err) {
    handleError(res, err);
  }
}

export async function deleteInternship(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user!.userId;
    const id = getParamId(req);
    await studentService.deleteInternship(userId, id);
    res.json({
      success: true,
      data: { message: 'Internship deleted successfully.' },
    });
  } catch (err) {
    handleError(res, err);
  }
}

// ── Certifications ───────────────────────────────────────────────────────────

export async function addCertification(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user!.userId;
    const cert = await studentService.addCertification(userId, req.body);
    res.status(201).json({
      success: true,
      data: cert,
    });
  } catch (err) {
    handleError(res, err);
  }
}

export async function updateCertification(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user!.userId;
    const id = getParamId(req);
    const cert = await studentService.updateCertification(userId, id, req.body);
    res.json({
      success: true,
      data: cert,
    });
  } catch (err) {
    handleError(res, err);
  }
}

export async function deleteCertification(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user!.userId;
    const id = getParamId(req);
    await studentService.deleteCertification(userId, id);
    res.json({
      success: true,
      data: { message: 'Certification deleted successfully.' },
    });
  } catch (err) {
    handleError(res, err);
  }
}

// ── Achievements ─────────────────────────────────────────────────────────────

export async function addAchievement(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user!.userId;
    const ach = await studentService.addAchievement(userId, req.body);
    res.status(201).json({
      success: true,
      data: ach,
    });
  } catch (err) {
    handleError(res, err);
  }
}

export async function updateAchievement(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user!.userId;
    const id = getParamId(req);
    const ach = await studentService.updateAchievement(userId, id, req.body);
    res.json({
      success: true,
      data: ach,
    });
  } catch (err) {
    handleError(res, err);
  }
}

export async function deleteAchievement(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user!.userId;
    const id = getParamId(req);
    await studentService.deleteAchievement(userId, id);
    res.json({
      success: true,
      data: { message: 'Achievement deleted successfully.' },
    });
  } catch (err) {
    handleError(res, err);
  }
}
