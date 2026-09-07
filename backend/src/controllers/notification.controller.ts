import { Request, Response } from 'express';
import { z } from 'zod';
import { NotificationService } from '../services/notification.service';

export class NotificationController {
  static async getNotifications(req: Request, res: Response) {
    try {
      const userId = req.user!.userId;
      const unreadOnly = req.query.unreadOnly === 'true';
      const limit = parseInt(req.query.limit as string) || 50;

      const notifications = await NotificationService.getUserNotifications(userId, {
        unreadOnly,
        limit,
      });

      res.status(200).json({ status: 'success', data: notifications });
    } catch (err: any) {
      console.error({ err, userId: req.user?.userId }, 'Failed to get notifications');
      res.status(500).json({ status: 'error', message: 'Failed to fetch notifications' });
    }
  }

  static async markAsRead(req: Request, res: Response) {
    try {
      const userId = req.user!.userId;
      const { id } = req.params;

      const result = await NotificationService.markAsRead(id as string, userId);
      if (result.count === 0) {
        return res.status(404).json({ status: 'error', message: 'Notification not found' });
      }

      res.status(200).json({ status: 'success', message: 'Notification marked as read' });
    } catch (err: any) {
      console.error({ err, userId: req.user?.userId }, 'Failed to mark notification as read');
      res.status(500).json({ status: 'error', message: 'Failed to mark notification' });
    }
  }

  static async markAllAsRead(req: Request, res: Response) {
    try {
      const userId = req.user!.userId;
      await NotificationService.markAllAsRead(userId);

      res.status(200).json({ status: 'success', message: 'All notifications marked as read' });
    } catch (err: any) {
      console.error({ err, userId: req.user?.userId }, 'Failed to mark all as read');
      res.status(500).json({ status: 'error', message: 'Failed to mark all as read' });
    }
  }

  static async getPreferences(req: Request, res: Response) {
    try {
      const userId = req.user!.userId;
      const prefs = await NotificationService.getPreferences(userId);

      res.status(200).json({ status: 'success', data: prefs });
    } catch (err: any) {
      console.error({ err, userId: req.user?.userId }, 'Failed to get notification preferences');
      res.status(500).json({ status: 'error', message: 'Failed to fetch preferences' });
    }
  }

  static async updatePreferences(req: Request, res: Response) {
    try {
      const userId = req.user!.userId;

      const schema = z.object({
        emailEnabled: z.boolean().optional(),
        inAppEnabled: z.boolean().optional(),
        typeOverrides: z.record(z.string(), z.boolean()).optional(),
      });

      const data = schema.parse(req.body);

      const prefs = await NotificationService.updatePreferences(userId, data);

      res.status(200).json({ status: 'success', data: prefs });
    } catch (err: any) {
      console.error({ err, userId: req.user?.userId }, 'Failed to update notification preferences');
      if (err instanceof z.ZodError) {
        return res.status(400).json({ status: 'error', message: 'Invalid data', errors: err.issues });
      }
      res.status(500).json({ status: 'error', message: 'Failed to update preferences' });
    }
  }
}
