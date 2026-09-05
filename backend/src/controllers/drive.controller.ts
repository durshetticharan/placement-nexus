import { Request, Response } from 'express';
import * as driveService from '../services/drive.service';
import { EligibilityService } from '../services/eligibility.service';
import { createDriveSchema, updateDriveSchema, driveRequirementSchema, reviewActionSchema } from '../validation/drive.validation';

function handleError(res: Response, err: any): void {
  if (err instanceof driveService.DriveServiceError) {
    res.status(err.statusCode).json({
      success: false,
      error: { code: err.code, message: err.message },
    });
    return;
  }
  res.status(500).json({
    success: false,
    error: { code: 'INTERNAL_ERROR', message: err.message || 'An unexpected error occurred.' },
  });
}

// === RECRUITER ACTIONS ===

export async function createDrive(req: Request, res: Response) {
  try {
    const validated = createDriveSchema.parse(req.body);
    const drive = await driveService.createDrive(req.user!.userId, validated);
    res.status(201).json({ success: true, data: drive });
  } catch (err: any) {
    if (err.name === 'ZodError') return res.status(400).json({ success: false, error: err.errors });
    handleError(res, err);
  }
}

export async function updateDrive(req: Request, res: Response) {
  try {
    const id = req.params['id'] as string;
    const validated = updateDriveSchema.parse(req.body);
    const drive = await driveService.updateDrive(req.user!.userId, id, validated);
    res.json({ success: true, data: drive });
  } catch (err: any) {
    if (err.name === 'ZodError') return res.status(400).json({ success: false, error: err.errors });
    handleError(res, err);
  }
}

export async function updateDriveRequirements(req: Request, res: Response) {
  try {
    const id = req.params['id'] as string;
    const validated = driveRequirementSchema.parse(req.body);
    const drive = await driveService.updateDriveRequirements(req.user!.userId, id, validated);
    res.json({ success: true, data: drive });
  } catch (err: any) {
    if (err.name === 'ZodError') return res.status(400).json({ success: false, error: err.errors });
    handleError(res, err);
  }
}

export async function submitDrive(req: Request, res: Response) {
  try {
    const id = req.params['id'] as string;
    const drive = await driveService.updateDriveStatus(req.user!.userId, id, 'PENDING_APPROVAL');
    res.json({ success: true, data: drive });
  } catch (err: any) {
    handleError(res, err);
  }
}

export async function closeDriveRecruiter(req: Request, res: Response) {
  try {
    const id = req.params['id'] as string;
    const drive = await driveService.updateDriveStatus(req.user!.userId, id, 'CLOSED');
    res.json({ success: true, data: drive });
  } catch (err: any) {
    handleError(res, err);
  }
}

export async function cancelDriveRecruiter(req: Request, res: Response) {
  try {
    const id = req.params['id'] as string;
    const drive = await driveService.updateDriveStatus(req.user!.userId, id, 'CANCELLED');
    res.json({ success: true, data: drive });
  } catch (err: any) {
    handleError(res, err);
  }
}

export async function listRecruiterDrives(req: Request, res: Response) {
  try {
    const drives = await driveService.listRecruiterDrives(req.user!.userId);
    res.json({ success: true, data: drives });
  } catch (err: any) {
    handleError(res, err);
  }
}

// === OFFICER ACTIONS ===

export async function listOfficerDrives(req: Request, res: Response) {
  try {
    const drives = await driveService.listOfficerDrives();
    res.json({ success: true, data: drives });
  } catch (err: any) {
    handleError(res, err);
  }
}

export async function officerApproveDrive(req: Request, res: Response) {
  try {
    const id = req.params['id'] as string;
    const drive = await driveService.updateDriveStatus(req.user!.userId, id, 'PUBLISHED', undefined, true);
    res.json({ success: true, data: drive });
  } catch (err: any) {
    handleError(res, err);
  }
}

export async function officerRejectDrive(req: Request, res: Response) {
  try {
    const id = req.params['id'] as string;
    const { reason } = reviewActionSchema.parse(req.body);
    const drive = await driveService.updateDriveStatus(req.user!.userId, id, 'DRAFT', reason, true);
    res.json({ success: true, data: drive });
  } catch (err: any) {
    handleError(res, err);
  }
}

export async function officerCloseDrive(req: Request, res: Response) {
  try {
    const id = req.params['id'] as string;
    const drive = await driveService.updateDriveStatus(req.user!.userId, id, 'CLOSED', undefined, true);
    res.json({ success: true, data: drive });
  } catch (err: any) {
    handleError(res, err);
  }
}

export async function officerCancelDrive(req: Request, res: Response) {
  try {
    const id = req.params['id'] as string;
    const drive = await driveService.updateDriveStatus(req.user!.userId, id, 'CANCELLED', undefined, true);
    res.json({ success: true, data: drive });
  } catch (err: any) {
    handleError(res, err);
  }
}

export async function officerCompleteDrive(req: Request, res: Response) {
  try {
    const id = req.params['id'] as string;
    const drive = await driveService.updateDriveStatus(req.user!.userId, id, 'COMPLETED', undefined, true);
    res.json({ success: true, data: drive });
  } catch (err: any) {
    handleError(res, err);
  }
}

// === STUDENT ACTIONS ===

export async function listStudentDrives(req: Request, res: Response) {
  try {
    const drives = await driveService.listStudentDrives();
    res.json({ success: true, data: drives });
  } catch (err: any) {
    handleError(res, err);
  }
}

export async function getDriveDetails(req: Request, res: Response) {
  try {
    const id = req.params['id'] as string;
    const drive = await driveService.getDriveById(id);
    res.json({ success: true, data: drive });
  } catch (err: any) {
    handleError(res, err);
  }
}

export async function getStudentEligibility(req: Request, res: Response) {
  try {
    const id = req.params['id'] as string;
    const result = await EligibilityService.evaluateStudentEligibility(req.user!.userId, id);
    res.json({ success: true, data: result });
  } catch (err: any) {
    handleError(res, err);
  }
}
