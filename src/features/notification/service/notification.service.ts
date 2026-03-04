import { getChatSocketServer } from '../../chat/socket/chat.gateway';
import { PushNotificationService } from '../../../common/services/push-notification.service';
import { UserModel } from '../../auth/entity/user.model';
import { NotificationType } from '../entity/notification.model';
import { NotificationRepository } from '../repository/notification.repository';

export class NotificationService {
  private readonly repository = new NotificationRepository();
  private readonly pushService = new PushNotificationService();

  private prettyOrderStatus(status: string) {
    return status
      .replace(/_/g, ' ')
      .replace(/\b\w/g, (char) => char.toUpperCase());
  }

  async createForUser(params: {
    userId: string;
    title: string;
    message: string;
    type: NotificationType;
    referenceId?: string;
  }) {
    const notification = await this.repository.create(params);

    try {
      const io = getChatSocketServer();
      io?.to(params.userId).emit('notification:created', notification);
    } catch (error) {
      console.error('[NotificationService] Socket emit failed:', error);
    }

    try {
      await this.pushService.sendToUser({
        userId: params.userId,
        title: params.title,
        body: params.message,
        data: {
          type: params.type,
          referenceId: params.referenceId ?? '',
        },
      });
    } catch (error) {
      console.error('[NotificationService] Push delivery failed:', error);
    }

    return notification;
  }

  async createForUsers(params: {
    userIds: string[];
    title: string;
    message: string;
    type: NotificationType;
    referenceId?: string;
  }) {
    const uniqueIds = Array.from(new Set(params.userIds.filter(Boolean)));
    const results = [] as any[];

    for (const userId of uniqueIds) {
      const created = await this.createForUser({
        userId,
        title: params.title,
        message: params.message,
        type: params.type,
        referenceId: params.referenceId,
      });
      results.push(created);
    }

    return results;
  }

  async listMyNotifications(userId: string, page: number = 1, limit: number = 20) {
    const safePage = page > 0 ? page : 1;
    const safeLimit = limit > 0 ? Math.min(limit, 100) : 20;
    const { items, total } = await this.repository.findByUser(userId, safePage, safeLimit);
    const unreadCount = await this.repository.countUnread(userId);

    return {
      notifications: items,
      unreadCount,
      pagination: {
        total,
        page: safePage,
        limit: safeLimit,
        totalPages: Math.ceil(total / safeLimit),
      },
    };
  }

  async unreadCount(userId: string) {
    const unreadCount = await this.repository.countUnread(userId);
    return { unreadCount };
  }

  async markRead(userId: string, id: string) {
    const updated = await this.repository.markRead(userId, id);
    if (!updated) throw new Error('Notification not found');
    return updated;
  }

  async markAllRead(userId: string) {
    const updatedCount = await this.repository.markAllRead(userId);
    return { updatedCount };
  }

  async notifyNewMessage(recipientId: string, senderName: string, conversationId: string) {
    return this.createForUser({
      userId: recipientId,
      title: 'New Message',
      message: `You have received a new message from ${senderName}.`,
      type: 'new_message',
      referenceId: conversationId,
    });
  }

  async notifyProductUploaded(productId: string, productName: string, ownerId: string) {
    const users = await UserModel.find({
      _id: { $ne: ownerId as any },
      isDeleted: false,
      status: 'active',
    }).select('_id');

    const userIds = users.map((u) => u._id.toString());
    if (userIds.length === 0) return [];

    return this.createForUsers({
      userIds,
      title: 'New Product Uploaded',
      message: `A new product ${productName} has been uploaded.`,
      type: 'new_product_uploaded',
      referenceId: productId,
    });
  }

  async notifyProductSold(ownerId: string, ownerName: string, productId: string, productName: string) {
    return this.createForUser({
      userId: ownerId,
      title: 'Product Sold',
      message: `Congratulations ${ownerName}! Your product ${productName} has been sold.`,
      type: 'product_sold',
      referenceId: productId,
    });
  }

  async notifyOrderCompleted(params: {
    sellerId: string;
    buyerName: string;
    orderId: string;
    productName?: string;
  }) {
    const suffix = params.productName ? ` for ${params.productName}` : '';
    return this.createForUser({
      userId: params.sellerId,
      title: 'Order Completed',
      message: `${params.buyerName} confirmed receipt${suffix}.`,
      type: 'order_completed',
      referenceId: params.orderId,
    });
  }

  async notifyNewOrderPlaced(params: {
    sellerId: string;
    buyerName: string;
    orderId: string;
    productName?: string;
  }) {
    const suffix = params.productName ? ` for ${params.productName}` : '';
    return this.createForUser({
      userId: params.sellerId,
      title: 'New Order',
      message: `${params.buyerName} placed a new order${suffix}.`,
      type: 'new_order',
      referenceId: params.orderId,
    });
  }

  async notifyOrderStatusChanged(params: {
    orderId: string;
    oldStatus: string;
    newStatus: string;
    buyerId: string;
    sellerId: string;
    actorName?: string;
    productName?: string;
  }) {
    const actor = params.actorName || 'A user';
    const oldLabel = this.prettyOrderStatus(params.oldStatus);
    const newLabel = this.prettyOrderStatus(params.newStatus);
    const productSuffix = params.productName ? ` (${params.productName})` : '';

    return this.createForUsers({
      userIds: [params.buyerId, params.sellerId],
      title: 'Order Status Updated',
      message: `${actor} changed order status from ${oldLabel} to ${newLabel}${productSuffix}.`,
      type: 'order_status_changed',
      referenceId: params.orderId,
    });
  }

  async notifyProductUpdated(params: {
    ownerId: string;
    productId: string;
    productName: string;
  }) {
    return this.createForUser({
      userId: params.ownerId,
      title: 'Product Updated',
      message: `Your product ${params.productName} was updated successfully.`,
      type: 'product_updated',
      referenceId: params.productId,
    });
  }

  async notifyProductDeleted(params: {
    ownerId: string;
    productId: string;
    productName: string;
    deletedBy?: string;
  }) {
    const by = params.deletedBy ? ` by ${params.deletedBy}` : '';
    return this.createForUser({
      userId: params.ownerId,
      title: 'Product Deleted',
      message: `Your product ${params.productName} was deleted${by}.`,
      type: 'product_deleted',
      referenceId: params.productId,
    });
  }

  async notifyUserDeletedAdminActivity(params: {
    actorUserId?: string;
    targetUserId: string;
    targetUserName?: string;
  }) {
    const admins = await UserModel.find({ role: 'admin', isDeleted: false }).select('_id name');
    const adminIds = admins.map((admin) => admin._id.toString());
    if (adminIds.length === 0) return [];

    const actorLabel = params.actorUserId
      ? `Admin (${params.actorUserId})`
      : 'An admin';
    const targetName = params.targetUserName || params.targetUserId;

    return this.createForUsers({
      userIds: adminIds,
      title: 'Admin Activity: User Deleted',
      message: `${actorLabel} deleted user ${targetName}.`,
      type: 'admin_activity',
      referenceId: params.targetUserId,
    });
  }

  async notifyTutorRequestAccepted(studentId: string, studentName: string, tutorRequestId: string) {
    return this.createForUser({
      userId: studentId,
      title: 'Tutor Request Accepted',
      message: `Good news ${studentName}! Your tutor request has been accepted.`,
      type: 'tutor_request_accepted',
      referenceId: tutorRequestId,
    });
  }
}
