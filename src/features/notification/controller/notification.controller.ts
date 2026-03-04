import { Request, Response } from 'express';
import { NotificationService } from '../service/notification.service';

const notificationService = new NotificationService();

export const listNotifications = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id as string;
    const page = Number(req.query.page ?? 1);
    const limit = Number(req.query.limit ?? 20);

    const result = await notificationService.listMyNotifications(userId, page, limit);
    return res.status(200).json({ success: true, data: result });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message || 'Failed to load notifications' });
  }
};

export const getUnreadCount = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id as string;
    const result = await notificationService.unreadCount(userId);
    return res.status(200).json({ success: true, data: result });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message || 'Failed to load unread count' });
  }
};

export const markNotificationRead = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id as string;
    const { id } = req.params;
    const result = await notificationService.markRead(userId, id);
    return res.status(200).json({ success: true, data: result });
  } catch (error: any) {
    return res.status(400).json({ success: false, message: error.message || 'Failed to mark notification as read' });
  }
};

export const markAllNotificationsRead = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id as string;
    const result = await notificationService.markAllRead(userId);
    return res.status(200).json({ success: true, data: result });
  } catch (error: any) {
    return res.status(400).json({ success: false, message: error.message || 'Failed to mark notifications as read' });
  }
};
