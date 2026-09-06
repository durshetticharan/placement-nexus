import { Request, Response } from 'express';
import { updateMentorProfile, getMentorDirectory } from '../services/mentor.service';

export async function updateProfile(req: Request, res: Response) {
  try {
    const updated = await updateMentorProfile(req.user!.userId, req.body);
    res.json({ message: 'Mentor profile updated successfully', mentor: updated });
  } catch (err: any) {
    const statusCode = err.statusCode || 500;
    res.status(statusCode).json({ error: err.message });
  }
}

export async function getDirectory(req: Request, res: Response) {
  try {
    const { topic, company } = req.query;
    const mentors = await getMentorDirectory({
      topic: topic as string,
      company: company as string
    });
    res.json({ mentors });
  } catch (err: any) {
    const statusCode = err.statusCode || 500;
    res.status(statusCode).json({ error: err.message });
  }
}
