import { Request, Response } from 'express';
import { createDrivePreparation, addPreparationTask, updateTaskStatus, getDrivePreparation } from '../services/learning.service';

export async function initDrivePreparation(req: Request, res: Response) {
  try {
    const { driveId } = req.params;
    const plan = await createDrivePreparation(req.user!.userId, driveId as string);
    res.status(201).json({ message: 'Preparation plan initialized', plan });
  } catch (err: any) {
    const statusCode = err.statusCode || 500;
    res.status(statusCode).json({ error: err.message });
  }
}

export async function getDrivePlan(req: Request, res: Response) {
  try {
    const { driveId } = req.params;
    const plan = await getDrivePreparation(req.user!.userId, driveId as string);
    if (!plan) {
      return res.status(404).json({ error: 'Plan not found' });
    }
    res.json({ plan });
  } catch (err: any) {
    const statusCode = err.statusCode || 500;
    res.status(statusCode).json({ error: err.message });
  }
}

export async function addTask(req: Request, res: Response) {
  try {
    const task = await addPreparationTask({
      ...req.body,
      studentUserId: req.user!.userId
    });
    res.status(201).json({ message: 'Task added', task });
  } catch (err: any) {
    const statusCode = err.statusCode || 500;
    res.status(statusCode).json({ error: err.message });
  }
}

export async function updateTask(req: Request, res: Response) {
  try {
    const { status } = req.body;
    const task = await updateTaskStatus(req.params.taskId as string, status, req.user!.userId);
    res.json({ message: 'Task updated', task });
  } catch (err: any) {
    const statusCode = err.statusCode || 500;
    res.status(statusCode).json({ error: err.message });
  }
}
