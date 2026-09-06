import { Request, Response } from 'express';
import * as applicationService from '../services/application.service';

export async function applyToDrive(req: Request, res: Response) {
  try {
    const studentUserId = req.user!.userId;
    const driveId = req.params.driveId as string;
    
    const application = await applicationService.applyToDrive(studentUserId, driveId);
    return res.status(201).json({ success: true, data: application });
  } catch (error: any) {
    if (error.name === 'ApplicationServiceError') {
      return res.status(error.statusCode).json({ success: false, error: { code: error.code, message: error.message } });
    }
    return res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: error.message } });
  }
}

export async function withdrawApplication(req: Request, res: Response) {
  try {
    const studentUserId = req.user!.userId;
    const id = req.params.id as string;

    const application = await applicationService.withdrawApplication(studentUserId, id);
    return res.status(200).json({ success: true, data: application });
  } catch (error: any) {
    if (error.name === 'ApplicationServiceError') {
      return res.status(error.statusCode).json({ success: false, error: { code: error.code, message: error.message } });
    }
    return res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: error.message } });
  }
}

export async function getMyApplications(req: Request, res: Response) {
  try {
    const studentUserId = req.user!.userId;
    const applications = await applicationService.getStudentApplications(studentUserId);
    return res.status(200).json({ success: true, data: applications });
  } catch (error: any) {
    if (error.name === 'ApplicationServiceError') {
      return res.status(error.statusCode).json({ success: false, error: { code: error.code, message: error.message } });
    }
    return res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: error.message } });
  }
}

export async function getDriveApplications(req: Request, res: Response) {
  try {
    const userId = req.user!.userId;
    const userRole = req.user!.role;
    const id = req.params.id as string; // driveId

    const applications = await applicationService.getDriveApplications(userId, userRole, id);
    return res.status(200).json({ success: true, data: applications });
  } catch (error: any) {
    if (error.name === 'ApplicationServiceError') {
      return res.status(error.statusCode).json({ success: false, error: { code: error.code, message: error.message } });
    }
    return res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: error.message } });
  }
}

export async function updateApplicationStatus(req: Request, res: Response) {
  try {
    const recruiterUserId = req.user!.userId;
    const id = req.params.id as string;
    const { status } = req.body;

    const application = await applicationService.updateApplicationStatus(recruiterUserId, id, status);
    return res.status(200).json({ success: true, data: application });
  } catch (error: any) {
    if (error.name === 'ApplicationServiceError') {
      return res.status(error.statusCode).json({ success: false, error: { code: error.code, message: error.message } });
    }
    return res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: error.message } });
  }
}
