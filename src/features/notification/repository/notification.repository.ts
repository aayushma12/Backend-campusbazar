import { INotification, NotificationModel, NotificationType } from '../entity/notification.model';

export class NotificationRepository {
  async create(data: {
    userId: string;
    title: string;
    message: string;
    type: NotificationType;
    referenceId?: string;
  }): Promise<INotification> {
    return NotificationModel.create({
      userId: data.userId,
      title: data.title,
      message: data.message,
      type: data.type,
      referenceId: data.referenceId,
      isRead: false,
    });
  }

  async findByUser(userId: string, page: number, limit: number): Promise<{ items: INotification[]; total: number }> {
    const skip = (page - 1) * limit;
    const [items, total] = await Promise.all([
      NotificationModel.find({ userId }).sort({ createdAt: -1 }).skip(skip).limit(limit),
      NotificationModel.countDocuments({ userId }),
    ]);
    return { items, total };
  }

  async countUnread(userId: string): Promise<number> {
    return NotificationModel.countDocuments({ userId, isRead: false });
  }

  async markRead(userId: string, id: string): Promise<INotification | null> {
    return NotificationModel.findOneAndUpdate({ _id: id, userId }, { isRead: true }, { new: true });
  }

  async markAllRead(userId: string): Promise<number> {
    const result = await NotificationModel.updateMany({ userId, isRead: false }, { isRead: true });
    return result.modifiedCount ?? 0;
  }
}
