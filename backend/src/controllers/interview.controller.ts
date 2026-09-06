import { Request, Response } from 'express';
import * as interviewService from '../services/interview.service';

export async function scheduleInterview(req: Request, res: Response) {
  try {
    const recruiterUserId = req.user!.userId;
    const appId = req.params.appId as string;
    const data = req.body;

    const interview = await interviewService.scheduleInterview(recruiterUserId, appId, data);
    return res.status(201).json({ success: true, data: interview });
  } catch (error: any) {
    if (error.name === 'InterviewServiceError') {
      return res.status(error.statusCode).json({ success: false, error: { code: error.code, message: error.message } });
    }
    return res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: error.message } });
  }
}

export async function updateInterviewOutcome(req: Request, res: Response) {
  try {
    const recruiterUserId = req.user!.userId;
    const id = req.params.id as string;
    const data = req.body;

    const interview = await interviewService.updateInterviewOutcome(recruiterUserId, id, data);
    return res.status(200).json({ success: true, data: interview });
  } catch (error: any) {
    if (error.name === 'InterviewServiceError') {
      return res.status(error.statusCode).json({ success: false, error: { code: error.code, message: error.message } });
    }
    return res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: error.message } });
  }
}

export async function getMyInterviews(req: Request, res: Response) {
  try {
    const studentUserId = req.user!.userId;
    
    const interviews = await interviewService.getInterviewsForStudent(studentUserId);
    return res.status(200).json({ success: true, data: interviews });
  } catch (error: any) {
    if (error.name === 'InterviewServiceError') {
      return res.status(error.statusCode).json({ success: false, error: { code: error.code, message: error.message } });
    }
    return res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: error.message } });
  }
}
