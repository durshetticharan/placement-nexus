import { Request, Response } from 'express';
import * as readinessService from '../services/readiness.service';
import * as studentRepo from '../repositories/student.repository';
import { ServiceError } from '../services/careerPath.service';

export async function computeReadiness(req: Request, res: Response) {
  try {
    const userId = req.user!.userId;
    const student = await studentRepo.findStudentByUserId(userId);
    
    if (!student) {
      return res.status(404).json({ success: false, message: 'Student profile not found.' });
    }

    const careerPathId = req.body.careerPathId;
    const result = await readinessService.computeAndSaveReadiness(student.id, careerPathId);
    
    res.status(200).json({ success: true, data: result });
  } catch (error: any) {
    if (error instanceof ServiceError) {
      res.status(error.statusCode).json({ success: false, message: error.message });
    } else {
      res.status(500).json({ success: false, message: error.message || 'Internal Server Error' });
    }
  }
}

export async function getReadiness(req: Request, res: Response) {
  try {
    const userId = req.user!.userId;
    const student = await studentRepo.findStudentByUserId(userId);
    
    if (!student) {
      return res.status(404).json({ success: false, message: 'Student profile not found.' });
    }

    const careerPathId = req.query.careerPathId as string;
    let result = await readinessService.getReadinessScore(student.id, careerPathId);
    
    // If not computed yet, compute it dynamically on the fly
    if (!result) {
      result = await readinessService.computeAndSaveReadiness(student.id, careerPathId) as any;
    }

    res.status(200).json({ success: true, data: result });
  } catch (error: any) {
    if (error instanceof ServiceError) {
      res.status(error.statusCode).json({ success: false, message: error.message });
    } else {
      res.status(500).json({ success: false, message: error.message || 'Internal Server Error' });
    }
  }
}
