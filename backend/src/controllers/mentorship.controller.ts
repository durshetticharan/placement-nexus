import { Request, Response } from 'express';
import { requestMentorship, updateRequestStatus, addGuidance, getMentorshipDetails, listStudentMentorships, listMentorMentees } from '../services/mentorship.service';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function createRequest(req: Request, res: Response) {
  try {
    const { alumniProfileId, message } = req.body;
    const student = await prisma.student.findUnique({ where: { userId: req.user!.userId } });
    if (!student) throw Object.assign(new Error('Student not found'), { statusCode: 404 });

    const request = await requestMentorship(student.id, alumniProfileId, message);
    res.status(201).json({ message: 'Mentorship requested successfully', request });
  } catch (err: any) {
    const statusCode = err.statusCode || 500;
    res.status(statusCode).json({ error: err.message });
  }
}

export async function updateStatus(req: Request, res: Response) {
  try {
    const { status } = req.body;
    const request = await updateRequestStatus(req.params.id as string, status, req.user!.userId, req.user!.role);
    res.json({ message: 'Mentorship status updated', request });
  } catch (err: any) {
    const statusCode = err.statusCode || 500;
    res.status(statusCode).json({ error: err.message });
  }
}

export async function postGuidance(req: Request, res: Response) {
  try {
    const { content } = req.body;
    const guidance = await addGuidance(req.params.id as string, content, req.user!.userId, req.user!.role);
    res.status(201).json({ message: 'Guidance added successfully', guidance });
  } catch (err: any) {
    const statusCode = err.statusCode || 500;
    res.status(statusCode).json({ error: err.message });
  }
}

export async function getDetails(req: Request, res: Response) {
  try {
    const request = await getMentorshipDetails(req.params.id as string, req.user!.userId);
    res.json({ request });
  } catch (err: any) {
    const statusCode = err.statusCode || 500;
    res.status(statusCode).json({ error: err.message });
  }
}

export async function listMyMentorships(req: Request, res: Response) {
  try {
    if (req.user!.role === 'STUDENT') {
      const mentorships = await listStudentMentorships(req.user!.userId);
      res.json({ mentorships });
    } else if (req.user!.role === 'ALUMNI') {
      const mentorships = await listMentorMentees(req.user!.userId);
      res.json({ mentorships });
    } else {
      res.json({ mentorships: [] });
    }
  } catch (err: any) {
    const statusCode = err.statusCode || 500;
    res.status(statusCode).json({ error: err.message });
  }
}
