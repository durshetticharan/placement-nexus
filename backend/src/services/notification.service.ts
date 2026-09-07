import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export type NotificationType =
  | 'NEW_DRIVE'
  | 'APPLICATION_STATUS'
  | 'SHORTLISTED'
  | 'INTERVIEW_SCHEDULED'
  | 'ASSESSMENT_ASSIGNED'
  | 'REFERRAL_STATUS'
  | 'MENTORSHIP_UPDATE'
  | 'LEARNING_RECOMMENDATION'
  | 'SKILL_GAP_REMINDER'
  | 'SYSTEM';

export type NotificationChannel = 'IN_APP' | 'EMAIL';

export interface CreateNotificationParams {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  channel?: NotificationChannel;
  metadata?: Record<string, any>;
}

export class NotificationService {
  /**
   * Retrieves or initializes notification preferences for a user.
   */
  static async getPreferences(userId: string) {
    let prefs = await prisma.notificationPreference.findUnique({
      where: { userId },
    });

    if (!prefs) {
      prefs = await prisma.notificationPreference.create({
        data: {
          userId,
          emailEnabled: true,
          inAppEnabled: true,
          typeOverrides: {},
        },
      });
    }

    return prefs;
  }

  /**
   * Updates user notification preferences.
   */
  static async updatePreferences(
    userId: string,
    data: { emailEnabled?: boolean; inAppEnabled?: boolean; typeOverrides?: any }
  ) {
    const prefs = await this.getPreferences(userId);
    return prisma.notificationPreference.update({
      where: { id: prefs.id },
      data,
    });
  }

  /**
   * Core method to send a notification. Checks preferences, creates DB record,
   * and optionally delegates to email service stub.
   */
  static async sendNotification(params: CreateNotificationParams) {
    const { userId, type, title, message, channel = 'IN_APP', metadata } = params;
    const prefs = await this.getPreferences(userId);

    // Check if the user has disabled this channel globally or overridden for this specific type
    const overrides = (prefs.typeOverrides as Record<string, boolean>) || {};
    
    // Priority: Type-specific override -> Global channel preference
    let shouldDeliverInApp = prefs.inAppEnabled;
    let shouldDeliverEmail = prefs.emailEnabled;

    if (overrides[`${type}_IN_APP`] !== undefined) {
      shouldDeliverInApp = overrides[`${type}_IN_APP`];
    }
    if (overrides[`${type}_EMAIL`] !== undefined) {
      shouldDeliverEmail = overrides[`${type}_EMAIL`];
    }

    const deliverInApp = channel === 'IN_APP' && shouldDeliverInApp;
    const deliverEmail = channel === 'EMAIL' && shouldDeliverEmail;

    // We always persist the notification in DB if IN_APP delivery is requested
    if (deliverInApp) {
      try {
        await prisma.notification.create({
          data: {
            userId,
            type,
            title,
            message,
            channel: 'IN_APP',
            metadata: metadata || {},
          },
        });
      } catch (err) {
        console.error('Failed to persist in-app notification', { err, userId, type });
      }
    }

    // Email delivery (stubbed)
    if (deliverEmail || channel === 'EMAIL') {
      // NOTE: We fall back to standard logging as email infra is not locally configured.
      console.info('EMAIL_DISPATCH_STUB', {
        userId,
        type,
        title,
        message,
        metadata
      });
      
      // We might also log it in the DB to keep a record that we 'sent' an email
      try {
        await prisma.notification.create({
          data: {
            userId,
            type,
            title,
            message,
            channel: 'EMAIL',
            isRead: true, // Emails are intrinsically 'read' from the app's perspective once sent
            metadata: metadata || {},
          },
        });
      } catch (err) {
         // Ignore
      }
    }
  }

  /**
   * Fetch unread and recent notifications for the UI dropdown
   */
  static async getUserNotifications(userId: string, options: { unreadOnly?: boolean; limit?: number; skip?: number } = {}) {
    const { unreadOnly = false, limit = 50, skip = 0 } = options;
    return prisma.notification.findMany({
      where: {
        userId,
        channel: 'IN_APP',
        ...(unreadOnly ? { isRead: false } : {}),
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip,
    });
  }

  /**
   * Mark a single notification as read
   */
  static async markAsRead(notificationId: string, userId: string) {
    return prisma.notification.updateMany({
      where: { id: notificationId, userId },
      data: { isRead: true },
    });
  }

  /**
   * Mark all unread notifications as read for a user
   */
  static async markAllAsRead(userId: string) {
    return prisma.notification.updateMany({
      where: { userId, channel: 'IN_APP', isRead: false },
      data: { isRead: true },
    });
  }
}
